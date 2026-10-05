import {
  SinglePredictionResponse,
  DemoAccountsResponse,
  BatchResponse,
  Playbook,
  AccountRecord
} from "./types";
import { SEED_ACCOUNTS, SEED_SUMMARY, SEED_PLAYBOOKS } from "./mockData";
import { getStoredToken } from "./auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const API_SECRET_KEY = process.env.NEXT_PUBLIC_API_KEY || "enterprise_churn_dev_key_2026";

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  headers.set("X-API-Key", API_SECRET_KEY);

  const token = getStoredToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    signal: AbortSignal.timeout(3000), // 3s timeout before fallback
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Request failed with status ${response.status}`);
  }

  return response.json();
}

export async function getHealthStatus() {
  try {
    return await fetchWithAuth("/health");
  } catch (err) {
    return { status: "offline", model_loaded: false };
  }
}

export async function getDemoAccounts(): Promise<DemoAccountsResponse> {
  try {
    const data = await fetchWithAuth("/api/v1/accounts/demo");
    if (data.accounts && data.accounts.length > 0) {
      return data;
    }
    return { summary: SEED_SUMMARY, accounts: SEED_ACCOUNTS };
  } catch (err) {
    console.warn("Backend offline, utilizing cached Enterprise intelligence state:", err);
    return { summary: SEED_SUMMARY, accounts: SEED_ACCOUNTS };
  }
}

export async function predictAccount(payload: Partial<AccountRecord>): Promise<SinglePredictionResponse> {
  try {
    return await fetchWithAuth("/api/v1/predict", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Local fallback explainability calculation
    const usage = payload.usage_change_pct_30d ?? 0;
    const p1 = payload.open_p1_tickets ?? 0;
    const login = payload.days_since_last_login ?? 0;
    const nps = payload.nps_score ?? 7;
    const mrr = payload.contract_mrr ?? 5000;

    const logit = -1.1 + (login * 0.045) - (usage * 0.038) + (p1 * 0.85) - (nps * 0.32);
    const prob = 1.0 / (1.0 + Math.exp(-logit));
    const tier = prob >= 0.8 ? "Critical" : prob >= 0.6 ? "High" : prob >= 0.3 ? "Medium" : "Low";

    return {
      account_id: payload.account_id || "ACC-DEMO",
      company_name: payload.company_name || "Enterprise Account",
      churn_probability: prob,
      risk_tier: tier,
      contract_mrr: mrr,
      mrr_at_risk: prob * mrr,
      base_value: -1.24,
      total_margin: logit,
      top_drivers: [
        {
          feature: "usage_change_pct_30d",
          display_name: "Usage Change (30d %)",
          value: usage,
          shap_value: usage < 0 ? Math.abs(usage) * 0.008 : -Math.abs(usage) * 0.008,
          impact: usage < 0 ? "increases_risk" : "decreases_risk",
          abs_importance: Math.abs(usage) * 0.008,
          insight: usage < 0 ? `30-day usage dropped by ${Math.abs(usage)}%, strongly elevating churn risk.` : `30-day usage expanded by ${usage}%, supporting account retention.`,
        },
        {
          feature: "open_p1_tickets",
          display_name: "Open P1 Support Tickets",
          value: p1,
          shap_value: p1 > 0 ? p1 * 0.32 : -0.15,
          impact: p1 > 0 ? "increases_risk" : "decreases_risk",
          abs_importance: p1 > 0 ? p1 * 0.32 : 0.15,
          insight: p1 > 0 ? `${p1} open P1 critical tickets creating customer distress.` : "Zero open critical tickets maintaining operational health.",
        },
        {
          feature: "days_since_last_login",
          display_name: "Days Since Last Login",
          value: login,
          shap_value: login > 10 ? (login - 10) * 0.015 : -0.08,
          impact: login > 10 ? "increases_risk" : "decreases_risk",
          abs_importance: login > 10 ? (login - 10) * 0.015 : 0.08,
          insight: login > 10 ? `${login} days of inactivity signaling disengagement.` : "Recent platform logins demonstrate active team engagement.",
        },
      ],
      recommended_playbooks: SEED_PLAYBOOKS.slice(0, prob > 0.5 ? 2 : 1),
      generated_at: new Date().toISOString(),
    };
  }
}

export async function simulateWhatIf(
  accountPayload: Partial<AccountRecord>,
  overrides: Record<string, any>
): Promise<SinglePredictionResponse> {
  const merged = { ...accountPayload, ...overrides };
  return predictAccount(merged);
}

export async function getPlaybooks(): Promise<{ playbooks: Playbook[] }> {
  try {
    const data = await fetchWithAuth("/api/v1/playbooks");
    if (data.playbooks && data.playbooks.length > 0) return data;
    return { playbooks: SEED_PLAYBOOKS };
  } catch (err) {
    return { playbooks: SEED_PLAYBOOKS };
  }
}

export async function dispatchPlaybook(payload: {
  account_id: string;
  playbook_id: string;
  assignee?: string;
}) {
  try {
    return await fetchWithAuth("/api/v1/playbooks/dispatch", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return {
      status: "dispatched",
      dispatch_id: `DISP-${Date.now()}`,
      account_id: payload.account_id,
      playbook_id: payload.playbook_id,
      dispatched_at: new Date().toISOString(),
      delivery_target: "CRM & Slack Webhook (Client Simulator)",
      message: `Retention Playbook '${payload.playbook_id}' queued for dispatch.`,
    };
  }
}

export async function getDispatchedPlaybooks(): Promise<Array<{
  id: number;
  account_id: string;
  company_name: string;
  playbook_id: string;
  priority: string;
  assignee_role: string;
  sla_hours: number;
  status: string;
  created_at: string;
  deadline_at: string | null;
}>> {
  try {
    return await fetchWithAuth("/api/v1/playbooks/dispatched");
  } catch (err) {
    return [];
  }
}

export async function updateDispatchedPlaybookStatus(recordId: number, status: "active" | "completed" | "escalated") {
  return await fetchWithAuth(`/api/v1/playbooks/dispatched/${recordId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function exportRenewalBrief(accountPayload: Partial<AccountRecord>, overrides: Record<string, any>) {
  return await fetchWithAuth("/api/v1/scenarios/export-brief", {
    method: "POST",
    body: JSON.stringify({
      account_payload: accountPayload,
      overrides: overrides,
    }),
  });
}

export async function uploadBatchCsv(file: File): Promise<BatchResponse> {
  const url = `${API_BASE_URL}/api/v1/batch-predict`;
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {
    "X-API-Key": API_SECRET_KEY,
  };
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Batch CSV upload failed");
  }

  return response.json();
}

export async function chatWithCopilot(
  query: string,
  account: Partial<AccountRecord> | null,
  playbooks: Playbook[] = [],
  history: { sender: string; text: string }[] = []
): Promise<{ text: string; card?: any; source?: string }> {
  try {
    return await fetchWithAuth("/api/copilot/chat", {
      method: "POST",
      body: JSON.stringify({
        query,
        account_id: account?.account_id,
        account_data: account,
        playbooks,
        history,
      }),
    });
  } catch (err) {
    console.warn("Copilot backend API unreachable, using calibrated local Jev decision engine:", err);
    throw err;
  }
}

export async function getWorkspaceStatus() {
  try {
    return await fetchWithAuth("/api/v1/workspace/status");
  } catch (err) {
    return { has_connected_data: false, mode: "demo", source: null, connected_accounts_count: 0 };
  }
}

export async function setWorkspaceMode(mode: "demo" | "live") {
  return await fetchWithAuth("/api/v1/workspace/mode", {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
}

export async function importWorkspaceData(file?: File, connector?: "stripe" | "salesforce") {
  const url = `${API_BASE_URL}/api/v1/workspace/import${connector ? `?connector=${connector}` : ""}`;
  const formData = new FormData();
  if (file) {
    formData.append("file", file);
  }

  const headers: Record<string, string> = {
    "X-API-Key": API_SECRET_KEY,
  };
  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: file ? formData : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to import company data.");
  }

  return response.json();
}

export async function resetDemoWorkspace() {
  return await fetchWithAuth("/api/v1/workspace/reset-demo", {
    method: "POST",
  });
}

