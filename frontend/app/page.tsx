"use client";

import { useEffect, useState } from "react";
import { getDemoAccounts, getPlaybooks, predictAccount } from "@/lib/api";
import { AccountRecord, PortfolioSummary, Playbook, SinglePredictionResponse } from "@/lib/types";
import { sound, playTick, playBlip, playExecute } from "@/lib/sound";
import KpiMetrics from "@/components/KpiMetrics";
import RiskTable from "@/components/RiskTable";
import RadialRiskGauge from "@/components/RadialRiskGauge";
import ForceShapVisualizer from "@/components/ForceShapVisualizer";
import ShapWaterfallChart from "@/components/ShapWaterfallChart";
import AccountRadar from "@/components/AccountRadar";
import CohortRiskChart from "@/components/CohortRiskChart";
import LiveTelemetryTicker from "@/components/LiveTelemetryTicker";
import DecisionCopilot from "@/components/DecisionCopilot";
import { formatCurrency, getRiskBadgeClasses, resolvePrimaryPlaybook } from "@/lib/utils";
import Link from "next/link";
import { 
  Activity, 
  ShieldAlert, 
  Sparkles, 
  RefreshCw, 
  BarChart2, 
  PieChart, 
  Layers, 
  Zap, 
  Bot, 
  Sliders, 
  CheckCircle2, 
  ArrowRight, 
  Calendar, 
  Users, 
  AlertTriangle,
  Clock
} from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountRecord | null>(null);
  const [prediction, setPrediction] = useState<SinglePredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictLoading, setPredictLoading] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"shap" | "radar" | "cohort">("shap");
  const [dispatchedPlaybooks, setDispatchedPlaybooks] = useState<Record<string, boolean>>({});

  const loadData = () => {
    sound.playClick(650);
    setLoading(true);
    Promise.all([getDemoAccounts(), getPlaybooks()])
      .then(([accRes, pbRes]) => {
        setSummary(accRes.summary);
        setAccounts(accRes.accounts);
        setPlaybooks(pbRes.playbooks);
        if (accRes.accounts.length > 0) {
          setSelectedAccount((prev) => {
            if (!prev) return accRes.accounts[0];
            const found = accRes.accounts.find((a) => a.account_id === prev.account_id);
            return found || accRes.accounts[0];
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load portfolio intelligence:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();

    // Listen to navbar copilot toggle
    const handleToggleCopilot = () => {
      setCopilotOpen((prev) => !prev);
    };
    window.addEventListener("toggle-churniq-copilot", handleToggleCopilot);
    return () => {
      window.removeEventListener("toggle-churniq-copilot", handleToggleCopilot);
    };
  }, []);

  useEffect(() => {
    if (!selectedAccount) return;
    setPredictLoading(true);
    predictAccount(selectedAccount)
      .then((res) => {
        setPrediction(res);
      })
      .catch((err) => {
        console.error("Failed to fetch SHAP explanation:", err);
      })
      .finally(() => {
        setPredictLoading(false);
      });
  }, [selectedAccount]);

  const handleSelectAccount = (account: AccountRecord) => {
    playTick();
    setSelectedAccount(account);
  };

  const currentPlaybookId = selectedAccount ? resolvePrimaryPlaybook(selectedAccount) : "PB-SUPP-01";
  const currentPlaybookObj = playbooks.find((pb) => pb.playbook_id === currentPlaybookId) || selectedAccount?.playbook_details;

  const handleExecutePlaybook = (playbookId: string) => {
    playExecute();
    setDispatchedPlaybooks((prev) => ({
      ...prev,
      [`${selectedAccount?.account_id}-${playbookId}`]: true,
    }));
  };

  const isCurrentDispatched = selectedAccount 
    ? dispatchedPlaybooks[`${selectedAccount.account_id}-${currentPlaybookId}`] 
    : false;

  return (
    <div className="w-full space-y-8 pb-16">
      {/* Streaming Live Telemetry Ribbon */}
      <LiveTelemetryTicker
        accounts={accounts}
        onSelectAccount={handleSelectAccount}
      />

      {/* Hero Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 border-b border-[#22201E] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400">
              Executive Decision Intelligence
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-[#FAF8F5] tracking-tight">
            Revenue Command Center
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed font-sans">
            Calibrated XGBoost churn probability scoring, TreeSHAP local attribution explainability, and automated retention playbook execution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              playTick();
              setCopilotOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold shadow-glowGold transition-all active:scale-[0.98]"
          >
            <Bot className="w-4 h-4" />
            <span>Open Decision Copilot</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#181716] border border-[#22201E] hover:border-stone-700 text-stone-300 hover:text-[#FAF8F5] text-xs font-semibold shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
            <span>Sync Feed</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      {summary && <KpiMetrics summary={summary} />}

      {/* Main 2-Column Responsive Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Surveillance Watchlist (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-300 flex items-center gap-2">
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              Surveillance Watchlist ({accounts.length})
            </h2>
            <span className="text-[10px] font-mono text-stone-500">Ranked by MRR Exposure</span>
          </div>

          <RiskTable
            accounts={accounts}
            onSelectAccount={handleSelectAccount}
            selectedAccountId={selectedAccount?.account_id}
          />
        </div>

        {/* Right Column: Hero Decision Canvas & Primary Action Hub (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedAccount ? (
            <>
              {/* Primary Hero Decision Card */}
              <div className="rounded-2xl border border-[#262422] bg-gradient-to-b from-[#181715] via-[#141311] to-[#0E0D0C] p-6 sm:p-8 shadow-2xl space-y-6">
                {/* Hero Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-[#22201E]">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="text-xs font-mono text-stone-500 font-bold">
                        {selectedAccount.account_id}
                      </span>
                      <span className="text-stone-600">•</span>
                      <span className="text-xs text-stone-400 font-medium">
                        {selectedAccount.contract_tier} Tier
                      </span>
                      <span className="text-stone-600">•</span>
                      <span className="text-xs text-stone-400 font-medium">
                        {selectedAccount.tenure_months}mo Active
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#FAF8F5]">
                      {selectedAccount.company_name}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wide border ${getRiskBadgeClasses(selectedAccount.risk_tier)}`}>
                      {selectedAccount.risk_tier} RISK
                    </span>
                    <div className="px-3 py-1 rounded-full bg-[#181716] border border-[#262422] text-stone-300 text-xs font-mono">
                      Renewal in <strong className="text-amber-400">{selectedAccount.days_until_renewal}d</strong>
                    </div>
                  </div>
                </div>

                {/* Gauge & Key Exposure Readouts */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Circular Speedometer Gauge */}
                  <div className="md:col-span-5 flex justify-center">
                    <RadialRiskGauge
                      probability={selectedAccount.churn_probability}
                      riskTier={selectedAccount.risk_tier}
                      size={210}
                    />
                  </div>

                  {/* High-Level Metric Tiles */}
                  <div className="md:col-span-7 grid grid-cols-2 gap-3.5">
                    <div className="p-4 rounded-xl bg-[#0E0D0C] border border-[#22201E]">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">Contract Value</span>
                      <div className="text-xl sm:text-2xl font-mono font-bold text-[#FAF8F5] mt-1">
                        {formatCurrency(selectedAccount.contract_mrr)}<span className="text-xs font-normal text-stone-500">/mo</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0E0D0C] border border-[#22201E]">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">MRR at Risk</span>
                      <div className="text-xl sm:text-2xl font-mono font-bold text-rose-400 mt-1">
                        {formatCurrency(selectedAccount.mrr_at_risk)}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0E0D0C] border border-[#22201E]">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">30d Usage Trend</span>
                      <div className={`text-xl sm:text-2xl font-mono font-bold mt-1 ${
                        selectedAccount.usage_change_pct_30d < 0 ? "text-rose-400" : "text-emerald-400"
                      }`}>
                        {selectedAccount.usage_change_pct_30d > 0 ? "+" : ""}
                        {selectedAccount.usage_change_pct_30d.toFixed(1)}%
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-[#0E0D0C] border border-[#22201E]">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">Support Health</span>
                      <div className={`text-xl sm:text-2xl font-mono font-bold mt-1 ${
                        selectedAccount.open_p1_tickets > 0 ? "text-rose-400" : "text-stone-300"
                      }`}>
                        {selectedAccount.open_p1_tickets} <span className="text-xs font-normal text-stone-500">P1 Tickets</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary Visual CTA Banner */}
                <div className="p-5 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#1C1B19] to-[#181716] border border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.06)] space-y-3.5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                        Prescribed Retention Intervention
                      </span>
                    </div>
                    <span className="text-xs font-mono text-stone-400">
                      SLA: <strong className="text-amber-400">{currentPlaybookObj?.sla_hours || 4}h</strong> Target
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-[#FAF8F5]">
                      {currentPlaybookId} — {currentPlaybookObj?.title || "Targeted Executive Outreach"}
                    </h3>
                    <p className="text-xs text-stone-300 mt-1 leading-relaxed font-sans">
                      {currentPlaybookObj?.action_summary || "Deploy immediate customer success outreach and technical support remediation."}
                    </p>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleExecutePlaybook(currentPlaybookId)}
                      className={`px-5 py-2.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                        isCurrentDispatched
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-glowGold active:scale-[0.98]"
                      }`}
                    >
                      {isCurrentDispatched ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>Intervention Dispatched to {currentPlaybookObj?.assignee_role || "CS"}</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 fill-stone-950" />
                          <span>⚡ Deploy Retention Protocol Now</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        playTick();
                        setCopilotOpen(true);
                      }}
                      className="px-4 py-2.5 rounded-lg bg-[#22201E] hover:bg-[#2A2825] border border-[#33302C] text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Bot className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ask Copilot for Strategy</span>
                    </button>

                    <Link
                      href="/simulator"
                      onClick={() => playTick()}
                      className="px-4 py-2.5 rounded-lg bg-[#181716] hover:bg-[#22201E] border border-[#262422] text-stone-400 hover:text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Simulate What-If</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Diagnostic Depth Tabs */}
              <div className="space-y-4">
                {/* Tab Controls */}
                <div className="flex items-center justify-between border-b border-[#22201E] pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        playTick();
                        setActiveTab("shap");
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === "shap"
                          ? "bg-[#FAF8F5] text-[#0E0D0C] shadow-sm"
                          : "bg-[#181716] text-stone-400 hover:text-stone-200 border border-[#22201E]"
                      }`}
                    >
                      TreeSHAP Root-Cause Attributions
                    </button>

                    <button
                      onClick={() => {
                        playTick();
                        setActiveTab("radar");
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === "radar"
                          ? "bg-[#FAF8F5] text-[#0E0D0C] shadow-sm"
                          : "bg-[#181716] text-stone-400 hover:text-stone-200 border border-[#22201E]"
                      }`}
                    >
                      5D Health Radar & Metrics
                    </button>

                    <button
                      onClick={() => {
                        playTick();
                        setActiveTab("cohort");
                      }}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        activeTab === "cohort"
                          ? "bg-[#FAF8F5] text-[#0E0D0C] shadow-sm"
                          : "bg-[#181716] text-stone-400 hover:text-stone-200 border border-[#22201E]"
                      }`}
                    >
                      Renewal Horizon Cohort Matrix
                    </button>
                  </div>
                </div>

                {/* Tab 1: TreeSHAP Visualizers */}
                {activeTab === "shap" && (
                  <div className="space-y-6">
                    {prediction ? (
                      <>
                        {/* Push / Pull Force Balance */}
                        <div className="p-6 rounded-2xl bg-[#181716] border border-[#22201E]">
                          <ForceShapVisualizer
                            drivers={prediction.top_drivers}
                            baseValue={prediction.base_value}
                            totalMargin={prediction.total_margin}
                            predictedProbability={prediction.churn_probability}
                          />
                        </div>

                        {/* TreeSHAP Waterfall Chart */}
                        <div className="p-6 rounded-2xl bg-[#181716] border border-[#22201E]">
                          <ShapWaterfallChart
                            drivers={prediction.top_drivers}
                            baseValue={prediction.base_value}
                            totalMargin={prediction.total_margin}
                            predictedProbability={prediction.churn_probability}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="p-12 text-center text-stone-400 bg-[#181716] rounded-2xl border border-[#22201E]">
                        <Zap className="w-5 h-5 mx-auto text-amber-400 animate-spin mb-2" />
                        Calculating TreeSHAP feature attributions...
                      </div>
                    )}
                  </div>
                )}

                {/* Tab 2: 5D Health Radar & Telemetry */}
                {activeTab === "radar" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-6 p-6 rounded-2xl bg-[#181716] border border-[#22201E] flex flex-col items-center justify-center">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400 mb-2">
                        Multivariate Health Radar
                      </h4>
                      <AccountRadar account={selectedAccount} />
                    </div>

                    <div className="md:col-span-6 p-6 rounded-2xl bg-[#181716] border border-[#22201E] space-y-4">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400">
                        Operational Telemetry Signals
                      </h4>

                      <div className="space-y-2.5 text-xs">
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#0E0D0C] border border-[#22201E]">
                          <span className="text-stone-400">Days Since Last Login</span>
                          <span className="font-mono text-stone-200 font-bold">{selectedAccount.days_since_last_login} Days</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#0E0D0C] border border-[#22201E]">
                          <span className="text-stone-400">Active User Ratio</span>
                          <span className="font-mono text-stone-200 font-bold">
                            {selectedAccount.active_user_ratio != null 
                              ? `${(selectedAccount.active_user_ratio * 100).toFixed(0)}%` 
                              : "82%"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#0E0D0C] border border-[#22201E]">
                          <span className="text-stone-400">Monthly API Calls</span>
                          <span className="font-mono text-stone-200 font-bold">
                            {selectedAccount.api_calls_monthly != null 
                              ? selectedAccount.api_calls_monthly.toLocaleString() 
                              : "18,400"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#0E0D0C] border border-[#22201E]">
                          <span className="text-stone-400">NPS / CSAT Score</span>
                          <span className="font-mono text-stone-200 font-bold">{selectedAccount.nps_score}/10 • {selectedAccount.csat_score}/5.0</span>
                        </div>
                        <div className="flex justify-between items-center p-2.5 rounded-lg bg-[#0E0D0C] border border-[#22201E]">
                          <span className="text-stone-400">Avg Ticket Resolution</span>
                          <span className="font-mono text-stone-200 font-bold">{selectedAccount.avg_resolution_time_hrs} Hours</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Cohort Matrix */}
                {activeTab === "cohort" && (
                  <div className="p-6 rounded-2xl bg-[#181716] border border-[#22201E]">
                    <div className="flex justify-between items-center pb-4 mb-4 border-b border-[#22201E]">
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-300">
                        Portfolio Renewal Horizon Matrix
                      </span>
                    </div>
                    <CohortRiskChart accounts={accounts} />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-16 rounded-2xl border border-[#22201E] bg-[#181716] text-center text-stone-500">
              Select an account from the watchlist to view deep diagnostics.
            </div>
          )}
        </div>
      </div>

      {/* Interactive ML Decision Copilot Drawer */}
      <DecisionCopilot
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        account={selectedAccount}
        playbooks={playbooks}
        onExecutePlaybook={handleExecutePlaybook}
      />
    </div>
  );
}
