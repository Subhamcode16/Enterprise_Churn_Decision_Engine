"use client";

import { useMemo } from "react";
import { RiskTier } from "@/lib/types";
import AnimatedCounter from "@/components/AnimatedCounter";

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
          glow: "rgba(190, 18, 60, 0.2)",
          text: "text-rose-700 font-bold",
          gradient: "from-red-500 to-rose-700",
        };
      case "High":
        return {
          glow: "rgba(140, 58, 39, 0.2)",
          text: "text-[#8C3A27] font-bold",
          gradient: "from-orange-500 to-[#8C3A27]",
        };
      case "Medium":
        return {
          glow: "rgba(35, 83, 71, 0.2)",
          text: "text-[#235347] font-bold",
          gradient: "from-[#8EB69B] to-[#235347]",
        };
      case "Low":
      default:
        return {
          glow: "rgba(35, 83, 71, 0.25)",
          text: "text-[#235347] font-bold",
          gradient: "from-[#DAF1DE] to-[#235347]",
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
            <stop offset="0%" stopColor="#8EB69B" />
            <stop offset="40%" stopColor="#235347" />
            <stop offset="72%" stopColor="#D97706" />
            <stop offset="100%" stopColor="#BE123C" />
          </linearGradient>
        </defs>

        {/* Background Track Arc (Clean Light Gray) */}
        <path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke="#E2EAE4"
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
          className="transition-all duration-700 cubic-bezier(0.22, 1, 0.36, 1)"
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
              fill="#051F20"
              stroke="#FFFFFF"
              strokeWidth={2}
              className="drop-shadow-md transition-all duration-700 cubic-bezier(0.22, 1, 0.36, 1)"
            />
          );
        })()}
      </svg>

      {/* Probability Readout (High-Contrast Bold Dark Numbers with Animated Counter) */}
      <div className="absolute top-[36%] flex flex-col items-center">
        <span className="text-3xl font-mono font-bold text-[#051F20] tracking-tighter">
          <AnimatedCounter value={clampedProb * 100} decimals={1} suffix="%" duration={700} />
        </span>
        <span className={`text-[10px] uppercase font-mono tracking-wider ${colorConfig.text}`}>
          {riskTier} Churn Risk
        </span>
      </div>
    </div>
  );
}
