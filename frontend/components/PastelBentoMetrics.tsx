"use client";

import { PortfolioSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Clock } from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";
import CardTilt from "@/components/CardTilt";

interface PastelBentoMetricsProps {
  summary: PortfolioSummary;
}

export default function PastelBentoMetrics({ summary }: PastelBentoMetricsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* 1. Canary Yellow Bento Card: Expected Loss with Vertical Mini Bars */}
      <CardTilt maxTilt={4} glare={true} className="rounded-2xl">
        <div className="bento-card-subtle bg-[#FFF7D1] border border-[#FFE885] p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group h-full">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#7A5800]">
                Expected Monthly Loss
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFEFA8] text-[#7A5800] border border-[#FFE270] transition-transform duration-200 group-hover:scale-105">
                <AnimatedCounter value={summary.portfolio_risk_pct} decimals={1} suffix="% Risk" />
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-[#382700] tracking-tight font-sans">
              <AnimatedCounter prefix="$" value={summary.total_mrr_at_risk} decimals={0} />
            </div>
            <p className="text-xs text-[#7A5800]/80 mt-1 font-medium">
              Calculated P(Churn) × Contract Value
            </p>
          </div>

          {/* Mini SVG Vertical Bars with Staggered Hover Effect */}
          <div className="mt-4 pt-3 border-t border-[#FFECA0] flex items-end justify-between gap-1.5 h-12">
            {[35, 60, 45, 95, 75, 40, 85].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className="w-full rounded-sm bg-[#E0A800] group-hover:bg-[#C99600] transition-all duration-300"
                  style={{ height: `${h}%`, transitionDelay: `${i * 35}ms` }}
                />
              </div>
            ))}
          </div>
        </div>
      </CardTilt>

      {/* 2. Soft Rose Bento Card: Critical Risk with Waveform Trend Line */}
      <CardTilt maxTilt={4} glare={true} className="rounded-2xl">
        <div className="bento-card-subtle bg-[#FFE9E9] border border-[#FFC2C2] p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group h-full">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#8E2424]">
                Urgent Pipeline
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFD1D1] text-[#8E2424] border border-[#FFA8A8] animate-pulse">
                Action Required
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-[#470B0B] tracking-tight font-sans">
              <AnimatedCounter value={summary.critical_risk_count + summary.high_risk_count} decimals={0} />{" "}
              <span className="text-sm font-normal text-[#8E2424]">Accounts</span>
            </div>
            <p className="text-xs text-[#8E2424]/80 mt-1 font-medium">
              {summary.critical_risk_count} Critical • {summary.high_risk_count} High Risk
            </p>
          </div>

          {/* Mini Smooth Waveform SVG Curve with Hover Pulse */}
          <div className="mt-4 pt-3 border-t border-[#FFD8D8] flex items-center justify-center h-12">
            <svg className="w-full h-10 overflow-visible" viewBox="0 0 200 40">
              <path
                d="M 0 30 Q 30 10, 60 25 T 120 15 T 160 5 T 200 20"
                fill="none"
                stroke="#D63838"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-all duration-300 group-hover:stroke-width-3"
              />
              <circle cx="160" cy="5" r="3.5" fill="#D63838" className="animate-ping origin-center" />
              <circle cx="160" cy="5" r="3.5" fill="#D63838" />
            </svg>
          </div>
        </div>
      </CardTilt>

      {/* 3. Sage Green Bento Card: Active Portfolio with Status Ratio Pills */}
      <CardTilt maxTilt={4} glare={true} className="rounded-2xl">
        <div className="bento-card-subtle bg-[#EAF5E8] border border-[#C1E7BC] p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group h-full">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#235E23]">
                Active Enterprise Base
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D6EED2] text-[#235E23] border border-[#B1E1AA]">
                Healthy Core
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-[#0D300D] tracking-tight font-sans">
              <AnimatedCounter prefix="$" value={summary.total_portfolio_mrr} decimals={0} />
            </div>
            <p className="text-xs text-[#235E23]/80 mt-1 font-medium">
              <AnimatedCounter value={summary.total_accounts} decimals={0} /> Monitored Contracts
            </p>
          </div>

          {/* Breakdown Ratio Pills */}
          <div className="mt-4 pt-3 border-t border-[#D5EDD0] flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FFFFFF]/80 text-[#235E23] border border-[#C1E7BC] transition-transform group-hover:scale-105">
              {summary.low_risk_count} Stable
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FFFFFF]/80 text-[#7A5800] border border-[#FFE885] transition-transform group-hover:scale-105">
              {summary.medium_risk_count} Fair
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[#FFFFFF]/80 text-[#8E2424] border border-[#FFC2C2] transition-transform group-hover:scale-105">
              {summary.critical_risk_count} Critical
            </span>
          </div>
        </div>
      </CardTilt>

      {/* 4. Lavender Blue Bento Card: SLA & Protocol Dispatch */}
      <CardTilt maxTilt={4} glare={true} className="rounded-2xl">
        <div className="bento-card-subtle bg-[#EDF0FF] border border-[#CCD4FF] p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden group h-full">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold text-[#2C3D8F]">
                Response Target SLA
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCE2FF] text-[#2C3D8F] border border-[#B8C4FF]">
                Deterministic
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-[#111A4D] tracking-tight font-sans">
              4.0 <span className="text-sm font-normal text-[#2C3D8F]">Hours SLA</span>
            </div>
            <p className="text-xs text-[#2C3D8F]/80 mt-1 font-medium">
              Automated Retention Workflow Engine
            </p>
          </div>

          {/* Protocol tags */}
          <div className="mt-4 pt-3 border-t border-[#DCE2FF] flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-[11px] text-[#2C3D8F] font-medium">
              <Clock className="w-3.5 h-3.5 animate-spin text-[#2C3D8F]" style={{ animationDuration: "10s" }} />
              <span>P0 Target: <strong>4 Hours</strong></span>
            </div>
            <span className="text-[10px] font-mono font-bold text-[#2C3D8F] bg-[#FFFFFF]/80 px-2 py-0.5 rounded-md border border-[#CCD4FF]">
              6 Playbooks
            </span>
          </div>
        </div>
      </CardTilt>
    </div>
  );
}
