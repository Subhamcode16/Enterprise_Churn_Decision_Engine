"use client";

import { useState, useMemo } from "react";
import { Search, ArrowUpDown, ChevronRight, AlertCircle, Sparkles, Filter, Activity, Clock } from "lucide-react";
import { AccountRecord, RiskTier } from "@/lib/types";
import { formatCurrency, getRiskBadgeClasses } from "@/lib/utils";

interface RiskTableProps {
  accounts: AccountRecord[];
  onSelectAccount: (account: AccountRecord) => void;
  selectedAccountId?: string;
}

export default function RiskTable({
  accounts,
  onSelectAccount,
  selectedAccountId,
}: RiskTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTier, setSelectedTier] = useState<string>("All");
  const [sortField, setSortField] = useState<keyof AccountRecord>("mrr_at_risk");
  const [sortAsc, setSortAsc] = useState(false);

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((acc) => {
        const matchesSearch =
          acc.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          acc.account_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTier = selectedTier === "All" || acc.risk_tier === selectedTier;
        return matchesSearch && matchesTier;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === "number" && typeof valB === "number") {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [accounts, searchQuery, selectedTier, sortField, sortAsc]);

  const handleSort = (field: keyof AccountRecord) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#0F1626]/90 backdrop-blur-2xl shadow-card overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-slate-900/40">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search account name, company, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Tier Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          {["All", "Critical", "High", "Medium", "Low"].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                selectedTier === tier
                  ? "bg-indigo-600 text-white shadow-sm font-bold"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 z-10 bg-slate-900/95 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 backdrop-blur-md">
            <tr>
              <th className="py-3 px-4">Account Portfolio</th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("contract_mrr")}>
                <div className="flex items-center gap-1">
                  Contract MRR <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("churn_probability")}>
                <div className="flex items-center gap-1">
                  Churn Risk <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("mrr_at_risk")}>
                <div className="flex items-center gap-1">
                  MRR At Risk <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4 cursor-pointer hover:text-white" onClick={() => handleSort("usage_change_pct_30d")}>
                <div className="flex items-center gap-1">
                  30d Trend <ArrowUpDown className="w-3 h-3 text-slate-500" />
                </div>
              </th>
              <th className="py-3 px-4">Signals</th>
              <th className="py-3 px-4 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredAccounts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                  No accounts matched your filter criteria.
                </td>
              </tr>
            ) : (
              filteredAccounts.map((acc) => {
                const isSelected = selectedAccountId === acc.account_id;
                return (
                  <tr
                    key={acc.account_id}
                    onClick={() => onSelectAccount(acc)}
                    className={`cursor-pointer transition-all duration-150 group ${
                      isSelected
                        ? "bg-indigo-500/15 border-l-4 border-l-indigo-500"
                        : "hover:bg-slate-800/50"
                    }`}
                  >
                    {/* Account ID & Name */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-100 group-hover:text-indigo-300 transition-colors text-sm">
                        {acc.company_name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span className="font-mono">{acc.account_id}</span>
                        <span>•</span>
                        <span>{acc.contract_tier}</span>
                        <span>•</span>
                        <span>{acc.tenure_months} mo</span>
                      </div>
                    </td>

                    {/* Contract MRR */}
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      {formatCurrency(acc.contract_mrr)}
                    </td>

                    {/* Churn Prob & Risk Badge */}
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getRiskBadgeClasses(acc.risk_tier)}`}>
                        {acc.risk_tier} ({(acc.churn_probability * 100).toFixed(0)}%)
                      </span>
                    </td>

                    {/* MRR at Risk */}
                    <td className="py-3 px-4 font-mono font-extrabold text-red-400 text-sm">
                      {formatCurrency(acc.mrr_at_risk)}
                    </td>

                    {/* 30-Day Usage Trend */}
                    <td className="py-3 px-4 font-mono">
                      <span
                        className={
                          acc.usage_change_pct_30d < -20
                            ? "text-red-400 font-bold"
                            : acc.usage_change_pct_30d < 0
                            ? "text-amber-400 font-semibold"
                            : "text-emerald-400 font-semibold"
                        }
                      >
                        {acc.usage_change_pct_30d >= 0 ? "+" : ""}
                        {acc.usage_change_pct_30d}%
                      </span>
                    </td>

                    {/* Health Signals */}
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      <div className="flex items-center gap-2">
                        {acc.open_p1_tickets > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold">
                            {acc.open_p1_tickets} P1
                          </span>
                        )}
                        <span>NPS {acc.nps_score}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {acc.days_until_renewal}d
                        </span>
                      </div>
                    </td>

                    {/* Inspect Button */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAccount(acc);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white border border-indigo-500/30 text-xs font-bold transition-all"
                      >
                        Drill Down
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
