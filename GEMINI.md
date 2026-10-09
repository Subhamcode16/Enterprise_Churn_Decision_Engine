# 🧠 GEMINI.md — Persistent Memory, Agent Rules & Operational Standards

> **Master Operating Directives & Long-Term Memory for Antigravity Agents**  
> *Active Workspace: VALENCE Enterprise Churn Intelligence & Decision Engine*

---

## ⚡ 1. Mandatory Agent Interaction Rules
1. **Mandatory Understanding Phase**: The agent MUST ask the host 3–4 questions related to the subject along with provided options before finalizing a plan.
2. **Mandatory Confirmation ("Green Signal")**: The agent MUST always request and obtain an explicit "green signal" approval from the host before executing code modifications or deployments.

---

## 🤖 2. Gemini AI Model Family & Intelligence Standards
- **Active Flagship Standard**: **Gemini 3 Family** (`gemini-3.8-flash` as primary flagship, `gemini-3.5-flash` as high-throughput secondary).
- **Deprecation Notice**: Gemini 2.x and below models are legacy and should not be prioritized.
- **Waterfall Fallback Strategy**:
  1. `gemini-3.8-flash` (Primary Flagship Reasoning)
  2. `gemini-3.5-flash` (Secondary High-Speed Engine)
  3. `gemini-2.5-flash` (Legacy Stable Fallback)
  4. Local Vectorized TreeSHAP Deterministic Engine (Zero-API Resilience)
- **SDK Protocol**: Use `google.generativeai` with clean model identifiers (do NOT prepend `models/`).

---

## 🎨 3. Design System & UI/UX Directives
- **Palette**: Refined executive pine & mint theme (`#051F20`, `#163832`, `#235347`, `#40C463`, `#9BE9A8`, `#DAF1DE`, `#FAFDFB`).
- **Telemetry Heatmap Architecture**: Authentic GitHub-style 52-week contribution graph with $10\text{px} \times 10\text{px}$ micro-tiles, top month markers (`Oct`–`Sep`), left weekday indicators (`Mon`, `Wed`, `Fri`), hover scale physics, dynamic telemetry ribbon, and scoring methodology modal.
- **5-Tier Pure Green Telemetry Scale**:
  - **Level 0 (`#EBEDF0`)**: Neutral / Zero Churn Signals ($0 loss)
  - **Level 1 (`#9BE9A8`)**: Healthy Baseline Operations (< $2k at risk)
  - **Level 2 (`#40C463`)**: Moderate Attention Warning ($2k – $5k at risk)
  - **Level 3 (`#235347`)**: High Risk Exposure ($5k – $20k at risk)
  - **Level 4 (`#0B2B26`)**: P0 Critical Crisis Escalation (> $20k at risk)
- **Modal Design**: Custom scrollable forms, distinct tab triggers (CSV, Cloud Connectors, Manual Entry), and calibrated text opacity for pre-filled inputs.

---

## 🔒 4. Security & OWASP Defense Rules
- **API Key Hygiene**: NEVER hardcode API keys or secrets in source code. All credentials reside in `.env` and must be verified in `.gitignore`.
- **Authentication**: NIST PBKDF2-HMAC-SHA256 (100k iterations, 32-byte salt) + 7-day HMAC-SHA256 JWT tokens with constant-time validation.
- **Rate Limiting**: SlowAPI token-bucket limiter on prediction and auth endpoints (default 5 req/min per IP).
- **CORS Whitelist**: Explicitly permit `http://localhost:3000` (development) and production domain (`https://valence-engine.vercel.app`).
- **Security Headers**: HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.

---

## 🌐 5. Deployment & Cloud Architecture
- **Frontend (Vercel)**: Next.js 14 App Router, auto-deploy on `git push origin main`, `NEXT_PUBLIC_API_URL` pointing to live backend.
- **Backend (Render)**: FastAPI Python 3.11+ container, uvicorn production server, health probe `/api/health`.
- **Database**: SQLite (`data/valence.db`) for local dev; PostgreSQL (`DATABASE_URL`) in production.

---

## 🛠️ 6. Debugging & Server Management
```powershell
# Check for active processes on port 8000 or 3000
Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess
Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess

# Force terminate orphaned processes
Stop-Process -Id <PID> -Force

# Launch full platform via 1-Click Startup
.\start-app.bat
```
