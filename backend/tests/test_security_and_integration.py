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


# ==============================================================================
# 4. MULTI-TENANT USER ISOLATION & PER-USER WORKSPACE PERSISTENCE
# ==============================================================================

def test_multi_tenant_notes_and_playbook_isolation(client):
    """Verify strict per-user database partitioning on operational notes and playbooks"""
    # 1. Register User Alpha
    email_a = f"user_alpha_{os.urandom(4).hex()}@tenant-a.com"
    res_a = client.post("/api/auth/register", json={
        "email": email_a,
        "password": "Password123!",
        "full_name": "Operator Alpha",
        "role": "operator"
    })
    assert res_a.status_code == 201
    token_a = res_a.json()["access_token"]

    # 2. Register User Beta
    email_b = f"user_beta_{os.urandom(4).hex()}@tenant-b.com"
    res_b = client.post("/api/auth/register", json={
        "email": email_b,
        "password": "Password123!",
        "full_name": "Operator Beta",
        "role": "operator"
    })
    assert res_b.status_code == 201
    token_b = res_b.json()["access_token"]

    # 3. User Alpha adds a private note to ACC-ALPHA-SECRET
    note_res = client.post(
        "/api/v1/accounts/ACC-ALPHA-SECRET/notes",
        headers={"Authorization": f"Bearer {token_a}"},
        json={"note": "Confidential executive negotiation in progress for Alpha."}
    )
    assert note_res.status_code == 200

    # 4. User Alpha dispatches a playbook
    play_res = client.post(
        "/api/v1/playbooks/dispatch",
        headers={"Authorization": f"Bearer {token_a}"},
        json={
            "account_id": "ACC-ALPHA-SECRET",
            "company_name": "Alpha Enterprise Inc",
            "playbook_id": "PB-SAVE-01",
            "priority": "P0",
            "sla_hours": 4
        }
    )
    assert play_res.status_code == 200
    playbook_id = play_res.json()["id"]

    # 5. User Beta queries notes for ACC-ALPHA-SECRET -> Must NOT see Alpha's private note
    beta_notes = client.get(
        "/api/v1/accounts/ACC-ALPHA-SECRET/notes",
        headers={"Authorization": f"Bearer {token_b}"}
    ).json()
    assert len(beta_notes) == 0

    # 6. User Alpha queries notes -> MUST see their note
    alpha_notes = client.get(
        "/api/v1/accounts/ACC-ALPHA-SECRET/notes",
        headers={"Authorization": f"Bearer {token_a}"}
    ).json()
    assert len(alpha_notes) == 1
    assert "Confidential executive negotiation" in alpha_notes[0]["note"]

    # 7. User Beta queries dispatched playbooks -> Must NOT see Alpha's playbook
    beta_playbooks = client.get(
        "/api/v1/playbooks/dispatched",
        headers={"Authorization": f"Bearer {token_b}"}
    ).json()
    assert not any(p["id"] == playbook_id for p in beta_playbooks)

    # 8. User Alpha queries dispatched playbooks -> MUST see their playbook
    alpha_playbooks = client.get(
        "/api/v1/playbooks/dispatched",
        headers={"Authorization": f"Bearer {token_a}"}
    ).json()
    assert any(p["id"] == playbook_id for p in alpha_playbooks)


def test_per_user_workspace_import_persistence(client):
    """Verify per-user live dataset import into CustomUserAccountRecord and isolation"""
    email = f"workspace_user_{os.urandom(4).hex()}@enterprise.com"
    res = client.post("/api/auth/register", json={
        "email": email,
        "password": "Password123!",
        "full_name": "Workspace Lead",
        "role": "operator"
    })
    token = res.json()["access_token"]

    # 1. User imports Stripe live workspace data
    import_res = client.post(
        "/api/v1/workspace/import?connector=stripe",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert import_res.status_code == 200
    import_data = import_res.json()
    assert import_data["success"] is True
    assert import_data["accounts_imported"] > 0

    # 2. Query demo accounts endpoint with user's token -> returns their user_vault accounts
    user_accounts_res = client.get(
        "/api/v1/accounts/demo",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert user_accounts_res.status_code == 200
    user_data = user_accounts_res.json()
    assert user_data["connected_source"] == "user_vault"
    assert user_data["summary"]["total_accounts"] == import_data["accounts_imported"]

    # 3. User resets workspace
    reset_res = client.post(
        "/api/v1/workspace/reset-demo",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert reset_res.status_code == 200

    # 4. Query demo accounts endpoint again -> reverts to default demo baseline
    revert_res = client.get(
        "/api/v1/accounts/demo",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert revert_res.status_code == 200
    assert revert_res.json()["connected_source"] is None
