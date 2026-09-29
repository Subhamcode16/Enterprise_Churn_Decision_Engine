"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { AccountRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { playTick } from "@/lib/sound";
import SkeletonPulse from "@/components/SkeletonPulse";

interface RiskTableProps {
  accounts: AccountRecord[];
  onSelectAccount: (account: AccountRecord) => void;
  selectedAccountId?: string;
  loading?: boolean;
}

export default function RiskTable({
  accounts,
  onSelectAccount,
  selectedAccountId,
  loading = false,
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
    <div className="bg-[#FFFFFF] border border-[#E8E5DD] rounded-2xl shadow-sm overflow-hidden flex flex-col h-[740px]">
      {/* Search & Tier Filters Header (Finexy Style) */}
      <div className="p-4 border-b border-[#EFECE4] space-y-3 bg-[#FAF8F5]">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search enterprise accounts or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white border border-[#E2DFD6] text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-stone-800 transition-all font-sans"
          />
        </div>

        {/* Tier Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-[#EFECE4] text-[11px] font-medium">
          {["All", "Critical", "High", "Medium", "Low"].map((tier) => (
            <button
              key={tier}
              onClick={() => {
                playTick();
                setSelectedTier(tier);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedTier === tier
                  ? "bg-[#141312] text-[#FAF8F5] font-bold shadow-sm"
                  : "text-stone-600 hover:text-stone-900 hover:bg-white/60"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Account List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#F0ECE1]">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="p-3 bg-[#FAF8F5] rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-2 flex-1">
                  <SkeletonPulse className="h-4 w-32 rounded" />
                  <SkeletonPulse className="h-3 w-24 rounded" />
                </div>
                <div className="space-y-2 flex flex-col items-end">
                  <SkeletonPulse className="h-4 w-16 rounded-full" />
                  <SkeletonPulse className="h-3 w-12 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          filteredAccounts.map((account) => {
            const isSelected = account.account_id === selectedAccountId;
            return (
              <div
                key={account.account_id}
                onClick={() => {
                  playTick();
                  onSelectAccount(account);
                }}
                className={`p-3.5 transition-all duration-150 cursor-pointer flex items-center justify-between text-left ${
                  isSelected
                    ? "bg-[#FFF9EA] border-l-4 border-l-amber-500 scale-[1.002] shadow-sm"
                    : "hover:bg-[#FAF8F5] hover:pl-4"
                }`}
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-stone-900 truncate max-w-[150px]">
                      {account.company_name}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      {account.account_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono">
                    <span>MRR: <strong className="text-stone-800 font-semibold">{formatCurrency(account.contract_mrr)}</strong></span>
                    <span>•</span>
                    <span className={account.usage_change_pct_30d < 0 ? "text-rose-600 font-semibold" : "text-emerald-700"}>
                      {account.usage_change_pct_30d > 0 ? "+" : ""}{account.usage_change_pct_30d.toFixed(0)}% 30d
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-transform hover:scale-105 ${
                    account.risk_tier === "Critical"
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : account.risk_tier === "High"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : account.risk_tier === "Medium"
                      ? "bg-stone-100 text-stone-700 border border-stone-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}>
                    {(account.churn_probability * 100).toFixed(0)}% Risk
                  </span>

                  <div className="text-[11px] font-mono font-bold text-rose-600">
                    {formatCurrency(account.mrr_at_risk)} loss
                  </div>
                </div>
              </div>
            );
          })
        )}

        {!loading && filteredAccounts.length === 0 && (
          <div className="p-8 text-center text-xs text-stone-400">
            No accounts found matching filter.
          </div>
        )}
      </div>
    </div>
  );
}
