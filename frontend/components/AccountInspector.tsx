"use client";

import { useEffect, useState } from "react";
import { AccountRecord, SinglePredictionResponse } from "@/lib/types";
import { predictAccount } from "@/lib/api";
import { formatCurrency, getRiskBadgeClasses } from "@/lib/utils";
import { sound } from "@/lib/sound";
import RadialRiskGauge from "./RadialRiskGauge";
import AccountRadar from "./AccountRadar";
import ForceShapVisualizer from "./ForceShapVisualizer";
import ShapWaterfallChart from "./ShapWaterfallChart";
import {
  Sparkles,
  ShieldAlert,
  Clock,
  Zap,
  Activity,
  Layers,
  TrendingDown,
  TrendingUp,
  X
} from "lucide-react";

interface AccountInspectorProps {
  account: AccountRecord;
  onClose?: () => void;
}

export default function AccountInspector({ account, onClose }: AccountInspectorProps) {
  const [prediction, setPrediction] = useState<SinglePredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"forces" | "waterfall" | "radar">("forces");

  useEffect(() => {
    setLoading(true);
    predictAccount(account)
      .then((res) => {
        setPrediction(res);
      })
      .catch((err) => {
        console.error("Prediction fetch failed:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [account]);

  return (
    <div className="rounded-3xl border border-stone-800 bg-gradient-to-b from-[#181716] via-[#141312] to-[#0E0D0C] backdrop-blur-2xl p-6 shadow-card space-y-6 flex flex-col h-[760px] overflow-y-auto">
      {/* Account Title Header */}
      <div className="pb-4 border-b border-stone-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-stone-100 tracking-tight">
              {account.company_name}
            </h2>
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${getRiskBadgeClasses(account.risk_tier)}`}>
              {account.risk_tier} Risk
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-stone-400 font-mono">
            <span>{account.account_id}</span>
            <span>•</span>
            <span>{account.contract_tier} Tier</span>
            <span>•</span>
            <span>{account.tenure_months} mo active relationship</span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-stone-900 text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hero Speedometer + Key Financial Readouts */}
      <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        <div className="sm:col-span-5 flex justify-center">
          <RadialRiskGauge
            probability={prediction?.churn_probability ?? account.churn_probability}
            riskTier={account.risk_tier}
            size={160}
          />
        </div>

        <div className="sm:col-span-7 grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] font-bold text-stone-400 uppercase font-mono">Contract MRR</span>
            <div className="text-base font-mono font-extrabold text-stone-100 mt-1">
              {formatCurrency(account.contract_mrr)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] font-bold text-stone-400 uppercase font-mono">MRR at Risk</span>
            <div className="text-base font-mono font-extrabold text-red-400 mt-1">
              {formatCurrency(prediction?.mrr_at_risk ?? account.mrr_at_risk)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] font-bold text-stone-400 uppercase font-mono">30d Usage Shift</span>
            <div className={`text-base font-mono font-extrabold mt-1 ${account.usage_change_pct_30d < 0 ? "text-red-400" : "text-emerald-400"}`}>
              {account.usage_change_pct_30d >= 0 ? "+" : ""}{account.usage_change_pct_30d}%
            </div>
          </div>
          <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800">
            <span className="text-[10px] font-bold text-stone-400 uppercase font-mono">Renewal In</span>
            <div className="text-base font-mono font-extrabold text-stone-200 mt-1">
              {account.days_until_renewal} Days
            </div>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-stone-900 border border-stone-800 text-xs font-bold">
            <button
              onClick={() => {
                sound.playClick(700);
                setActiveTab("forces");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "forces"
                  ? "bg-amber-500 text-stone-950 font-extrabold shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              Force Dynamics
            </button>
            <button
              onClick={() => {
                sound.playClick(700);
                setActiveTab("waterfall");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "waterfall"
                  ? "bg-amber-500 text-stone-950 font-extrabold shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              SHAP Waterfall
            </button>
            <button
              onClick={() => {
                sound.playClick(700);
                setActiveTab("radar");
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "radar"
                  ? "bg-amber-500 text-stone-950 font-extrabold shadow-sm"
                  : "text-stone-400 hover:text-stone-200"
              }`}
            >
              5D Health Radar
            </button>
          </div>

          <span className="text-[10px] font-mono text-stone-400">
            TreeSHAP Calibrated
          </span>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-stone-400 bg-stone-950/40 rounded-xl border border-stone-800">
              <Zap className="w-5 h-5 mx-auto text-amber-400 animate-spin mb-2" />
              Calculating TreeSHAP force attributions...
            </div>
          ) : prediction ? (
            <>
              {activeTab === "forces" && (
                <ForceShapVisualizer
                  drivers={prediction.top_drivers}
                  baseValue={prediction.base_value}
                  totalMargin={prediction.total_margin}
                  predictedProbability={prediction.churn_probability}
                />
              )}
              {activeTab === "waterfall" && (
                <ShapWaterfallChart
                  drivers={prediction.top_drivers}
                  baseValue={prediction.base_value}
                  totalMargin={prediction.total_margin}
                  predictedProbability={prediction.churn_probability}
                />
              )}
              {activeTab === "radar" && (
                <AccountRadar account={account} />
              )}
            </>
          ) : (
            <div className="p-4 text-xs text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
              Failed to load diagnostic telemetry for this account.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
