"use client";

import { useState } from "react";
import { AccountRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { playTick, playExecute } from "@/lib/sound";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Bot, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  ShieldAlert,
  AlertTriangle
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
  const [dispatchedMap, setDispatchedMap] = useState<Record<string, boolean>>({});

  // Sort accounts by urgency of renewal (closest first)
  const sortedAccounts = [...accounts]
    .sort((a, b) => a.days_until_renewal - b.days_until_renewal)
    .slice(0, 5);

  const handleQuickDispatch = (e: React.MouseEvent, accId: string) => {
    e.stopPropagation();
    playExecute();
    setDispatchedMap((prev) => ({ ...prev, [accId]: true }));
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Calendar Timeline Widget (Intelly & Finexy style) */}
      <div className="bg-[#FFFFFF] border border-[#E8E5DD] rounded-2xl p-5 shadow-sm space-y-4">
        {/* Month Selector Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-stone-600" />
            <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider font-mono">
              Renewal Horizon
            </h3>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-lg border border-stone-200">
            <span>Q3 2026 Horizon</span>
          </div>
        </div>

        {/* Mini Day Strip with Active P0 Horizon Highlighting */}
        <div className="grid grid-cols-7 gap-1 text-center py-2 border-y border-[#F0ECE1]">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i} className="text-[10px] font-mono text-stone-400 font-bold">
              {d}
            </span>
          ))}
          {[24, 25, 26, 27, 28, 29, 30].map((day, idx) => (
            <div
              key={idx}
              className={`py-1 rounded-md text-xs font-mono font-medium transition-all ${
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
            <span>Expiring Contracts</span>
            <span>Horizon</span>
          </div>

          <div className="space-y-2">
            {sortedAccounts.map((acc) => {
              const isSelected = acc.account_id === selectedAccountId;
              const isDispatched = dispatchedMap[acc.account_id];
              return (
                <div
                  key={acc.account_id}
                  onClick={() => {
                    playTick();
                    onSelectAccount(acc);
                  }}
                  className={`cursor-pointer p-3 rounded-xl border transition-all text-xs flex items-center justify-between group ${
                    isSelected
                      ? "bg-[#FFF9EA] border-[#FFE28A] shadow-sm ring-1 ring-[#FFE28A]"
                      : "bg-[#FBF9F5] border-[#EFECE4] hover:border-stone-400 hover:bg-white"
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="font-semibold text-stone-900 truncate max-w-[135px]">
                      {acc.company_name}
                    </div>
                    <div className="text-[10px] text-stone-500 font-mono">
                      {formatCurrency(acc.contract_mrr)} • {acc.contract_tier}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      acc.risk_tier === "Critical" 
                        ? "bg-rose-100 text-rose-700 border border-rose-200" 
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}>
                      {acc.days_until_renewal}d left
                    </span>

                    {isDispatched ? (
                      <span className="text-[9px] font-mono text-emerald-700 font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Sent
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleQuickDispatch(e, acc.account_id)}
                        className="text-[9px] font-mono text-stone-500 hover:text-stone-950 font-semibold underline"
                        title="Fast-dispatch protocol"
                      >
                        ⚡ Escalate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
