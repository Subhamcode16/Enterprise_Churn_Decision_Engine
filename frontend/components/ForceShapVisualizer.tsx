"use client";

import { FeatureDriver } from "@/lib/types";
import { TrendingUp, TrendingDown, Zap, ShieldCheck } from "lucide-react";

interface ForceShapVisualizerProps {
  drivers: FeatureDriver[];
  baseValue: number;
  totalMargin: number;
  predictedProbability: number;
}

export default function ForceShapVisualizer({
  drivers,
  baseValue,
  totalMargin,
  predictedProbability,
}: ForceShapVisualizerProps) {
  const positiveDrivers = drivers.filter((d) => d.impact === "increases_risk");
  const negativeDrivers = drivers.filter((d) => d.impact === "decreases_risk");

  const totalPush = positiveDrivers.reduce((acc, d) => acc + Math.abs(d.shap_value), 0);
  const totalPull = negativeDrivers.reduce((acc, d) => acc + Math.abs(d.shap_value), 0);
  const sumForces = totalPush + totalPull || 1;
  const pushRatio = (totalPush / sumForces) * 100;
  const pullRatio = (totalPull / sumForces) * 100;

  return (
    <div className="space-y-4">
      {/* Central Force Balance Gauge Bar (Light Bento Style) */}
      <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EFECE4] space-y-2.5">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-emerald-700 flex items-center gap-1 font-mono">
            <TrendingDown className="w-3.5 h-3.5" /> Retention Forces ({negativeDrivers.length})
          </span>
          <span className="text-stone-500 font-mono text-[11px]">
            Base Margin: <strong className="text-stone-800">{baseValue.toFixed(2)}</strong> → Risk Margin: <strong className="text-stone-900">{totalMargin.toFixed(2)}</strong>
          </span>
          <span className="text-rose-600 flex items-center gap-1 font-mono">
            <TrendingUp className="w-3.5 h-3.5" /> Churn Pressures ({positiveDrivers.length})
          </span>
        </div>

        {/* Dynamic Force Balance Bar */}
        <div className="relative w-full h-3.5 rounded-full bg-[#E8E5DD] overflow-hidden flex shadow-inner">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${pullRatio}%` }}
            title={`Retention Force: ${pullRatio.toFixed(1)}%`}
          />
          <div
            className="h-full bg-rose-500 transition-all duration-500"
            style={{ width: `${pushRatio}%` }}
            title={`Churn Pressure: ${pushRatio.toFixed(1)}%`}
          />
        </div>
      </div>

      {/* Two Column Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
        {/* Top Churn Accelerators */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold text-rose-700 px-1">
            <span>Churn Accelerators</span>
            <span>SHAP Impact</span>
          </div>
          <div className="space-y-1.5">
            {positiveDrivers.slice(0, 3).map((driver, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[#FFF5F5] border border-[#FFD8D8] flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-stone-900 truncate text-xs">
                    {driver.display_name}
                  </div>
                  <div className="text-[10px] text-stone-500 truncate">
                    {driver.insight}
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-600 text-xs shrink-0">
                  +{driver.shap_value.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Protective Retention Anchors */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono uppercase font-bold text-emerald-800 px-1">
            <span>Retention Anchors</span>
            <span>SHAP Impact</span>
          </div>
          <div className="space-y-1.5">
            {negativeDrivers.slice(0, 3).map((driver, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-[#F2F9F0] border border-[#D5EDD0] flex items-center justify-between"
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-stone-900 truncate text-xs">
                    {driver.display_name}
                  </div>
                  <div className="text-[10px] text-stone-500 truncate">
                    {driver.insight}
                  </div>
                </div>
                <span className="font-mono font-bold text-emerald-700 text-xs shrink-0">
                  {driver.shap_value.toFixed(3)}
                </span>
              </div>
            ))}
            {negativeDrivers.length === 0 && (
              <div className="p-4 rounded-lg bg-[#FAF8F5] border border-[#EFECE4] text-center text-stone-400 text-xs">
                No protective signals detected.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
