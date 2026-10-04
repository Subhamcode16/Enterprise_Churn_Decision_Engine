"use client";

import { useState } from "react";
import { 
  X, 
  Plus, 
  Building2, 
  DollarSign, 
  Calendar, 
  Activity, 
  AlertTriangle, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { predictAccount } from "@/lib/api";
import { AccountRecord, RiskTier, SinglePredictionResponse } from "@/lib/types";
import { playTick, playBlip, playExecute } from "@/lib/sound";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded: (account: AccountRecord, prediction?: SinglePredictionResponse) => void;
}

export default function AddAccountModal({
  isOpen,
  onClose,
  onAccountAdded
}: AddAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [contractMrr, setContractMrr] = useState("18500");
  const [contractTier, setContractTier] = useState("Enterprise");
  const [tenureMonths, setTenureMonths] = useState("24");
  const [daysSinceLogin, setDaysSinceLogin] = useState("3");
  const [usageChangePct, setUsageChangePct] = useState("-12.5");
  const [openP1Tickets, setOpenP1Tickets] = useState("1");
  const [npsScore, setNpsScore] = useState("6");
  const [csatScore, setCsatScore] = useState("3.8");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError("Please enter a valid company name.");
      return;
    }

    setLoading(true);
    setError(null);
    playBlip();

    const newAccountId = `ACC-MANUAL-${Math.floor(1000 + Math.random() * 9000)}`;
    const mrr = parseFloat(contractMrr) || 15000;

    const accountPayload: AccountRecord = {
      account_id: newAccountId,
      company_name: companyName.trim(),
      contract_mrr: mrr,
      tenure_months: parseInt(tenureMonths) || 12,
      contract_tier: contractTier,
      days_since_last_login: parseInt(daysSinceLogin) || 2,
      usage_change_pct_30d: parseFloat(usageChangePct) || 0.0,
      open_p1_tickets: parseInt(openP1Tickets) || 0,
      avg_resolution_time_hrs: 12.0,
      nps_score: parseInt(npsScore) || 8,
      csat_score: parseFloat(csatScore) || 4.2,
      payment_failures_past_quarter: 0,
      days_until_renewal: 120,
      auto_renew_enabled: 1,
      churn_probability: 0.5,
      risk_tier: "Medium",
      mrr_at_risk: mrr * 0.5,
      active_user_ratio: 0.72,
      api_calls_monthly: 32000
    };

    try {
      const predRes = await predictAccount(accountPayload);
      const churnProb = predRes.churn_probability ?? 0.45;
      const riskTier: RiskTier = predRes.risk_tier || (churnProb >= 0.75 ? "Critical" : churnProb >= 0.5 ? "High" : churnProb >= 0.25 ? "Medium" : "Low");

      const enrichedAccount: AccountRecord = {
        ...accountPayload,
        churn_probability: churnProb,
        risk_tier: riskTier,
        mrr_at_risk: predRes.mrr_at_risk ?? Math.round(mrr * churnProb),
        primary_playbook: predRes.recommended_playbooks?.[0]?.playbook_id,
        playbook_details: predRes.recommended_playbooks?.[0],
      };

      playExecute();
      onAccountAdded(enrichedAccount, predRes);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to score new account.");
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#051F20]/75 backdrop-blur-md animate-in fade-in duration-200 font-sans"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-white border border-[#E2EAE4] rounded-[32px] shadow-[0_32px_80px_-16px_rgba(5,31,32,0.35)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Top Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-[#235347] to-[#0B2B26]" />

        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-[#F0F4F1] bg-[#F4F8F5]/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xl font-serif font-bold text-[#051F20]">
                Direct Account Ingestion & Scorer
              </h3>
            </div>
            <p className="text-xs text-stone-500">
              Input single customer telemetry to run instant sub-50ms XGBoost & TreeSHAP risk scoring.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              playTick();
              onClose();
            }}
            className="w-8 h-8 rounded-full border border-[#E2EAE4] bg-white hover:bg-[#F4F8F5] text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Company Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-mono font-bold text-[#051F20] uppercase tracking-wider">
              Company / Tenant Name
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Global Systems Inc"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E2EAE4] focus:border-[#235347] text-xs font-sans text-[#051F20] focus:outline-none transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* MRR & Contract Tier */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-[#051F20] uppercase tracking-wider">
                Monthly MRR ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  required
                  value={contractMrr}
                  onChange={(e) => setContractMrr(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E2EAE4] focus:border-[#235347] text-xs font-mono text-[#051F20] focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-[#051F20] uppercase tracking-wider">
                Contract Tier
              </label>
              <select
                value={contractTier}
                onChange={(e) => setContractTier(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E2EAE4] focus:border-[#235347] text-xs font-sans text-[#051F20] focus:outline-none bg-white"
              >
                <option value="Enterprise">Enterprise</option>
                <option value="Mid-Market">Mid-Market</option>
                <option value="Professional">Professional</option>
                <option value="Starter">Starter</option>
              </select>
            </div>
          </div>

          {/* Tenure & Login Inactivity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-[#051F20] uppercase tracking-wider">
                Tenure (Months)
              </label>
              <input
                type="number"
                value={tenureMonths}
                onChange={(e) => setTenureMonths(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E2EAE4] focus:border-[#235347] text-xs font-mono text-[#051F20] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-[#051F20] uppercase tracking-wider">
                Days Inactive
              </label>
              <input
                type="number"
                value={daysSinceLogin}
                onChange={(e) => setDaysSinceLogin(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E2EAE4] focus:border-[#235347] text-xs font-mono text-[#051F20] focus:outline-none"
              />
            </div>
          </div>

          {/* 30-Day Usage & P1 Tickets */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-[#051F20] uppercase tracking-wider">
                Usage Velocity (30d %)
              </label>
              <input
                type="number"
                step="0.1"
                value={usageChangePct}
                onChange={(e) => setUsageChangePct(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E2EAE4] focus:border-[#235347] text-xs font-mono text-[#051F20] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-[#051F20] uppercase tracking-wider">
                Open P1 Tickets
              </label>
              <input
                type="number"
                value={openP1Tickets}
                onChange={(e) => setOpenP1Tickets(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E2EAE4] focus:border-[#235347] text-xs font-mono text-[#051F20] focus:outline-none"
              />
            </div>
          </div>

          {/* NPS & CSAT */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-[#051F20] uppercase tracking-wider">
                NPS Rating (0-10)
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={npsScore}
                onChange={(e) => setNpsScore(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E2EAE4] focus:border-[#235347] text-xs font-mono text-[#051F20] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-mono font-bold text-[#051F20] uppercase tracking-wider">
                CSAT (1.0 - 5.0)
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={csatScore}
                onChange={(e) => setCsatScore(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#E2EAE4] focus:border-[#235347] text-xs font-mono text-[#051F20] focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-between gap-3 border-t border-[#F0F4F1]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-full bg-white hover:bg-stone-50 border border-[#E2EAE4] text-stone-600 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-[#051F20] hover:bg-[#0B2B26] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-sm hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>{loading ? "Computing TreeSHAP..." : "Score & Ingest Account"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
