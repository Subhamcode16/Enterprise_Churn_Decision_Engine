"use client";

import { useState, useEffect, useMemo } from "react";
import { Sliders, Sparkles, ArrowRight, ShieldCheck, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { simulateWhatIf, predictAccount } from "@/lib/api";
import { SinglePredictionResponse, RiskTier } from "@/lib/types";
import { formatCurrency, getRiskBadgeClasses } from "@/lib/utils";
import ShapWaterfallChart from "@/components/ShapWaterfallChart";

export default function SimulatorPage() {
  const [contractMrr, setContractMrr] = useState(14500);
  const [tenureMonths, setTenureMonths] = useState(16);
  const [daysSinceLogin, setDaysSinceLogin] = useState(18);
  const [usageChange, setUsageChange] = useState(-45);
  const [openP1Tickets, setOpenP1Tickets] = useState(2);
  const [npsScore, setNpsScore] = useState(4);
  const [csatScore, setCsatScore] = useState(2.8);
  const [paymentFailures, setPaymentFailures] = useState(1);
  const [daysUntilRenewal, setDaysUntilRenewal] = useState(45);
  const [contractTier, setContractTier] = useState("Enterprise");

  const [simResult, setSimResult] = useState<SinglePredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Baseline unmitigated state comparison
  const baselineMrrLoss = useMemo(() => {
    return 14500 * 0.88; // ~$12,760
  }, []);

  const runSimulation = () => {
    setLoading(true);
    const payload = {
      account_id: "SIM-ACCOUNT",
      company_name: "Simulated Enterprise Corp",
      contract_mrr: Number(contractMrr),
      tenure_months: Number(tenureMonths),
      days_since_last_login: Number(daysSinceLogin),
      usage_change_pct_30d: Number(usageChange),
      open_p1_tickets: Number(openP1Tickets),
      avg_resolution_time_hrs: 24.0,
      nps_score: Number(npsScore),
      csat_score: Number(csatScore),
      payment_failures_past_quarter: Number(paymentFailures),
      days_until_renewal: Number(daysUntilRenewal),
      contract_tier: contractTier,
      active_user_ratio: 0.75,
      api_calls_monthly: 10000,
      auto_renew_enabled: 1,
    };

    predictAccount(payload)
      .then((res) => {
        setSimResult(res);
      })
      .catch((err) => {
        console.error("Simulation error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    runSimulation();
  }, [
    contractMrr,
    tenureMonths,
    daysSinceLogin,
    usageChange,
    openP1Tickets,
    npsScore,
    csatScore,
    paymentFailures,
    daysUntilRenewal,
    contractTier,
  ]);

  const mrrSaved = useMemo(() => {
    if (!simResult) return 0;
    return Math.max(0, baselineMrrLoss - simResult.mrr_at_risk);
  }, [simResult, baselineMrrLoss]);

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="pb-2 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Counterfactual Risk Simulator
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Dynamically adjust customer parameters to calculate expected churn probability shifts, TreeSHAP attributions, and saved revenue.
          </p>
        </div>

        {/* Saved Revenue Ticker */}
        {mrrSaved > 0 && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-glow">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Saved MRR Exposure: +{formatCurrency(mrrSaved)}/mo</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-[#0F1626]/90 backdrop-blur-2xl p-6 shadow-card space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">
              Simulation Telemetry Controls
            </h2>
            <button
              onClick={() => {
                setUsageChange(20);
                setOpenP1Tickets(0);
                setDaysSinceLogin(2);
                setNpsScore(9);
                setCsatScore(4.8);
                setPaymentFailures(0);
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
            >
              Reset to Ideal Retention
            </button>
          </div>

          {/* Sliders */}
          <div className="space-y-4 text-xs font-semibold">
            {/* 30-Day Usage Change */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1.5">
                <span>30-Day Usage Shift (%)</span>
                <span className={`font-mono font-extrabold ${usageChange < 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {usageChange >= 0 ? "+" : ""}{usageChange}%
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={usageChange}
                onChange={(e) => setUsageChange(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Open P1 Tickets */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1.5">
                <span>Open P1 Critical Tickets</span>
                <span className={`font-mono font-extrabold ${openP1Tickets > 0 ? "text-red-400" : "text-slate-200"}`}>
                  {openP1Tickets} tickets
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={openP1Tickets}
                onChange={(e) => setOpenP1Tickets(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Days Since Last Login */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1.5">
                <span>Days Since Last Session</span>
                <span className="font-mono font-extrabold text-slate-200">{daysSinceLogin} days</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={daysSinceLogin}
                onChange={(e) => setDaysSinceLogin(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* NPS Score */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1.5">
                <span>NPS Customer Rating</span>
                <span className={`font-mono font-extrabold ${npsScore <= 6 ? "text-red-400" : "text-emerald-400"}`}>
                  {npsScore} / 10
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={npsScore}
                onChange={(e) => setNpsScore(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Contract MRR */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1.5">
                <span>Contract MRR ($)</span>
                <span className="font-mono font-extrabold text-white">{formatCurrency(contractMrr)}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="40000"
                step="500"
                value={contractMrr}
                onChange={(e) => setContractMrr(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Payment Failures */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1.5">
                <span>Payment Failures (Past Qtr)</span>
                <span className={`font-mono font-extrabold ${paymentFailures > 0 ? "text-red-400" : "text-slate-200"}`}>
                  {paymentFailures}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={paymentFailures}
                onChange={(e) => setPaymentFailures(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Days Until Renewal */}
            <div>
              <div className="flex justify-between text-slate-300 mb-1.5">
                <span>Days Until Renewal</span>
                <span className="font-mono font-extrabold text-slate-200">{daysUntilRenewal} days</span>
              </div>
              <input
                type="range"
                min="1"
                max="365"
                step="5"
                value={daysUntilRenewal}
                onChange={(e) => setDaysUntilRenewal(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Scorecard & Output (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {simResult && (
            <>
              {/* Scoreboard */}
              <div className="p-6 rounded-2xl border border-indigo-500/40 bg-gradient-to-b from-[#131B2E] via-[#0F1626] to-[#0A0E1A] backdrop-blur-2xl shadow-glow">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                      Calculated Risk Classification
                    </span>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${getRiskBadgeClasses(simResult.risk_tier)}`}>
                        {simResult.risk_tier} Risk
                      </span>
                      <span className="text-2xl font-mono font-extrabold text-white">
                        {(simResult.churn_probability * 100).toFixed(1)}% P(Churn)
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
                      Projected Monthly Loss
                    </span>
                    <div className="text-2xl font-mono font-extrabold text-red-400 mt-1">
                      {formatCurrency(simResult.mrr_at_risk)}
                    </div>
                  </div>
                </div>

                {/* Playbooks Triggered */}
                <div className="mt-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    Automated Playbooks Triggered ({simResult.recommended_playbooks.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {simResult.recommended_playbooks.map((pb) => (
                      <div
                        key={pb.playbook_id}
                        className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200">{pb.title}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                            {pb.priority}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                          {pb.action_summary}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SHAP Waterfall Breakdown */}
              <div className="p-6 rounded-2xl border border-slate-800 bg-[#0F1626]/90 backdrop-blur-2xl shadow-card">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                    Counterfactual TreeSHAP Local Attributions
                  </h3>
                </div>
                <ShapWaterfallChart
                  drivers={simResult.top_drivers}
                  baseValue={simResult.base_value}
                  totalMargin={simResult.total_margin}
                  predictedProbability={simResult.churn_probability}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
