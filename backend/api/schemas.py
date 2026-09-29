"""
Pydantic Data Schemas & API Contracts
Validates incoming inference requests, bounds checking, and structured response definitions.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AccountInputSchema(BaseModel):
    account_id: str = Field(..., min_length=2, max_length=64, description="Unique account identifier")
    company_name: Optional[str] = Field("Enterprise Account", max_length=128, description="Company name")
    contract_mrr: float = Field(..., ge=0.0, le=1_000_000.0, description="Current Monthly Recurring Revenue ($)")
    tenure_months: int = Field(..., ge=0, le=240, description="Active subscription duration in months")
    contract_tier: Optional[str] = Field("Enterprise", description="Contract plan tier: Standard, Professional, Enterprise")
    days_since_last_login: int = Field(..., ge=0, le=365, description="Days since last user or admin session")
    usage_change_pct_30d: float = Field(..., ge=-100.0, le=1000.0, description="30-day percentage usage shift")
    active_user_ratio: Optional[float] = Field(0.75, ge=0.0, le=1.0, description="Active seats / licensed seats ratio")
    api_calls_monthly: Optional[int] = Field(5000, ge=0, description="Monthly API usage volume")
    open_p1_tickets: int = Field(..., ge=0, le=50, description="Unresolved P1 critical support tickets")
    avg_resolution_time_hrs: Optional[float] = Field(12.0, ge=0.0, le=500.0, description="Average support ticket resolution time (hrs)")
    nps_score: int = Field(..., ge=0, le=10, description="Net Promoter Score rating (0-10)")
    csat_score: Optional[float] = Field(4.0, ge=1.0, le=5.0, description="CSAT customer rating (1.0 - 5.0)")
    payment_failures_past_quarter: int = Field(0, ge=0, le=20, description="Failed billing dunning attempts")
    days_until_renewal: int = Field(..., ge=0, le=730, description="Days remaining until contract renewal")
    auto_renew_enabled: Optional[int] = Field(1, ge=0, le=1, description="Auto-renewal active flag (1 or 0)")

class FeatureDriverSchema(BaseModel):
    feature: str
    display_name: str
    value: Any
    shap_value: float
    impact: str
    abs_importance: float
    insight: str

class PlaybookSchema(BaseModel):
    playbook_id: str
    title: str
    category: str
    priority: str
    action_summary: str
    assignee_role: str
    sla_hours: int

class SinglePredictionResponse(BaseModel):
    account_id: str
    company_name: str
    churn_probability: float
    risk_tier: str
    contract_mrr: float
    mrr_at_risk: float
    base_value: float
    total_margin: float
    top_drivers: List[FeatureDriverSchema]
    all_drivers: Optional[List[FeatureDriverSchema]] = None
    recommended_playbooks: List[PlaybookSchema]
    generated_at: str

class BatchPredictionItem(BaseModel):
    account_id: str
    company_name: str
    contract_mrr: float
    churn_probability: float
    risk_tier: str
    mrr_at_risk: float
    primary_risk_driver: str
    primary_playbook: str

class BatchPredictionResponse(BaseModel):
    total_processed: int
    total_mrr_at_risk: float
    high_risk_count: int
    critical_risk_count: int
    accounts: List[BatchPredictionItem]
    generated_at: str

class HealthStatusResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: str
    explainer_ready: bool
    total_features: int
    uptime_seconds: float
    timestamp: str

class WhatIfSimulationRequest(BaseModel):
    account_payload: AccountInputSchema
    overrides: Dict[str, Any]
