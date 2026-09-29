# Production Deployment & Operations Guide
## Enterprise Churn & Revenue Decision Engine

This guide provides end-to-end instructions for deploying the **Enterprise Churn & Revenue Decision Engine** across local environments, Docker containers, and Cloud platforms (Render for Backend API and Vercel for Next.js Frontend).

---

## 1. Local Development Setup

### 1.1 Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- Git

### 1.2 Quick Local Start
We provide automated launch scripts for unified execution.

1. **Backend Environment Setup:**
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   python -m src.train_pipeline # Generates data & trains model artifacts
   uvicorn api.main:app --reload --port 8000
   ```

2. **Frontend Setup:**
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

3. **Access Applications:**
   - **Frontend UI:** `http://localhost:3000`
   - **FastAPI Docs:** `http://localhost:8000/docs`
   - **API Health Check:** `http://localhost:8000/health`

---

## 2. Docker Containerization

### 2.1 Backend Dockerfile
The backend uses a lightweight Python 3.11-slim image with non-root security enforcement:

```dockerfile
FROM python:3.11-slim AS builder

WORKDIR /app

# Install compilation dependencies for OpenMP / XGBoost / SHAP
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Train model if artifacts are not present
RUN python -m src.train_pipeline

# Create non-root user
RUN addgroup --system appgroup && adduser --system --group appuser
USER appuser

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2.2 Docker Compose (Full Stack)
```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - API_SECRET_KEY=prod_super_secret_key_12345
      - FRONTEND_URL=http://localhost:3000
      - ENVIRONMENT=production
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - API_SECRET_KEY=prod_super_secret_key_12345
    depends_on:
      - backend
    restart: unless-stopped
```

---

## 3. Cloud Deployment (Render + Vercel)

### 3.1 Backend Deployment on Render (Web Service)
1. **Repository Link:** Connect your GitHub repository to Render.
2. **Settings:**
   - **Environment:** Docker (or Python 3)
   - **Build Command:** `pip install -r requirements.txt && python -m src.train_pipeline`
   - **Start Command:** `uvicorn api.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
3. **Environment Variables on Render:**
   - `ENVIRONMENT` = `production`
   - `API_SECRET_KEY` = `<secure-random-token>`
   - `FRONTEND_URL` = `https://your-frontend-app.vercel.app`
   - `CORS_ORIGINS` = `https://your-frontend-app.vercel.app,http://localhost:3000`

### 3.2 Frontend Deployment on Vercel
1. **Import Project:** Select the `frontend/` directory in Vercel.
2. **Framework Preset:** Next.js
3. **Build Settings:**
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
4. **Environment Variables on Vercel:**
   - `NEXT_PUBLIC_API_URL` = `https://your-backend-app.onrender.com`
   - `API_SECRET_KEY` = `<same-secure-random-token>`

---

## 4. Post-Deployment Verification & Diagnostics

1. **Verify Backend Health:**
   ```bash
   curl -I https://your-backend-app.onrender.com/health
   # Expected: HTTP 200 OK with model_loaded: true
   ```

2. **Verify Prediction & Explanation Pipeline:**
   ```bash
   curl -X POST https://your-backend-app.onrender.com/api/v1/predict \
     -H "Content-Type: application/json" \
     -H "X-API-Key: <your-key>" \
     -d '{"account_id":"TEST-01","company_name":"Test Corp","contract_mrr":5000,"tenure_months":12,"days_since_last_login":5,"usage_change_pct_30d":-20,"open_p1_tickets":1,"nps_score":6,"payment_failures_past_quarter":0,"days_until_renewal":60}'
   ```

3. **Verify CORS & Rate Limiting:**
   - Send requests from unauthorized origins and verify blocked pre-flight.
   - Fire 70 rapid requests and verify `429 Too Many Requests`.

---

## 5. Rollback Procedures
- **Vercel:** Instantly redeploy the previous stable deployment hash from the Vercel Deployments dashboard.
- **Render:** Roll back to the previous successful deploy image or commit from the Render History tab.
