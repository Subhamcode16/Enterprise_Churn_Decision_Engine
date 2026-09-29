"use client";

import { useEffect, useState } from "react";
import { getDemoAccounts, getPlaybooks } from "@/lib/api";
import { AccountRecord, PortfolioSummary, Playbook } from "@/lib/types";
import { sound } from "@/lib/sound";
import KpiMetrics from "@/components/KpiMetrics";
import RiskTable from "@/components/RiskTable";
import AccountInspector from "@/components/AccountInspector";
import PlaybookActionHud from "@/components/PlaybookActionHud";
import CohortRiskChart from "@/components/CohortRiskChart";
import LiveTelemetryTicker from "@/components/LiveTelemetryTicker";
import { Activity, ShieldAlert, Sparkles, RefreshCw, BarChart2, PieChart, Layers, Zap } from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountRecord | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  const handleSelectAccount = (account: AccountRecord) => {
    sound.playSelect();
    setSelectedAccount(account);
  };

  return (
    <div className="space-y-6">
      {/* Live Telemetry Streaming Ribbon */}
      <LiveTelemetryTicker
        accounts={accounts}
        onSelectAccount={handleSelectAccount}
      />

      {/* Hero Title & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-stone-800">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
              Enterprise Revenue Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Swiss Editorial Suite
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-stone-400">
            Real-time churn risk quantification, TreeSHAP diagnostic attributions, and retention playbook dispatch.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 border border-stone-800 hover:border-amber-500/50 text-stone-300 hover:text-white text-xs font-bold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-400" : ""}`} />
          Sync Intelligence Feed
        </button>
      </div>

      {/* KPI Cards Grid */}
      {summary && <KpiMetrics summary={summary} />}

      {/* 3-Column Linear Pro Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Risk Watchlist (28% / 3 cols or 4 cols on 12-grid -> 4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-amber-400" />
              Surveillance Watchlist ({accounts.length})
            </h2>
            <span className="text-[10px] text-stone-500 font-mono">Ranked by MRR Exposure</span>
          </div>
          <RiskTable
            accounts={accounts}
            onSelectAccount={handleSelectAccount}
            selectedAccountId={selectedAccount?.account_id}
          />
        </div>

        {/* Column 2: Deep-Dive Diagnostic Canvas (44% / 5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Deep-Dive Diagnostic Canvas
            </h2>
            <span className="text-[10px] text-stone-500 font-mono">TreeSHAP Explainability</span>
          </div>
          {selectedAccount ? (
            <AccountInspector account={selectedAccount} />
          ) : (
            <div className="rounded-3xl border border-stone-800 bg-[#141312]/60 p-8 text-center text-xs text-stone-500">
              Select an account from the watchlist to inspect telemetry.
            </div>
          )}
        </div>

        {/* Column 3: Playbook Action HUD (28% / 3 cols) */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Playbook Action HUD
            </h2>
            <span className="text-[10px] text-stone-500 font-mono">Automated Retention</span>
          </div>
          {selectedAccount ? (
            <PlaybookActionHud account={selectedAccount} playbooks={playbooks} />
          ) : (
            <div className="rounded-3xl border border-stone-800 bg-[#141312]/60 p-8 text-center text-xs text-stone-500">
              Awaiting account selection.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Renewal Horizon Risk Cohorts Visualizer */}
      <div className="rounded-3xl border border-stone-800 bg-gradient-to-b from-[#181716] via-[#141312] to-[#0E0D0C] backdrop-blur-2xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-200">
              Renewal Horizon Risk Cohort Matrix
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Critical Risk
            </span>
            <span className="flex items-center gap-1.5 text-orange-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" /> High Risk
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Medium
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Low Risk
            </span>
          </div>
        </div>

        <CohortRiskChart accounts={accounts} />
      </div>
    </div>
  );
}
