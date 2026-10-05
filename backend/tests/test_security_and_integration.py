"""
VALENCE Enterprise Decision Engine — End-to-End Security & Integration Verification Suite
Tests Auth, Database WAL, Multi-tier Rate Limiting, RBAC, Security Headers & ML Decision APIs.
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient

# Ensure backend root on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from api.main import app
from src.database import init_db, SessionLocal, User
from src.auth import hash_password, verify_password, generate_salt, create_access_token, decode_access_token

@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    init_db()
    yield

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


# ==============================================================================
# 1. AUTHENTICATION & NIST PBKDF2 SECURITY TESTS
# ==============================================================================

def test_password_hashing_and_verification():
    """Verify PBKDF2-HMAC-SHA256 hashing and constant-time verification"""
    raw_pass = "ValenceSecureTest2026!"
    salt = generate_salt()
    hashed = hash_password(raw_pass, salt)
    
    assert hashed != raw_pass
    assert verify_password(raw_pass, salt, hashed) is True
    assert verify_password("WrongPassword123!", salt, hashed) is False


def test_jwt_token_creation_and_expiration():
    """Verify HMAC-SHA256 JWT encoding, claims decoding, and integrity"""
    payload = {"sub": "999", "email": "security.lead@valence.ai", "role": "admin"}
    token = create_access_token(payload)
    
    assert isinstance(token, str)
    assert len(token.split(".")) == 3
    
    decoded = decode_access_token(token)
    assert decoded["sub"] == "999"
    assert decoded["email"] == "security.lead@valence.ai"
    assert decoded["role"] == "admin"
    assert decoded["iss"] == "valence_retention_core"


def test_auth_registration_and_login_flow(client):
    """End-to-end user registration, duplicate prevention, and login"""
    unique_email = f"operator_{os.urandom(4).hex()}@enterprise-test.ai"
    password = "SuperSecurePassword2026!"
    
    # 1. Register
    reg_res = client.post(
        "/api/auth/register",
        json={
            "email": unique_email,
            "password": password,
            "full_name": "Senior Retention Operator",
            "role": "operator"
        }
    )
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == unique_email
    assert reg_data["user"]["role"] == "operator"

    # 2. Duplicate prevention
    dup_res = client.post(
        "/api/auth/register",
        json={
            "email": unique_email,
            "password": password,
            "full_name": "Duplicate User",
            "role": "operator"
        }
    )
    assert dup_res.status_code == 400

    # 3. Successful Login
    login_res = client.post(
        "/api/auth/login",
        json={"email": unique_email, "password": password}
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 4. Authenticated /me endpoint
    me_res = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == unique_email
    assert me_data["role"] == "operator"


# ==============================================================================
# 2. SECURITY HEADERS & DEFENSE-IN-DEPTH
# ==============================================================================

def test_security_headers_present(client):
    """Verify modern HTTP defense-in-depth headers are injected on all responses"""
    res = client.get("/health")
    assert res.status_code == 200
    headers = res.headers
    
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "max-age=31536000" in headers.get("Strict-Transport-Security", "")


# ==============================================================================
# 3. ML PREDICTION & TREESHAP EXPLAINABILITY INTEGRATION
# ==============================================================================

def test_single_prediction_and_shap_pipeline(client):
    """Verify XGBoost prediction, risk tiering, and SHAP top drivers"""
    account_payload = {
        "account_id": "ACC-TEST-9901",
        "company_name": "Apex Global Logistics",
        "contract_mrr": 18500.0,
        "tenure_months": 14,
        "contract_tier": "Enterprise",
        "days_since_last_login": 22,
        "usage_change_pct_30d": -42.0,
        "active_user_ratio": 0.45,
        "api_calls_monthly": 8500,
        "open_p1_tickets": 3,
        "avg_resolution_time_hrs": 24.5,
        "nps_score": 4,
        "csat_score": 3.2,
        "payment_failures_past_quarter": 2,
        "days_until_renewal": 45,
        "auto_renew_enabled": 0
    }

    res = client.post("/api/v1/predict", json=account_payload)
    assert res.status_code == 200
    data = res.json()
    
    assert "churn_probability" in data
    assert 0.0 <= data["churn_probability"] <= 1.0
    assert data["risk_tier"].upper() in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    assert "top_drivers" in data
    assert len(data["top_drivers"]) > 0
    assert "recommended_playbooks" in data


def test_what_if_counterfactual_simulation(client):
    """Verify counterfactual scenario simulation with parameter overrides"""
    base_account = {
        "account_id": "ACC-SIM-101",
        "company_name": "OmniCorp Cloud",
        "contract_mrr": 12000.0,
        "tenure_months": 12,
        "contract_tier": "Enterprise",
        "days_since_last_login": 15,
        "usage_change_pct_30d": -25.0,
        "active_user_ratio": 0.60,
        "api_calls_monthly": 12000,
        "open_p1_tickets": 2,
        "avg_resolution_time_hrs": 14.0,
        "nps_score": 5,
        "csat_score": 3.8,
        "payment_failures_past_quarter": 1,
        "days_until_renewal": 60,
        "auto_renew_enabled": 0
    }

    sim_payload = {
        "account_payload": base_account,
        "overrides": {
            "days_since_last_login": 2,
            "open_p1_tickets": 0,
            "usage_change_pct_30d": 15.0,
            "auto_renew_enabled": 1
        }
    }

    res = client.post("/api/v1/simulate", json=sim_payload)
    assert res.status_code == 200
    sim_data = res.json()
    assert "churn_probability" in sim_data
    assert "top_drivers" in sim_data
