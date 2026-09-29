"""
Unit Tests for Data Generation, Preprocessing, Model Training, and Explainer
"""

import pytest
import numpy as np
import pandas as pd
from src.data_generator import generate_b2b_churn_dataset
from src.pipeline import build_preprocessor, ALL_MODEL_FEATURES, get_transformed_feature_names
from src.model import train_churn_model, evaluate_model
from src.explainer import ChurnExplainer
from src.rules_engine import determine_risk_tier, compute_financial_exposure, match_retention_playbooks

def test_data_generator():
    df = generate_b2b_churn_dataset(n_samples=500, random_seed=123)
    assert len(df) == 500
    assert "churned" in df.columns
    assert set(ALL_MODEL_FEATURES).issubset(set(df.columns))
    assert df["contract_mrr"].min() >= 500.0
    assert df["churned"].isin([0, 1]).all()

def test_preprocessor_and_model_pipeline():
    df = generate_b2b_churn_dataset(n_samples=600, random_seed=42)
    X = df[ALL_MODEL_FEATURES]
    y = df["churned"].values

    preprocessor = build_preprocessor()
    X_trans = preprocessor.fit_transform(X)
    assert X_trans.shape[0] == 600
    assert not np.isnan(X_trans).any()

    model, metrics = train_churn_model(X_trans[:400], y[:400], X_trans[400:], y[400:])
    assert metrics["train_roc_auc"] > 0.70

    eval_res = evaluate_model(model, X_trans[400:], y[400:])
    assert eval_res["roc_auc"] > 0.70

def test_shap_explainer():
    df = generate_b2b_churn_dataset(n_samples=300, random_seed=42)
    preprocessor = build_preprocessor()
    X_trans = preprocessor.fit_transform(df[ALL_MODEL_FEATURES])
    feature_names = get_transformed_feature_names(preprocessor)

    model, _ = train_churn_model(X_trans, df["churned"].values)
    explainer = ChurnExplainer(model, feature_names)

    sample_dict = df.iloc[0].to_dict()
    explanation = explainer.explain_instance(X_trans[0], sample_dict, top_k=3)

    assert "base_value" in explanation
    assert "predicted_probability" in explanation
    assert 0.0 <= explanation["predicted_probability"] <= 1.0
    assert len(explanation["top_drivers"]) == 3

def test_rules_engine():
    assert determine_risk_tier(0.85) == "Critical"
    assert determine_risk_tier(0.65) == "High"
    assert determine_risk_tier(0.45) == "Medium"
    assert determine_risk_tier(0.15) == "Low"

    exposure = compute_financial_exposure(0.80, 5000.0)
    assert exposure == 4000.0

    account_data = {
        "open_p1_tickets": 2,
        "avg_resolution_time_hrs": 48.0,
        "usage_change_pct_30d": -40.0,
        "contract_mrr": 6000.0,
        "days_until_renewal": 30
    }
    playbooks = match_retention_playbooks(account_data, churn_probability=0.85, top_drivers=[])
    playbook_ids = [pb["playbook_id"] for pb in playbooks]
    assert "PB-SUPP-01" in playbook_ids
    assert "PB-ENGAGE-02" in playbook_ids
