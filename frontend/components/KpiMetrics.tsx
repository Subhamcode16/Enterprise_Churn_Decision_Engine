"use client";

import { AlertTriangle, DollarSign, TrendingDown, Users, ShieldAlert, ArrowUpRight } from "lucide-react";
import { PortfolioSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface KpiMetricsProps {
  summary: PortfolioSummary;
}

export default function KpiMetrics({ summary }: KpiMetricsProps) {
  const cards = [
    {
      title: "Expected Monthly Loss (MRR)",
      value: formatCurrency(summary.total_mrr_at_risk),
      badge: `${summary.portfolio_risk_pct.toFixed(1)}% Portfolio Risk`,
      badgeColor: "bg-red-500/15 text-red-400 border-red-500/30",
      subtext: "Quantified P(Churn) × Contract Value",
      icon: DollarSign,
      glowColor: "rgba(239, 68, 68, 0.15)",
      borderColor: "border-red-500/30",
    },
    {
      title: "Active Monitored ARR / MRR",
      value: formatCurrency(summary.total_portfolio_mrr),
      badge: `${summary.total_accounts} Accounts`,
      badgeColor: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
      subtext: `ARR: ${formatCurrency(summary.total_portfolio_mrr * 12)}`,
      icon: Users,
      glowColor: "rgba(99, 102, 241, 0.15)",
      borderColor: "border-indigo-500/30",
    },
    {
      title: "Critical & High Risk Pipeline",
      value: `${summary.critical_risk_count + summary.high_risk_count}`,
      badge: "Action Required",
      badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      subtext: `${summary.critical_risk_count} Critical • ${summary.high_risk_count} High Risk accounts`,
      icon: AlertTriangle,
      glowColor: "rgba(245, 158, 11, 0.15)",
      borderColor: "border-amber-500/30",
    },
    {
      title: "Retention & Expansion Base",
      value: `${summary.low_risk_count + summary.medium_risk_count}`,
      badge: "Healthy Base",
      badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      subtext: `${summary.low_risk_count} Low Risk • ${summary.medium_risk_count} Stable`,
      icon: TrendingDown,
      glowColor: "rgba(16, 185, 129, 0.15)",
      borderColor: "border-emerald-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            style={{
              boxShadow: `0 10px 30px -10px ${card.glowColor}`,
            }}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#131B2E] via-[#0F1626] to-[#0A0E1A] p-5 border ${card.borderColor} backdrop-blur-xl transition-all duration-200 hover:-translate-y-1 hover:border-slate-600`}
          >
            {/* Top Row */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {card.title}
              </span>
              <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Value & Badge */}
            <div className="mt-4 flex items-baseline justify-between gap-2">
              <div className="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-tight">
                {card.value}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>

            <p className="mt-2 text-xs text-slate-400 font-medium">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
