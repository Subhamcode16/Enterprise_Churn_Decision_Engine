"""
Synthetic B2B SaaS Enterprise Dataset Generator
Generates realistic customer telemetry, financial, support, and contract metrics
with non-linear risk factors and calibrated churn targets.
"""

import os
import numpy as np
import pandas as pd
from typing import Tuple

COMPANY_PREFIXES = [
    "Apex", "Nova", "Vanguard", "Catalyst", "Vertex", "Quantum", "Pulse", "Stratis",
    "Omni", "Synthetix", "Hyperion", "Beacon", "Nexus", "Cloudscale", "DataCore",
    "Aegis", "Ironclad", "Centric", "Lumina", "Optima", "Zenith", "Cobalt", "Solace"
]

COMPANY_SUFFIXES = [
    "Analytics", "Technologies", "Health", "Logistics", "Financial", "Systems",
    "Dynamics", "Software", "Cloud", "Solutions", "Networks", "Labs", "Robotics", "Global"
]

def generate_company_name(rnd: np.random.RandomState) -> str:
    prefix = rnd.choice(COMPANY_PREFIXES)
    suffix = rnd.choice(COMPANY_SUFFIXES)
    return f"{prefix} {suffix}"

def generate_b2b_churn_dataset(
    n_samples: int = 50000,
    random_seed: int = 42,
    output_path: str = None
) -> pd.DataFrame:
    """
    Generates a realistic 50,000-record B2B enterprise SaaS account dataset.
    """
    rnd = np.random.RandomState(random_seed)

    # 1. Identifiers & Profiles
    account_ids = [f"ACC-{10000 + i}" for i in range(n_samples)]
    company_names = [generate_company_name(rnd) for _ in range(n_samples)]

    # 2. Contract Attributes
    # Log-normal distribution for MRR: median around $4,000, ranging $500 to $45,000+
    mrr_base = rnd.lognormal(mean=8.2, sigma=0.75, size=n_samples)
    contract_mrr = np.clip(np.round(mrr_base, 2), 500.0, 50000.0)

    # Tenure: 1 to 60 months
    tenure_months = rnd.randint(1, 61, size=n_samples)

    # Contract Tier based on MRR
    contract_tier = []
    for mrr in contract_mrr:
        if mrr > 12000:
            contract_tier.append("Enterprise")
        elif mrr > 3500:
            contract_tier.append("Professional")
        else:
            contract_tier.append("Standard")

    # 3. Product Telemetry & Engagement
    # Days since last login
    days_since_last_login = rnd.geometric(p=0.08, size=n_samples) - 1
    days_since_last_login = np.clip(days_since_last_login, 0, 90)

    # Usage change over past 30 days (%)
    usage_change_pct_30d = rnd.normal(loc=-2.0, scale=32.0, size=n_samples)
    usage_change_pct_30d = np.clip(np.round(usage_change_pct_30d, 1), -100.0, 150.0)

    # Active user ratio (active seats / licensed seats)
    active_user_ratio = np.clip(np.round(rnd.beta(a=5, b=2, size=n_samples), 2), 0.05, 1.0)

    # Monthly API calls (scaled by MRR and usage)
    api_calls_monthly = (contract_mrr * rnd.uniform(50, 200, size=n_samples) * (1 + usage_change_pct_30d / 200.0)).astype(int)
    api_calls_monthly = np.maximum(api_calls_monthly, 100)

    # 4. Support & Customer Health
    # Open P1 critical support tickets (majority 0, high churners have 1-4)
    open_p1_tickets = rnd.poisson(lam=0.35, size=n_samples)
    open_p1_tickets = np.clip(open_p1_tickets, 0, 5)

    # Average ticket resolution time (hours)
    avg_resolution_time_hrs = rnd.gamma(shape=3.0, scale=6.0, size=n_samples)
    avg_resolution_time_hrs = np.clip(np.round(avg_resolution_time_hrs, 1), 1.0, 72.0)

    # NPS score (0-10) correlated with support and usage
    nps_base = 8.0 - (open_p1_tickets * 1.8) + (usage_change_pct_30d / 40.0) + rnd.normal(0, 1.5, size=n_samples)
    nps_score = np.clip(np.round(nps_base).astype(int), 0, 10)

    # CSAT score (1.0 to 5.0)
    csat_base = 4.2 - (open_p1_tickets * 0.7) - (days_since_last_login / 40.0) + rnd.normal(0, 0.4, size=n_samples)
    csat_score = np.clip(np.round(csat_base, 1), 1.0, 5.0)

    # 5. Billing & Renewal
    payment_failures_past_quarter = rnd.choice([0, 1, 2, 3], p=[0.78, 0.15, 0.05, 0.02], size=n_samples)
    days_until_renewal = rnd.randint(1, 366, size=n_samples)
    auto_renew_enabled = rnd.choice([1, 0], p=[0.72, 0.28], size=n_samples)

    # 6. Realistic Churn Logit Model (Ground Truth with Non-Linear Interactions)
    # Calibrated to ~20% B2B enterprise industry churn rate
    logit = (
        - 1.10
        + 0.045 * days_since_last_login
        - 0.038 * usage_change_pct_30d
        + 0.850 * open_p1_tickets
        + 0.035 * avg_resolution_time_hrs
        - 0.320 * nps_score
        - 0.400 * (csat_score - 3.0)
        + 0.650 * payment_failures_past_quarter
        - 0.018 * tenure_months
        - 0.450 * auto_renew_enabled
        + 0.75 * ((days_until_renewal < 60) & (usage_change_pct_30d < -15)).astype(int)
        + rnd.normal(0, 0.25, size=n_samples)
    )

    # Sigmoid to calculate churn probability
    churn_prob = 1.0 / (1.0 + np.exp(-logit))
    # Threshold sampling for binary target
    churned = (rnd.uniform(0, 1, size=n_samples) < churn_prob).astype(int)

    df = pd.DataFrame({
        "account_id": account_ids,
        "company_name": company_names,
        "contract_mrr": contract_mrr,
        "tenure_months": tenure_months,
        "contract_tier": contract_tier,
        "days_since_last_login": days_since_last_login,
        "usage_change_pct_30d": usage_change_pct_30d,
        "active_user_ratio": active_user_ratio,
        "api_calls_monthly": api_calls_monthly,
        "open_p1_tickets": open_p1_tickets,
        "avg_resolution_time_hrs": avg_resolution_time_hrs,
        "nps_score": nps_score,
        "csat_score": csat_score,
        "payment_failures_past_quarter": payment_failures_past_quarter,
        "days_until_renewal": days_until_renewal,
        "auto_renew_enabled": auto_renew_enabled,
        "churned": churned
    })

    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        df.to_csv(output_path, index=False)
        print(f"Generated {len(df)} B2B accounts -> Saved to {output_path}")
        print(f"Churn distribution: {df['churned'].value_counts(normalize=True).to_dict()}")

    return df

if __name__ == "__main__":
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, ".."))
    out = os.path.join(project_root, "data", "b2b_churn_dataset.csv")
    generate_b2b_churn_dataset(n_samples=12000, output_path=out)
