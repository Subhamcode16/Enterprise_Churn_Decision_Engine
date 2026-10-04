"use client";

import { FeatureDriver } from "@/lib/types";
import { TrendingUp, TrendingDown, HelpCircle, ShieldAlert } from "lucide-react";

interface ShapWaterfallChartProps {
  drivers: FeatureDriver[];
  baseValue: number;
  totalMargin: number;
  predictedProbability: number;
}

export default function ShapWaterfallChart({
  drivers,
  baseValue,
  totalMargin,
  predictedProbability,
}: ShapWaterfallChartProps) {
  // Find max absolute SHAP value for scaling bars
  const maxAbsShap = Math.max(...drivers.map((d) => Math.abs(d.shap_value)), 0.5);

  return (
    <div className="space-y-4 font-sans">
      {/* Summary Header */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#E2EAE4] text-xs shadow-2xs">
        <div>
          <span className="text-stone-500">Baseline Margin: </span>
          <span className="font-mono font-bold text-[#051F20]">{baseValue.toFixed(3)}</span>
        </div>
        <div>
          <span className="text-stone-500">Account Margin: </span>
          <span className="font-mono font-bold text-[#051F20]">{totalMargin.toFixed(3)}</span>
        </div>
        <div>
          <span className="text-stone-500">P(Churn): </span>
          <span className="font-mono font-bold text-[#8C3A27]">
            {(predictedProbability * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Waterfall Feature Contribution Bars */}
      <div className="space-y-2">
        {drivers.map((driver, index) => {
          const isRisk = driver.impact === "increases_risk";
          const widthPct = Math.min((Math.abs(driver.shap_value) / maxAbsShap) * 100, 100);

          return (
            <div
              key={index}
              className="p-3.5 rounded-2xl bg-white border border-[#E2EAE4] hover:border-[#8EB69B] transition-all text-xs space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isRisk ? (
                    <TrendingUp className="w-3.5 h-3.5 text-[#8C3A27] shrink-0" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-[#235347] shrink-0" />
                  )}
                  <span className="font-semibold text-[#051F20]">
                    {driver.display_name}
                  </span>
                  {driver.value !== null && (
                    <span className="px-2 py-0.5 rounded-full bg-[#F4F8F5] border border-[#E2EAE4] text-[10px] font-mono text-[#163832]/70">
                      val: {driver.value}
                    </span>
                  )}
                </div>

                <span
                  className={`font-mono font-bold text-xs ${
                    isRisk ? "text-[#8C3A27]" : "text-[#235347]"
                  }`}
                >
                  {isRisk ? `+${driver.shap_value.toFixed(3)}` : driver.shap_value.toFixed(3)} SHAP
                </span>
              </div>

              {/* Hatched Pill Bar (Matching Reference Pattern) */}
              <div className="h-2.5 rounded-full bg-[#E2EAE4]/60 overflow-hidden flex">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isRisk 
                      ? "bg-[#8C3A27] shadow-2xs" 
                      : "bg-[#235347] pattern-diagonal-stripes"
                  }`}
                  style={{ width: `${Math.max(widthPct, 6)}%` }}
                />
              </div>

              {/* Feature Insight Note */}
              <p className="text-[11px] text-[#163832]/60 leading-snug">
                {driver.insight}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
