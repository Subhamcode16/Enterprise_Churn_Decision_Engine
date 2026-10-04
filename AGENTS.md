# ⚡ AGENTS.md — Master Architecture, Decision Pipeline & System Map

> **Comprehensive Living Blueprint for Autonomous Coding & Research Agents**  
> *Everything required to understand, debug, extend, and deploy VALENCE without full codebase grepping.*

---

## 🏛️ 1. Executive System Overview

**VALENCE** is an autonomous B2B enterprise customer churn intelligence and revenue retention decision engine. It replaces lagging quarterly business reviews and arbitrary 1–100 customer health scores with calibrated machine learning, game-theoretic **TreeSHAP** mathematical feature attribution, and automated SLA-governed Customer Success playbooks.

### Core Architecture Decision Loop
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              VALENCE OPERATIONAL LOOP                                  │
│                                                                                        │
│  [ Enterprise Telemetry ] ──► [ Schema Ingestion Vault ] ──► [ Calibrated XGBoost ]     │
│  (CSV, Stripe, SF CRM)        (AES-256 GCM Isolated)         (Isotonic Probability)    │
│                                                                        │               │
│                                                                        ▼               │
│  [ Executive Renewal Brief ] ◄── [ SLA Playbook Dispatch ] ◄── [ TreeSHAP Attribution]  │
│  (PDF / Webhook / Slack)         (Dedicated TAM, Credits)      (Sub-50ms Exact Shapley)│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 2. Machine Learning & Telemetry Ingestion Pipeline

### XGBoost Classifier Architecture
- **Model Framework**: `xgboost.XGBClassifier` with calibrated post-processing.
- **Hyperparameters**:
  - `max_depth`: `4` (Constrains overfitting on noise)
  - `learning_rate`: `0.05`
  - `n_estimators`: `180`
  - `subsample`: `0.8`
  - `colsample_bytree`: `0.8`
  - `scale_pos_weight`: `2.5` (Compensates for class imbalance in enterprise churn cohorts)
  - `eval_metric`: `logloss`
- **Calibration**: Calibrated via `sklearn.calibration.CalibratedClassifierCV(method='isotonic')` to guarantee output probabilities represent empirical retention risks.

### 14 Core Telemetry Features & Schema Constraints
| Feature Key | Type | Description | Baseline Normal Range |
|---|---|---|---|
| `contract_mrr` | `float` | Monthly recurring revenue in USD | $1,000 – $500,000 |
| `tenure_months` | `int` | Customer lifetime duration in months | 1 – 120 |
| `contract_tier` | `str` | Enterprise, Mid-Market, Professional, Starter | Categorical |
| `days_since_last_login` | `int` | Primary admin/seat inactivity | 0 – 90 days |
| `usage_change_pct_30d` | `float` | 30-day product consumption velocity | -100.0% to +500.0% |
| `open_p1_tickets` | `int` | Active blocking production incidents | 0 – 10 |
| `nps_score` | `int` | Net Promoter Score rating | 0 – 10 |
| `csat_score` | `float` | Customer satisfaction rating | 1.0 – 5.0 |
| `monthly_api_calls` | `int` | API consumption velocity | 0 – 50,000,000 |
| `active_user_ratio` | `float` | Ratio of licensed seats active | 0.0 – 1.0 |
| `license_utilization_pct`| `float` | Total seat capacity utilization | 0.0 – 100.0% |
| `payment_failure_count` | `int` | Unresolved invoice retry attempts | 0 – 5 |
| `contract_duration_years`| `int` | Multi-year agreement duration | 1 – 5 |
| `auto_renew_enabled` | `bool` | Contract auto-renewal clause active | True / False |

### TreeSHAP Mathematical Attribution Engine
- **Engine**: `shap.TreeExplainer` loaded directly on the trained tree matrix.
- **Performance**: Sub-50ms local vectorized computation per account.
- **Output**: Positive SHAP values indicate churn catalysts (e.g. `+0.28` from unresolved P1 incidents), negative values indicate retention anchors (e.g. `-0.14` from 36-month contract vintage).

---

## 📁 3. Codebase Directory & Symbol Map

```
Enterprise_churn_engine/
├── AGENTS.md                          # Master architectural map for AI agents
├── TRD.MD                             # Technical Requirements Document
├── README.md                          # Product landing & executive documentation
├── start-app.bat                      # 1-Click self-healing startup script (ports 3000 & 8000)
├── sample_enterprise_accounts.csv     # Verified enterprise test cohort dataset
│
├── backend/                           # FastAPI Python Backend
│   ├── api/
│   │   ├── main.py                    # App entrypoint, middleware, lifespan & endpoints
│   │   ├── auth_routes.py             # Operator registration, JWT login, profile endpoints
│   │   └── schemas.py                 # Pydantic v2 input/output validation models
│   ├── src/
│   │   ├── auth.py                    # NIST PBKDF2 hashing, JWT verification, RBAC
│   │   ├── database.py                # SQLAlchemy 2.0 ORM models & session management
│   │   ├── model.py                   # XGBoost loader & inference abstractions
│   │   ├── explainer.py               # TreeSHAP vectorized calculation core
│   │   ├── pipeline.py                # RobustScaler + OneHotEncoder pipelines
│   │   ├── rules_engine.py            # SLA retention playbook catalog & matching logic
│   │   ├── train_pipeline.py          # Synthetic cohort generator & model trainer
│   │   └── mock_data.py               # Seed cohorts for sandbox mode
│   ├── data/                          # SQLite valence.db & demo JSON fixtures
│   ├── models/                        # Serialized xgb_churn_model.json & preprocessor.joblib
│   └── tests/                         # Pytest test suite (test_api.py, test_auth.py, test_pipeline.py)
│
└── frontend/                          # Next.js 14 React / TypeScript Frontend
    ├── app/
    │   ├── page.tsx                   # Main executive dashboard cockpit & layout
    │   ├── layout.tsx                 # Root layout with Google Inter/Outfit fonts
    │   ├── globals.css                # Tailwind CSS design system & custom scrollbars
    │   ├── simulator/page.tsx         # Real-time TreeSHAP parameter simulator
    │   ├── playbooks/page.tsx         # Retention SLA orchestration hub
    │   ├── batch/page.tsx             # Bulk CSV cohort scoring matrix
    │   └── settings/page.tsx          # Tenant vault & API connection management
    ├── components/
    │   ├── ConnectDataModal.tsx       # 3-Stage Vault Data Ingestion (Idle, HUD, 3D Tilt)
    │   ├── FaqSection.tsx             # Asymmetrical 2-column full-width editorial FAQ
    │   ├── LiveTelemetryHeader.tsx    # Header ribbon with live status & mode toggling
    │   ├── PastelBentoMetrics.tsx     # 4 Core KPI financial risk bento cards
    │   ├── CohortMigrationMatrix.tsx  # Dynamic churn migration and risk cohort flow
    │   ├── RiskTable.tsx              # Sortable, searchable enterprise account watchlist
    │   ├── ShapWaterfallChart.tsx     # Interactive TreeSHAP waterfall visualizer
    │   ├── ForceShapVisualizer.tsx    # Horizontal positive/negative force balance bar
    │   ├── AccountRadar.tsx           # 5D Health radar polygon chart
    │   ├── RenewalTimelineRail.tsx    # Interactive quarterly contract renewal rail
    │   └── DecisionCopilot.tsx        # Slide-over Bear AI retention decision copilot
    ├── lib/
    │   ├── api.ts                     # REST client connecting to FastAPI backend
    │   ├── types.ts                   # Unified TypeScript schemas & interfaces
    │   ├── sound.ts                   # Web Audio API procedural sound engine
    │   └── utils.ts                   # Currency, dates, and metric formatting helpers
    └── public/
        ├── mascot_bear.png            # Circular Bear Copilot avatar asset
        └── sample_enterprise_accounts.csv # Downloadable benchmark template
```

---

## 🗄️ 4. Persistence Models & Database Schemas

Configured via SQLAlchemy 2.0 (`backend/src/database.py`). Defaults to local SQLite (`data/valence.db`) and transparently supports PostgreSQL in production via `DATABASE_URL`.

### Database Tables
```sql
-- Operator & Executive RBAC Accounts
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'operator' NOT NULL, -- 'admin', 'operator', 'executive'
    is_active BOOLEAN DEFAULT 1 NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login DATETIME
);

-- AES-256 GCM Isolated Tenant Vault Partition
CREATE TABLE tenant_vaults (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenant_id VARCHAR(100) NOT NULL,
    data_source VARCHAR(50) NOT NULL, -- 'csv', 'stripe', 'salesforce'
    records_count INTEGER DEFAULT 0 NOT NULL,
    encrypted_payload TEXT,
    schema_status VARCHAR(50) DEFAULT 'verified' NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Retention SLA Action Audit Log
CREATE TABLE playbook_executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id VARCHAR(100) NOT NULL,
    playbook_id VARCHAR(50) NOT NULL,
    playbook_name VARCHAR(255) NOT NULL,
    dispatched_by VARCHAR(255) DEFAULT 'system_operator' NOT NULL,
    status VARCHAR(50) DEFAULT 'dispatched' NOT NULL,
    sla_deadline_hours INTEGER DEFAULT 24 NOT NULL,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Security & Telemetry Audit Trail
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    ip_address VARCHAR(50),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL
);
```

---

## 🔒 5. Security Architecture & OWASP Defense

1. **Password Security**: NIST-compliant PBKDF2-HMAC-SHA256 with 100,000 iterations and cryptographically random 32-byte salts.
2. **Session Authentication**: HMAC-SHA256 Bearer JWT tokens with 7-day expiration and constant-time verification.
3. **Rate Limiting**: `SlowAPI` token-bucket limiter restricting `/api/predict` and `/api/auth/*` to **5 requests per minute** per client IP.
4. **Security Headers**:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: DENY` (Clickjacking mitigation)
   - `X-XSS-Protection: 1; mode=block`
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
   - `Referrer-Policy: strict-origin-when-cross-origin`
5. **Data Protection**: Tenant datasets are encrypted at rest with hardware-accelerated AES-256 GCM in isolated vault partitions.

---

## 📡 6. Complete REST API Specification

| HTTP Method | Route | Description | Auth Guard |
|---|---|---|---|
| `POST` | `/api/auth/register` | Creates a new operator account | Public |
| `POST` | `/api/auth/login` | Issues 7-day Bearer JWT token | Public |
| `GET` | `/api/auth/me` | Validates active operator profile & role | `Bearer Token` |
| `GET` | `/api/accounts/demo` | Retrieves sandbox cohort accounts & portfolio summary | Public / Token |
| `POST` | `/api/predict` | Runs instant XGBoost + TreeSHAP prediction on account payload | Rate-limited (5/min) |
| `POST` | `/api/workspace/import` | Ingests CSV or initiates OAuth synchronization into tenant vault | Public / Token |
| `GET` | `/api/workspace/status` | Returns workspace mode (`demo` vs `live`) and active source | Public / Token |
| `POST` | `/api/workspace/mode` | Swaps workspace view between demo sandbox and live vault | Public / Token |
| `POST` | `/api/playbooks/{id}/execute`| Triggers SLA retention playbook, audit log & webhooks | Public / Token |
| `POST` | `/api/simulate` | Evaluates what-if telemetry adjustments against TreeSHAP | Public / Token |
| `GET` | `/api/health` | Service liveness probe & engine memory state | Public |

---

## 🚀 7. Operational Runbook & 1-Click Launch

### Windows 1-Click Startup
```powershell
.\start-app.bat
```
*The script terminates any orphaned processes on port `3000` and `8000`, installs dependencies, and launches both Next.js and FastAPI.*

### Manual Startup
```bash
# 1. Backend (Terminal 1)
cd backend
python -m uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload

# 2. Frontend (Terminal 2)
cd frontend
npm run dev -p 3000
```
Open **http://localhost:3000** in your browser.
