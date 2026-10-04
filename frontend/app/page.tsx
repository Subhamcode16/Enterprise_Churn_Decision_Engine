"use client";

import { useEffect, useState, useRef } from "react";
import { getDemoAccounts, getPlaybooks, predictAccount, getWorkspaceStatus, setWorkspaceMode } from "@/lib/api";
import { AccountRecord, PortfolioSummary, Playbook, SinglePredictionResponse } from "@/lib/types";
import { sound, playTick, playBlip, playExecute } from "@/lib/sound";
import PastelBentoMetrics from "@/components/PastelBentoMetrics";
import LiveTelemetryHeader from "@/components/LiveTelemetryHeader";
import CohortMigrationMatrix from "@/components/CohortMigrationMatrix";
import ConnectDataModal from "@/components/ConnectDataModal";
import AddAccountModal from "@/components/AddAccountModal";
import RiskTable from "@/components/RiskTable";
import RadialRiskGauge from "@/components/RadialRiskGauge";
import ForceShapVisualizer from "@/components/ForceShapVisualizer";
import ShapWaterfallChart from "@/components/ShapWaterfallChart";
import AccountRadar from "@/components/AccountRadar";
import RenewalTimelineRail from "@/components/RenewalTimelineRail";
import AnimatedCounter from "@/components/AnimatedCounter";
import SkeletonPulse from "@/components/SkeletonPulse";
import TextStateSwap from "@/components/TextStateSwap";
import DecisionCopilot from "@/components/DecisionCopilot";
import FaqSection from "@/components/FaqSection";
import { formatCurrency, resolvePrimaryPlaybook } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import { 
  BarChart2, 
  Zap, 
  Bot, 
  Sliders, 
  CheckCircle2, 
  Calendar 
} from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountRecord | null>(null);
  const [prediction, setPrediction] = useState<SinglePredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictLoading, setPredictLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"shap" | "radar">("shap");
  const [selectedCohortTier, setSelectedCohortTier] = useState<string>("All");
  const [dispatchedPlaybooks, setDispatchedPlaybooks] = useState<Record<string, boolean>>({});
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotInitialQuery, setCopilotInitialQuery] = useState<string | undefined>(undefined);

  // Live Company Workspace & Connection State
  const [workspaceMode, setWorkspaceModeState] = useState<"demo" | "live">("demo");
  const [hasConnectedData, setHasConnectedData] = useState(false);
  const [connectedSource, setConnectedSource] = useState<string | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);

  // Client-side instant prediction cache (0ms lag when switching accounts)
  const predictionCache = useRef<Record<string, SinglePredictionResponse>>({});

  useEffect(() => {
    const handleToggle = (e: any) => {
      if (e?.detail?.query) {
        setCopilotInitialQuery(e.detail.query);
        setIsCopilotOpen(true);
      } else {
        setIsCopilotOpen((prev) => !prev);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCopilotOpen) {
        setIsCopilotOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCopilotOpen((prev) => !prev);
      }
    };

    window.addEventListener("toggle-valence-copilot", handleToggle);
    window.addEventListener("toggle-churniq-copilot", handleToggle);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("toggle-valence-copilot", handleToggle);
      window.removeEventListener("toggle-churniq-copilot", handleToggle);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCopilotOpen]);

  const loadData = () => {
    sound.playClick(650);
    setLoading(true);
    Promise.all([getDemoAccounts(), getPlaybooks(), getWorkspaceStatus()])
      .then(([accRes, pbRes, wsStatus]) => {
        setSummary(accRes.summary);
        setAccounts(accRes.accounts);
        setPlaybooks(pbRes.playbooks);
        if (wsStatus) {
          setWorkspaceModeState(wsStatus.mode || "demo");
          setHasConnectedData(Boolean(wsStatus.has_connected_data));
          setConnectedSource(wsStatus.source || null);
        }
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

  const handleToggleMode = async (mode: "demo" | "live") => {
    sound.playClick(700);
    if (mode === "live" && !hasConnectedData) {
      setIsConnectModalOpen(true);
      return;
    }
    setWorkspaceModeState(mode);
    try {
      await setWorkspaceMode(mode);
      loadData();
    } catch (err) {
      console.error("Failed to set workspace mode:", err);
    }
  };

  const handleDataConnected = (response: any) => {
    playExecute();
    if (response.summary) setSummary(response.summary);
    if (response.accounts && response.accounts.length > 0) {
      setAccounts(response.accounts);
      setSelectedAccount(response.accounts[0]);
    }
    setWorkspaceModeState("live");
    setHasConnectedData(true);
    setConnectedSource(response.source || "csv");
  };

  useEffect(() => {
    loadData();
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("select-copilot-account", { detail: account }));
    }
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

  const handleAccountAdded = (newAccount: AccountRecord, predictionResult?: SinglePredictionResponse) => {
    playExecute();
    setAccounts((prev) => [newAccount, ...prev]);
    setSelectedAccount(newAccount);
    if (predictionResult) {
      predictionCache.current[newAccount.account_id] = predictionResult;
      setPrediction(predictionResult);
    }
    if (summary) {
      setSummary((prev) => {
        if (!prev) return prev;
        const score = newAccount.churn_probability ?? 0;
        const isCrit = score >= 0.75;
        const isHigh = score >= 0.5 && score < 0.75;
        return {
          ...prev,
          total_accounts: prev.total_accounts + 1,
          total_mrr_at_risk: score >= 0.5 ? prev.total_mrr_at_risk + newAccount.contract_mrr : prev.total_mrr_at_risk,
          critical_risk_count: isCrit ? prev.critical_risk_count + 1 : prev.critical_risk_count,
          high_risk_count: isHigh ? prev.high_risk_count + 1 : prev.high_risk_count,
        };
      });
    }
  };

  const isCurrentDispatched = selectedAccount 
    ? dispatchedPlaybooks[`${selectedAccount.account_id}-${currentPlaybookId}`] 
    : false;

  return (
    <div className="w-full flex flex-row items-start pb-20">
      {/* Main Dashboard Canvas - Dynamically shrinks when Copilot is open */}
      <div className="flex-1 min-w-0 space-y-8 lg:space-y-10 transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]">
        {/* Live Telemetry Header Ribbon with Workspace Banner */}
        <LiveTelemetryHeader
          onOpenCopilot={() => {
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("toggle-valence-copilot"));
            }
          }}
          onRefresh={loadData}
          loading={loading}
          accountsCount={accounts.length || 100}
          urgentCount={summary ? summary.critical_risk_count + summary.high_risk_count : 22}
          workspaceMode={workspaceMode}
          hasConnectedData={hasConnectedData}
          connectedSource={connectedSource}
          onToggleMode={handleToggleMode}
          onOpenConnectModal={() => setIsConnectModalOpen(true)}
          onOpenAddAccountModal={() => setIsAddAccountOpen(true)}
        />

        {/* 4 Expressive Pastel Bento Metric Cards with Dedicated Top Breathing Room */}
        <div className="pt-2">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-36 bg-white border border-[#E2EAE4] p-5 rounded-[28px] space-y-3">
                  <SkeletonPulse className="h-3 w-28 rounded" />
                  <SkeletonPulse className="h-7 w-36 rounded" />
                  <SkeletonPulse className="h-3 w-20 rounded" />
                </div>
              ))}
            </div>
          ) : (
            summary && <PastelBentoMetrics summary={summary} />
          )}
        </div>

        {/* Portfolio Risk Migration Flow & Cohort Health Matrix */}
        {summary && (
          <CohortMigrationMatrix
            summary={summary}
            selectedTier={selectedCohortTier}
            onFilterTier={(tier) => setSelectedCohortTier(tier)}
          />
        )}

        {/* 3-Column Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Column 1: Surveillance Watchlist (4 Cols) */}
          <div className="lg:col-span-4 space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#051F20] flex items-center gap-2">
                <BarChart2 className="w-3.5 h-3.5 text-[#235347]" />
                Watchlist ({accounts.length})
              </h2>
              <span className="text-[10px] font-mono text-[#163832]/60 font-medium">Ranked by Loss</span>
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
              <div className="bg-white border border-[#E2EAE4] rounded-[28px] p-6 shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-6 transition-all duration-200">
                {/* Account Header */}
                <div className="flex items-start justify-between pb-4 border-b border-[#E2EAE4]">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#163832]/60 font-mono mb-1">
                      <span className="font-bold text-[#051F20]">{selectedAccount.account_id}</span>
                      <span>•</span>
                      <span>{selectedAccount.contract_tier} Tier</span>
                      <span>•</span>
                      <span>{selectedAccount.tenure_months}mo Active</span>
                    </div>

                    <TextStateSwap triggerKey={selectedAccount.company_name}>
                      <h2 className="text-2xl font-serif font-bold text-[#051F20] tracking-tight">
                        {selectedAccount.company_name}
                      </h2>
                    </TextStateSwap>
                  </div>

                  <TextStateSwap triggerKey={selectedAccount.risk_tier}>
                    <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                      selectedAccount.risk_tier === "Critical"
                        ? "bg-rose-100 text-rose-800 border border-rose-200"
                        : selectedAccount.risk_tier === "High"
                        ? "bg-[#FAF0E6] text-[#8C3A27] border border-[#8C3A27]/30"
                        : "bg-[#DAF1DE] text-[#0B2B26] border border-[#8EB69B]/40"
                    }`}>
                      {selectedAccount.risk_tier} RISK
                    </span>
                  </TextStateSwap>
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
                    <div className="p-3 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] transition-all hover:border-[#8EB69B]/60">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#163832]/60">Contract Value</span>
                      <div className="text-base font-mono font-bold text-[#051F20] mt-0.5">
                        <AnimatedCounter prefix="$" value={selectedAccount.contract_mrr} decimals={0} showDelta={true} />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] transition-all hover:border-[#8EB69B]/60">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#163832]/60">MRR Exposure</span>
                      <div className="text-base font-mono font-bold text-rose-600 mt-0.5">
                        <AnimatedCounter prefix="$" value={selectedAccount.mrr_at_risk} decimals={0} showDelta={true} />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] transition-all hover:border-[#8EB69B]/60">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#163832]/60">30d Usage</span>
                      <div className={`text-base font-mono font-bold mt-0.5 ${
                        selectedAccount.usage_change_pct_30d < 0 ? "text-rose-600" : "text-[#235347]"
                      }`}>
                        {selectedAccount.usage_change_pct_30d > 0 ? "+" : ""}
                        <AnimatedCounter value={selectedAccount.usage_change_pct_30d} decimals={1} suffix="%" showDelta={true} />
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] transition-all hover:border-[#8EB69B]/60">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#163832]/60">P1 Tickets</span>
                      <div className={`text-base font-mono font-bold mt-0.5 ${
                        selectedAccount.open_p1_tickets > 0 ? "text-rose-600" : "text-[#051F20]"
                      }`}>
                        <AnimatedCounter value={selectedAccount.open_p1_tickets} decimals={0} suffix=" Open" showDelta={true} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* High-Impact Visual CTA Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0B2B26] via-[#163832] to-[#051F20] text-white space-y-3.5 shadow-md border border-[#163832]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#8EB69B] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#DAF1DE]" />
                      Recommended Protocol: {currentPlaybookId}
                    </span>
                    <span className="text-[11px] text-[#DAF1DE]/80 font-mono">
                      SLA: {currentPlaybookObj?.sla_hours || 4}h
                    </span>
                  </div>

                  <div className="text-xs text-white/85 leading-relaxed font-sans">
                    {currentPlaybookObj?.action_summary || "Deploy immediate customer success outreach and technical support remediation."}
                  </div>

                  <div className="pt-1 flex flex-wrap items-center gap-2.5">
                    <button
                      onClick={() => handleExecutePlaybook(currentPlaybookId)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-150 cursor-pointer ${
                        isCurrentDispatched
                          ? "bg-[#DAF1DE] text-[#051F20] font-bold"
                          : "bg-[#235347] hover:bg-[#163832] text-white border border-[#8EB69B]/40 shadow-sm active:scale-[0.97]"
                      }`}
                    >
                      <TextStateSwap triggerKey={isCurrentDispatched ? "dispatched" : "deploy"}>
                        {isCurrentDispatched ? (
                          <span className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#051F20]" />
                            <span>Protocol Dispatched</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 fill-white" />
                            <span>Deploy Protocol Now</span>
                          </span>
                        )}
                      </TextStateSwap>
                    </button>

                    <button
                      onClick={() => {
                        playTick();
                        const query = selectedAccount
                          ? `Explain the top root causes and TreeSHAP feature drivers for ${selectedAccount.company_name}.`
                          : "Explain the top root causes and SHAP feature drivers for this account.";
                        setCopilotInitialQuery(query);
                        setIsCopilotOpen(true);
                        if (typeof window !== "undefined") {
                          window.dispatchEvent(new CustomEvent("toggle-valence-copilot", { detail: { query } }));
                        }
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-[0.97] cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5 text-[#8EB69B]" />
                      <span>Ask Copilot</span>
                    </button>

                    <Link
                      href="/simulator"
                      onClick={() => playTick()}
                      className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-[0.97]"
                    >
                      <Sliders className="w-3.5 h-3.5 text-[#8EB69B]" />
                      <span>Simulate</span>
                    </Link>
                  </div>
                </div>

                {/* Diagnostic Sliding Tabs (Persistent DOM Retention for 0ms Lag) */}
                <div className="space-y-4 pt-1">
                  <div className="relative flex items-center p-1 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] text-xs">
                    <button
                      onClick={() => {
                        playTick();
                        setActiveTab("shap");
                      }}
                      className={`relative z-10 flex-1 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 text-center cursor-pointer ${
                        activeTab === "shap" ? "text-[#051F20] font-bold" : "text-[#163832]/60 hover:text-[#051F20]"
                      }`}
                    >
                      TreeSHAP Explainability
                    </button>

                    <button
                      onClick={() => {
                        playTick();
                        setActiveTab("radar");
                      }}
                      className={`relative z-10 flex-1 py-2 rounded-xl text-xs font-semibold transition-colors duration-150 text-center cursor-pointer ${
                        activeTab === "radar" ? "text-[#051F20] font-bold" : "text-[#163832]/60 hover:text-[#051F20]"
                      }`}
                    >
                      5D Health Radar
                    </button>

                    {/* Sliding Indicator Pill */}
                    <div
                      className="absolute top-1 bottom-1 bg-white rounded-xl shadow-xs border border-[#E2EAE4] transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
                      style={{
                        left: activeTab === "shap" ? "4px" : "50%",
                        width: "calc(50% - 4px)",
                      }}
                    />
                  </div>

                  {/* Tab 1: TreeSHAP */}
                  <div className={activeTab === "shap" ? "space-y-4 block opacity-100 transition-opacity duration-150" : "hidden opacity-0"}>
                    {predictLoading ? (
                      <div className="p-6 bg-[#F4F8F5] rounded-2xl space-y-4">
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
                      <div className="p-8 text-center text-xs text-[#163832]/50">
                        <span className="t-shimmer">Calculating TreeSHAP attributions...</span>
                      </div>
                    )}
                  </div>

                  {/* Tab 2: 5D Radar */}
                  <div className={activeTab === "radar" ? "p-4 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] flex flex-col items-center block opacity-100 transition-opacity duration-150" : "hidden opacity-0"}>
                    <AccountRadar account={selectedAccount} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-16 rounded-[28px] bg-white border border-[#E2EAE4] text-center text-[#163832]/50 text-xs">
                Select an account to view deep-dive diagnostics.
              </div>
            )}
          </div>

          {/* Column 3: Renewal Timeline Rail & Copilot Launcher (3 Cols) */}
          <div className="lg:col-span-3 space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#051F20] flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#235347]" />
                Contract Schedule
              </h2>
              <span className="text-[10px] font-mono text-[#163832]/60 font-medium">Q3 Renewals</span>
            </div>

            <RenewalTimelineRail
              accounts={accounts}
              onSelectAccount={handleSelectAccount}
              selectedAccountId={selectedAccount?.account_id}
              onOpenCopilot={() => {
                sound.playClick(700);
                setIsCopilotOpen(true);
              }}
            />
          </div>
        </div>

        {/* Full-Width Centered Knowledge Base FAQ Section */}
        <FaqSection onOpenConnectModal={() => setIsConnectModalOpen(true)} />
      </div>

      {/* Fluid Spring Slide-Over Decision Copilot */}
      <DecisionCopilot
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        account={selectedAccount}
        playbooks={playbooks}
        onExecutePlaybook={handleExecutePlaybook}
        initialQuery={copilotInitialQuery}
        onClearInitialQuery={() => setCopilotInitialQuery(undefined)}
      />

      {/* Floating Bottom-Right Launcher Trigger: Circular Bear Mascot Profile Button */}
      {!isCopilotOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center group">
          {/* Subtle Hover Tooltip Pill */}
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none mr-3 px-3 py-1.5 rounded-full bg-[#051F20] text-[#DAF1DE] text-xs font-mono font-bold shadow-md whitespace-nowrap border border-emerald-500/20 translate-x-2 group-hover:translate-x-0">
            Ask Bear Copilot
          </div>

          <button
            onClick={() => {
              sound.playClick(750);
              setIsCopilotOpen(true);
            }}
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-br from-emerald-400 via-[#235347] to-[#0B2B26] shadow-[0_8px_32px_rgba(5,31,32,0.3)] hover:shadow-[0_12px_36px_rgba(35,83,71,0.5)] transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
            title="Open AI Decision Copilot"
          >
            {/* Inner Round Avatar Frame */}
            <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-white/90 bg-[#0B2B26]">
              <Image
                src="/mascot_bear.png"
                alt="Valence Bear Mascot Copilot"
                fill
                sizes="64px"
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>

            {/* Glowing Live Green Online Status Badge */}
            <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white shadow-xs">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </span>
          </button>
        </div>
      )}

      {/* Connect Company Data Modal */}
      <ConnectDataModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        onDataConnected={handleDataConnected}
      />

      {/* Single Account Direct Scorer Modal */}
      <AddAccountModal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        onAccountAdded={handleAccountAdded}
      />
    </div>
  );
}
