"""
Decision & Rules Engine
Quantifies financial MRR exposure, classifies risk tiers, and matches accounts to retention playbooks.
"""

from typing import Dict, List, Any

PLAYBOOK_CATALOG = {
    "PB-SUPP-01": {
        "playbook_id": "PB-SUPP-01",
        "title": "Critical Support Escalation & Technical Review",
        "category": "Engineering / Support",
        "priority": "P0",
        "action_summary": "Escalate unresolved P1 critical tickets to VP of Engineering and organize an immediate root-cause retrospective with customer technical leads.",
        "assignee_role": "VP Engineering / Senior TAM",
        "sla_hours": 4
    },
    "PB-ENGAGE-02": {
        "playbook_id": "PB-ENGAGE-02",
        "title": "TAM Adoption & Workflow Re-Onboarding",
        "category": "Customer Success",
        "priority": "P1",
        "action_summary": "Schedule a hands-on workflow audit with the client admin, identify dropped telemetry features, and conduct targeted enablement sessions.",
        "assignee_role": "Dedicated TAM",
        "sla_hours": 24
    },
    "PB-BILL-03": {
        "playbook_id": "PB-BILL-03",
        "title": "Finance Dunning & Billing Optimization",
        "category": "Finance & Operations",
        "priority": "P1",
        "action_summary": "Initiate white-glove dunning outreach, review payment gateway retry logs, and present flexible quarterly invoicing or wire transfer options.",
        "assignee_role": "Billing Operations / AE",
        "sla_hours": 12
    },
    "PB-RENEW-04": {
        "playbook_id": "PB-RENEW-04",
        "title": "Executive Sponsor Renewal Alignment",
        "category": "Sales / Executive",
        "priority": "P0",
        "action_summary": "Schedule an urgent C-Level alignment check-in, review multi-year commercial incentives, and align product roadmap commitments ahead of renewal.",
        "assignee_role": "VP Sales / Executive Sponsor",
        "sla_hours": 24
    },
    "PB-HEALTH-05": {
        "playbook_id": "PB-HEALTH-05",
        "title": "NPS Sentiment Recovery Outreach",
        "category": "Customer Success",
        "priority": "P2",
        "action_summary": "Reach out to detractor stakeholders, capture qualitative feedback regarding feature blockers, and present immediate mitigation milestones.",
        "assignee_role": "Customer Success Manager",
        "sla_hours": 48
    },
    "PB-NURTURE-06": {
        "playbook_id": "PB-NURTURE-06",
        "title": "Proactive Expansion & Value Realization",
        "category": "Growth",
        "priority": "P3",
        "action_summary": "Deliver quarterly ROI benchmark report and propose enterprise tier tier-ups or add-on modules for expanding workloads.",
        "assignee_role": "Account Executive",
        "sla_hours": 72
    }
}

def determine_risk_tier(churn_probability: float) -> str:
    """
    Classifies churn probability into calibrated risk tiers.
    """
    if churn_probability >= 0.80:
        return "Critical"
    elif churn_probability >= 0.60:
        return "High"
    elif churn_probability >= 0.30:
        return "Medium"
    else:
        return "Low"

def compute_financial_exposure(churn_probability: float, contract_mrr: float) -> float:
    """
    Calculates expected monthly recurring revenue at risk: P_churn * MRR.
    """
    return round(float(churn_probability * contract_mrr), 2)

def match_retention_playbooks(
    account_features: Dict[str, Any],
    churn_probability: float,
    top_drivers: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Deterministically evaluates business rules against account telemetry and top SHAP drivers.
    """
    matched_ids = []

    open_p1 = account_features.get("open_p1_tickets", 0)
    avg_res_time = account_features.get("avg_resolution_time_hrs", 0.0)
    usage_change = account_features.get("usage_change_pct_30d", 0.0)
    days_no_login = account_features.get("days_since_last_login", 0)
    payment_fails = account_features.get("payment_failures_past_quarter", 0)
    days_renewal = account_features.get("days_until_renewal", 365)
    contract_mrr = account_features.get("contract_mrr", 0.0)
    nps = account_features.get("nps_score", 10)
    csat = account_features.get("csat_score", 5.0)

    # Rule 1: Critical Support Distress
    if open_p1 >= 1 or avg_res_time >= 36.0:
        matched_ids.append("PB-SUPP-01")

    # Rule 2: Usage / Engagement Drops
    if usage_change <= -20.0 or days_no_login >= 10:
        matched_ids.append("PB-ENGAGE-02")

    # Rule 3: Billing & Dunning Friction
    if payment_fails >= 1:
        matched_ids.append("PB-BILL-03")

    # Rule 4: High-Value Imminent Renewal Risk
    if days_renewal <= 60 and contract_mrr >= 4000 and churn_probability >= 0.40:
        matched_ids.append("PB-RENEW-04")

    # Rule 5: Low Sentiment / NPS Detractor
    if nps <= 6 or csat < 3.5:
        matched_ids.append("PB-HEALTH-05")

    # Fallback for Low Risk Accounts
    if not matched_ids or churn_probability < 0.25:
        matched_ids.append("PB-NURTURE-06")

    # Format matched playbooks in priority order
    priority_rank = {"P0": 0, "P1": 1, "P2": 2, "P3": 3}
    playbooks = [PLAYBOOK_CATALOG[pid] for pid in dict.fromkeys(matched_ids)]
    playbooks.sort(key=lambda pb: priority_rank.get(pb["priority"], 99))

    return playbooks
