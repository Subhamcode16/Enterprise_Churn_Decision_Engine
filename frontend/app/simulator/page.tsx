"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  RotateCcw,
  CheckCircle2,
  Activity
} from "lucide-react";
import { predictAccount } from "@/lib/api";
import { SinglePredictionResponse, RiskTier } from "@/lib/types";
import { formatCurrency, getRiskBadgeClasses } from "@/lib/utils";
import { sound } from "@/lib/sound";
import RadialRiskGauge from "@/components/RadialRiskGauge";
import ForceShapVisualizer from "@/components/ForceShapVisualizer";
import ShapWaterfallChart from "@/components/ShapWaterfallChart";

export default function SimulatorPage() {
  // Baseline Parameters
  const [contractMrr, setContractMrr] = useState(16500);
  const [tenureMonths, setTenureMonths] = useState(18);
  const [daysSinceLogin, setDaysSinceLogin] = useState(19);
  const [usageChange, setUsageChange] = useState(-48);
  const [openP1Tickets, setOpenP1Tickets] = useState(2);
  const [npsScore, setNpsScore] = useState(3);
  const [csatScore, setCsatScore] = useState(2.4);
  const [paymentFailures, setPaymentFailures] = useState(1);
  const [daysUntilRenewal, setDaysUntilRenewal] = useState(45);
  const [contractTier, setContractTier] = useState("Enterprise");

  const [simResult, setSimResult] = useState<SinglePredictionResponse | null>(null);
  const [baselineResult, setBaselineResult] = useState<SinglePredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"forces" | "waterfall">("forces");

  // Run Baseline (Initial unmitigated state)
  useEffect(() => {
    const basePayload = {
      account_id: "BASELINE-01",
      company_name: "Vertex Analytics (Baseline)",
      contract_mrr: 16500,
      tenure_months: 18,
      days_since_last_login: 19,
      usage_change_pct_30d: -48,
      open_p1_tickets: 2,
      avg_resolution_time_hrs: 36.0,
      nps_score: 3,
      csat_score: 2.4,
      payment_failures_past_quarter: 1,
      days_until_renewal: 45,
      contract_tier: "Enterprise",
      active_user_ratio: 0.65,
      api_calls_monthly: 12000,
      auto_renew_enabled: 0,
    };
    predictAccount(basePayload).then((res) => setBaselineResult(res));
  }, []);

  // Run Dynamic Simulation
  const runSimulation = () => {
    setLoading(true);
    const payload = {
      account_id: "SIM-ACCOUNT",
      company_name: "Simulated Scenario Corp",
      contract_mrr: Number(contractMrr),
      tenure_months: Number(tenureMonths),
      days_since_last_login: Number(daysSinceLogin),
      usage_change_pct_30d: Number(usageChange),
      open_p1_tickets: Number(openP1Tickets),
      avg_resolution_time_hrs: 18.0,
      nps_score: Number(npsScore),
      csat_score: Number(csatScore),
      payment_failures_past_quarter: Number(paymentFailures),
      days_until_renewal: Number(daysUntilRenewal),
      contract_tier: contractTier,
      active_user_ratio: 0.85,
      api_calls_monthly: 15000,
      auto_renew_enabled: 1,
    };

    predictAccount(payload)
      .then((res) => setSimResult(res))
      .catch((err) => console.error("Simulation error:", err))
      .finally(() => setLoading(false));
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

  // Scenario Presets
  const applyPreset = (type: "critical" | "tam_fix" | "exec_qbr" | "ideal") => {
    sound.playSelect();
    if (type === "critical") {
      setUsageChange(-65);
      setOpenP1Tickets(3);
      setDaysSinceLogin(28);
      setNpsScore(2);
      setCsatScore(1.8);
      setPaymentFailures(2);
      setDaysUntilRenewal(30);
    } else if (type === "tam_fix") {
      setUsageChange(12);
      setOpenP1Tickets(0);
      setDaysSinceLogin(4);
      setNpsScore(7);
      setCsatScore(4.0);
      setPaymentFailures(0);
    } else if (type === "exec_qbr") {
      setUsageChange(5);
      setOpenP1Tickets(0);
      setDaysSinceLogin(6);
      setNpsScore(8);
      setCsatScore(4.2);
      setPaymentFailures(0);
      setDaysUntilRenewal(180);
    } else if (type === "ideal") {
      setUsageChange(25);
      setOpenP1Tickets(0);
      setDaysSinceLogin(1);
      setNpsScore(10);
      setCsatScore(5.0);
      setPaymentFailures(0);
      setDaysUntilRenewal(240);
    }
  };

  const mrrSaved = useMemo(() => {
    if (!simResult || !baselineResult) return 0;
    return Math.max(0, baselineResult.mrr_at_risk - simResult.mrr_at_risk);
  }, [simResult, baselineResult]);

  return (
    <div className="space-y-6">
      {/* Hero Title & Actions */}
      <div className="pb-3 border-b border-stone-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-100 tracking-tight">
              Counterfactual Risk Simulator
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold">
              Dual-Pane Sandbox
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-stone-400">
            Compare unmitigated customer baseline versus counterfactual intervention scenarios with real-time TreeSHAP force recalculation.
          </p>
        </div>

        {/* Dynamic Saved Revenue Badge */}
        {mrrSaved > 0 && (
          <div className="px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Revenue Protected: +{formatCurrency(mrrSaved)}/mo (+{formatCurrency(mrrSaved * 12)} ARR)</span>
          </div>
        )}
      </div>

      {/* Instant Scenario Preset Bar */}
      <div className="p-3.5 rounded-2xl border border-stone-800 bg-gradient-to-r from-[#181716] via-[#141312] to-[#181716] backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <span className="font-bold text-stone-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5 font-mono">
          <Zap className="w-3.5 h-3.5 text-amber-400" /> Quick Intervention Scenarios:
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyPreset("critical")}
            className="px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 font-bold transition-all"
          >
            Severe Disengagement
          </button>
          <button
            onClick={() => applyPreset("tam_fix")}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 font-bold transition-all"
          >
            TAM Re-Onboarding Fix
          </button>
          <button
            onClick={() => applyPreset("exec_qbr")}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 font-bold transition-all"
          >
            Executive QBR Alignment
          </button>
          <button
            onClick={() => applyPreset("ideal")}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 font-bold transition-all"
          >
            Optimal Retention State
          </button>
        </div>
      </div>

      {/* Dual-Pane Comparison Layout (Left: Controls, Center: Baseline, Right: Simulated) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Column 1: Telemetry Sliders (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl border border-stone-800 bg-gradient-to-b from-[#181716] via-[#141312] to-[#0E0D0C] backdrop-blur-2xl p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-stone-200 font-mono">
              Intervention Parameter Dials
            </h2>
            <button
              onClick={() => applyPreset("ideal")}
              className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="space-y-3.5 text-xs font-medium">
            {/* 30-Day Usage */}
            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>30-Day Usage Shift (%)</span>
                <span className={`font-mono font-bold ${usageChange < 0 ? "text-red-400" : "text-emerald-400"}`}>
                  {usageChange >= 0 ? "+" : ""}{usageChange}%
                </span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                step="5"
                value={usageChange}
                onChange={(e) => {
                  sound.playClick(800);
                  setUsageChange(Number(e.target.value));
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Open P1 Tickets */}
            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Open P1 Critical Tickets</span>
                <span className={`font-mono font-bold ${openP1Tickets > 0 ? "text-red-400" : "text-stone-200"}`}>
                  {openP1Tickets} tickets
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={openP1Tickets}
                onChange={(e) => {
                  sound.playClick(800);
                  setOpenP1Tickets(Number(e.target.value));
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Days Since Last Login */}
            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Days Since Last Session</span>
                <span className="font-mono font-bold text-stone-200">{daysSinceLogin} days</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={daysSinceLogin}
                onChange={(e) => {
                  sound.playClick(800);
                  setDaysSinceLogin(Number(e.target.value));
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* NPS Rating */}
            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>NPS Customer Rating</span>
                <span className={`font-mono font-bold ${npsScore <= 6 ? "text-red-400" : "text-emerald-400"}`}>
                  {npsScore} / 10
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={npsScore}
                onChange={(e) => {
                  sound.playClick(800);
                  setNpsScore(Number(e.target.value));
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Contract MRR */}
            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Contract MRR ($)</span>
                <span className="font-mono font-bold text-stone-100">{formatCurrency(contractMrr)}</span>
              </div>
              <input
                type="range"
                min="2000"
                max="40000"
                step="500"
                value={contractMrr}
                onChange={(e) => {
                  sound.playClick(800);
                  setContractMrr(Number(e.target.value));
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Payment Failures */}
            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Billing Failures (Past Qtr)</span>
                <span className={`font-mono font-bold ${paymentFailures > 0 ? "text-red-400" : "text-stone-200"}`}>
                  {paymentFailures}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={paymentFailures}
                onChange={(e) => {
                  sound.playClick(800);
                  setPaymentFailures(Number(e.target.value));
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Days Until Renewal */}
            <div>
              <div className="flex justify-between text-stone-300 mb-1">
                <span>Days Until Renewal</span>
                <span className="font-mono font-bold text-stone-200">{daysUntilRenewal} days</span>
              </div>
              <input
                type="range"
                min="1"
                max="365"
                step="5"
                value={daysUntilRenewal}
                onChange={(e) => {
                  sound.playClick(800);
                  setDaysUntilRenewal(Number(e.target.value));
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Column 2 & 3: Dual-Pane Comparison (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Side-by-Side Comparison Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Card: Baseline State */}
            {baselineResult && (
              <div className="p-5 rounded-3xl border border-red-500/30 bg-gradient-to-b from-[#1C1615] via-[#161211] to-[#0E0D0C] backdrop-blur-xl shadow-card space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400">
                    Unmitigated Baseline
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-500/20 text-red-300 border border-red-500/40">
                    {baselineResult.risk_tier} ({(baselineResult.churn_probability * 100).toFixed(0)}%)
                  </span>
                </div>

                <div className="flex justify-center py-2">
                  <RadialRiskGauge
                    probability={baselineResult.churn_probability}
                    riskTier={baselineResult.risk_tier}
                    size={140}
                  />
                </div>

                <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800 flex justify-between items-center text-xs">
                  <span className="text-stone-400 font-medium">Baseline MRR Loss:</span>
                  <span className="font-mono font-extrabold text-red-400">
                    {formatCurrency(baselineResult.mrr_at_risk)}
                  </span>
                </div>
              </div>
            )}

            {/* Right Card: Counterfactual Simulated State */}
            {simResult && (
              <div className="p-5 rounded-3xl border border-amber-500/40 bg-gradient-to-b from-[#1F1C18] via-[#161412] to-[#0E0D0C] backdrop-blur-xl shadow-glowGold space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-stone-800">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                    Counterfactual Simulated State
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${getRiskBadgeClasses(simResult.risk_tier)}`}>
                    {simResult.risk_tier} ({(simResult.churn_probability * 100).toFixed(0)}%)
                  </span>
                </div>

                <div className="flex justify-center py-2">
                  <RadialRiskGauge
                    probability={simResult.churn_probability}
                    riskTier={simResult.risk_tier}
                    size={140}
                  />
                </div>

                <div className="p-3 rounded-2xl bg-stone-900/80 border border-stone-800 flex justify-between items-center text-xs">
                  <span className="text-stone-400 font-medium">Simulated MRR Loss:</span>
                  <span className="font-mono font-extrabold text-stone-100">
                    {formatCurrency(simResult.mrr_at_risk)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Deep-Dive Force SHAP Breakdown */}
          {simResult && (
            <div className="p-6 rounded-3xl border border-stone-800 bg-gradient-to-b from-[#181716] via-[#141312] to-[#0E0D0C] backdrop-blur-2xl shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">
                    Simulated TreeSHAP Force Dynamic
                  </h3>
                </div>
                <div className="flex items-center gap-1 p-1 rounded-xl bg-stone-900 border border-stone-800 text-xs font-bold">
                  <button
                    onClick={() => {
                      sound.playClick(700);
                      setActiveTab("forces");
                    }}
                    className={`px-3 py-1 rounded-lg ${activeTab === "forces" ? "bg-amber-500 text-stone-950 font-extrabold" : "text-stone-400"}`}
                  >
                    Forces
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick(700);
                      setActiveTab("waterfall");
                    }}
                    className={`px-3 py-1 rounded-lg ${activeTab === "waterfall" ? "bg-amber-500 text-stone-950 font-extrabold" : "text-stone-400"}`}
                  >
                    Waterfall
                  </button>
                </div>
              </div>

              {activeTab === "forces" ? (
                <ForceShapVisualizer
                  drivers={simResult.top_drivers}
                  baseValue={simResult.base_value}
                  totalMargin={simResult.total_margin}
                  predictedProbability={simResult.churn_probability}
                />
              ) : (
                <ShapWaterfallChart
                  drivers={simResult.top_drivers}
                  baseValue={simResult.base_value}
                  totalMargin={simResult.total_margin}
                  predictedProbability={simResult.churn_probability}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
