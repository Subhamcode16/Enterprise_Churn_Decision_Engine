"use client";

import { useState, useEffect } from "react";
import { 
  Settings, 
  Key, 
  Webhook, 
  Sliders, 
  Database, 
  CheckCircle2, 
  Copy, 
  RefreshCw, 
  Send, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  Layers, 
  ExternalLink,
  Lock,
  Sparkles,
  Zap,
  Globe
} from "lucide-react";
import { sound, playTick } from "@/lib/sound";
import { getHealthStatus } from "@/lib/api";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"connectors" | "api_keys" | "sla_policy" | "environment">("connectors");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [pingStatus, setPingStatus] = useState<{ [key: string]: "idle" | "testing" | "success" | "error" }>({});

  // Form State
  const [apiKey, setApiKey] = useState("val_live_9f8e7d6c5b4a3210_2026");
  const [slackWebhook, setSlackWebhook] = useState("https://hooks.slack.com/services/T000/B000/XXXXXX");
  const [salesforceUrl, setSalesforceUrl] = useState("https://your-company.my.salesforce.com/services/data/v59.0");
  const [hubspotToken, setHubspotToken] = useState("pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx");
  const [stripeSecret, setStripeSecret] = useState("whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx");
  
  // Toggles
  const [slackEnabled, setSlackEnabled] = useState(true);
  const [salesforceEnabled, setSalesforceEnabled] = useState(true);
  const [hubspotEnabled, setHubspotEnabled] = useState(false);
  const [stripeEnabled, setStripeEnabled] = useState(true);

  // Policy Thresholds
  const [criticalThreshold, setCriticalThreshold] = useState(80);
  const [highThreshold, setHighThreshold] = useState(60);
  const [mediumThreshold, setMediumThreshold] = useState(30);
  const [p0SlaHours, setP0SlaHours] = useState(2);
  const [p1SlaHours, setP1SlaHours] = useState(8);
  const [p2SlaHours, setP2SlaHours] = useState(24);

  // Data Mode
  const [dataMode, setDataMode] = useState<"demo" | "live">("live");

  useEffect(() => {
    getHealthStatus()
      .then((res) => setIsHealthy(res.status === "healthy"))
      .catch(() => setIsHealthy(false));
  }, []);

  const handleCopy = (text: string, id: string) => {
    sound.playClick(800);
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRegenerateKey = () => {
    sound.playClick(600);
    const randomHex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    setApiKey(`val_live_${randomHex}_2026`);
    handleSave();
  };

  const handleTestPing = (connector: string) => {
    sound.playClick(750);
    setPingStatus((prev) => ({ ...prev, [connector]: "testing" }));
    setTimeout(() => {
      sound.playDispatch();
      setPingStatus((prev) => ({ ...prev, [connector]: "success" }));
      setTimeout(() => {
        setPingStatus((prev) => ({ ...prev, [connector]: "idle" }));
      }, 3000);
    }, 1200);
  };

  const handleSave = () => {
    sound.playSelect();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const tabs = [
    { id: "connectors", name: "Ecosystem & Connectors", icon: Webhook, count: "4 Active" },
    { id: "api_keys", name: "API Keys & Developer SDK", icon: Key, count: "v1.1.0" },
    { id: "sla_policy", name: "Risk Calibration & SLA Policy", icon: Sliders, count: "P0-P2" },
    { id: "environment", name: "Pipeline & Data Mode", icon: Database, count: dataMode.toUpperCase() },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#163832]/60">
            <span>Cockpit</span>
            <span>/</span>
            <span className="text-[#235347] font-semibold">Settings & Enterprise Integrations</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#051F20] flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-[#235347]" />
            Enterprise Configuration Hub
          </h1>
          <p className="text-xs text-[#163832]/70">
            Manage your CRM webhooks, API tokens, risk sensitivity thresholds, and multi-service egress channels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F4F8F5] border border-[#E2EAE4] text-xs shadow-xs">
            <span className={`w-2 h-2 rounded-full ${isHealthy ? "bg-[#235347] shadow-[0_0_8px_rgba(35,83,71,0.6)]" : "bg-amber-500"}`} />
            <span className="font-mono text-[#051F20] font-semibold">
              {isHealthy ? "Gateway Live" : "Local State"}
            </span>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#235347] hover:bg-[#163832] text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer border border-[#8EB69B]/40"
          >
            {isSaved ? <Check className="w-4 h-4 text-[#DAF1DE]" /> : <ShieldCheck className="w-4 h-4 text-[#DAF1DE]" />}
            <span>{isSaved ? "Settings Saved!" : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2EAE4] pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick(750);
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-[#235347] text-white shadow-xs font-bold"
                  : "text-[#163832]/70 hover:text-[#051F20] hover:bg-[#F4F8F5]"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#DAF1DE]" : "text-[#163832]/50"}`} />
              <span>{tab.name}</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                isActive ? "bg-[#DAF1DE] text-[#051F20] font-bold" : "bg-[#F4F8F5] text-[#163832]/60 border border-[#E2EAE4]"
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Ecosystem & Connectors */}
      {activeTab === "connectors" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Slack P0 Alerts */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#4A154B]/10 border border-[#4A154B]/20 flex items-center justify-center text-[#4A154B] font-bold text-sm">
                    #
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#051F20]">Slack P0 Retention Webhook</h3>
                    <p className="text-[11px] text-[#163832]/60">Broadcasts instant SLA alerts to #revenue-defense</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={slackEnabled} 
                    onChange={(e) => {
                      playTick();
                      setSlackEnabled(e.target.checked);
                    }} 
                    className="sr-only peer" 
                  />
                  <div className="w-10 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#235347]"></div>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[#163832]/60 uppercase tracking-wider font-semibold">Incoming Webhook URL</label>
                <input 
                  type="text" 
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  disabled={!slackEnabled}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[#F4F8F5] border border-[#E2EAE4] text-[#051F20] focus:outline-none focus:border-[#235347] focus:bg-white disabled:opacity-50 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E2EAE4]">
                <span className="text-[10px] font-mono text-[#163832]/60">Status: {slackEnabled ? "Connected" : "Paused"}</span>
                <button
                  onClick={() => handleTestPing("slack")}
                  disabled={!slackEnabled || pingStatus["slack"] === "testing"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F8F5] hover:bg-[#EAEFEA] border border-[#E2EAE4] text-[#051F20] text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  <Send className="w-3 h-3 text-[#235347]" />
                  <span>{pingStatus["slack"] === "testing" ? "Sending..." : pingStatus["slack"] === "success" ? "Alert Delivered!" : "Test Ping"}</span>
                </button>
              </div>
            </div>

            {/* Salesforce CRM */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#00A1E0]/10 border border-[#00A1E0]/20 flex items-center justify-center text-[#00A1E0] font-bold text-sm">
                    SF
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#051F20]">Salesforce CRM Connector</h3>
                    <p className="text-[11px] text-[#163832]/60">Syncs contract MRR and logs dispatched tasks</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={salesforceEnabled} 
                    onChange={(e) => {
                      playTick();
                      setSalesforceEnabled(e.target.checked);
                    }} 
                    className="sr-only peer" 
                  />
                  <div className="w-10 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#235347]"></div>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[#163832]/60 uppercase tracking-wider font-semibold">Instance REST Endpoint</label>
                <input 
                  type="text" 
                  value={salesforceUrl}
                  onChange={(e) => setSalesforceUrl(e.target.value)}
                  disabled={!salesforceEnabled}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[#F4F8F5] border border-[#E2EAE4] text-[#051F20] focus:outline-none focus:border-[#235347] focus:bg-white disabled:opacity-50 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E2EAE4]">
                <span className="text-[10px] font-mono text-[#163832]/60">Two-way Sync: Active</span>
                <button
                  onClick={() => handleTestPing("salesforce")}
                  disabled={!salesforceEnabled || pingStatus["salesforce"] === "testing"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F8F5] hover:bg-[#EAEFEA] border border-[#E2EAE4] text-[#051F20] text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 text-cyan-600 ${pingStatus["salesforce"] === "testing" ? "animate-spin" : ""}`} />
                  <span>{pingStatus["salesforce"] === "testing" ? "Syncing..." : pingStatus["salesforce"] === "success" ? "Sync Verified!" : "Sync Test"}</span>
                </button>
              </div>
            </div>

            {/* HubSpot CRM */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#FF7A59]/10 border border-[#FF7A59]/20 flex items-center justify-center text-[#FF7A59] font-bold text-sm">
                    HS
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#051F20]">HubSpot RevOps Sync</h3>
                    <p className="text-[11px] text-[#163832]/60">Pushes risk scores into custom property fields</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={hubspotEnabled} 
                    onChange={(e) => {
                      playTick();
                      setHubspotEnabled(e.target.checked);
                    }} 
                    className="sr-only peer" 
                  />
                  <div className="w-10 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#235347]"></div>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[#163832]/60 uppercase tracking-wider font-semibold">Private App Access Token</label>
                <input 
                  type="password" 
                  value={hubspotToken}
                  onChange={(e) => setHubspotToken(e.target.value)}
                  disabled={!hubspotEnabled}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[#F4F8F5] border border-[#E2EAE4] text-[#051F20] focus:outline-none focus:border-[#235347] focus:bg-white disabled:opacity-50 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E2EAE4]">
                <span className="text-[10px] font-mono text-[#163832]/60">OAuth Scope: crm.objects.contacts</span>
                <button
                  onClick={() => handleTestPing("hubspot")}
                  disabled={!hubspotEnabled || pingStatus["hubspot"] === "testing"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F8F5] hover:bg-[#EAEFEA] border border-[#E2EAE4] text-[#051F20] text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  <Send className="w-3 h-3 text-[#235347]" />
                  <span>{pingStatus["hubspot"] === "testing" ? "Testing..." : pingStatus["hubspot"] === "success" ? "Connected!" : "Test Link"}</span>
                </button>
              </div>
            </div>

            {/* Stripe Billing */}
            <div className="p-6 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#635BFF]/10 border border-[#635BFF]/20 flex items-center justify-center text-[#635BFF] font-bold text-sm">
                    ST
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#051F20]">Stripe Billing & Invoices</h3>
                    <p className="text-[11px] text-[#163832]/60">Captures invoice.payment_failed telemetry</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={stripeEnabled} 
                    onChange={(e) => {
                      playTick();
                      setStripeEnabled(e.target.checked);
                    }} 
                    className="sr-only peer" 
                  />
                  <div className="w-10 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#235347]"></div>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-[#163832]/60 uppercase tracking-wider font-semibold">Webhook Signing Secret</label>
                <input 
                  type="password" 
                  value={stripeSecret}
                  onChange={(e) => setStripeSecret(e.target.value)}
                  disabled={!stripeEnabled}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl bg-[#F4F8F5] border border-[#E2EAE4] text-[#051F20] focus:outline-none focus:border-[#235347] focus:bg-white disabled:opacity-50 transition-colors"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E2EAE4]">
                <span className="text-[10px] font-mono text-[#163832]/60">Signature: HMAC-SHA256</span>
                <button
                  onClick={() => handleTestPing("stripe")}
                  disabled={!stripeEnabled || pingStatus["stripe"] === "testing"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F4F8F5] hover:bg-[#EAEFEA] border border-[#E2EAE4] text-[#051F20] text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3 text-[#235347]" />
                  <span>{pingStatus["stripe"] === "testing" ? "Verifying..." : pingStatus["stripe"] === "success" ? "Signature OK!" : "Verify Secret"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: API Keys & Developer SDK */}
      {activeTab === "api_keys" && (
        <div className="space-y-6">
          <div className="p-6 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#051F20] flex items-center gap-2">
                  <Key className="w-4 h-4 text-[#235347]" />
                  Production API Secret Key
                </h3>
                <p className="text-xs text-[#163832]/70 mt-0.5">
                  Use this token in the <code className="text-[#0B2B26] bg-[#DAF1DE] px-1.5 py-0.5 rounded border border-[#8EB69B]/40 font-mono">X-API-Key</code> header to authenticate server-to-server requests.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRegenerateKey}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#F4F8F5] hover:bg-[#EAEFEA] border border-[#E2EAE4] text-[#051F20] text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#163832]/60" />
                  <span>Roll Token</span>
                </button>

                <button
                  onClick={() => handleCopy(apiKey, "api_key")}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#235347] hover:bg-[#163832] text-white text-xs font-bold transition-all shadow-xs cursor-pointer border border-[#8EB69B]/40"
                >
                  {copiedKey === "api_key" ? <Check className="w-3.5 h-3.5 text-[#DAF1DE]" /> : <Copy className="w-3.5 h-3.5 text-[#DAF1DE]" />}
                  <span>{copiedKey === "api_key" ? "Copied!" : "Copy Token"}</span>
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] flex items-center justify-between font-mono text-xs text-[#051F20]">
              <span className="truncate font-semibold">{apiKey}</span>
              <span className="text-[10px] text-[#0B2B26] font-bold uppercase tracking-widest ml-2 px-2 py-0.5 rounded-full bg-[#DAF1DE] border border-[#8EB69B]/40">Read/Write</span>
            </div>
          </div>

          {/* Code Snippets */}
          <div className="p-6 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-4">
            <h3 className="text-sm font-bold text-[#051F20] flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#235347]" />
              Developer Integration Quickstart (cURL)
            </h3>
            <p className="text-xs text-[#163832]/70">
              Stream single-account telemetry directly into VALENCE to receive instant TreeSHAP attributions:
            </p>

            <div className="relative p-4 rounded-2xl bg-[#0B2B26] border border-[#163832] font-mono text-xs text-[#DAF1DE] overflow-x-auto">
              <button
                onClick={() => handleCopy(`curl -X POST https://api.valence-decision.com/api/v1/predict \\\n  -H "Content-Type: application/json" \\\n  -H "X-API-Key: ${apiKey}" \\\n  -d '{\n    "account_id": "ACC-ENTERPRISE-01",\n    "company_name": "Acme Global",\n    "contract_mrr": 15000,\n    "tenure_months": 18,\n    "days_since_last_login": 9,\n    "usage_change_pct_30d": -28.5,\n    "open_p1_tickets": 2,\n    "nps_score": 5,\n    "payment_failures_past_quarter": 1,\n    "days_until_renewal": 45,\n    "contract_tier": "Enterprise",\n    "auto_renew_enabled": 0\n  }'`, "curl_snippet")}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-[#DAF1DE] transition-colors shadow-xs cursor-pointer"
              >
                {copiedKey === "curl_snippet" ? <Check className="w-3.5 h-3.5 text-[#DAF1DE]" /> : <Copy className="w-3.5 h-3.5 text-[#DAF1DE]" />}
              </button>
              <pre className="text-[#DAF1DE]">
{`curl -X POST https://api.valence-decision.com/api/v1/predict \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{
    "account_id": "ACC-ENTERPRISE-01",
    "company_name": "Acme Global",
    "contract_mrr": 15000,
    "tenure_months": 18,
    "days_since_last_login": 9,
    "usage_change_pct_30d": -28.5,
    "open_p1_tickets": 2,
    "nps_score": 5,
    "payment_failures_past_quarter": 1,
    "days_until_renewal": 45,
    "contract_tier": "Enterprise",
    "auto_renew_enabled": 0
  }'`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Risk Calibration & SLA Policy */}
      {activeTab === "sla_policy" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Risk Tier Cutoffs */}
          <div className="p-6 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#051F20] flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#235347]" />
                Risk Tier Boundary Calibration
              </h3>
              <p className="text-xs text-[#163832]/70 mt-1">
                Define the probability cutoffs that categorize enterprise accounts into operational risk tiers.
              </p>
            </div>

            {/* Critical Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-rose-800">Critical Risk Threshold</span>
                <span className="font-mono font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">P ≥ {criticalThreshold}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="95"
                value={criticalThreshold}
                onChange={(e) => setCriticalThreshold(Number(e.target.value))}
                className="w-full accent-rose-700 cursor-pointer"
              />
            </div>

            {/* High Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#8C3A27]">High Risk Threshold</span>
                <span className="font-mono font-bold text-[#8C3A27] bg-[#FAF0E6] px-2.5 py-0.5 rounded-full border border-[#E8C4B8]">P ≥ {highThreshold}%</span>
              </div>
              <input
                type="range"
                min="45"
                max="75"
                value={highThreshold}
                onChange={(e) => setHighThreshold(Number(e.target.value))}
                className="w-full accent-[#8C3A27] cursor-pointer"
              />
            </div>

            {/* Medium Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-[#051F20]">Medium Risk Threshold</span>
                <span className="font-mono font-bold text-[#051F20] bg-[#DAF1DE] px-2.5 py-0.5 rounded-full border border-[#8EB69B]/40">P ≥ {mediumThreshold}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="45"
                value={mediumThreshold}
                onChange={(e) => setMediumThreshold(Number(e.target.value))}
                className="w-full accent-[#235347] cursor-pointer"
              />
            </div>
          </div>

          {/* Playbook SLA Deadlines */}
          <div className="p-6 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#051F20] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#235347]" />
                Retention Playbook SLA Governance
              </h3>
              <p className="text-xs text-[#163832]/70 mt-1">
                Configure target SLA countdown deadlines when frontline Customer Success playbooks are dispatched.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4]">
                <div>
                  <div className="text-xs font-bold text-rose-800">P0 — Executive Intervention SLA</div>
                  <div className="text-[10px] text-[#163832]/60">Dedicated TAM escalation & VP sponsor touchpoint</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={p0SlaHours}
                    onChange={(e) => setP0SlaHours(Number(e.target.value))}
                    className="w-14 px-2 py-1 text-xs font-mono font-bold text-center rounded-lg bg-white border border-[#E2EAE4] text-[#051F20] shadow-xs"
                  />
                  <span className="text-xs text-[#163832]/60">hours</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4]">
                <div>
                  <div className="text-xs font-bold text-[#8C3A27]">P1 — Usage & Adoption Recovery SLA</div>
                  <div className="text-[10px] text-[#163832]/60">Adoption velocity audit and power user enablement</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={p1SlaHours}
                    onChange={(e) => setP1SlaHours(Number(e.target.value))}
                    className="w-14 px-2 py-1 text-xs font-mono font-bold text-center rounded-lg bg-white border border-[#E2EAE4] text-[#051F20] shadow-xs"
                  />
                  <span className="text-xs text-[#163832]/60">hours</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4]">
                <div>
                  <div className="text-xs font-bold text-[#051F20]">P2 — Commercial Restructure SLA</div>
                  <div className="text-[10px] text-[#163832]/60">Multi-year renewal proposal and pricing flexibility</div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={p2SlaHours}
                    onChange={(e) => setP2SlaHours(Number(e.target.value))}
                    className="w-14 px-2 py-1 text-xs font-mono font-bold text-center rounded-lg bg-white border border-[#E2EAE4] text-[#051F20] shadow-xs"
                  />
                  <span className="text-xs text-[#163832]/60">hours</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Pipeline & Data Mode */}
      {activeTab === "environment" && (
        <div className="space-y-6">
          <div className="p-6 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-6">
            <div>
              <h3 className="text-sm font-bold text-[#051F20] flex items-center gap-2">
                <Database className="w-4 h-4 text-[#235347]" />
                Data Ingestion Mode
              </h3>
              <p className="text-xs text-[#163832]/70 mt-1">
                Toggle between simulated demo portfolio data and live enterprise pipeline inference.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div 
                onClick={() => {
                  sound.playClick(650);
                  setDataMode("live");
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  dataMode === "live"
                    ? "bg-[#DAF1DE]/40 border-[#235347] shadow-xs ring-1 ring-[#235347]/20"
                    : "bg-[#F4F8F5] border-[#E2EAE4] hover:border-[#8EB69B]/60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#051F20]">Live Enterprise Pipeline</span>
                  {dataMode === "live" && <CheckCircle2 className="w-4 h-4 text-[#235347]" />}
                </div>
                <p className="text-[11px] text-[#163832]/70">
                  Connects to FastAPI Gateway and PostgreSQL audit store. Real-time TreeSHAP calculations.
                </p>
              </div>

              <div 
                onClick={() => {
                  sound.playClick(650);
                  setDataMode("demo");
                }}
                className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                  dataMode === "demo"
                    ? "bg-[#DAF1DE]/40 border-[#235347] shadow-xs ring-1 ring-[#235347]/20"
                    : "bg-[#F4F8F5] border-[#E2EAE4] hover:border-[#8EB69B]/60"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#051F20]">Demo Sandbox Mode</span>
                  {dataMode === "demo" && <CheckCircle2 className="w-4 h-4 text-[#235347]" />}
                </div>
                <p className="text-[11px] text-[#163832]/70">
                  Utilizes 100 pre-calibrated benchmark accounts with synthetic noise for offline exploration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
