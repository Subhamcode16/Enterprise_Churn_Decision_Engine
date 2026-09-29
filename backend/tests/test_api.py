"""
API Integration Tests using FastAPI TestClient
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app, init_engine

@pytest.fixture(scope="session", autouse=True)
def setup_engine():
    init_engine()

client = TestClient(app)

def test_health_endpoint():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["model_loaded"] is True

def test_predict_single_account():
    with TestClient(app) as client:
        payload = {
            "account_id": "ACC-TEST-001",
            "company_name": "Test Technologies",
            "contract_mrr": 5500.00,
            "tenure_months": 14,
            "contract_tier": "Enterprise",
            "days_since_last_login": 12,
            "usage_change_pct_30d": -35.0,
            "active_user_ratio": 0.65,
            "api_calls_monthly": 12000,
            "open_p1_tickets": 1,
            "avg_resolution_time_hrs": 24.0,
            "nps_score": 4,
            "csat_score": 3.2,
            "payment_failures_past_quarter": 1,
            "days_until_renewal": 45,
            "auto_renew_enabled": 0
        }

        response = client.post("/api/v1/predict", json=payload)
        assert response.status_code == 200
        res_data = response.json()
        assert res_data["account_id"] == "ACC-TEST-001"
        assert "churn_probability" in res_data
        assert "risk_tier" in res_data
        assert "top_drivers" in res_data
        assert len(res_data["top_drivers"]) > 0
        assert len(res_data["recommended_playbooks"]) > 0

def test_demo_accounts_endpoint():
    with TestClient(app) as client:
        response = client.get("/api/v1/accounts/demo")
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        assert "accounts" in data
        assert len(data["accounts"]) > 0

def test_playbook_catalog():
    with TestClient(app) as client:
        response = client.get("/api/v1/playbooks")
        assert response.status_code == 200
        data = response.json()
        assert "playbooks" in data
        assert len(data["playbooks"]) >= 5
