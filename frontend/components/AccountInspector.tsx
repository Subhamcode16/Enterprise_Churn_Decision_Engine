"use client";

import { useEffect, useState } from "react";
import { AccountRecord, SinglePredictionResponse } from "@/lib/types";
import { predictAccount } from "@/lib/api";
import { formatCurrency, getRiskBadgeClasses } from "@/lib/utils";
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
  UserCheck,
  CheckCircle2,
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
    <div className="rounded-2xl border border-indigo-500/30 bg-[#0F1626] backdrop-blur-2xl shadow-card overflow-hidden">
      {/* Header Bar */}
      <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-indigo-950/50 via-slate-900/80 to-slate-900/40 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-white tracking-tight">
              {account.company_name}
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskBadgeClasses(account.risk_tier)}`}>
              {account.risk_tier} Risk
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
            <span className="font-mono font-semibold text-slate-300">{account.account_id}</span>
            <span>•</span>
            <span>{account.contract_tier} Plan</span>
            <span>•</span>
            <span>{account.tenure_months} mo tenure</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPlaybooks(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-glow transition-all"
          >
            <BookOpen className="w-4 h-4" />
            Playbooks ({prediction?.recommended_playbooks.length || 0})
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-5 space-y-5">
        {/* Core Metric Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contract MRR</div>
            <div className="text-lg font-mono font-extrabold text-white mt-1">
              {formatCurrency(account.contract_mrr)}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">P(Churn) Model</div>
            <div className="text-lg font-mono font-extrabold text-red-400 mt-1">
              {((prediction?.churn_probability ?? account.churn_probability) * 100).toFixed(1)}%
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Expected Loss</div>
            <div className="text-lg font-mono font-extrabold text-red-400 mt-1">
              {formatCurrency(prediction?.mrr_at_risk ?? account.mrr_at_risk)}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contract Renewal</div>
            <div className="text-lg font-mono font-extrabold text-slate-200 mt-1">
              {account.days_until_renewal} Days
            </div>
          </div>
        </div>

        {/* Telemetry & Signal Matrix */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-indigo-400" />
            Live Telemetry & Account Vitality
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-slate-500">Days Since Login:</span>
              <p className="font-bold text-slate-200 mt-0.5">{account.days_since_last_login} days</p>
            </div>
            <div>
              <span className="text-slate-500">30d Usage Shift:</span>
              <p className={`font-bold mt-0.5 ${account.usage_change_pct_30d < 0 ? "text-red-400" : "text-emerald-400"}`}>
                {account.usage_change_pct_30d >= 0 ? "+" : ""}{account.usage_change_pct_30d}%
              </p>
            </div>
            <div>
              <span className="text-slate-500">Critical P1 Tickets:</span>
              <p className={`font-bold mt-0.5 ${account.open_p1_tickets > 0 ? "text-red-400 font-extrabold" : "text-slate-200"}`}>
                {account.open_p1_tickets} unresolved
              </p>
            </div>
            <div>
              <span className="text-slate-500">Sentiment Score:</span>
              <p className="font-bold text-slate-200 mt-0.5">
                NPS {account.nps_score}/10 • CSAT {account.csat_score}/5.0
              </p>
            </div>
          </div>
        </div>

        {/* Root-Cause Explainability */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Root-Cause Explainability (TreeSHAP Attributions)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Base Margin: {prediction?.base_value?.toFixed(3) ?? "-1.240"}
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-900/50 rounded-xl border border-slate-800">
              <Zap className="w-6 h-6 mx-auto text-indigo-400 animate-spin mb-2" />
              Computing local Shapley attributions...
            </div>
          ) : prediction ? (
            <ShapWaterfallChart
              drivers={prediction.top_drivers}
              baseValue={prediction.base_value}
              totalMargin={prediction.total_margin}
              predictedProbability={prediction.churn_probability}
            />
          ) : (
            <div className="p-4 text-xs text-red-400 bg-red-500/10 rounded-xl border border-red-500/20">
              Failed to load explainability breakdown for this record.
            </div>
          )}
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
