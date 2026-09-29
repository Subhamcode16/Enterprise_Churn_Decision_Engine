"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle, CheckCircle2, TrendingDown, Zap } from "lucide-react";
import { AccountRecord } from "@/lib/types";

interface LiveTelemetryTickerProps {
  accounts: AccountRecord[];
  onSelectAccount?: (account: AccountRecord) => void;
}

export default function LiveTelemetryTicker({ accounts, onSelectAccount }: LiveTelemetryTickerProps) {
  const [tickerIndex, setTickerIndex] = useState(0);

  const events = accounts.slice(0, 8).map((acc) => {
    if (acc.risk_tier === "Critical") {
      return {
        id: acc.account_id,
        account: acc,
        type: "critical",
        icon: AlertTriangle,
        color: "text-red-400 bg-red-500/10 border-red-500/30",
        message: `${acc.company_name} (${acc.account_id}) flagged for Critical Churn Risk (${(acc.churn_probability * 100).toFixed(0)}%) • $${acc.mrr_at_risk.toLocaleString()} at risk`,
      };
    } else if (acc.open_p1_tickets > 0) {
      return {
        id: acc.account_id,
        account: acc,
        type: "p1",
        icon: Activity,
        color: "text-orange-400 bg-orange-500/10 border-orange-500/30",
        message: `${acc.company_name}: ${acc.open_p1_tickets} active P1 critical support escalation(s) impacting CSAT`,
      };
    } else if (acc.usage_change_pct_30d < -20) {
      return {
        id: acc.account_id,
        account: acc,
        type: "usage",
        icon: TrendingDown,
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        message: `${acc.company_name}: 30-day telemetry dropped by ${Math.abs(acc.usage_change_pct_30d)}% • TAM outreach queued`,
      };
    } else {
      return {
        id: acc.account_id,
        account: acc,
        type: "healthy",
        icon: CheckCircle2,
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        message: `${acc.company_name}: High engagement & 100% renewal likelihood (${acc.days_until_renewal}d remaining)`,
      };
    }
  });

  useEffect(() => {
    if (events.length === 0) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % events.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [events.length]);

  if (events.length === 0) return null;

  const currentEvent = events[tickerIndex];
  const Icon = currentEvent.icon;

  return (
    <div
      onClick={() => onSelectAccount && onSelectAccount(currentEvent.account)}
      className="cursor-pointer group relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/70 backdrop-blur-xl px-4 py-2 flex items-center justify-between text-xs transition-all hover:border-indigo-500/50"
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        <span className="flex items-center gap-1 font-mono font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          <Zap className="w-3 h-3 text-indigo-400 animate-bounce" />
          Live Telemetry
        </span>

        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-all ${currentEvent.color}`}>
          <Icon className="w-3 h-3" />
          {currentEvent.message}
        </span>
      </div>

      <span className="hidden sm:inline text-[10px] text-slate-500 group-hover:text-slate-300 font-mono transition-colors">
        Click to Inspect →
      </span>
    </div>
  );
}
