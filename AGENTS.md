# ⚡ AGENTS.md — Master Architecture, Decision Pipeline & System Map

> **Comprehensive Living Blueprint for Autonomous Coding & Research Agents**  
> *Everything required to understand, debug, extend, and deploy VALENCE without full codebase grepping.*

---

## 🏛️ 1. Executive System Overview

**VALENCE** is an enterprise-grade autonomous customer churn intelligence and revenue retention decision platform. It replaces lagging quarterly business reviews (QBRs) and arbitrary 1–100 health scores with calibrated machine learning, game-theoretic **TreeSHAP** mathematical feature attribution, and generative AI decision copilots backed by the **Gemini 3 Family** (`gemini-3.8-flash` & `gemini-3.5-flash`).

### Dual-Engine Decision Loop
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              VALENCE OPERATIONAL LOOP                                  │
│                                                                                        │
│  [ Enterprise Telemetry ] ──► [ Schema Ingestion Vault ] ──► [ Calibrated XGBoost ]     │
│  (CSV, Stripe, SF CRM)        (AES-256 GCM Isolated)         (Isotonic Probability)    │
│                                                                        │               │
│                                                                        ▼               │
│  [ Executive Renewal Brief ] ◄── [ SLA Playbook Dispatch ] ◄── [ TreeSHAP Attribution]  │
│  (Gemini 3 AI Synthesis)         (Dedicated TAM, Credits)      (Sub-50ms Exact Shapley)│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 2. Machine Learning & Telemetry Ingestion Pipeline

### XGBoost Classifier Architecture
- **Model Framework**: `xgboost.XGBClassifier` with calibrated post-processing.
- **Hyperparameters**:
  - `max_depth`: `4` (Constrains overfitting on noisy telemetry)
  - `learning_rate`: `0.05`
  - `n_estimators`: `180`
  - `subsample`: `0.8`
  - `colsample_bytree`: `0.8`
  - `scale_pos_weight`: `2.5` (Compensates for enterprise churn class imbalance)
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

### Gemini 3 LLM Copilot & Waterfall Fallback Architecture
For natural language queries, root-cause diagnosis, and automated executive renewal brief generation, the backend implements a resilient waterfall cascade:
1. **Primary Model**: `gemini-3.8-flash` (State-of-the-art fast reasoning & telemetry synthesis)
2. **Secondary Model**: `gemini-3.5-flash` (High-throughput efficient inference)
3. **Legacy Fallback**: `gemini-2.5-flash` (Stable safety net)
4. **Deterministic Resilience**: If API keys or external networks are unavailable, the system automatically falls back to local TreeSHAP heuristic synthesis without crashing.

---

## 📁 3. Complete Codebase Directory & Symbol Map

```
Enterprise_churn_engine/
├── AGENTS.md                          # Master architectural map for AI agents
├── GEMINI.md                          # Persistent agent memory & operational directives
├── TRD.MD                             # Technical Requirements Document
├── DEPLOYMENT_GUIDE.md                # Production cloud setup (Vercel + Render)
├── README.md                          # Product landing & executive overview
├── start-app.bat                      # 1-Click self-healing startup script (ports 3000 & 8000)
├── sample_enterprise_accounts.csv     # Verified enterprise test cohort dataset
│
├── backend/                           # FastAPI Python Backend
│   ├── api/
│   │   ├── main.py                    # Gateway entrypoint, middleware, Gemini 3 copilot, REST routes
│   │   ├── auth_routes.py             # Operator registration, JWT authentication, RBAC endpoints
│   │   └── schemas.py                 # Pydantic v2 input/output validation models
│   ├── src/
│   │   ├── auth.py                    # NIST PBKDF2 hashing, JWT verification, constant-time checks
│   │   ├── database.py                # SQLAlchemy 2.0 ORM models & session management
│   │   ├── limiter.py                 # SlowAPI rate limiting configuration
│   │   ├── model.py                   # XGBoost loader & inference abstractions
│   │   ├── explainer.py               # TreeSHAP vectorized calculation core
│   │   ├── pipeline.py                # RobustScaler + OneHotEncoder preprocessing pipelines
│   │   ├── rules_engine.py            # SLA retention playbook catalog & matching logic
│   │   ├── train_pipeline.py          # Synthetic cohort generator & model trainer
│   │   └── mock_data.py               # Seed cohorts for sandbox mode
│   ├── data/                          # SQLite valence.db & demo JSON fixtures
│   ├── models/                        # Serialized xgb_churn_model.json & preprocessor.joblib
│   └── tests/                         # Pytest test suite (test_api.py, test_auth.py, test_pipeline.py)
│
└── frontend/                          # Next.js 14 React / TypeScript Frontend
    ├── app/
    │   ├── page.tsx                   # Main executive dashboard cockpit
    │   ├── layout.tsx                 # Root layout with Google Inter/Outfit typography
    │   ├── globals.css                # Tailwind CSS design system, glassmorphism, scrollbars
    │   ├── simulator/page.tsx         # Real-time TreeSHAP parameter simulator
    │   ├── playbooks/page.tsx         # Retention SLA orchestration hub
    │   ├── batch/page.tsx             # Bulk CSV cohort scoring matrix
    │   └── settings/page.tsx          # Tenant vault & API connection management
    ├── components/
    │   ├── PortfolioRiskMatrix.tsx    # Gartner 2×2 Matrix + GitHub 52-Week Contribution Heatmap
    │   ├── ConnectDataModal.tsx       # 3-Stage Ingestion Vault (CSV, Cloud OAuth, Manual Entry)
    │   ├── LiveTelemetryHeader.tsx    # Executive header ribbon with mode toggling & sound engine
    │   ├── PastelBentoMetrics.tsx     # 4 Core KPI financial risk bento cards
    │   ├── CohortMigrationMatrix.tsx  # Dynamic churn migration and risk cohort flow
    │   ├── RiskTable.tsx              # Sortable, searchable enterprise account watchlist
    │   ├── ShapWaterfallChart.tsx     # Interactive TreeSHAP waterfall visualizer
    │   ├── ForceShapVisualizer.tsx    # Horizontal positive/negative force balance bar
    │   ├── AccountRadar.tsx           # 5D Health radar polygon chart
    │   ├── RenewalTimelineRail.tsx    # Interactive quarterly contract renewal rail
    │   ├── DecisionCopilot.tsx        # Slide-over Bear AI retention decision copilot
    │   └── FaqSection.tsx             # Asymmetrical 2-column full-width editorial FAQ
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

## 🎨 4. Frontend UI & Telemetry Heatmap Architecture

### PortfolioRiskMatrix & GitHub 52-Week Contribution Map
Located in `frontend/components/PortfolioRiskMatrix.tsx`:
- **Gartner 2×2 Risk/Value Canvas**: Interactive 2D scatter matrix mapping Churn Probability (X-axis) against Contract MRR (Y-axis), segmented into 4 quadrant zones (P0 Crisis Exposure, Expansion ARR Pool, Automated Nurture, Stable Core).
- **GitHub 52-Week Contribution Matrix**: 52 weekly columns $\times$ 7 daily rows ($10\text{px} \times 10\text{px}$ micro-tiles), top month markers (`Oct` through `Sep`), left weekday indicators (`Mon`, `Wed`, `Fri`), spring scale hover physics, dynamic telemetry ribbon, and scoring methodology modal.

### 5-Tier Pure Green Telemetry Scale
| Tier | Color Code | Visual Accent | Telemetry Meaning / Threshold |
| :--- | :--- | :--- | :--- |
| **Level 0** | `#EBEDF0` / `rgba(22,56,50,0.06)` | Light Grey | **Neutral / Zero Signals**: No churn events recorded ($0 loss) |
| **Level 1** | `#9BE9A8` | Light Mint | **Healthy Baseline**: Stable engagement, low risk exposure (< $2k at risk) |
| **Level 2** | `#40C463` | Soft Emerald | **Moderate Warning**: Minor usage drop or renewal in <90d ($2k–$5k at risk) |
| **Level 3** | `#235347` | Deep Forest Green | **High Risk Exposure**: Significant attrition or sponsor departure ($5k–$20k) |
| **Level 4** | `#0B2B26` | Midnight Jade | **P0 Critical Crisis**: Imminent churn hazard (>60% prob, >$20k MRR at risk) |

---

## 🗄️ 5. Persistence Models & Database Schemas

Configured via SQLAlchemy 2.0 (`backend/src/database.py`). Defaults to local SQLite (`data/valence.db`) and transparently connects to PostgreSQL (`DATABASE_URL`) in production.

### Core Database Tables
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

## 🔒 6. Security Architecture & OWASP Defense

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

## 📡 7. Complete REST API Specification

| HTTP Method | Route | Description | Auth Guard |
|---|---|---|---|
| `POST` | `/api/auth/register` | Creates a new operator account | Public |
| `POST` | `/api/auth/login` | Issues 7-day Bearer JWT token | Public |
| `GET` | `/api/auth/me` | Validates active operator profile & role | `Bearer Token` |
| `GET` | `/api/accounts/demo` | Retrieves sandbox cohort accounts & portfolio summary | Public / Token |
| `POST` | `/api/predict` | Runs instant XGBoost + TreeSHAP prediction on account payload | Rate-limited (5/min) |
| `POST` | `/api/copilot/chat` | Gemini 3 AI Copilot telemetry synthesis & brief generation | Public / Token |
| `POST` | `/api/workspace/import` | Ingests CSV or initiates OAuth synchronization into tenant vault | Public / Token |
| `GET` | `/api/workspace/status` | Returns workspace mode (`demo` vs `live`) and active source | Public / Token |
| `POST` | `/api/workspace/mode` | Swaps workspace view between demo sandbox and live vault | Public / Token |
| `POST` | `/api/playbooks/{id}/execute`| Triggers SLA retention playbook, audit log & webhooks | Public / Token |
| `POST` | `/api/simulate` | Evaluates what-if telemetry adjustments against TreeSHAP | Public / Token |
| `GET` | `/api/health` | Service liveness probe & engine memory state | Public |

---

## 🌐 8. Cloud Deployment & CI/CD Blueprint

### Production Architecture
- **Frontend (Vercel)**: Next.js 14 App Router, static page generation, serverless edge functions. Automatically redeploys on push to `main`.
- **Backend (Render)**: Docker / Python 3.11+ web service running Uvicorn with auto-restart on commit.
- **Environment Variables**:
  - Frontend: `NEXT_PUBLIC_API_URL=https://valence-decision-engine.onrender.com`
  - Backend: `GEMINI_API_KEY=AIzaSy...`, `DATABASE_URL=postgresql://...`, `FRONTEND_URL=https://valence-engine.vercel.app`

---

## 🚀 9. Operational Runbook & 1-Click Launch

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
