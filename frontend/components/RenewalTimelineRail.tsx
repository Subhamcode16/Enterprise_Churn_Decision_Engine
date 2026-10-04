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
      {/* Calendar Timeline Widget (Forest Emerald Aesthetic) */}
      <div className="bg-white border border-[#E2EAE4] rounded-[28px] p-5 shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-4">
        {/* Month Selector Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#DAF1DE] border border-[#8EB69B]/40 flex items-center justify-center text-[#0B2B26]">
              <CalendarIcon className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-[#051F20] uppercase tracking-wider font-mono">
              Renewal Horizon
            </h3>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-[#051F20] bg-[#F4F8F5] px-2.5 py-1 rounded-full border border-[#E2EAE4]">
            <span>Q3 Horizon</span>
          </div>
        </div>

        {/* Mini Day Strip with Active P0 Horizon Highlighting */}
        <div className="grid grid-cols-7 gap-1 text-center py-2.5 border-y border-[#E2EAE4]">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i} className="text-[10px] font-mono text-[#163832]/50 font-bold">
              {d}
            </span>
          ))}
          {[24, 25, 26, 27, 28, 29, 30].map((day, idx) => (
            <div
              key={idx}
              className={`py-1.5 rounded-xl text-xs font-mono font-medium transition-all flex flex-col items-center justify-center ${
                day === 30
                  ? "bg-[#235347] text-white font-bold shadow-xs scale-105"
                  : day === 28
                  ? "bg-rose-50 text-rose-700 font-bold border border-rose-200/60"
                  : "text-[#163832]/70 hover:bg-[#F4F8F5]"
              }`}
            >
              <span>{day}</span>
              {day === 28 && <span className="w-1 h-1 rounded-full bg-rose-500 mt-0.5" />}
              {day === 30 && <span className="w-1 h-1 rounded-full bg-[#DAF1DE] mt-0.5" />}
            </div>
          ))}
        </div>

        {/* Timeline Items */}
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center justify-between text-[11px] font-mono font-bold uppercase tracking-wider text-[#163832]/60 px-0.5">
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
                  className={`cursor-pointer p-3.5 rounded-2xl border transition-all text-xs flex items-center justify-between group ${
                    isSelected
                      ? "bg-[#DAF1DE]/40 border-[#235347] shadow-xs ring-1 ring-[#235347]/20"
                      : "bg-[#F4F8F5] border-[#E2EAE4] hover:border-[#8EB69B]/60 hover:bg-white"
                  }`}
                >
                  <div className="space-y-0.5 min-w-0 pr-2">
                    <div className="font-semibold text-[#051F20] truncate max-w-[135px]">
                      {acc.company_name}
                    </div>
                    <div className="text-[10px] text-[#163832]/70 font-mono">
                      {formatCurrency(acc.contract_mrr)} • {acc.contract_tier}
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      acc.risk_tier === "Critical" 
                        ? "bg-rose-50 text-rose-700 border border-rose-200" 
                        : "bg-[#DAF1DE] text-[#0B2B26] border border-[#8EB69B]/40"
                    }`}>
                      {acc.days_until_renewal}d left
                    </span>

                    {isDispatched ? (
                      <span className="text-[9px] font-mono text-[#235347] font-bold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Sent
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleQuickDispatch(e, acc.account_id)}
                        className="text-[9px] font-mono text-[#235347] hover:text-[#051F20] font-semibold underline cursor-pointer"
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
