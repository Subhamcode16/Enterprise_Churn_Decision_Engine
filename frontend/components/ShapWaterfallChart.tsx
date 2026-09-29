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
      <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
        <div>
          <span className="text-slate-400">Baseline Portfolio Margin: </span>
          <span className="font-mono font-bold text-slate-200">{baseValue.toFixed(3)}</span>
        </div>
        <div>
          <span className="text-slate-400">Account Risk Margin: </span>
          <span className="font-mono font-bold text-indigo-300">{totalMargin.toFixed(3)}</span>
        </div>
        <div>
          <span className="text-slate-400">Model Probability: </span>
          <span className="font-mono font-bold text-red-400">{(predictedProbability * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Feature Attribution Bars */}
      <div className="space-y-3">
        {drivers.map((driver, idx) => {
          const isRiskElevating = driver.impact === "increases_risk";
          const barWidthPercent = Math.min(Math.round((driver.abs_importance / maxAbsShap) * 100), 100);

          return (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#090D16]/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2">
                  {isRiskElevating ? (
                    <TrendingUp className="w-4 h-4 text-red-400 shrink-0" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-200">
                    {driver.display_name}
                  </span>
                  {driver.value !== null && driver.value !== undefined && (
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                      val: {String(driver.value)}
                    </span>
                  )}
                </div>

                <div className="font-mono font-bold text-xs flex items-center gap-1">
                  <span
                    className={
                      isRiskElevating ? "text-red-400" : "text-emerald-400"
                    }
                  >
                    {driver.shap_value > 0 ? "+" : ""}
                    {driver.shap_value.toFixed(3)} SHAP
                  </span>
                </div>
              </div>

              {/* Visual Relative Bar */}
              <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden flex">
                {isRiskElevating ? (
                  <div
                    style={{ width: `${barWidthPercent}%` }}
                    className="h-full bg-gradient-to-r from-red-500 to-rose-400 rounded-full"
                  />
                ) : (
                  <div
                    style={{ width: `${barWidthPercent}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  />
                )}
              </div>

              {/* Natural Language Diagnostic Insight */}
              <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                {driver.insight}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
