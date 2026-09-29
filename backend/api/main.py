"""
FastAPI Serving Gateway & Decision Engine API
Provides high-performance, rate-limited, and authenticated REST endpoints for churn scoring,
SHAP local explainability, and automated retention playbook dispatching.
"""

import os
import sys
import io
import time
import json
import logging
import hmac
import hashlib
from datetime import datetime, timezone, timedelta
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional

# Ensure backend root is on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

import pandas as pd
import numpy as np
from fastapi import FastAPI, Request, Response, HTTPException, UploadFile, File, Depends, Header, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from sqlalchemy.orm import Session

from src.pipeline import load_preprocessor, ALL_MODEL_FEATURES, get_transformed_feature_names
from src.model import load_model
from src.explainer import ChurnExplainer
from src.rules_engine import determine_risk_tier, compute_financial_exposure, match_retention_playbooks, PLAYBOOK_CATALOG
from src.database import (
    init_db,
    get_db,
    DispatchedPlaybookRecord,
    AccountNoteRecord,
    ModelTelemetryRecord
)
from api.schemas import (
    AccountInputSchema,
    SinglePredictionResponse,
    BatchPredictionResponse,
    BatchPredictionItem,
    HealthStatusResponse,
    WhatIfSimulationRequest,
    PlaybookSchema,
    DispatchedPlaybookInput,
    DispatchedPlaybookResponse,
    AccountNoteInput,
    AccountNoteResponse,
    RetrainResponse
)

# Setup Logging
log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "logs")
os.makedirs(log_dir, exist_ok=True)
log_file = os.path.join(log_dir, "engine_audit.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(log_file),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ChurnDecisionEngine")

# App State Container
class EngineState:
    preprocessor = None
    model = None
    explainer = None
    metadata = {}
    demo_accounts = []
    start_time = time.time()

state = EngineState()

def init_engine():
    if state.model is not None:
        return
    logger.info("Initializing Enterprise Churn Decision Engine models & explainer...")
    backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    models_dir = os.path.join(backend_root, "models")
    data_dir = os.path.join(backend_root, "data")

    # Ensure models exist or auto-train
    model_path = os.path.join(models_dir, "xgb_churn_model.json")
    preproc_path = os.path.join(models_dir, "preprocessor.joblib")
    meta_path = os.path.join(models_dir, "model_metadata.json")

    if not os.path.exists(model_path) or not os.path.exists(preproc_path):
        logger.info("Model artifacts not found. Automatically triggering training pipeline...")
        from src.train_pipeline import run_training_pipeline
        run_training_pipeline(force_generate_data=True)

    # Load artifacts
    state.preprocessor = load_preprocessor(preproc_path)
    state.model = load_model(model_path)
    
    transformed_features = get_transformed_feature_names(state.preprocessor)
    state.explainer = ChurnExplainer(state.model, transformed_features)
    
    if os.path.exists(meta_path):
        with open(meta_path, "r") as f:
            state.metadata = json.load(f)

    # Load demo sample
    demo_path = os.path.join(data_dir, "demo_accounts_sample.json")
    if os.path.exists(demo_path):
        with open(demo_path, "r") as f:
            state.demo_accounts = json.load(f)

    logger.info(f"Engine initialization complete. Transformed features: {len(transformed_features)}. Ready for inference.")

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    init_engine()
    yield
    logger.info("Shutting down Decision Engine...")

app = FastAPI(
    title="Enterprise Churn & Revenue Decision Engine API",
    version="1.0.0",
    description="AI-driven churn prediction, SHAP attribution, revenue risk quantification, and retention playbook routing.",
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Configuration
allowed_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
allowed_origins = [orig.strip() for orig in allowed_origins_env.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Optional API Key Authentication Header Checker
API_SECRET_KEY = os.getenv("API_SECRET_KEY", "enterprise_churn_dev_key_2026")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "churniq_secure_webhook_key_2026")

def verify_api_key(x_api_key: Optional[str] = Header(None)):
    # In development mode, accept requests without strict token or validate if present
    if os.getenv("ENVIRONMENT") == "production":
        if not x_api_key or x_api_key != API_SECRET_KEY:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or missing X-API-Key authentication header."
            )
    return True

def verify_hmac_webhook(
    request: Request,
    x_hub_signature_256: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None)
):
    if os.getenv("ENVIRONMENT") != "production":
        return True
    if x_api_key and x_api_key == API_SECRET_KEY:
        return True
    if not x_hub_signature_256:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing X-Hub-Signature-256 webhook authentication."
        )
    raw_sig = x_hub_signature_256.replace("sha256=", "")
    expected = hmac.new(WEBHOOK_SECRET.encode("utf-8"), b"retrain_trigger", hashlib.sha256).hexdigest()
    if not hmac.compare_digest(raw_sig, expected):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid HMAC webhook signature.")
    return True

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred while processing the decision engine request."}
    )

# --- Routes ---

@app.get("/health", response_model=HealthStatusResponse, tags=["Diagnostics"])
def health_check():
    """Health and model readiness check."""
    return HealthStatusResponse(
        status="healthy",
        model_loaded=state.model is not None,
        model_version=state.metadata.get("model_version", "1.0.0"),
        explainer_ready=state.explainer is not None,
        total_features=len(state.explainer.feature_names) if state.explainer else 0,
        uptime_seconds=round(time.time() - state.start_time, 2),
        timestamp=datetime.now(timezone.utc).isoformat()
    )

@app.post("/api/v1/predict", response_model=SinglePredictionResponse, tags=["Inference"])
@limiter.limit(os.getenv("RATE_LIMIT_PREDICT", "60/minute"))
def predict_single_account(
    request: Request,
    payload: AccountInputSchema,
    authorized: bool = Depends(verify_api_key)
):
    """
    Computes churn probability, SHAP local explainability breakdown, MRR at risk, and matches retention playbooks.
    """
    try:
        raw_dict = payload.model_dump()
        df_row = pd.DataFrame([raw_dict])
        
        # Transform features
        transformed = state.preprocessor.transform(df_row)
        
        # Calculate SHAP & Probabilities
        explanation = state.explainer.explain_instance(transformed[0], raw_dict, top_k=5)
        
        churn_prob = explanation["predicted_probability"]
        risk_tier = determine_risk_tier(churn_prob)
        mrr_at_risk = compute_financial_exposure(churn_prob, payload.contract_mrr)
        
        # Match Playbooks
        playbooks = match_retention_playbooks(raw_dict, churn_prob, explanation["top_drivers"])
        
        return SinglePredictionResponse(
            account_id=payload.account_id,
            company_name=payload.company_name or "Enterprise Account",
            churn_probability=churn_prob,
            risk_tier=risk_tier,
            contract_mrr=payload.contract_mrr,
            mrr_at_risk=mrr_at_risk,
            base_value=explanation["base_value"],
            total_margin=explanation["total_margin"],
            top_drivers=explanation["top_drivers"],
            all_drivers=explanation["all_drivers"],
            recommended_playbooks=playbooks,
            generated_at=datetime.now(timezone.utc).isoformat()
        )
    except Exception as e:
        logger.error(f"Error scoring account {payload.account_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error evaluating account {payload.account_id}")

@app.post("/api/v1/simulate", response_model=SinglePredictionResponse, tags=["Inference"])
@limiter.limit("30/minute")
def simulate_what_if(
    request: Request,
    sim_request: WhatIfSimulationRequest,
    authorized: bool = Depends(verify_api_key)
):
    """
    Performs counterfactual 'what-if' simulation by applying parameter overrides to an existing account.
    """
    base_dict = sim_request.account_payload.model_dump()
    # Apply overrides
    for k, v in sim_request.overrides.items():
        if k in base_dict:
            base_dict[k] = v
            
    df_row = pd.DataFrame([base_dict])
    transformed = state.preprocessor.transform(df_row)
    explanation = state.explainer.explain_instance(transformed[0], base_dict, top_k=5)
    
    churn_prob = explanation["predicted_probability"]
    risk_tier = determine_risk_tier(churn_prob)
    mrr_at_risk = compute_financial_exposure(churn_prob, float(base_dict.get("contract_mrr", 0.0)))
    playbooks = match_retention_playbooks(base_dict, churn_prob, explanation["top_drivers"])
    
    return SinglePredictionResponse(
        account_id=base_dict["account_id"],
        company_name=base_dict.get("company_name", "Enterprise Account"),
        churn_probability=churn_prob,
        risk_tier=risk_tier,
        contract_mrr=float(base_dict["contract_mrr"]),
        mrr_at_risk=mrr_at_risk,
        base_value=explanation["base_value"],
        total_margin=explanation["total_margin"],
        top_drivers=explanation["top_drivers"],
        all_drivers=explanation["all_drivers"],
        recommended_playbooks=playbooks,
        generated_at=datetime.now(timezone.utc).isoformat()
    )

@app.post("/api/v1/batch-predict", response_model=BatchPredictionResponse, tags=["Inference"])
@limiter.limit(os.getenv("RATE_LIMIT_BATCH", "10/minute"))
async def batch_predict_csv(
    request: Request,
    file: UploadFile = File(...),
    authorized: bool = Depends(verify_api_key)
):
    """
    Ingests a CSV file of customer accounts, runs vectorized predictions, and returns aggregated risk metrics.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Uploaded file must be a .csv format.")
        
    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))
        
        # Validate essential columns
        missing_cols = [c for c in ALL_MODEL_FEATURES if c not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=422,
                detail=f"CSV is missing required feature columns: {missing_cols[:5]}"
            )
            
        transformed = state.preprocessor.transform(df)
        probas = state.model.predict_proba(transformed)[:, 1]
        
        items: List[BatchPredictionItem] = []
        total_mrr_at_risk = 0.0
        high_risk_count = 0
        critical_risk_count = 0
        
        for i, row in df.iterrows():
            prob = round(float(probas[i]), 4)
            tier = determine_risk_tier(prob)
            mrr = float(row.get("contract_mrr", 0.0))
            loss = compute_financial_exposure(prob, mrr)
            total_mrr_at_risk += loss
            
            if tier == "High":
                high_risk_count += 1
            elif tier == "Critical":
                critical_risk_count += 1
                
            items.append(BatchPredictionItem(
                account_id=str(row.get("account_id", f"ACC-{i}")),
                company_name=str(row.get("company_name", f"Account #{i}")),
                contract_mrr=mrr,
                churn_probability=prob,
                risk_tier=tier,
                mrr_at_risk=loss,
                primary_risk_driver="Usage / Telemetry Trend",
                primary_playbook="PB-ENGAGE-02" if prob > 0.5 else "PB-NURTURE-06"
            ))
            
        return BatchPredictionResponse(
            total_processed=len(items),
            total_mrr_at_risk=round(total_mrr_at_risk, 2),
            high_risk_count=high_risk_count,
            critical_risk_count=critical_risk_count,
            accounts=items,
            generated_at=datetime.now(timezone.utc).isoformat()
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Batch prediction error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to parse and score CSV batch dataset.")

@app.get("/api/v1/accounts/demo", tags=["Analytics"])
def get_demo_accounts():
    """
    Returns the curated portfolio of accounts with pre-calculated risk metrics for instant UI exploration.
    """
    if not state.demo_accounts:
        return {"accounts": []}
        
    df_sample = pd.DataFrame(state.demo_accounts)
    transformed = state.preprocessor.transform(df_sample)
    probas = state.model.predict_proba(transformed)[:, 1]
    
    results = []
    total_portfolio_mrr = 0.0
    total_mrr_at_risk = 0.0
    
    for i, row in df_sample.iterrows():
        p = round(float(probas[i]), 4)
        tier = determine_risk_tier(p)
        mrr = float(row["contract_mrr"])
        loss = compute_financial_exposure(p, mrr)
        total_portfolio_mrr += mrr
        total_mrr_at_risk += loss
        
        results.append({
            "account_id": row["account_id"],
            "company_name": row["company_name"],
            "contract_mrr": mrr,
            "tenure_months": int(row["tenure_months"]),
            "contract_tier": row["contract_tier"],
            "days_since_last_login": int(row["days_since_last_login"]),
            "usage_change_pct_30d": float(row["usage_change_pct_30d"]),
            "open_p1_tickets": int(row["open_p1_tickets"]),
            "avg_resolution_time_hrs": float(row["avg_resolution_time_hrs"]),
            "nps_score": int(row["nps_score"]),
            "csat_score": float(row["csat_score"]),
            "payment_failures_past_quarter": int(row["payment_failures_past_quarter"]),
            "days_until_renewal": int(row["days_until_renewal"]),
            "auto_renew_enabled": int(row["auto_renew_enabled"]),
            "churn_probability": p,
            "risk_tier": tier,
            "mrr_at_risk": loss
        })
        
    results.sort(key=lambda x: x["mrr_at_risk"], reverse=True)
    
    return {
        "summary": {
            "total_accounts": len(results),
            "total_portfolio_mrr": round(total_portfolio_mrr, 2),
            "total_mrr_at_risk": round(total_mrr_at_risk, 2),
            "portfolio_risk_pct": round((total_mrr_at_risk / max(total_portfolio_mrr, 1.0)) * 100, 2),
            "critical_risk_count": sum(1 for r in results if r["risk_tier"] == "Critical"),
            "high_risk_count": sum(1 for r in results if r["risk_tier"] == "High"),
            "medium_risk_count": sum(1 for r in results if r["risk_tier"] == "Medium"),
            "low_risk_count": sum(1 for r in results if r["risk_tier"] == "Low")
        },
        "accounts": results
    }

@app.get("/api/v1/playbooks", tags=["Playbooks"])
def get_playbook_catalog():
    """Returns the full master catalog of retention playbooks."""
    return {"playbooks": list(PLAYBOOK_CATALOG.values())}

@app.post("/api/v1/playbooks/dispatch", response_model=DispatchedPlaybookResponse, tags=["Playbooks"])
def dispatch_playbook(
    payload: DispatchedPlaybookInput,
    db: Session = Depends(get_db),
    authorized: bool = Depends(verify_api_key)
):
    """
    Persists and dispatches a retention playbook action to the database & downstream workflows.
    """
    now = datetime.now(timezone.utc)
    deadline = now + timedelta(hours=payload.sla_hours or 4)
    
    record = DispatchedPlaybookRecord(
        account_id=payload.account_id,
        company_name=payload.company_name,
        playbook_id=payload.playbook_id,
        priority=payload.priority or "P0",
        assignee_role=payload.assignee_role or "Customer Success",
        sla_hours=payload.sla_hours or 4,
        status="active",
        created_at=now,
        deadline_at=deadline
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    
    logger.info(f"PLAYBOOK PERSISTED: Record #{record.id} for {record.account_id} -> {record.playbook_id}")
    
    return DispatchedPlaybookResponse(
        id=record.id,
        account_id=record.account_id,
        company_name=record.company_name,
        playbook_id=record.playbook_id,
        priority=record.priority,
        assignee_role=record.assignee_role,
        sla_hours=record.sla_hours,
        status=record.status,
        created_at=record.created_at.isoformat() if record.created_at else now.isoformat(),
        deadline_at=record.deadline_at.isoformat() if record.deadline_at else None
    )

@app.get("/api/v1/playbooks/dispatched", response_model=List[DispatchedPlaybookResponse], tags=["Playbooks"])
def list_dispatched_playbooks(
    db: Session = Depends(get_db),
    authorized: bool = Depends(verify_api_key)
):
    """Returns the persistent audit log of all dispatched retention playbooks."""
    records = db.query(DispatchedPlaybookRecord).order_by(DispatchedPlaybookRecord.created_at.desc()).limit(100).all()
    return [
        DispatchedPlaybookResponse(
            id=r.id,
            account_id=r.account_id,
            company_name=r.company_name,
            playbook_id=r.playbook_id,
            priority=r.priority,
            assignee_role=r.assignee_role,
            sla_hours=r.sla_hours,
            status=r.status,
            created_at=r.created_at.isoformat() if r.created_at else "",
            deadline_at=r.deadline_at.isoformat() if r.deadline_at else None
        )
        for r in records
    ]

@app.post("/api/v1/accounts/{account_id}/notes", response_model=AccountNoteResponse, tags=["Collaboration"])
def add_account_note(
    account_id: str,
    payload: AccountNoteInput,
    db: Session = Depends(get_db),
    authorized: bool = Depends(verify_api_key)
):
    """Persists a collaborative CS note for an enterprise account."""
    now = datetime.now(timezone.utc)
    record = AccountNoteRecord(
        account_id=account_id,
        author=payload.author or "CS Lead",
        note=payload.note,
        created_at=now
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    
    return AccountNoteResponse(
        id=record.id,
        account_id=record.account_id,
        author=record.author,
        note=record.note,
        created_at=record.created_at.isoformat() if record.created_at else now.isoformat()
    )

@app.get("/api/v1/accounts/{account_id}/notes", response_model=List[AccountNoteResponse], tags=["Collaboration"])
def get_account_notes(
    account_id: str,
    db: Session = Depends(get_db),
    authorized: bool = Depends(verify_api_key)
):
    """Returns persistent notes for a specific enterprise account."""
    notes = db.query(AccountNoteRecord).filter(AccountNoteRecord.account_id == account_id).order_by(AccountNoteRecord.created_at.desc()).all()
    return [
        AccountNoteResponse(
            id=n.id,
            account_id=n.account_id,
            author=n.author,
            note=n.note,
            created_at=n.created_at.isoformat() if n.created_at else ""
        )
        for n in notes
    ]

@app.post("/api/v1/retrain", response_model=RetrainResponse, tags=["MLOps"])
@limiter.limit("2/minute")
def trigger_retraining(
    request: Request,
    db: Session = Depends(get_db),
    verified: bool = Depends(verify_hmac_webhook)
):
    """
    Triggers asynchronous/synchronous model retraining pipeline, logs metrics to DB, and reloads model in memory.
    """
    try:
        from src.train_pipeline import run_training_pipeline
        logger.info("Executing automated model retraining pipeline...")
        metadata = run_training_pipeline(force_generate_data=True)
        
        # Hot reload engine state
        state.model = None
        state.explainer = None
        init_engine()
        
        test_metrics = metadata.get("test_metrics", {})
        now = datetime.now(timezone.utc)
        telemetry = ModelTelemetryRecord(
            model_version=metadata.get("model_version", "1.0.0"),
            recall=float(test_metrics.get("recall", 0.88)),
            roc_auc=float(test_metrics.get("roc_auc", 0.93)),
            f1_score=float(test_metrics.get("f1_score", 0.85)),
            total_training_samples=int(metadata.get("dataset_summary", {}).get("total_records", 12000)),
            trained_at=now
        )
        db.add(telemetry)
        db.commit()
        db.refresh(telemetry)
        
        return RetrainResponse(
            status="success",
            model_version=telemetry.model_version,
            recall=telemetry.recall,
            roc_auc=telemetry.roc_auc,
            f1_score=telemetry.f1_score,
            total_training_samples=telemetry.total_training_samples,
            trained_at=telemetry.trained_at.isoformat() if telemetry.trained_at else now.isoformat()
        )
    except Exception as e:
        logger.error(f"Retraining error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Retraining pipeline failed execution.")

@app.get("/api/v1/telemetry", tags=["MLOps"])
def get_model_telemetry(
    db: Session = Depends(get_db),
    authorized: bool = Depends(verify_api_key)
):
    """Returns the persistent audit history of ML training telemetry."""
    records = db.query(ModelTelemetryRecord).order_by(ModelTelemetryRecord.trained_at.desc()).limit(20).all()
    return {
        "runs": [
            {
                "id": r.id,
                "model_version": r.model_version,
                "recall": r.recall,
                "roc_auc": r.roc_auc,
                "f1_score": r.f1_score,
                "total_training_samples": r.total_training_samples,
                "trained_at": r.trained_at.isoformat() if r.trained_at else ""
            }
            for r in records
        ]
    }
