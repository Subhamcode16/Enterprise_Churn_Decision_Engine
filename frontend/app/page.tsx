"use client";

import { useEffect, useState, useRef } from "react";
import { getDemoAccounts, getPlaybooks, predictAccount } from "@/lib/api";
import { AccountRecord, PortfolioSummary, Playbook, SinglePredictionResponse } from "@/lib/types";
import { sound, playTick, playBlip, playExecute } from "@/lib/sound";
import PastelBentoMetrics from "@/components/PastelBentoMetrics";
import RiskTable from "@/components/RiskTable";
import RadialRiskGauge from "@/components/RadialRiskGauge";
import ForceShapVisualizer from "@/components/ForceShapVisualizer";
import ShapWaterfallChart from "@/components/ShapWaterfallChart";
import AccountRadar from "@/components/AccountRadar";
import RenewalTimelineRail from "@/components/RenewalTimelineRail";
import DecisionCopilot from "@/components/DecisionCopilot";
import AnimatedCounter from "@/components/AnimatedCounter";
import SkeletonPulse from "@/components/SkeletonPulse";
import { formatCurrency, resolvePrimaryPlaybook } from "@/lib/utils";
import Link from "next/link";
import { 
  BarChart2, 
  Zap, 
  Bot, 
  Sliders, 
  CheckCircle2, 
  Calendar, 
  RefreshCw 
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
  const [activeTab, setActiveTab] = useState<"shap" | "radar">("shap");
  const [dispatchedPlaybooks, setDispatchedPlaybooks] = useState<Record<string, boolean>>({});

  // Client-side instant prediction cache (0ms lag when switching accounts)
  const predictionCache = useRef<Record<string, SinglePredictionResponse>>({});

  const loadData = () => {
    sound.playClick(650);
    setLoading(true);
    Promise.all([getDemoAccounts(), getPlaybooks()])
      .then(([accRes, pbRes]) => {
        setSummary(accRes.summary);
        setAccounts(accRes.accounts);
        setPlaybooks(pbRes.playbooks);
        if (accRes.accounts.length > 0) {
          const firstAcc = accRes.accounts[0];
          setSelectedAccount((prev) => {
            if (!prev) return firstAcc;
            const found = accRes.accounts.find((a) => a.account_id === prev.account_id);
            return found || firstAcc;
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

    const handleToggleCopilot = () => {
      setCopilotOpen((prev) => !prev);
    };
    window.addEventListener("toggle-churniq-copilot", handleToggleCopilot);
    return () => {
      window.removeEventListener("toggle-churniq-copilot", handleToggleCopilot);
    };
  }, []);

  // 0ms Instant Cache Fetching for TreeSHAP Predictions
  useEffect(() => {
    if (!selectedAccount) return;

    const accId = selectedAccount.account_id;
    if (predictionCache.current[accId]) {
      setPrediction(predictionCache.current[accId]);
      setPredictLoading(false);
      return;
    }

    setPredictLoading(true);
    predictAccount(selectedAccount)
      .then((res) => {
        predictionCache.current[accId] = res;
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
    <div className="w-full flex flex-row items-start pb-16">
      {/* Main Dashboard Canvas - Dynamically shrinks when Copilot is open */}
      <div className="flex-1 min-w-0 space-y-7 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]">
        {/* Top Bar: Search & Executive Greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              Good morning, Revenue Director
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
              Calibrated XGBoost & TreeSHAP engine actively monitoring 100 enterprise accounts. <strong className="text-stone-900 font-bold">22 accounts</strong> require proactive intervention today.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                playTick();
                setCopilotOpen((prev) => !prev);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all duration-150 active:scale-[0.97] ${
                copilotOpen
                  ? "bg-amber-500 text-stone-950 font-bold"
                  : "bg-[#141312] hover:bg-stone-800 text-[#FAF8F5]"
              }`}
            >
              <Bot className={`w-4 h-4 ${copilotOpen ? "text-stone-950" : "text-amber-400"}`} />
              <span>{copilotOpen ? "Copilot Active" : "AI Copilot"}</span>
            </button>

            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E8E5DD] hover:border-stone-400 text-stone-700 hover:text-stone-950 text-xs font-medium shadow-sm transition-all duration-150 active:scale-[0.97]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} />
              <span>Sync</span>
            </button>
          </div>
        </div>

        {/* 4 Expressive Pastel Bento Metric Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 bg-white border border-[#E8E5DD] p-5 rounded-2xl space-y-3">
                <SkeletonPulse className="h-3 w-28 rounded" />
                <SkeletonPulse className="h-7 w-36 rounded" />
                <SkeletonPulse className="h-3 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : (
          summary && <PastelBentoMetrics summary={summary} />
        )}

        {/* 3-Column Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Column 1: Surveillance Watchlist (4 Cols) */}
          <div className="lg:col-span-4 space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
                <BarChart2 className="w-3.5 h-3.5 text-stone-600" />
                Watchlist ({accounts.length})
              </h2>
              <span className="text-[10px] font-mono text-stone-500 font-medium">Ranked by Loss</span>
            </div>

            <RiskTable
              accounts={accounts}
              onSelectAccount={handleSelectAccount}
              selectedAccountId={selectedAccount?.account_id}
              loading={loading}
            />
          </div>

          {/* Column 2: Deep-Dive Decision Hero Canvas (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            {selectedAccount ? (
              <div className="bg-[#FFFFFF] border border-[#E8E5DD] rounded-2xl p-6 shadow-sm space-y-6 transition-all duration-200">
                {/* Account Header */}
                <div className="flex items-start justify-between pb-4 border-b border-[#F0ECE1]">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-stone-500 font-mono mb-1">
                      <span className="font-bold text-stone-800">{selectedAccount.account_id}</span>
                      <span>•</span>
                      <span>{selectedAccount.contract_tier} Tier</span>
                      <span>•</span>
                      <span>{selectedAccount.tenure_months}mo Active</span>
                    </div>

                    <h2 className="text-2xl font-serif font-bold text-stone-900">
                      {selectedAccount.company_name}
                    </h2>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                    selectedAccount.risk_tier === "Critical"
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : selectedAccount.risk_tier === "High"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : "bg-stone-100 text-stone-700 border border-stone-200"
                  }`}>
                    {selectedAccount.risk_tier} RISK
                  </span>
                </div>

                {/* Gauge & Key Exposure Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-5 flex justify-center">
                    <RadialRiskGauge
                      probability={selectedAccount.churn_probability}
                      riskTier={selectedAccount.risk_tier}
                      size={175}
                    />
                  </div>

                  <div className="sm:col-span-7 grid grid-cols-2 gap-2.5">
                    <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EFECE4] transition-all hover:border-stone-300">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">Contract Value</span>
                      <div className="text-base font-mono font-bold text-stone-900 mt-0.5">
                        <AnimatedCounter prefix="$" value={selectedAccount.contract_mrr} decimals={0} />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EFECE4] transition-all hover:border-stone-300">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">MRR Exposure</span>
                      <div className="text-base font-mono font-bold text-rose-600 mt-0.5">
                        <AnimatedCounter prefix="$" value={selectedAccount.mrr_at_risk} decimals={0} />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EFECE4] transition-all hover:border-stone-300">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">30d Usage</span>
                      <div className={`text-base font-mono font-bold mt-0.5 ${
                        selectedAccount.usage_change_pct_30d < 0 ? "text-rose-600" : "text-emerald-700"
                      }`}>
                        {selectedAccount.usage_change_pct_30d > 0 ? "+" : ""}
                        <AnimatedCounter value={selectedAccount.usage_change_pct_30d} decimals={1} suffix="%" />
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EFECE4] transition-all hover:border-stone-300">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">P1 Tickets</span>
                      <div className={`text-base font-mono font-bold mt-0.5 ${
                        selectedAccount.open_p1_tickets > 0 ? "text-rose-600" : "text-stone-700"
                      }`}>
                        <AnimatedCounter value={selectedAccount.open_p1_tickets} decimals={0} suffix=" Open" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* High-Impact Visual CTA Banner */}
                <div className="p-4 rounded-xl bg-[#141312] text-[#FAF8F5] space-y-3 shadow-md">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5" />
                      Recommended Protocol: {currentPlaybookId}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      SLA: {currentPlaybookObj?.sla_hours || 4}h
                    </span>
                  </div>

                  <div className="text-xs text-stone-300 leading-relaxed font-sans">
                    {currentPlaybookObj?.action_summary || "Deploy immediate customer success outreach and technical support remediation."}
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => handleExecutePlaybook(currentPlaybookId)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-150 ${
                        isCurrentDispatched
                          ? "bg-emerald-500 text-stone-950 font-bold"
                          : "bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-sm active:scale-[0.97]"
                      }`}
                    >
                      {isCurrentDispatched ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Protocol Dispatched</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 fill-stone-950" />
                          <span>Deploy Protocol Now</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => {
                        playTick();
                        setCopilotOpen(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-[#262422] hover:bg-[#33302C] text-stone-200 text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-[0.97]"
                    >
                      <Bot className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ask Copilot</span>
                    </button>

                    <Link
                      href="/simulator"
                      onClick={() => playTick()}
                      className="px-3.5 py-2 rounded-xl bg-[#262422] hover:bg-[#33302C] text-stone-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-[0.97]"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Simulate</span>
                    </Link>
                  </div>
                </div>

                {/* Diagnostic Sliding Tabs (Persistent DOM Retention for 0ms Lag) */}
                <div className="space-y-4 pt-1">
                  <div className="relative flex items-center p-1 rounded-xl bg-[#F0ECE1] border border-[#E8E5DD] text-xs">
                    <button
                      onClick={() => {
                        playTick();
                        setActiveTab("shap");
                      }}
                      className={`relative z-10 flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 text-center ${
                        activeTab === "shap" ? "text-[#FAF8F5] font-bold" : "text-stone-600 hover:text-stone-950"
                      }`}
                    >
                      TreeSHAP Explainability
                    </button>

                    <button
                      onClick={() => {
                        playTick();
                        setActiveTab("radar");
                      }}
                      className={`relative z-10 flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors duration-150 text-center ${
                        activeTab === "radar" ? "text-[#FAF8F5] font-bold" : "text-stone-600 hover:text-stone-950"
                      }`}
                    >
                      5D Health Radar
                    </button>

                    {/* Sliding Indicator Pill */}
                    <div
                      className="absolute top-1 bottom-1 bg-[#141312] rounded-lg shadow-sm transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{
                        left: activeTab === "shap" ? "4px" : "50%",
                        width: "calc(50% - 4px)",
                      }}
                    />
                  </div>

                  {/* Tab 1: TreeSHAP */}
                  <div className={activeTab === "shap" ? "space-y-4 block opacity-100 transition-opacity duration-150" : "hidden opacity-0"}>
                    {predictLoading ? (
                      <div className="p-6 bg-[#FAF8F5] rounded-xl space-y-4">
                        <SkeletonPulse className="h-4 w-48 rounded" />
                        <SkeletonPulse className="h-20 w-full rounded-xl" />
                        <SkeletonPulse className="h-32 w-full rounded-xl" />
                      </div>
                    ) : prediction ? (
                      <>
                        <ForceShapVisualizer
                          drivers={prediction.top_drivers}
                          baseValue={prediction.base_value}
                          totalMargin={prediction.total_margin}
                          predictedProbability={prediction.churn_probability}
                        />
                        <ShapWaterfallChart
                          drivers={prediction.top_drivers}
                          baseValue={prediction.base_value}
                          totalMargin={prediction.total_margin}
                          predictedProbability={prediction.churn_probability}
                        />
                      </>
                    ) : (
                      <div className="p-8 text-center text-xs text-stone-400">
                        Calculating TreeSHAP attributions...
                      </div>
                    )}
                  </div>

                  {/* Tab 2: 5D Radar */}
                  <div className={activeTab === "radar" ? "p-4 rounded-xl bg-[#FAF8F5] border border-[#EFECE4] flex flex-col items-center block opacity-100 transition-opacity duration-150" : "hidden opacity-0"}>
                    <AccountRadar account={selectedAccount} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-16 rounded-2xl bg-white border border-[#E8E5DD] text-center text-stone-400 text-xs">
                Select an account to view deep-dive diagnostics.
              </div>
            )}
          </div>

          {/* Column 3: Renewal Timeline Rail & Copilot Launcher (3 Cols) */}
          <div className="lg:col-span-3 space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-stone-600" />
                Contract Schedule
              </h2>
              <span className="text-[10px] font-mono text-stone-500 font-medium">Q3 Renewals</span>
            </div>

            <RenewalTimelineRail
              accounts={accounts}
              onSelectAccount={handleSelectAccount}
              selectedAccountId={selectedAccount?.account_id}
              onOpenCopilot={() => setCopilotOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Integrated Sliding Side Column: Decision Copilot Panel */}
      <aside
        className={`flex-shrink-0 sticky top-6 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] h-[calc(100vh-4rem)] ${
          copilotOpen
            ? "w-[380px] lg:w-[420px] xl:w-[450px] opacity-100 pl-6 pointer-events-auto"
            : "w-0 opacity-0 pointer-events-none p-0 overflow-hidden"
        }`}
      >
        <DecisionCopilot
          isOpen={copilotOpen}
          onClose={() => setCopilotOpen(false)}
          account={selectedAccount}
          playbooks={playbooks}
          onExecutePlaybook={handleExecutePlaybook}
        />
      </aside>
    </div>
  );
}
