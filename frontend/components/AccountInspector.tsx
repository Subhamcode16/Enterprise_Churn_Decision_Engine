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
import PlaybookModal from "./PlaybookModal";
import {
  Sparkles,
  ShieldAlert,
  Clock,
  Zap,
  BookOpen,
  DollarSign,
  Activity,
  Layers,
  ChevronRight,
  TrendingDown,
  X
} from "lucide-react";

interface AccountInspectorProps {
  account: AccountRecord;
  onClose?: () => void;
}

export default function AccountInspector({ account, onClose }: AccountInspectorProps) {
  const [prediction, setPrediction] = useState<SinglePredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPlaybooks, setShowPlaybooks] = useState(false);
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

  const handleOpenPlaybooks = () => {
    sound.playSelect();
    setShowPlaybooks(true);
  };

  return (
    <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-[#111728]/95 via-[#0D1220]/95 to-[#080C16]/95 backdrop-blur-2xl shadow-[0_15px_40px_rgba(0,0,0,0.6)] overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-800/80 bg-gradient-to-r from-indigo-950/60 via-purple-950/30 to-slate-900/40 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {account.company_name}
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${getRiskBadgeClasses(account.risk_tier)}`}>
              {account.risk_tier} Risk
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <span className="font-mono font-bold text-slate-300">{account.account_id}</span>
            <span>•</span>
            <span>{account.contract_tier} Tier</span>
            <span>•</span>
            <span>{account.tenure_months} mo tenure</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenPlaybooks}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Playbooks ({prediction?.recommended_playbooks.length || 0})
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5 space-y-6">
        {/* Radial Speedometer Gauge + Hero Exposure */}
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <RadialRiskGauge
            probability={prediction?.churn_probability ?? account.churn_probability}
            riskTier={account.risk_tier}
            size={170}
          />

          <div className="flex-1 space-y-2.5 w-full sm:w-auto">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Expected Financial Loss</span>
              <span className="text-lg font-mono font-extrabold text-red-400">
                {formatCurrency(prediction?.mrr_at_risk ?? account.mrr_at_risk)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Active Contract MRR</span>
              <span className="text-base font-mono font-bold text-white">
                {formatCurrency(account.contract_mrr)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Renewal Runway</span>
              <span className="text-xs font-mono font-bold text-slate-200">
                {account.days_until_renewal} Days Remaining
              </span>
            </div>
          </div>
        </div>

        {/* Explainability Tab Switcher */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
              <button
                onClick={() => {
                  sound.playClick(700);
                  setActiveTab("forces");
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "forces"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
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
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
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
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Health Radar
              </button>
            </div>

            <span className="text-[10px] font-mono text-slate-400">
              TreeSHAP Calibrated
            </span>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
                <Zap className="w-6 h-6 mx-auto text-indigo-400 animate-spin mb-2" />
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

      {/* Playbooks Modal */}
      {showPlaybooks && prediction && (
        <PlaybookModal
          accountId={account.account_id}
          companyName={account.company_name}
          playbooks={prediction.recommended_playbooks}
          onClose={() => setShowPlaybooks(false)}
        />
      )}
    </div>
  );
}
