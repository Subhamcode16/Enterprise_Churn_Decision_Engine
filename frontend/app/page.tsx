"use client";

import { useEffect, useState } from "react";
import { getDemoAccounts } from "@/lib/api";
import { AccountRecord, PortfolioSummary } from "@/lib/types";
import KpiMetrics from "@/components/KpiMetrics";
import RiskTable from "@/components/RiskTable";
import AccountInspector from "@/components/AccountInspector";
import CohortRiskChart from "@/components/CohortRiskChart";
import { Activity, ShieldAlert, Sparkles, RefreshCw, BarChart2, PieChart, Layers } from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<AccountRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    getDemoAccounts()
      .then((res) => {
        setSummary(res.summary);
        setAccounts(res.accounts);
        if (res.accounts.length > 0) {
          // If no selection or previous selection not found, pick the highest risk account
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

  return (
    <div className="space-y-8">
      {/* Top Hero Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Enterprise Portfolio Intelligence
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Surveillance
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            AI-calibrated churn probability, financial exposure quantification, and TreeSHAP diagnostic attributions.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold shadow-sm transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-indigo-400" : ""}`} />
          Sync Intelligence Feed
        </button>
      </div>

      {/* KPI Cards Grid */}
      {summary && <KpiMetrics summary={summary} />}

      {/* Visual Analytics Bar: Risk Cohorts & Renewal Horizons */}
      <div className="rounded-2xl border border-slate-800 bg-[#0F1626]/80 backdrop-blur-2xl p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Renewal Horizon Risk Cohorts
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-red-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Critical
            </span>
            <span className="flex items-center gap-1.5 text-orange-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" /> High
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Medium
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Low
            </span>
          </div>
        </div>

        <CohortRiskChart accounts={accounts} />
      </div>

      {/* Main Command Workspace (7 / 5 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Accounts Matrix (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Accounts Surveillance Matrix ({accounts.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Ranked by Expected Financial Loss
            </span>
          </div>

          <RiskTable
            accounts={accounts}
            onSelectAccount={(acc) => setSelectedAccount(acc)}
            selectedAccountId={selectedAccount?.account_id}
          />
        </div>

        {/* Right Column: Account Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Real-Time Account Diagnostic
            </h2>
          </div>

          {selectedAccount ? (
            <AccountInspector account={selectedAccount} />
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-[#0F1626]/50 p-8 text-center text-xs text-slate-400">
              Select an account from the matrix to inspect diagnostic attributions.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
