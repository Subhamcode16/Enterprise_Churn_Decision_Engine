# Security Architecture, Threat Modeling & Production Deployment Risk Document
## Enterprise Churn & Revenue Decision Engine

**Document Metadata:**
- **Version:** 1.0.0
- **Status:** Approved
- **Compliance Scope:** OWASP Top 10 (2025/2026), API Security Best Practices, Cloud Production Hardening

---

## 1. Security Architecture & Implementation Controls

### 1.1 Credential & Secrets Management
- **Zero Secrets in Source Code:** API keys, database URLs, and session secrets are managed strictly through environment variables loaded via `.env` files in development and Cloud Dashboards in production.
- **Strict `.gitignore` Enforcement:** Root, backend, and frontend `.gitignore` files are committed first to block inadvertent leaks of `.env`, `.env.local`, `*.log`, `*.pem`, and binary artifacts.

### 1.2 Rate Limiting (SlowAPI / Redis)
To protect computational resources (specifically `shap.TreeExplainer` and batch inference), rate limiting is enforced at the FastAPI gateway:
- **Prediction Endpoint (`/api/v1/predict`):** 60 requests/minute per client IP / API key.
- **Batch Endpoint (`/api/v1/batch-predict`):** 10 requests/minute (max 5 MB file size, max 10,000 rows per batch).
- **Simulation Endpoint (`/api/v1/simulate`):** 30 requests/minute.
- **Exceeding Limits:** Returns standardized HTTP `429 Too Many Requests` with `Retry-After` header.

### 1.3 Cross-Origin Resource Sharing (CORS) Configuration
CORS middleware strictly permits trusted origins only:
```python
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    os.getenv("FRONTEND_URL", "https://enterprise-churn-engine.vercel.app"),
]
```
- Wildcard `*` origins are strictly forbidden in production.
- Allowed methods: `GET`, `POST`, `OPTIONS`.
- Allowed headers: `Content-Type`, `X-API-Key`, `Authorization`.

### 1.4 Input Validation & Sanitization (Pydantic V2)
All incoming payloads are strictly validated against numeric boundaries and regex constraints:
```python
class AccountFeaturePayload(BaseModel):
    account_id: str = Field(..., min_length=3, max_length=64, pattern=r"^[A-Za-z0-9\-_]+$")
    company_name: str = Field(..., min_length=1, max_length=128)
    contract_mrr: float = Field(..., ge=0.0, le=1_000_000.0)
    tenure_months: int = Field(..., ge=0, le=240)
    days_since_last_login: int = Field(..., ge=0, le=365)
    usage_change_pct_30d: float = Field(..., ge=-100.0, le=1000.0)
    open_p1_tickets: int = Field(..., ge=0, le=50)
    nps_score: int = Field(..., ge=0, le=10)
    payment_failures_past_quarter: int = Field(..., ge=0, le=20)
    days_until_renewal: int = Field(..., ge=0, le=730)
```

### 1.5 Error Handling & Information Leakage Prevention
- Generic user-facing messages for client responses (e.g., `{"detail": "Unable to process prediction for the specified account payload"}`).
- Detailed stack traces and exceptions are written solely to secure server-side rotating loggers (`logs/engine_audit.log`).
- No internal server paths or model memory addresses are ever exposed.

---

## 2. Threat Modeling & Mitigation Matrix

| Threat Category | Threat Scenario | Impact | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **Denial of Service (DoS)** | Malicious user submits huge CSV (1M rows) or parallel TreeSHAP computations. | High (CPU saturation & service crash) | Enforce 5MB upload ceiling, cap batch rows to 10k, queue background tasks, apply SlowAPI rate limits. |
| **Data Poisoning / Malformed Data** | Out-of-bounds or NaN values passed to XGBoost pipeline causing undefined inference behavior. | High (Corrupted predictions, silent failures) | Pydantic validation on schema + Scikit-learn imputation and clipping transformers. |
| **API Abuse / Unauthorized Ingestion** | Unauthenticated bots scraping churn scores or triggering webhook retention actions. | High (Data breach, false trigger of customer playbooks) | `X-API-Key` verification header + HMAC webhook signatures on playbook dispatch. |
| **Information Leakage** | Internal debug traces or model tree topology exposed via 500 error outputs. | Medium (Reconnaissance vulnerability) | Global FastAPI exception handlers intercepting all unhandled errors and returning clean standard error bodies. |
| **Cross-Origin Hijacking** | CSRF / unauthorized browser cross-origin requests from malicious domains. | Medium (Unauthorized state changes) | Strict CORS allowlist + SameSite cookie / Authorization header standards. |

---

## 3. Production Deployment Risks & Mitigations

### 3.1 Cloud Environment Inconsistencies (Render + Vercel)
- **Risk:** Models or packages running fine on local Windows Python fail on Render Linux due to native compilation discrepancies or missing OpenMP libraries for XGBoost/SHAP.
- **Mitigation:** Use a standardized Docker container with `python:3.11-slim` containing necessary C++ runtime libraries (`libgomp1`).

### 3.2 Uvicorn Silent Worker Failure
- **Risk:** Uncaught asynchronous exceptions can crash the Uvicorn worker process, triggering `ERR_CONNECTION_CLOSED` without logging an error.
- **Mitigation:** Wrap all prediction, SHAP, and file I/O operations in structured `try...except` blocks, catching specific `ValueError`, `KeyError`, and `Exception` instances with fallback responses.

### 3.3 Memory Spikes in SHAP Calculations
- **Risk:** SHAP `TreeExplainer` computing multi-row attributions can spike RAM, causing Render free-tier container OOM (Out Of Memory) kills.
- **Mitigation:** Pre-compile the `TreeExplainer` during application startup (`lifespan` handler) and reuse the singleton instance across requests. Use vectorized matrix operations rather than Python loops.

### 3.4 Cold Start Latency
- **Risk:** Serverless or spun-down containers take 10-30s to boot and load XGBoost weights.
- **Mitigation:** Lightweight model format (`.json` for XGBoost rather than heavy uncompressed pickles), warm-up ping in FastAPI startup routine, and Next.js optimistic loading states.

---

## 4. Production Pre-Flight Checklist

- [ ] **Secrets & Config:**
  - [ ] `.env` is listed in all `.gitignore` files.
  - [ ] `API_SECRET_KEY`, `FRONTEND_URL`, and `PORT` defined in cloud environment dashboards.
- [ ] **Network & Security:**
  - [ ] CORS limited to production Vercel domain and localhost.
  - [ ] Rate limits verified and operational.
  - [ ] All `console.log` and sensitive debug print statements stripped or directed to file logging.
- [ ] **Data & Model Integrity:**
  - [ ] Input payload validation bounds thoroughly tested with edge cases.
  - [ ] Fallback heuristics implemented in case model inference fails.
  - [ ] SHAP attribution sums tested against baseline margin.
- [ ] **Observability & Diagnostics:**
  - [ ] `/health` endpoint exposes model readiness and timestamp without sensitive internals.
  - [ ] File-based rotating logging configured (`logs/engine_audit.log`).
