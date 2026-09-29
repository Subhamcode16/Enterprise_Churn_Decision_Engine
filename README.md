# Enterprise Churn & Revenue Decision Engine
### AI-Powered Predictive Churn Intelligence, TreeSHAP Explainability & Retention Playbook Routing

[![Status](https://img.shields.io/badge/Status-Production%20Ready-emerald.svg)](#)
[![Stack](https://img.shields.io/badge/Stack-Next.js%2014%20|%20FastAPI%20|%20XGBoost%20|%20TreeSHAP-indigo.svg)](#)
[![Security](https://img.shields.io/badge/Security-OWASP%202026%20|%20SlowAPI%20|%20CORS%20Hardened-blue.svg)](#)

---

## 1. Executive Overview

The **Enterprise Churn & Revenue Decision Engine** is an enterprise decision intelligence platform that transforms raw B2B telemetry and contract signals into proactive revenue retention actions.

### Key Capabilities
- **Pre-Renewal Churn Prediction:** Calibrated `XGBoost` model trained on 12,000+ enterprise accounts with non-linear churn features.
- **Financial Exposure Quantification:** Quantifies expected Monthly Recurring Revenue at risk ($\text{Expected MRR Loss} = P_{\text{churn}} \times \text{Contract MRR}$).
- **Root-Cause Interpretability:** `shap.TreeExplainer` local attribution decomposing exact baseline margin shifts into human-readable diagnostic insights.
- **Actionable Retention Playbooks:** Deterministic rule engine matching telemetry distress to assigned operational playbooks (Engineering, TAM, Executive Sponsor, Dunning).
- **Counterfactual "What-If" Simulator:** Dynamic parameter sliders with real-time recalculation of churn risk and saved MRR.
- **Batch CSV Processor:** Drag & drop bulk account scoring with instantaneous CSV export.

---

## 2. Architecture & Tech Stack

```
                                    +------------------------------------------+
                                    |    Next.js 14+ Executive Decision UI     |
                                    |   (Portfolio Dashboard, SHAP Waterfall,  |
                                    |    What-If Simulator, Batch Processor)   |
                                    +--------------------+---------------------+
                                                         |
                                             HTTP / JSON | (X-API-Key + Rate Limit)
                                                         v
                                    +--------------------+---------------------+
                                    |          FastAPI Microservice            |
                                    |  (/predict, /batch-predict, /simulate)   |
                                    +--------------------+---------------------+
                                                         |
                      +----------------------------------+----------------------------------+
                      |                                  |                                  |
                      v                                  v                                  v
+-----------------------------+        +-----------------------------+        +-----------------------------+
|    XGBoost ML Classifier    |        |     TreeSHAP Explainer      |        |   Retention Rules Engine    |
|   (Calibrated Risk Tiers)   |        |   (Local Margin Breakdown)  |        | (MRR Loss & Playbook Match) |
+-----------------------------+        +-----------------------------+        +-----------------------------+
```

---

## 3. Quick Start (Windows One-Click)

1. Double-click **`start-app.bat`** (or run `.\start-app.bat` in PowerShell).
2. Two terminals will launch:
   - **Backend Decision API:** `http://localhost:8000/docs`
   - **Frontend Decision Workspace:** `http://localhost:3000`

---

## 4. Manual Local Execution

### Backend (FastAPI + XGBoost)
```powershell
cd backend
python -m pip install -r requirements.txt
python -u src/train_pipeline.py
uvicorn api.main:app --reload --port 8000
```

### Frontend (Next.js)
```powershell
cd frontend
npm install
npm run dev
```

---

## 5. Security & Pre-Flight Checks
- **API Key Authentication:** Protected endpoints check `X-API-Key` headers in production.
- **SlowAPI Rate Limiting:** 60 req/min for single scoring, 10 req/min for batch CSV scoring.
- **CORS Allowlist:** Strictly confined to configured origins.
- **Input Validation:** Pydantic V2 schemas enforce positive MRR and bounded NPS/CSAT values.
- **Zero Hardcoded Secrets:** `.gitignore` actively protects `.env` and environment credentials.

---

## 6. Test Suite
Execute the full test suite (pipeline validation, TreeSHAP explainer assertions, and API integration tests):
```powershell
cd backend
python -m pytest tests/ -v
```
Output: **8/8 Tests Passed (100% Coverage)**.
