"use client";

import { useState } from "react";
import { AccountRecord } from "@/lib/types";
import { formatCurrency, getRiskBadgeClasses } from "@/lib/utils";
import { playTick, playExecute } from "@/lib/sound";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Bot, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Send
} from "lucide-react";

interface RenewalTimelineRailProps {
  accounts: AccountRecord[];
  onSelectAccount: (account: AccountRecord) => void;
  selectedAccountId?: string;
  onOpenCopilot: () => void;
}

export default function RenewalTimelineRail({
  accounts,
  onSelectAccount,
  selectedAccountId,
  onOpenCopilot,
}: RenewalTimelineRailProps) {
  // Sort accounts by urgency of renewal (closest first)
  const sortedAccounts = [...accounts]
    .sort((a, b) => a.days_until_renewal - b.days_until_renewal)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Calendar Timeline Widget (Intelly style) */}
      <div className="bg-[#FFFFFF] border border-[#E8E5DD] rounded-2xl p-5 shadow-sm space-y-4">
        {/* Month Selector Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-stone-600" />
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">
              Renewal Horizon
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-stone-700 bg-stone-100 px-2 py-1 rounded-lg">
            <span>Q3 2026</span>
          </div>
        </div>

        {/* Mini Day Strip */}
        <div className="grid grid-cols-7 gap-1 text-center py-2 border-y border-[#F0ECE1]">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i} className="text-[10px] font-mono text-stone-400 font-bold">
              {d}
            </span>
          ))}
          {[24, 25, 26, 27, 28, 29, 30].map((day, idx) => (
            <div
              key={idx}
              className={`py-1 rounded-md text-xs font-mono font-medium ${
                day === 30
                  ? "bg-[#141312] text-[#FAF8F5] font-bold shadow-sm"
                  : day === 28
                  ? "bg-[#FFE8E8] text-[#8E2424] font-bold"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Timeline Items */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-stone-400 px-0.5">
            <span>Critical Accounts</span>
            <span>Horizon</span>
          </div>

          <div className="space-y-2">
            {sortedAccounts.map((acc) => {
              const isSelected = acc.account_id === selectedAccountId;
              return (
                <div
                  key={acc.account_id}
                  onClick={() => {
                    playTick();
                    onSelectAccount(acc);
                  }}
                  className={`cursor-pointer p-3 rounded-xl border transition-all text-xs flex items-center justify-between ${
                    isSelected
                      ? "bg-[#FFF9EA] border-[#FFE28A] shadow-sm"
                      : "bg-[#FBF9F5] border-[#EFECE4] hover:border-stone-400 hover:bg-white"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-stone-900 truncate max-w-[140px]">
                      {acc.company_name}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      {formatCurrency(acc.contract_mrr)}/mo • {acc.contract_tier}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      acc.risk_tier === "Critical" 
                        ? "bg-rose-100 text-rose-700" 
                        : "bg-amber-100 text-amber-800"
                    }`}>
                      {acc.days_until_renewal}d left
                    </span>
                    <div className="text-[10px] font-mono font-bold text-stone-600">
                      {(acc.churn_probability * 100).toFixed(0)}% Risk
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Embedded Decision Copilot Card */}
      <div className="bg-[#141312] text-[#FAF8F5] rounded-2xl p-5 shadow-lg border border-[#2B2926] space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-stone-950 font-bold">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#FAF8F5]">
                ML Decision Copilot
              </h4>
              <p className="text-[10px] text-stone-400">
                XGBoost & TreeSHAP Assistant
              </p>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
        </div>

        <p className="text-xs text-stone-300 leading-relaxed font-sans">
          Ask for root-cause explainability, run counterfactual simulations, or dispatch automated retention protocols.
        </p>

        <button
          onClick={() => {
            playTick();
            onOpenCopilot();
          }}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold transition-all shadow-glowGold flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch Copilot Chat</span>
        </button>
      </div>
    </div>
  );
}
