@echo off
TITLE Enterprise Churn Engine Startup
echo =========================================================
echo    Enterprise Churn ^& Revenue Decision Engine Launcher
echo =========================================================
echo.

:: 1. Check Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not on PATH.
    pause
    exit /b 1
)

:: 2. Check Node
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not on PATH.
    pause
    exit /b 1
)

echo [1/3] Ensuring Backend ML models and artifacts are ready...
cd /d "%~dp0backend"
python src/train_pipeline.py
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Model pipeline generated warnings. Proceeding with startup.
)

echo.
echo [2/3] Starting FastAPI Decision Intelligence Microservice (Port 8000)...
start "Churn Decision API (FastAPI)" cmd /k "cd /d %~dp0backend && python -m uvicorn api.main:app --reload --port 8000 --host 127.0.0.1"

echo.
echo [3/3] Starting Next.js Executive Decision UI (Port 3000)...
start "Churn Engine UI (Next.js)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =========================================================
echo  Application successfully initiated!
echo  - Frontend Dashboard: http://localhost:3000
echo  - Backend API Docs:   http://localhost:8000/docs
echo  - Health Telemetry:   http://localhost:8000/health
echo =========================================================
echo.
pause
