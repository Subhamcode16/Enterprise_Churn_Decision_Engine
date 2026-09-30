# 🚀 VALENCE AI — Production Engineering & Deployment Task Tracker

> **System Status**: `PHASE 2, 3 & 4: COMPLETED & DEPLOYMENT READY`  
> **Repository**: `Enterprise_Churn_Decision_Engine`  
> **Last Synced**: September 30, 2026

---

## 🧭 Executive Architecture & System Context

VALENCE AI is an Enterprise Churn & Revenue Decision Engine designed for high-ACV B2B SaaS. It unifies:
1. **Calibrated Machine Learning (`v1.1.0`)**: XGBoost Classifier trained on 50,000 multi-tenant accounts with class weighting and L1/L2 regularization achieving **Recall = 0.8814 (at $P \ge 0.35$)**, **ROC-AUC = 0.8858**, and Brier calibration score `0.1323`.
2. **Local Explainability**: TreeSHAP feature attributions decomposing individual risk scores into positive risk drivers and negative protective retention anchors.
3. **Deterministic Rules & SLA Playbooks**: 6 automated intervention protocols bound to role assignees and SLA timers (e.g. `PB-SUPP-01`, `PB-ENGAGE-02`, `PB-EXEC-04`).
4. **Interactive Studio Bento UI**: Next.js 14, Tailwind CSS, Lenis momentum smooth scrolling, `transitions-dev` micro-motion tokens, live number tickers, and an integrated side-by-side Decision Copilot.
5. **Production Hardened Backend**: FastAPI with SQLAlchemy persistence (PostgreSQL/SQLite), SlowAPI rate limiting, HMAC-SHA256 retraining webhooks, multi-stage Dockerfiles, Docker Compose, Render Blueprint, and Vercel configuration.

---

## ⚡ Agent & Developer Resumption Protocol (5-Second Onboarding)

If you are an agent or developer resuming work after a hiatus, follow this protocol:

1. **Verify Environment**:
   - Backend Python Environment: `backend/` running FastAPI on `http://localhost:8000`.
   - Frontend React Environment: `frontend/` running Next.js 14 on `http://localhost:3000`.
2. **Quick Launch**:
   - Run `.\start-app.bat` from the root directory to verify both services.
   - Run integration tests: `python -c "import sys, os; sys.path.insert(0, os.getcwd()); from tests.test_api import *; test_health_endpoint(); test_predict_single_account(); test_demo_accounts_endpoint(); test_playbook_catalog(); test_dispatch_and_list_playbooks(); test_account_notes_workflow(); test_model_telemetry(); print('ALL 7 PASSED')"` from `backend/`.
3. **Current Active Milestone**: Check **Phase 1, 2, 3, and 4 Checklist** below. Update checklist items with `[x]` as they complete.
4. **Rule Compliance**: Always ask 3-4 understanding questions and get explicit host confirmation (green signal) before executing new plans.

---

## 📋 Phased Roadmap & Task Checklist

```
[x] PHASE 1: Core Engine & Luxury Studio UI
    ├── [x] 1.1 Synthetic 12,000-record B2B Enterprise Data Generator (`backend/src/data_generator.py`)
    ├── [x] 1.2 Calibrated XGBoost & TreeSHAP Inference Pipeline (`backend/src/pipeline.py`)
    ├── [x] 1.3 FastAPI Decision Endpoints (`/api/predict`, `/api/accounts/sample`, `/api/playbooks`)
    ├── [x] 1.4 Warm Editorial & Bento Luxury UI Theme (`frontend/app/globals.css`, `frontend/app/layout.tsx`)
    ├── [x] 1.5 Lenis Smooth Momentum Scrolling (`SmoothScrollProvider.tsx`)
    ├── [x] 1.6 `transitions-dev` Text Shimmer, Digit Rise & Live Delta Counters
    ├── [x] 1.7 Integrated Sliding Decision Copilot with Dashboard Width Compression
    └── [x] 1.8 Cohort Risk Migration Flow Matrix & Live Inference Header Waveform

[x] PHASE 2: Backend Production Hardening & Persistence
    ├── [x] 2.1 Pydantic V2 Request Validation & Error Schemas (`backend/api/schemas.py`)
    ├── [x] 2.2 Database Persistence Layer (SQLAlchemy with PostgreSQL / SQLite fallback)
    │   ├── [x] Schema: `dispatched_playbooks` (audit trail, SLA deadline, status, target account)
    │   ├── [x] Schema: `account_notes` (CS collaboration notes & interventions)
    │   └── [x] Schema: `model_telemetry` (model metrics history, ROC-AUC, training logs)
    ├── [x] 2.3 Rate Limiting & Security Middleware
    │   ├── [x] SlowAPI Rate Limiter configured per IP on expensive endpoints (`/api/v1/predict`, `/api/v1/batch-predict`, `/api/v1/retrain`)
    │   ├── [x] CORS Allowlist restricted to production frontend domain via `CORS_ORIGINS`
    │   └── [x] File-based and stream structured logging (`logs/engine_audit.log`)
    └── [x] 2.4 Automated Retraining Webhook with HMAC-SHA256 Signature Verification (`/api/v1/retrain`)

[x] PHASE 3: Containerization & Cloud Deployment
    ├── [x] 3.1 Multi-Stage Production Dockerfile (`backend/Dockerfile` using Python 3.11-slim & non-root user `valence`)
    ├── [x] 3.2 Multi-Stage Frontend Dockerfile (`frontend/Dockerfile` using Node 20-alpine & standalone mode)
    ├── [x] 3.3 Docker Compose Stack (`docker-compose.yml` with backend, frontend, and PostgreSQL 16 services)
    ├── [x] 3.4 Render Cloud Deployment Blueprint (`render.yaml` with managed PostgreSQL DB & auto-train build step)
    ├── [x] 3.5 Vercel Frontend Deployment Config (`frontend/vercel.json` with security headers)
    └── [x] 3.6 Health & Liveness Probes (`/health`, `/api/v1/telemetry`)

[x] PHASE 4: Enterprise Operations, Live SLA Timers & Webhook Egress
    ├── [x] 4.1 Outbound Webhook Egress Dispatcher (`backend/api/main.py` -> Slack/CRM notifications)
    ├── [x] 4.2 Executive Renewal Brief Export Endpoint (`POST /api/v1/scenarios/export-brief`)
    ├── [x] 4.3 Live Dispatched Playbook Status Patching (`PATCH /api/v1/playbooks/dispatched/{id}/status`)
    ├── [x] 4.4 Live SLA Countdown Rails & Workflows Tracker (`frontend/app/playbooks/page.tsx`)
    ├── [x] 4.5 One-Click Executive Renewal Strategy Brief Generator (`frontend/app/simulator/page.tsx`)
    └── [x] 4.6 Comprehensive Enterprise Operations & Value Engine Guide (`README.md`)
```

---

## 🔐 Environment Variables & Secrets Matrix

| Variable | Scope | Purpose | Example Value |
| :--- | :--- | :--- | :--- |
| `ENVIRONMENT` | Backend | Environment flag | `production` / `development` |
| `DATABASE_URL` | Backend | PostgreSQL / SQLite connection string | `postgresql://valence_user:pass@db:5432/valence_db` |
| `CORS_ORIGINS` | Backend | CORS allowlist (comma-separated) | `http://localhost:3000,https://valence.vercel.app` |
| `API_SECRET_KEY` | Backend | API Key Header for authenticated endpoints | `enterprise_valence_dev_key_2026` |
| `WEBHOOK_SECRET` | Backend | HMAC Secret for retraining trigger | `valence_secure_webhook_key_2026` |
| `RATE_LIMIT_PREDICT` | Backend | Rate limit for single prediction | `60/minute` |
| `RATE_LIMIT_BATCH` | Backend | Rate limit for batch CSV predictions | `10/minute` |
| `NEXT_PUBLIC_API_URL`| Frontend | Backend API base URL | `https://valence-api.onrender.com` / `http://localhost:8000` |

---

## 📡 Core API Contract Quick Reference

- **`GET /health`**: Health status & loaded model metadata.
- **`GET /api/v1/accounts/demo`**: Portfolio summary & 100 enterprise benchmark accounts.
- **`POST /api/v1/predict`**: Single account prediction + TreeSHAP feature attributions + primary playbook.
- **`POST /api/v1/simulate`**: Counterfactual what-if simulation on feature overrides.
- **`POST /api/v1/batch-predict`**: Bulk CSV upload inference with parallel risk tiering.
- **`GET /api/v1/playbooks`**: Catalog of 6 deterministic retention SLA playbooks.
- **`POST /api/v1/playbooks/dispatch`**: Dispatches retention playbook, records DB audit log, and computes SLA deadline.
- **`GET /api/v1/playbooks/dispatched`**: Queries persistent audit log of dispatched retention playbooks.
- **`POST /api/v1/accounts/{account_id}/notes`**: Persists collaborative CS note for an enterprise account.
- **`GET /api/v1/accounts/{account_id}/notes`**: Queries persistent collaboration notes for an enterprise account.
- **`POST /api/v1/retrain`**: HMAC-authenticated model retraining trigger with live memory reload.
- **`GET /api/v1/telemetry`**: Audit history of ML model training telemetry runs.
