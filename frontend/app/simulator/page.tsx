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
import { predictAccount, exportRenewalBrief } from "@/lib/api";
import { SinglePredictionResponse, RiskTier } from "@/lib/types";
import { formatCurrency, getRiskBadgeClasses } from "@/lib/utils";
import { sound, playTick, playBlip, playExecute } from "@/lib/sound";
import RadialRiskGauge from "@/components/RadialRiskGauge";
import ForceShapVisualizer from "@/components/ForceShapVisualizer";
import ShapWaterfallChart from "@/components/ShapWaterfallChart";
import { FileDown, FileText } from "lucide-react";

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
  const [exportingBrief, setExportingBrief] = useState(false);
  const [briefPreview, setBriefPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"forces" | "waterfall">("forces");

  // Run Baseline (Initial unmitigated state)
  const runBaseline = async () => {
    try {
      const res = await predictAccount({
        account_id: "SIM-BASELINE",
        company_name: "Baseline Account",
        contract_mrr: 16500,
        tenure_months: 18,
        contract_tier: "Enterprise",
        days_since_last_login: 19,
        usage_change_pct_30d: -48,
        open_p1_tickets: 2,
        avg_resolution_time_hrs: 42,
        nps_score: 3,
        csat_score: 2.4,
        payment_failures_past_quarter: 1,
        days_until_renewal: 45,
        auto_renew_enabled: 0,
        churn_probability: 0.95,
        risk_tier: "Critical",
        mrr_at_risk: 15702,
      });
      setBaselineResult(res);
    } catch (e) {
      console.error("Baseline calculation failed", e);
    }
  };

  const handleExportBrief = async () => {
    try {
      playBlip();
      setExportingBrief(true);
      const res = await exportRenewalBrief(
        {
          account_id: "ACC-RENEWAL-SIM",
          company_name: "Enterprise Renewal Client",
          contract_mrr: Number(contractMrr),
          tenure_months: Number(tenureMonths),
          contract_tier: contractTier,
          days_since_last_login: 19,
          usage_change_pct_30d: -48,
          open_p1_tickets: 2,
          avg_resolution_time_hrs: 42,
          nps_score: 3,
          csat_score: 2.4,
          payment_failures_past_quarter: 1,
          days_until_renewal: 45,
          auto_renew_enabled: 0,
        },
        {
          days_since_last_login: Number(daysSinceLogin),
          usage_change_pct_30d: Number(usageChange),
          open_p1_tickets: Number(openP1Tickets),
          nps_score: Number(npsScore),
          csat_score: Number(csatScore),
          auto_renew_enabled: daysUntilRenewal > 90 ? 1 : 0,
        }
      );

      if (res && res.brief_markdown) {
        setBriefPreview(res.brief_markdown);
        // Download as .md file
        const blob = new Blob([res.brief_markdown], { type: "text/markdown;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `CHURNIQ_Renewal_Brief_${Date.now()}.md`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        playExecute();
      }
    } catch (err) {
      console.error("Brief export error:", err);
    } finally {
      setExportingBrief(false);
    }
  };

  // Run Simulation Inference with Debounce
  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await predictAccount({
        account_id: "SIM-CUSTOM",
        company_name: "Simulated Counterfactual State",
        contract_mrr: Number(contractMrr),
        tenure_months: Number(tenureMonths),
        contract_tier: contractTier,
        days_since_last_login: Number(daysSinceLogin),
        usage_change_pct_30d: Number(usageChange),
        open_p1_tickets: Number(openP1Tickets),
        avg_resolution_time_hrs: openP1Tickets === 0 ? 8 : 36,
        nps_score: Number(npsScore),
        csat_score: Number(csatScore),
        payment_failures_past_quarter: Number(paymentFailures),
        days_until_renewal: Number(daysUntilRenewal),
        auto_renew_enabled: daysUntilRenewal > 90 ? 1 : 0,
        churn_probability: 0.5,
        risk_tier: "Medium",
        mrr_at_risk: 8000,
      });
      setSimResult(res);
    } catch (e) {
      console.error("Simulation failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBaseline();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      runSimulation();
    }, 250);
    return () => clearTimeout(timer);
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

  const handleReset = () => {
    playTick();
    setContractMrr(16500);
    setTenureMonths(18);
    setDaysSinceLogin(19);
    setUsageChange(-48);
    setOpenP1Tickets(2);
    setNpsScore(3);
    setCsatScore(2.4);
    setPaymentFailures(1);
    setDaysUntilRenewal(45);
    setContractTier("Enterprise");
  };

  const applyPreset = (type: string) => {
    playBlip();
    if (type === "emergency_support") {
      setOpenP1Tickets(0);
      setCsatScore(4.5);
      setNpsScore(8);
      setDaysSinceLogin(2);
    } else if (type === "disengaged") {
      setDaysSinceLogin(28);
      setUsageChange(-65);
      setOpenP1Tickets(3);
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
    <div className="w-full space-y-7 pb-16 font-sans">
      {/* Hero Title & Header */}
      <div className="pb-4 border-b border-[#E8E5DD] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-stone-500">
              Counterfactual Simulation Sandbox
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Counterfactual Risk Simulator
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
            Compare unmitigated customer baseline versus counterfactual intervention scenarios with real-time TreeSHAP force recalculation.
          </p>
        </div>

        {/* Header Actions: Ticker & Export Brief */}
        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          <div className="p-3.5 rounded-2xl bg-[#EAF5E8] border border-[#C1E7BC] shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#C1E7BC] flex items-center justify-center text-emerald-700 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-800">
                Revenue Protected
              </span>
              <div className="text-lg font-mono font-bold text-emerald-800">
                +{formatCurrency(mrrSaved)}<span className="text-xs font-normal text-emerald-700">/mo</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleExportBrief}
            disabled={exportingBrief}
            className="p-3.5 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-[0.98]"
          >
            {exportingBrief ? (
              <>
                <Zap className="w-4 h-4 animate-spin text-amber-400" />
                <span>Generating Brief...</span>
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 text-amber-400" />
                <span>Export Renewal Strategy Brief</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preset Quick Scenario Pills */}
      <div className="p-4 rounded-2xl bg-white border border-[#E8E5DD] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs font-mono font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500" />
          Quick Scenarios:
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => applyPreset("emergency_support")}
            className="px-3 py-1.5 rounded-xl bg-[#FFF7D1] hover:bg-[#FFEFA8] border border-[#FFE885] text-[#7A5800] text-xs font-semibold transition-all"
          >
            Emergency Support Blitz
          </button>
          <button
            onClick={() => applyPreset("tam_fix")}
            className="px-3 py-1.5 rounded-xl bg-[#EDF0FF] hover:bg-[#DCE2FF] border border-[#CCD4FF] text-[#2C3D8F] text-xs font-semibold transition-all"
          >
            TAM Re-Onboarding Fix
          </button>
          <button
            onClick={() => applyPreset("exec_qbr")}
            className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] hover:bg-stone-100 border border-[#E8E5DD] text-stone-800 text-xs font-semibold transition-all"
          >
            Executive QBR Alignment
          </button>
          <button
            onClick={() => applyPreset("ideal")}
            className="px-3 py-1.5 rounded-xl bg-[#EAF5E8] hover:bg-[#D6EED2] border border-[#C1E7BC] text-[#235E23] text-xs font-semibold transition-all"
          >
            Optimal Retention State
          </button>
        </div>
      </div>

      {/* Main Grid: Dials on Left, Side-by-Side Comparison on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        {/* Left Column: Interactive Dials (5 Cols - White Card) */}
        <div className="lg:col-span-5 bg-white border border-[#E8E5DD] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-500" />
              Intervention Parameter Dials
            </h3>
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] font-mono text-stone-500 hover:text-stone-900 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Baseline
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* 30-Day Usage Change */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-stone-700">30-Day Usage Shift (%)</span>
                <span className={`font-mono ${usageChange < 0 ? "text-rose-600" : "text-emerald-700"}`}>
                  {usageChange > 0 ? "+" : ""}{usageChange}%
                </span>
              </div>
              <input
                type="range"
                min="-80"
                max="80"
                step="5"
                value={usageChange}
                onChange={(e) => setUsageChange(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Open P1 Tickets */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-stone-700">Open P1 Critical Tickets</span>
                <span className={`font-mono ${openP1Tickets > 0 ? "text-rose-600 font-bold" : "text-emerald-700"}`}>
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
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Days Since Login */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-stone-700">Days Since Last Session</span>
                <span className="font-mono text-stone-900 font-bold">{daysSinceLogin} days</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={daysSinceLogin}
                onChange={(e) => setDaysSinceLogin(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* NPS Score */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-stone-700">NPS Customer Rating</span>
                <span className="font-mono text-stone-900 font-bold">{npsScore} / 10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={npsScore}
                onChange={(e) => setNpsScore(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Contract MRR */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-stone-700">Contract MRR ($)</span>
                <span className="font-mono text-stone-900 font-bold">{formatCurrency(contractMrr)}</span>
              </div>
              <input
                type="range"
                min="2000"
                max="50000"
                step="1000"
                value={contractMrr}
                onChange={(e) => setContractMrr(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>

            {/* Days until renewal */}
            <div className="space-y-1.5">
              <div className="flex justify-between font-semibold">
                <span className="text-stone-700">Days Until Renewal</span>
                <span className="font-mono text-stone-900 font-bold">{daysUntilRenewal} days</span>
              </div>
              <input
                type="range"
                min="10"
                max="365"
                step="5"
                value={daysUntilRenewal}
                onChange={(e) => setDaysUntilRenewal(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Dual-Pane Before/After State & SHAP (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Side-by-Side Comparison Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Baseline */}
            <div className="p-5 rounded-2xl bg-white border border-[#E8E5DD] shadow-sm flex flex-col items-center justify-between">
              <div className="w-full flex items-center justify-between text-xs pb-2 border-b border-[#F0ECE1]">
                <span className="font-mono uppercase font-bold text-stone-500">Unmitigated Baseline</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800">
                  Critical (95%)
                </span>
              </div>
              <div className="py-4">
                <RadialRiskGauge probability={0.95} riskTier="Critical" size={150} />
              </div>
              <div className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFECE4] text-center text-xs">
                <span className="text-stone-500">Baseline MRR Loss: </span>
                <strong className="font-mono text-rose-600 font-bold">$15,702</strong>
              </div>
            </div>

            {/* Counterfactual Simulated State */}
            <div className="p-5 rounded-2xl bg-white border border-[#E8E5DD] shadow-sm flex flex-col items-center justify-between">
              <div className="w-full flex items-center justify-between text-xs pb-2 border-b border-[#F0ECE1]">
                <span className="font-mono uppercase font-bold text-emerald-800">Counterfactual State</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  simResult?.risk_tier === "Critical" 
                    ? "bg-rose-100 text-rose-800" 
                    : simResult?.risk_tier === "High"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}>
                  {simResult ? `${simResult.risk_tier} (${(simResult.churn_probability * 100).toFixed(0)}%)` : "Calculating..."}
                </span>
              </div>
              <div className="py-4">
                <RadialRiskGauge
                  probability={simResult ? simResult.churn_probability : 0.5}
                  riskTier={simResult ? simResult.risk_tier : "Medium"}
                  size={150}
                />
              </div>
              <div className="w-full p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EFECE4] text-center text-xs">
                <span className="text-stone-500">Simulated MRR Loss: </span>
                <strong className="font-mono text-stone-900 font-bold">
                  {simResult ? formatCurrency(simResult.mrr_at_risk) : "..."}
                </strong>
              </div>
            </div>
          </div>

          {/* TreeSHAP Diagnostics Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#E8E5DD] shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0ECE1]">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Simulated TreeSHAP Force Dynamic
              </h3>
              <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-lg border border-[#EFECE4] text-xs">
                <button
                  onClick={() => setActiveTab("forces")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeTab === "forces" ? "bg-[#141312] text-white font-bold" : "text-stone-600"
                  }`}
                >
                  Forces
                </button>
                <button
                  onClick={() => setActiveTab("waterfall")}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    activeTab === "waterfall" ? "bg-[#141312] text-white font-bold" : "text-stone-600"
                  }`}
                >
                  Waterfall
                </button>
              </div>
            </div>

            {simResult ? (
              <div className="space-y-4">
                <div className={activeTab === "forces" ? "block opacity-100 transition-opacity duration-150" : "hidden opacity-0"}>
                  <ForceShapVisualizer
                    drivers={simResult.top_drivers}
                    baseValue={simResult.base_value}
                    totalMargin={simResult.total_margin}
                    predictedProbability={simResult.churn_probability}
                  />
                </div>
                <div className={activeTab === "waterfall" ? "block opacity-100 transition-opacity duration-150" : "hidden opacity-0"}>
                  <ShapWaterfallChart
                    drivers={simResult.top_drivers}
                    baseValue={simResult.base_value}
                    totalMargin={simResult.total_margin}
                    predictedProbability={simResult.churn_probability}
                  />
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-stone-400">
                Calculating counterfactual SHAP attributions...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
