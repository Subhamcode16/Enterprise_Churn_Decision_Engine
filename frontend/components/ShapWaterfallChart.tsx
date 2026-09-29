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
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EFECE4] text-xs">
        <div>
          <span className="text-stone-500">Baseline Margin: </span>
          <span className="font-mono font-bold text-stone-800">{baseValue.toFixed(3)}</span>
        </div>
        <div>
          <span className="text-stone-500">Account Margin: </span>
          <span className="font-mono font-bold text-stone-900">{totalMargin.toFixed(3)}</span>
        </div>
        <div>
          <span className="text-stone-500">P(Churn): </span>
          <span className="font-mono font-bold text-rose-600">
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
              className="p-3 rounded-xl bg-white border border-[#E8E5DD] hover:border-stone-400 transition-all text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isRisk ? (
                    <TrendingUp className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                  <span className="font-semibold text-stone-900">
                    {driver.display_name}
                  </span>
                  {driver.value !== null && (
                    <span className="px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-[10px] font-mono text-stone-700">
                      val: {driver.value}
                    </span>
                  )}
                </div>

                <span
                  className={`font-mono font-bold text-xs ${
                    isRisk ? "text-rose-600" : "text-emerald-700"
                  }`}
                >
                  {isRisk ? `+${driver.shap_value.toFixed(3)}` : driver.shap_value.toFixed(3)} SHAP
                </span>
              </div>

              {/* Bar */}
              <div className="h-2 rounded-full bg-[#F0ECE1] overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    isRisk ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.max(widthPct, 4)}%` }}
                />
              </div>

              {/* Feature Insight Note */}
              <p className="text-[11px] text-stone-500 leading-snug">
                {driver.insight}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
