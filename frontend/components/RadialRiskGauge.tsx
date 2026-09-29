"use client";

import { useMemo } from "react";
import { RiskTier } from "@/lib/types";

interface RadialRiskGaugeProps {
  probability: number;
  riskTier: RiskTier;
  size?: number;
}

export default function RadialRiskGauge({
  probability,
  riskTier,
  size = 170,
}: RadialRiskGaugeProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle (180 deg)
  const clampedProb = Math.min(Math.max(probability, 0), 1);
  const strokeDashoffset = circumference - clampedProb * circumference;

  const colorConfig = useMemo(() => {
    switch (riskTier) {
      case "Critical":
        return {
          glow: "rgba(239, 68, 68, 0.25)",
          text: "text-rose-600 font-bold",
          gradient: "from-red-500 to-rose-600",
        };
      case "High":
        return {
          glow: "rgba(249, 115, 22, 0.25)",
          text: "text-amber-700 font-bold",
          gradient: "from-orange-500 to-amber-600",
        };
      case "Medium":
        return {
          glow: "rgba(245, 158, 11, 0.25)",
          text: "text-stone-700 font-bold",
          gradient: "from-amber-500 to-yellow-500",
        };
      case "Low":
      default:
        return {
          glow: "rgba(16, 185, 129, 0.25)",
          text: "text-emerald-700 font-bold",
          gradient: "from-emerald-400 to-teal-500",
        };
    }
  }, [riskTier]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size * 0.62}
        viewBox={`0 0 ${size} ${size * 0.65}`}
        className="overflow-visible"
      >
        <defs>
          <linearGradient id="editorialGaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="70%" stopColor="#F97316" />
            <stop offset="100%" stopColor="#EF4444" />
          </linearGradient>
        </defs>

        {/* Background Track Arc (Clean Light Gray) */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="#E8E5DD"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Dynamic Filled Colored Arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="url(#editorialGaugeGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />

        {/* Needle / Indicator Dot */}
        {(() => {
          const angle = Math.PI - clampedProb * Math.PI;
          const cx = size / 2 - radius * Math.cos(angle);
          const cy = size / 2 - radius * Math.sin(angle);
          return (
            <circle
              cx={cx}
              cy={cy}
              r={5.5}
              fill="#141312"
              stroke="#FFFFFF"
              strokeWidth={2}
              className="drop-shadow-md transition-all duration-700 ease-out"
            />
          );
        })()}
      </svg>

      {/* Probability Readout (High-Contrast Bold Dark Numbers) */}
      <div className="absolute top-[36%] flex flex-col items-center">
        <span className="text-3xl font-mono font-bold text-stone-900 tracking-tighter">
          {(clampedProb * 100).toFixed(1)}%
        </span>
        <span className={`text-[10px] uppercase font-mono tracking-wider ${colorConfig.text}`}>
          {riskTier} Churn Risk
        </span>
      </div>
    </div>
  );
}
