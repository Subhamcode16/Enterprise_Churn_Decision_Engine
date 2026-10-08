"""
VALENCE Authentication & Security Integration Tests
Tests password hashing, JWT generation/validation, registration, login, and RBAC protection.
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app
from src.database import init_db, SessionLocal, User
from src.auth import hash_password, generate_salt, verify_password, create_access_token, decode_access_token

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_test_db():
    init_db()


def test_password_hashing_and_verification():
    salt = generate_salt()
    pwd = "EnterpriseSecurePassword2026!"
    hashed = hash_password(pwd, salt)

    assert hashed is not None
    assert len(hashed) > 20
    assert verify_password(pwd, salt, hashed) is True
    assert verify_password("WrongPassword123!", salt, hashed) is False


def test_jwt_token_lifecycle():
    payload = {"sub": "42", "email": "vp_revenue@acme.com", "role": "admin"}
    token = create_access_token(payload)

    assert token is not None
    decoded = decode_access_token(token)
    assert decoded["sub"] == "42"
    assert decoded["email"] == "vp_revenue@acme.com"
    assert decoded["role"] == "admin"


def test_auth_registration_and_login_flow():
    test_email = "operator_test_2026@valence.ai"
    test_pwd = "SuperSecretOperatorPass123!"

    # 1. Register User
    reg_res = client.post("/api/auth/register", json={
        "email": test_email,
        "password": test_pwd,
        "full_name": "Lead Risk Analyst",
        "role": "operator"
    })
    
    # Status should be 201 or 400 if already created in earlier test run
    assert reg_res.status_code in (201, 400)

    # 2. Login User
    login_res = client.post("/api/auth/login", json={
        "email": test_email,
        "password": test_pwd
    })
    assert login_res.status_code == 200
    data = login_res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == test_email

    # 3. Access Protected /me Endpoint
    token = data["access_token"]
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    me_data = me_res.json()
    assert me_data["email"] == test_email
    assert me_data["role"] == "operator"


def test_invalid_login_rejection():
    res = client.post("/api/auth/login", json={
        "email": "nonexistent_operator@valence.ai",
        "password": "WrongPassword123!"
    })
    assert res.status_code == 401


def test_sso_authentication_flow():
    # 1. 1-Click Google SSO
    google_res = client.post("/api/auth/sso", json={
        "provider": "google",
        "email": "google.director@enterprise.com",
        "full_name": "Google Director Operator"
    })
    assert google_res.status_code == 200
    g_data = google_res.json()
    assert "access_token" in g_data
    assert g_data["user"]["auth_provider"] == "google"
    assert g_data["user"]["email"] == "google.director@enterprise.com"

    # 2. Verify Token on /me
    token = g_data["access_token"]
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["auth_provider"] == "google"

    # 3. 1-Click X / Twitter SSO
    x_res = client.post("/api/auth/sso", json={
        "provider": "x",
        "email": "x.strategist@enterprise.com",
        "full_name": "X Strategist"
    })
    assert x_res.status_code == 200
    assert x_res.json()["user"]["auth_provider"] == "x"
