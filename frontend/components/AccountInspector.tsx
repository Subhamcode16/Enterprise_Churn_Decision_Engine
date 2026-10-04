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
    <div className="rounded-[28px] border border-[#E2EAE4] bg-white p-6 shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-6 flex flex-col h-[760px] overflow-y-auto font-sans">
      {/* Account Title Header */}
      <div className="pb-4 border-b border-[#E2EAE4] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold font-serif text-[#051F20] tracking-tight">
              {account.company_name}
            </h2>
            <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${getRiskBadgeClasses(account.risk_tier)}`}>
              {account.risk_tier} Risk
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-[#163832]/60 font-mono">
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
            className="p-2 rounded-full bg-[#F4F8F5] border border-[#E2EAE4] text-[#163832]/70 hover:text-[#051F20] hover:bg-[#E2EAE4] transition-colors shadow-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Hero Speedometer + Key Financial Readouts */}
      <div className="p-4 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
        <div className="sm:col-span-5 flex justify-center">
          <RadialRiskGauge
            probability={prediction?.churn_probability ?? account.churn_probability}
            riskTier={account.risk_tier}
            size={160}
          />
        </div>

        <div className="sm:col-span-7 grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-3 rounded-xl bg-white border border-[#E2EAE4] shadow-xs">
            <span className="text-[10px] font-bold text-[#163832]/60 uppercase font-mono">Contract MRR</span>
            <div className="text-base font-mono font-extrabold text-[#051F20] mt-1">
              {formatCurrency(account.contract_mrr)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E2EAE4] shadow-xs">
            <span className="text-[10px] font-bold text-[#163832]/60 uppercase font-mono">MRR at Risk</span>
            <div className="text-base font-mono font-extrabold text-rose-700 mt-1">
              {formatCurrency(prediction?.mrr_at_risk ?? account.mrr_at_risk)}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E2EAE4] shadow-xs">
            <span className="text-[10px] font-bold text-[#163832]/60 uppercase font-mono">30d Usage Shift</span>
            <div className={`text-base font-mono font-extrabold mt-1 ${account.usage_change_pct_30d < 0 ? "text-rose-700" : "text-[#235347]"}`}>
              {account.usage_change_pct_30d >= 0 ? "+" : ""}{account.usage_change_pct_30d}%
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#E2EAE4] shadow-xs">
            <span className="text-[10px] font-bold text-[#163832]/60 uppercase font-mono">Renewal In</span>
            <div className="text-base font-mono font-extrabold text-[#051F20] mt-1">
              {account.days_until_renewal} Days
            </div>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-[#E2EAE4]">
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] text-xs font-bold shadow-xs">
            <button
              onClick={() => {
                sound.playClick(700);
                setActiveTab("forces");
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "forces"
                  ? "bg-[#235347] text-white font-bold shadow-xs"
                  : "text-[#163832]/70 hover:text-[#051F20]"
              }`}
            >
              Force Dynamics
            </button>
            <button
              onClick={() => {
                sound.playClick(700);
                setActiveTab("waterfall");
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "waterfall"
                  ? "bg-[#235347] text-white font-bold shadow-xs"
                  : "text-[#163832]/70 hover:text-[#051F20]"
              }`}
            >
              SHAP Waterfall
            </button>
            <button
              onClick={() => {
                sound.playClick(700);
                setActiveTab("radar");
              }}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                activeTab === "radar"
                  ? "bg-[#235347] text-white font-bold shadow-xs"
                  : "text-[#163832]/70 hover:text-[#051F20]"
              }`}
            >
              5D Health Radar
            </button>
          </div>

          <span className="text-[10px] font-mono font-medium text-stone-500">
            TreeSHAP Calibrated
          </span>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="p-8 text-center text-xs text-stone-600 bg-[#FAF8F5] rounded-xl border border-[#E8E5DD]">
              <Zap className="w-5 h-5 mx-auto text-amber-600 animate-spin mb-2" />
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
            <div className="p-4 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
              Failed to load diagnostic telemetry for this account.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
