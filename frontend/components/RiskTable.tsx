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
  const [quickFilter, setQuickFilter] = useState<"none" | "high_mrr" | "near_renewal" | "p1_open">("none");

  const filteredAccounts = useMemo(() => {
    return accounts
      .filter((acc) => {
        const matchesSearch =
          acc.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          acc.account_id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTier = selectedTier === "All" || acc.risk_tier === selectedTier;
        
        let matchesQuick = true;
        if (quickFilter === "high_mrr") matchesQuick = acc.contract_mrr >= 15000;
        if (quickFilter === "near_renewal") matchesQuick = acc.days_until_renewal <= 45;
        if (quickFilter === "p1_open") matchesQuick = acc.open_p1_tickets > 0;

        return matchesSearch && matchesTier && matchesQuick;
      })
      .sort((a, b) => b.mrr_at_risk - a.mrr_at_risk);
  }, [accounts, searchQuery, selectedTier, quickFilter]);

  return (
    <div className="bg-[#FFFFFF] border border-[#E2EAE4] rounded-[28px] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] overflow-hidden flex flex-col h-[740px] font-sans">
      {/* Search & Tier Filters Header */}
      <div className="p-4 border-b border-[#F0F4F1] space-y-3 bg-[#F4F8F5]/60">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search enterprise accounts or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-full bg-white border border-[#E2EAE4] text-xs text-[#051F20] placeholder:text-stone-400 focus:outline-none focus:border-[#235347] transition-all font-sans shadow-2xs"
          />
        </div>

        {/* Quick Triage Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[10px] font-mono">
          <button
            onClick={() => {
              playTick();
              setQuickFilter("none");
            }}
            className={`px-3 py-1 rounded-full border transition-all ${
              quickFilter === "none"
                ? "bg-[#051F20] text-white border-[#051F20] font-bold"
                : "bg-white text-stone-600 border-[#E2EAE4] hover:bg-[#F4F8F5]"
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              playTick();
              setQuickFilter(quickFilter === "high_mrr" ? "none" : "high_mrr");
            }}
            className={`px-3 py-1 rounded-full border transition-all whitespace-nowrap ${
              quickFilter === "high_mrr"
                ? "bg-[#235347] text-white border-[#235347] font-bold"
                : "bg-white text-stone-600 border-[#E2EAE4] hover:bg-[#F4F8F5]"
            }`}
          >
            ARR &gt; $15k
          </button>
          <button
            onClick={() => {
              playTick();
              setQuickFilter(quickFilter === "near_renewal" ? "none" : "near_renewal");
            }}
            className={`px-3 py-1 rounded-full border transition-all whitespace-nowrap ${
              quickFilter === "near_renewal"
                ? "bg-rose-500 text-white border-rose-600 font-bold"
                : "bg-white text-stone-600 border-[#E2EAE4] hover:bg-[#F4F8F5]"
            }`}
          >
            Renewal &lt; 45d
          </button>
          <button
            onClick={() => {
              playTick();
              setQuickFilter(quickFilter === "p1_open" ? "none" : "p1_open");
            }}
            className={`px-3 py-1 rounded-full border transition-all whitespace-nowrap ${
              quickFilter === "p1_open"
                ? "bg-rose-500 text-white border-rose-600 font-bold"
                : "bg-white text-stone-600 border-[#E2EAE4] hover:bg-[#F4F8F5]"
            }`}
          >
            P1 Open
          </button>
        </div>

        {/* Tier Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-[#E2EAE4]/60 text-[11px] font-medium">
          {["All", "Critical", "High", "Medium", "Low"].map((tier) => (
            <button
              key={tier}
              onClick={() => {
                playTick();
                setSelectedTier(tier);
              }}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                selectedTier === tier
                  ? "bg-[#235347] text-white font-bold shadow-xs"
                  : "text-[#163832]/70 hover:text-[#051F20] hover:bg-white/80"
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Account List */}
      <div className="flex-1 overflow-y-auto divide-y divide-[#E2EAE4]/60">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="p-3 bg-[#F4F8F5] rounded-xl flex items-center justify-between gap-3">
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
                    ? "bg-[#DAF1DE]/40 border-l-[3.5px] border-l-[#235347] scale-[1.002] shadow-xs"
                    : "hover:bg-[#F4F8F5] hover:pl-4"
                }`}
              >
                <div className="space-y-1 min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-[#051F20] truncate max-w-[150px]">
                      {account.company_name}
                    </span>
                    <span className="text-[10px] font-mono text-[#163832]/60">
                      {account.account_id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#163832]/70 font-mono">
                    <span>MRR: <strong className="text-[#051F20] font-semibold">{formatCurrency(account.contract_mrr)}</strong></span>
                    <span>•</span>
                    <span className={account.usage_change_pct_30d < 0 ? "text-rose-600 font-semibold" : "text-[#235347]"}>
                      {account.usage_change_pct_30d > 0 ? "+" : ""}{account.usage_change_pct_30d.toFixed(0)}% 30d
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0 space-y-1">
                  <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-full transition-transform hover:scale-105 ${
                    account.risk_tier === "Critical"
                      ? "bg-rose-50 text-rose-800 border border-rose-200/80"
                      : account.risk_tier === "High"
                      ? "bg-[#FAF0E6] text-[#8C3A27] border border-[#E8C4B8]"
                      : account.risk_tier === "Medium"
                      ? "bg-[#DAF1DE]/70 text-[#0B2B26] border border-[#8EB69B]/40"
                      : "bg-[#DAF1DE] text-[#051F20] border border-[#8EB69B]/60"
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
