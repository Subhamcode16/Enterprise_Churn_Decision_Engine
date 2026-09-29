"use client";

import { useMemo } from "react";
import { ArrowRight, ShieldCheck, AlertTriangle, TrendingDown, Users, Sparkles, CheckCircle2 } from "lucide-react";
import { PortfolioSummary } from "@/lib/types";
import { playTick } from "@/lib/sound";

interface CohortMigrationMatrixProps {
  summary: PortfolioSummary;
  onFilterTier?: (tier: string) => void;
  selectedTier?: string;
}

export default function CohortMigrationMatrix({
  summary,
  onFilterTier,
  selectedTier = "All",
}: CohortMigrationMatrixProps) {
  const tiers = [
    {
      id: "Low",
      label: "Healthy Core",
      count: summary.low_risk_count,
      pct: ((summary.low_risk_count / summary.total_accounts) * 100).toFixed(0),
      desc: "High telemetry usage & stable CSAT (>4.0)",
      color: "border-emerald-200 bg-emerald-50/60 text-emerald-900",
      badge: "bg-emerald-100 text-emerald-800 border-emerald-300",
      status: "Stable Retention",
    },
    {
      id: "Medium",
      label: "Vulnerable Cohort",
      count: summary.medium_risk_count,
      pct: ((summary.medium_risk_count / summary.total_accounts) * 100).toFixed(0),
      desc: "Usage dip >15% or detractor NPS rating",
      color: "border-amber-200 bg-amber-50/60 text-amber-900",
      badge: "bg-amber-100 text-amber-800 border-amber-300",
      status: "Early Warning",
    },
    {
      id: "Critical",
      label: "Acute Risk (P0)",
      count: summary.critical_risk_count + summary.high_risk_count,
      pct: (((summary.critical_risk_count + summary.high_risk_count) / summary.total_accounts) * 100).toFixed(0),
      desc: "Open P1 tickets or renewal <60 days",
      color: "border-rose-200 bg-rose-50/60 text-rose-900",
      badge: "bg-rose-100 text-rose-800 border-rose-300",
      status: "Immediate SLA",
    },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E8E5DD] shadow-2xs space-y-3 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-[#F0ECE1]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-900">
            Portfolio Risk Migration Flow & Cohort Health
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-stone-500">
          <span>Click tier to filter watchlist</span>
        </div>
      </div>

      {/* 3 Tier Stages Flow */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
        {tiers.map((tier, idx) => {
          const isSelected = selectedTier === tier.id;
          return (
            <div
              key={tier.id}
              onClick={() => {
                playTick();
                if (onFilterTier) onFilterTier(isSelected ? "All" : tier.id);
              }}
              className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? "ring-2 ring-stone-900 bg-white border-stone-900 shadow-sm"
                  : `${tier.color} hover:shadow-2xs hover:scale-[1.01]`
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-bold text-stone-900">
                    {tier.label}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${tier.badge}`}>
                    {tier.count} Accounts ({tier.pct}%)
                  </span>
                </div>

                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {tier.desc}
                </p>
              </div>

              <div className="pt-2.5 mt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-mono">
                <span className="font-semibold text-stone-700">{tier.status}</span>
                <span className="text-stone-500 flex items-center gap-0.5">
                  Filter <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
