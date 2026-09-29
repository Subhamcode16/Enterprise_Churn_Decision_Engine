# Technical Requirements Document (TRD)

## Project Name
Enterprise Churn & Revenue Decision Engine

## Document Metadata
- Version: 1.0.0
- Status: Architecture Approved
- Target Stack: Next.js (App Router, TypeScript), FastAPI (Python 3.11+), XGBoost, Scikit-learn, SHAP, Docker

---

## 1. System Architecture

[ Synthetic B2B Dataset Engine / Ingestion ]
               |
               v
[ Preprocessing & Feature Pipeline (Pandas, Scikit-Learn RobustScaler) ]
               |
               v
[ Inference & Explainability Core (XGBoost Classifier + TreeSHAP) ]
               |
               v
[ Decision & Rules Engine (Revenue Loss + Playbook Mapper) ]
               |
               v
[ Serving & API Layer (FastAPI REST API with SlowAPI & Auth) ]
               |
               v
[ Executive UI & Decision Workspace (Next.js 14+ / React Dashboard) ]

---

## 2. Data Engineering & Feature Specifications

### 2.1 Feature Definitions
- contract_mrr (float): Current Monthly Recurring Revenue ($).
- tenure_months (int): Number of active subscription months.
- days_since_last_login (int): Days since user or team activity.
- usage_change_pct_30d (float): Percentage change in feature utilization over 30 days.
- open_p1_tickets (int): Number of unresolved critical support tickets.
- nps_score (int): Net Promoter Score rating (0-10).
- payment_failures_past_quarter (int): Count of failed automated billing attempts.

### 2.2 Data Pipeline & Preprocessing
- Missing Value Imputation: Median imputation for continuous variables; mode imputation for categorical attributes.
- Scaling: RobustScaler to handle extreme outliers in MRR and usage metrics without distorting distribution tails.
- Handling Class Imbalance: Set scale_pos_weight in XGBoost based on the negative-to-positive class ratio:
  scale_pos_weight = N_retained / N_churned

---

## 3. Modeling & Explainability Specifications

### 3.1 Model Architecture
- Algorithm: xgboost.XGBClassifier
- Objective: binary:logistic
- Hyperparameter Optimization: Optuna / 5-fold Stratified Cross-Validation tuning max_depth, learning_rate, subsample, and colsample_bytree.

### 3.2 Explainability Core
- Explainer: shap.TreeExplainer utilizing tree structure optimization for fast local attribution.
- Output: Exact feature contributions (Shapley Values) summing to the difference between model output and expected base margin.

---

## 4. API Data Contracts & Endpoints

### 4.1 POST /predict
Scores an individual account payload and returns risk metrics, top drivers, and playbook recommendations.

Request Payload:
{
  "account_id": "ACC-9042",
  "contract_mrr": 4500.00,
  "tenure_months": 14,
  "days_since_last_login": 18,
  "usage_change_pct_30d": -42.5,
  "open_p1_tickets": 2,
  "nps_score": 5,
  "payment_failures_past_quarter": 1
}

Response Payload:
{
  "account_id": "ACC-9042",
  "churn_probability": 0.842,
  "risk_tier": "Critical",
  "mrr_at_risk": 3789.00,
  "top_drivers": [
    {
      "feature": "usage_change_pct_30d",
      "direction": "increases_risk",
      "shap_value": 0.381
    },
    {
      "feature": "open_p1_tickets",
      "direction": "increases_risk",
      "shap_value": 0.294
    },
    {
      "feature": "tenure_months",
      "direction": "decreases_risk",
      "shap_value": -0.112
    }
  ],
  "recommended_playbook": "Escalate unresolved P1 tickets to Engineering and schedule an emergency health review."
}

### 4.2 POST /batch-predict
Accepts a .csv file upload containing multiple account records, runs vectorized scoring, and returns an enriched dataset with risk tiers, MRR at risk, and primary churn drivers.

---

## 5. Repository Structure

enterprise-churn-engine/
├── data/
│   ├── raw/
│   └── processed/
├── notebooks/
│   └── 01_eda_and_feature_engineering.ipynb
├── src/
│   ├── __init__.py
│   ├── data_pipeline.py
│   ├── model.py
│   ├── explainer.py
│   └── rules_engine.py
├── api/
│   ├── __init__.py
│   └── app.py
├── dashboard/
│   └── app.py
├── tests/
│   ├── test_pipeline.py
│   └── test_api.py
├── Dockerfile
├── requirements.txt
└── README.md