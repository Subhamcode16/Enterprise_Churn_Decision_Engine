"use client";

import { useEffect, useState } from "react";
import { getDemoAccounts } from "@/lib/api";
import { AccountRecord, PortfolioSummary } from "@/lib/types";
import { sound } from "@/lib/sound";
import KpiMetrics from "@/components/KpiMetrics";
import RiskTable from "@/components/RiskTable";
import AccountInspector from "@/components/AccountInspector";
import CohortRiskChart from "@/components/CohortRiskChart";
import LiveTelemetryTicker from "@/components/LiveTelemetryTicker";
import { Activity, ShieldAlert, Sparkles, RefreshCw, BarChart2, PieChart, Layers, Zap } from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    sound.playClick(650);
    setLoading(true);
    getDemoAccounts()
      .then((res) => {
        setSummary(res.summary);
        setAccounts(res.accounts);
        if (res.accounts.length > 0) {
          setSelectedAccount((prev) => {
            if (!prev) return res.accounts[0];
            const found = res.accounts.find((a) => a.account_id === prev.account_id);
            return found || res.accounts[0];
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load portfolio data:", err);
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

      {/* Hero Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Enterprise Revenue Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 text-xs font-extrabold flex items-center gap-1.5 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Surveillance
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time churn risk quantification, TreeSHAP diagnostic attributions, and retention playbook dispatch.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white text-xs font-bold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          Sync Intelligence Feed
        </button>
      </div>

      {/* KPI Cards Grid */}
      {summary && <KpiMetrics summary={summary} />}

      {/* Bento Row: Horizon Cohort Visualizer (Full Width) */}
      <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-b from-[#111728]/80 via-[#0D1220]/80 to-[#080C16]/80 backdrop-blur-2xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Renewal Horizon Risk Cohorts
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> Critical
            </span>
            <span className="flex items-center gap-1.5 text-orange-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" /> High
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" /> Medium
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" /> Low
            </span>
          </div>
        </div>

        <CohortRiskChart accounts={accounts} />
      </div>

      {/* Asymmetric Command Workspace Grid (7 cols / 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Accounts Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Accounts Surveillance Matrix ({accounts.length})
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Ranked by Financial Exposure
            </span>
          </div>

          <RiskTable
            accounts={accounts}
            onSelectAccount={handleSelectAccount}
            selectedAccountId={selectedAccount?.account_id}
          />
        </div>

        {/* Right Column: Account Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              Diagnostic Deep Dive
            </h2>
          </div>

          {selectedAccount ? (
            <AccountInspector account={selectedAccount} />
          ) : (
            <div className="rounded-3xl border border-slate-800 bg-[#0F1626]/50 p-8 text-center text-xs text-slate-400">
              Select an account from the matrix to inspect diagnostic attributions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
