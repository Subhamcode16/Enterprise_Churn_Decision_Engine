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
          glow: "rgba(239, 68, 68, 0.4)",
          text: "text-red-400",
          gradient: "from-red-500 to-rose-600",
        };
      case "High":
        return {
          glow: "rgba(249, 115, 22, 0.4)",
          text: "text-orange-400",
          gradient: "from-orange-500 to-amber-600",
        };
      case "Medium":
        return {
          glow: "rgba(245, 158, 11, 0.4)",
          text: "text-amber-400",
          gradient: "from-amber-500 to-yellow-500",
        };
      case "Low":
      default:
        return {
          glow: "rgba(16, 185, 129, 0.4)",
          text: "text-emerald-400",
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
          <filter id="gaugeGlowGold">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="#292524"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Dynamic Filled Arc */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="url(#editorialGaugeGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          filter="url(#gaugeGlowGold)"
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
              fill="#FAF8F5"
              className="drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] transition-all duration-700 ease-out"
            />
          );
        })()}
      </svg>

      {/* Probability Readout */}
      <div className="absolute top-[38%] flex flex-col items-center">
        <span className="text-3xl font-mono font-extrabold text-stone-100 tracking-tighter">
          {(clampedProb * 100).toFixed(1)}%
        </span>
        <span className={`text-[10px] uppercase font-extrabold tracking-widest ${colorConfig.text}`}>
          {riskTier} Churn Risk
        </span>
      </div>
    </div>
  );
}
