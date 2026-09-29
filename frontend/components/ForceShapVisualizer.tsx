"use client";

import { FeatureDriver } from "@/lib/types";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";

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

  return (
    <div className="space-y-4">
      {/* Central Force Balance Gauge Bar */}
      <div className="relative p-4 rounded-xl bg-[#090D16]/90 border border-slate-800 backdrop-blur-xl">
        <div className="flex items-center justify-between text-xs font-bold mb-2">
          <span className="text-emerald-400 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> Retention Forces ({negativeDrivers.length})
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            Base Margin: {baseValue.toFixed(2)} → Risk Margin: {totalMargin.toFixed(2)}
          </span>
          <span className="text-red-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> Churn Pressures ({positiveDrivers.length})
          </span>
        </div>

        {/* Dynamic Force Balance Bar */}
        <div className="relative w-full h-3 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
          <div
            style={{ width: `${Math.min(100, Math.max(0, (1 - predictedProbability) * 100))}%` }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 ease-out"
          />
          <div
            style={{ width: `${Math.min(100, Math.max(0, predictedProbability * 100))}%` }}
            className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-700 ease-out"
          />
        </div>
      </div>

      {/* Force Nodes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Positive Churn Drivers (Elevating Risk) */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Top Churn Escalators
          </span>
          {positiveDrivers.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No acute risk factors detected.</p>
          ) : (
            positiveDrivers.map((d, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-red-950/20 border border-red-500/20 hover:border-red-500/40 transition-all text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{d.display_name}</span>
                  <span className="font-mono font-bold text-red-400">+{d.shap_value.toFixed(3)}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 leading-snug">{d.insight}</p>
              </div>
            ))
          )}
        </div>

        {/* Negative Churn Drivers (Protective Factors) */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Protective Retention Anchors
          </span>
          {negativeDrivers.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No protective factors active.</p>
          ) : (
            negativeDrivers.map((d, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 hover:border-emerald-500/40 transition-all text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{d.display_name}</span>
                  <span className="font-mono font-bold text-emerald-400">{d.shap_value.toFixed(3)}</span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400 leading-snug">{d.insight}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
