export type RiskTier = "Low" | "Medium" | "High" | "Critical";

export interface FeatureDriver {
  feature: string;
  display_name: string;
  value: number | string | null;
  shap_value: number;
  impact: "increases_risk" | "decreases_risk";
  abs_importance: number;
  insight: string;
}

export interface Playbook {
  playbook_id: string;
  title: string;
  category: string;
  priority: "P0" | "P1" | "P2" | "P3";
  action_summary: string;
  assignee_role: string;
  sla_hours: number;
}

export interface AccountRecord {
  account_id: string;
  company_name: string;
  contract_mrr: number;
  tenure_months: number;
  contract_tier: string;
  days_since_last_login: number;
  usage_change_pct_30d: number;
  open_p1_tickets: number;
  avg_resolution_time_hrs: number;
  nps_score: number;
  csat_score: number;
  payment_failures_past_quarter: number;
  days_until_renewal: number;
  auto_renew_enabled: number;
  churn_probability: number;
  risk_tier: RiskTier;
  mrr_at_risk: number;
}

export interface SinglePredictionResponse {
  account_id: string;
  company_name: string;
  churn_probability: number;
  risk_tier: RiskTier;
  contract_mrr: number;
  mrr_at_risk: number;
  base_value: number;
  total_margin: number;
  top_drivers: FeatureDriver[];
  all_drivers?: FeatureDriver[];
  recommended_playbooks: Playbook[];
  generated_at: string;
}

export interface PortfolioSummary {
  total_accounts: number;
  total_portfolio_mrr: number;
  total_mrr_at_risk: number;
  portfolio_risk_pct: number;
  critical_risk_count: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
}

export interface DemoAccountsResponse {
  summary: PortfolioSummary;
  accounts: AccountRecord[];
}

export interface BatchItem {
  account_id: string;
  company_name: string;
  contract_mrr: number;
  churn_probability: number;
  risk_tier: RiskTier;
  mrr_at_risk: number;
  primary_risk_driver: string;
  primary_playbook: string;
}

export interface BatchResponse {
  total_processed: number;
  total_mrr_at_risk: number;
  high_risk_count: number;
  critical_risk_count: number;
  accounts: BatchItem[];
  generated_at: string;
}
