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

def test_dispatch_and_list_playbooks():
    with TestClient(app) as client:
        dispatch_payload = {
            "account_id": "ACC-TEST-999",
            "company_name": "Audit Test Corp",
            "playbook_id": "PB-ENGAGE-02",
            "priority": "P0",
            "assignee_role": "Customer Success",
            "sla_hours": 4
        }
        post_res = client.post("/api/v1/playbooks/dispatch", json=dispatch_payload)
        assert post_res.status_code == 200
        data = post_res.json()
        assert data["account_id"] == "ACC-TEST-999"
        assert data["playbook_id"] == "PB-ENGAGE-02"
        assert "id" in data

        # Test listing
        get_res = client.get("/api/v1/playbooks/dispatched")
        assert get_res.status_code == 200
        items = get_res.json()
        assert len(items) >= 1
        assert any(item["account_id"] == "ACC-TEST-999" for item in items)

def test_account_notes_workflow():
    with TestClient(app) as client:
        note_payload = {
            "author": "Retention Architect",
            "note": "Scheduled emergency sponsor touchpoint for contract extension."
        }
        post_res = client.post("/api/v1/accounts/ACC-TEST-999/notes", json=note_payload)
        assert post_res.status_code == 200
        data = post_res.json()
        assert data["account_id"] == "ACC-TEST-999"
        assert data["author"] == "Retention Architect"

        # Test retrieval
        get_res = client.get("/api/v1/accounts/ACC-TEST-999/notes")
        assert get_res.status_code == 200
        notes = get_res.json()
        assert len(notes) >= 1
        assert notes[0]["note"] == "Scheduled emergency sponsor touchpoint for contract extension."

def test_model_telemetry():
    with TestClient(app) as client:
        res = client.get("/api/v1/telemetry")
        assert res.status_code == 200
        data = res.json()
        assert "runs" in data

def test_update_playbook_status():
    with TestClient(app) as client:
        dispatch_payload = {
            "account_id": "ACC-STATUS-01",
            "company_name": "Status Corp",
            "playbook_id": "PB-SUPP-01",
            "priority": "P0",
            "assignee_role": "VP Engineering",
            "sla_hours": 4
        }
        create_res = client.post("/api/v1/playbooks/dispatch", json=dispatch_payload)
        rec_id = create_res.json()["id"]

        patch_res = client.patch(f"/api/v1/playbooks/dispatched/{rec_id}/status", json={"status": "completed"})
        assert patch_res.status_code == 200
        assert patch_res.json()["status"] == "completed"

def test_export_renewal_brief():
    with TestClient(app) as client:
        payload = {
            "account_payload": {
                "account_id": "ACC-BRIEF-01",
                "company_name": "Brief Corp",
                "contract_mrr": 12000.0,
                "tenure_months": 18,
                "contract_tier": "Enterprise",
                "days_since_last_login": 15,
                "usage_change_pct_30d": -30.0,
                "active_user_ratio": 0.6,
                "api_calls_monthly": 8000,
                "open_p1_tickets": 2,
                "avg_resolution_time_hrs": 36.0,
                "nps_score": 3,
                "csat_score": 2.8,
                "payment_failures_past_quarter": 1,
                "days_until_renewal": 45,
                "auto_renew_enabled": 0
            },
            "overrides": {
                "open_p1_tickets": 0,
                "usage_change_pct_30d": 10.0,
                "auto_renew_enabled": 1
            }
        }
        res = client.post("/api/v1/scenarios/export-brief", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["account_id"] == "ACC-BRIEF-01"
        assert data["risk_delta"] > 0
        assert "brief_markdown" in data
        assert len(data["recommended_mitigation_plan"]) >= 1

def test_workspace_lifecycle():
    with TestClient(app) as client:
        # 1. Check default status
        status_res = client.get("/api/v1/workspace/status")
        assert status_res.status_code == 200
        status_data = status_res.json()
        assert "mode" in status_data

        # 2. Test connector simulation import (Stripe)
        import_res = client.post("/api/v1/workspace/import", data={"source": "stripe"})
        assert import_res.status_code == 200
        import_data = import_res.json()
        assert import_data["success"] is True
        assert import_data["mode"] == "live"
        assert import_data["accounts_imported"] > 0
        assert len(import_data["accounts"]) > 0

        # 3. Verify accounts/demo now serves live accounts
        demo_res = client.get("/api/v1/accounts/demo")
        assert demo_res.status_code == 200
        assert len(demo_res.json()["accounts"]) == import_data["accounts_imported"]

        # 4. Toggle back to demo
        mode_res = client.post("/api/v1/workspace/mode", json={"mode": "demo"})
        assert mode_res.status_code == 200
        assert mode_res.json()["mode"] == "demo"

        # 5. Reset demo
        reset_res = client.post("/api/v1/workspace/reset-demo")
        assert reset_res.status_code == 200
        assert reset_res.json()["mode"] == "demo"
        assert reset_res.json()["has_connected_data"] is False

