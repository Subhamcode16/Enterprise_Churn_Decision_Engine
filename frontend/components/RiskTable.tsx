"use client";

import { useState, useMemo } from "react";
import { Search, ChevronRight, AlertCircle, Sparkles, Filter, Clock } from "lucide-react";
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

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((acc) => {
        const matchesSearch =
          acc.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          acc.account_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTier = selectedTier === "All" || acc.risk_tier === selectedTier;
        return matchesSearch && matchesTier;
      })
      .sort((a, b) => b.mrr_at_risk - a.mrr_at_risk);
  }, [accounts, searchQuery, selectedTier]);

  return (
    <div className="rounded-3xl border border-stone-800 bg-gradient-to-b from-[#181716] via-[#141312] to-[#0E0D0C] backdrop-blur-2xl shadow-card overflow-hidden flex flex-col h-[760px]">
      {/* Search & Tier Filters */}
      <div className="p-4 border-b border-stone-800 space-y-3 bg-stone-950/60">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search accounts or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
          />
        </div>

        {/* Tier Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-stone-900 border border-stone-800 text-[11px] font-bold">
          {["All", "Critical", "High", "Medium", "Low"].map((tier) => (
            <button
              key={tier}
              onClick={() => setSelectedTier(tier)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedTier === tier
                  ? "bg-amber-500 text-stone-950 font-extrabold shadow-sm"
                  : "text-stone-400 hover:text-stone-200 hover:bg-stone-800/60"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Account Cards Watchlist List */}
      <div className="flex-1 overflow-y-auto divide-y divide-stone-800/60 p-2 space-y-1">
        {filteredAccounts.length === 0 ? (
          <div className="py-12 text-center text-xs text-stone-500">
            <AlertCircle className="w-6 h-6 mx-auto text-stone-600 mb-2" />
            No accounts match search criteria.
          </div>
        ) : (
          filteredAccounts.map((acc) => {
            const isSelected = selectedAccountId === acc.account_id;
            return (
              <div
                key={acc.account_id}
                onClick={() => onSelectAccount(acc)}
                className={`cursor-pointer p-3.5 rounded-2xl transition-all duration-150 group ${
                  isSelected
                    ? "bg-amber-500/15 border border-amber-500/40 shadow-sm"
                    : "hover:bg-stone-800/50 border border-transparent"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-stone-100 group-hover:text-amber-300 transition-colors text-xs leading-snug">
                      {acc.company_name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-stone-400 font-mono">
                      <span>{acc.account_id}</span>
                      <span>•</span>
                      <span>{acc.contract_tier}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${getRiskBadgeClasses(acc.risk_tier)}`}>
                    {(acc.churn_probability * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="mt-2.5 flex items-center justify-between text-[11px]">
                  <div className="text-stone-400">
                    MRR: <strong className="text-stone-200 font-mono">${acc.contract_mrr.toLocaleString()}</strong>
                  </div>
                  <div className="text-red-400 font-mono font-extrabold">
                    -${acc.mrr_at_risk.toLocaleString()} risk
                  </div>
                </div>

                <div className="mt-1.5 flex items-center justify-between text-[10px] text-stone-400 font-mono">
                  <span className={acc.usage_change_pct_30d < 0 ? "text-red-400" : "text-emerald-400"}>
                    {acc.usage_change_pct_30d >= 0 ? "+" : ""}{acc.usage_change_pct_30d}% 30d
                  </span>
                  <span>{acc.days_until_renewal}d renewal</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
