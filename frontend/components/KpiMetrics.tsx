"use client";

import { AlertTriangle, DollarSign, TrendingDown, Users, ArrowUpRight } from "lucide-react";
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
      title: "Monitored Active Portfolio",
      value: formatCurrency(summary.total_portfolio_mrr),
      badge: `${summary.total_accounts} Enterprise Accounts`,
      badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      subtext: `Annual Run-Rate: ${formatCurrency(summary.total_portfolio_mrr * 12)}`,
      icon: Users,
      glowColor: "rgba(245, 158, 11, 0.15)",
      borderColor: "border-amber-500/30",
    },
    {
      title: "Urgent Critical & High Pipeline",
      value: `${summary.critical_risk_count + summary.high_risk_count}`,
      badge: "Action Required",
      badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      subtext: `${summary.critical_risk_count} Critical • ${summary.high_risk_count} High Risk`,
      icon: AlertTriangle,
      glowColor: "rgba(245, 158, 11, 0.15)",
      borderColor: "border-amber-500/30",
    },
    {
      title: "Stable Retention Cohort",
      value: `${summary.low_risk_count + summary.medium_risk_count}`,
      badge: "Healthy Base",
      badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
      subtext: `${summary.low_risk_count} Low Risk • ${summary.medium_risk_count} Moderate`,
      icon: TrendingDown,
      glowColor: "rgba(16, 185, 129, 0.15)",
      borderColor: "border-emerald-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="relative overflow-hidden rounded-2xl bg-[#FFFFFF] p-5 border border-[#E8E5DD] shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-amber-300 hover:shadow-md"
          >
            {/* Top Row */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                {card.title}
              </span>
              <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E8E5DD] text-stone-800 shadow-xs">
                <Icon className="w-4 h-4 text-amber-600" />
              </div>
            </div>

            {/* Value & Badge */}
            <div className="mt-3.5 flex items-baseline justify-between gap-2">
              <div className="text-2xl sm:text-3xl font-mono font-extrabold text-stone-950 tracking-tight">
                {card.value}
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                idx === 0 
                  ? "bg-rose-100 text-rose-800 border-rose-200"
                  : idx === 1 
                  ? "bg-amber-100 text-amber-900 border-amber-200"
                  : idx === 2
                  ? "bg-amber-100 text-amber-800 border-amber-200"
                  : "bg-emerald-100 text-emerald-800 border-emerald-200"
              }`}>
                {card.badge}
              </span>
            </div>

            <p className="mt-2 text-xs text-stone-500 font-medium">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
