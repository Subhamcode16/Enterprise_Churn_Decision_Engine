"use client";

import React, { useState, useMemo } from "react";
import { AccountRecord, PortfolioSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { sound, playTick, playBlip } from "@/lib/sound";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Compass, 
  Flame, 
  TrendingUp, 
  AlertTriangle, 
  ShieldCheck, 
  Zap, 
  Layers, 
  ArrowUpRight, 
  Filter, 
  Sparkles,
  Search,
  Maximize2
} from "lucide-react";

interface PortfolioRiskMatrixProps {
  accounts: AccountRecord[];
  selectedAccount: AccountRecord | null;
  onSelectAccount: (account: AccountRecord) => void;
  summary: PortfolioSummary | null;
}

export default function PortfolioRiskMatrix({
  accounts,
  selectedAccount,
  onSelectAccount,
  summary,
}: PortfolioRiskMatrixProps) {
  const [activeTab, setActiveTab] = useState<"scatter" | "heatmap" | "distribution">("scatter");
  const [filterMode, setFilterMode] = useState<"all" | "high_mrr" | "critical">("all");
  const [hoveredAccount, setHoveredAccount] = useState<AccountRecord | null>(null);

  // Filtered dataset based on selection
  const filteredAccounts = useMemo(() => {
    if (filterMode === "high_mrr") {
      return accounts.filter((a) => a.contract_mrr >= 15000);
    }
    if (filterMode === "critical") {
      return accounts.filter((a) => (a.churn_probability ?? 0) >= 0.6 || a.risk_tier === "Critical");
    }
    return accounts;
  }, [accounts, filterMode]);

  // Max MRR for dynamic Y-scaling
  const maxMrr = useMemo(() => {
    if (accounts.length === 0) return 35000;
    const maxVal = Math.max(...accounts.map((a) => a.contract_mrr));
    return Math.max(maxVal, 30000);
  }, [accounts]);

  // Quadrant stats calculation
  const quadrantStats = useMemo(() => {
    let p0Mrr = 0, p0Count = 0;
    let expansionMrr = 0, expansionCount = 0;
    let automatedMrr = 0, automatedCount = 0;
    let stableMrr = 0, stableCount = 0;

    accounts.forEach((acc) => {
      const isHighVal = acc.contract_mrr >= 12000;
      const isHighRisk = (acc.churn_probability ?? 0) >= 0.5;

      if (isHighVal && isHighRisk) {
        p0Mrr += acc.contract_mrr;
        p0Count++;
      } else if (isHighVal && !isHighRisk) {
        expansionMrr += acc.contract_mrr;
        expansionCount++;
      } else if (!isHighVal && isHighRisk) {
        automatedMrr += acc.contract_mrr;
        automatedCount++;
      } else {
        stableMrr += acc.contract_mrr;
        stableCount++;
      }
    });

    return {
      p0: { count: p0Count, mrr: p0Mrr },
      expansion: { count: expansionCount, mrr: expansionMrr },
      automated: { count: automatedCount, mrr: automatedMrr },
      stable: { count: stableCount, mrr: stableMrr },
    };
  }, [accounts]);

  // 4x4 Heatmap Matrix Builder (Usage Change vs Renewal Horizon)
  const heatmapData = useMemo(() => {
    const usageBands = [
      { id: "severe_drop", label: "Severe Drop (<-25%)", filter: (u: number) => u < -25 },
      { id: "mod_drop", label: "Moderate Drop (-25% to -5%)", filter: (u: number) => u >= -25 && u < -5 },
      { id: "stable", label: "Stable (-5% to +10%)", filter: (u: number) => u >= -5 && u <= 10 },
      { id: "expansion", label: "Expansion (> +10%)", filter: (u: number) => u > 10 },
    ];

    const renewalBands = [
      { id: "urgent", label: "< 30 Days", filter: (d: number) => d <= 30 },
      { id: "q1", label: "30 - 60 Days", filter: (d: number) => d > 30 && d <= 60 },
      { id: "q2", label: "60 - 90 Days", filter: (d: number) => d > 60 && d <= 90 },
      { id: "distant", label: "> 90 Days", filter: (d: number) => d > 90 },
    ];

    return usageBands.map((uBand) => {
      return {
        usageBand: uBand,
        cells: renewalBands.map((rBand) => {
          const matchingAccounts = accounts.filter(
            (acc) => uBand.filter(acc.usage_change_pct_30d ?? 0) && rBand.filter(acc.days_until_renewal ?? 60)
          );
          const totalLoss = matchingAccounts.reduce((sum, a) => sum + (a.mrr_at_risk ?? (a.churn_probability ?? 0) * a.contract_mrr), 0);
          const totalMrr = matchingAccounts.reduce((sum, a) => sum + a.contract_mrr, 0);

          return {
            renewalBand: rBand,
            accounts: matchingAccounts,
            count: matchingAccounts.length,
            totalLoss,
            totalMrr,
          };
        }),
      };
    });
  }, [accounts]);

  return (
    <div className="w-full bg-[#051F20] border border-[#163832]/60 rounded-[32px] p-6 lg:p-8 text-[#FAF0E6] shadow-[0_16px_48px_-8px_rgba(5,31,32,0.5)] relative overflow-hidden">
      {/* Background Ambient Radial Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-[#0B2B26]/80 via-[#235347]/10 to-transparent blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#8C3A27]/20 via-transparent to-transparent blur-3xl pointer-events-none -z-0" />

      {/* Top Header & Segmented Toolbar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#163832]/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-emerald-300">
              Institutional Intelligence Suite
            </span>
            <span className="text-[11px] font-mono text-[#FAF0E6]/40">•</span>
            <span className="text-[11px] font-mono text-[#FAF0E6]/60">TreeSHAP Calibrated (N={accounts.length})</span>
          </div>
          <h3 className="text-xl lg:text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            Portfolio Revenue & Risk Matrix
          </h3>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Pills */}
          <div className="flex items-center bg-[#0B2B26] p-1 rounded-xl border border-[#163832]">
            <button
              onClick={() => {
                playTick();
                setFilterMode("all");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                filterMode === "all" ? "bg-[#235347] text-white shadow" : "text-[#FAF0E6]/60 hover:text-white"
              }`}
            >
              All ({accounts.length})
            </button>
            <button
              onClick={() => {
                playTick();
                setFilterMode("high_mrr");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                filterMode === "high_mrr" ? "bg-[#235347] text-white shadow" : "text-[#FAF0E6]/60 hover:text-white"
              }`}
            >
              MRR &gt; $15k
            </button>
            <button
              onClick={() => {
                playTick();
                setFilterMode("critical");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                filterMode === "critical" ? "bg-[#8C3A27] text-white shadow" : "text-[#FAF0E6]/60 hover:text-white"
              }`}
            >
              Critical Risk
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#0B2B26] p-1 rounded-xl border border-[#163832]">
            <button
              onClick={() => {
                playBlip();
                setActiveTab("scatter");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === "scatter"
                  ? "bg-gradient-to-r from-[#235347] to-[#0B2B26] text-white border border-emerald-500/30 shadow-md"
                  : "text-[#FAF0E6]/60 hover:text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              2D Quadrant Map
            </button>
            <button
              onClick={() => {
                playBlip();
                setActiveTab("heatmap");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === "heatmap"
                  ? "bg-gradient-to-r from-[#235347] to-[#0B2B26] text-white border border-emerald-500/30 shadow-md"
                  : "text-[#FAF0E6]/60 hover:text-white"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              Cohort Heatmap
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="relative z-10 pt-6">
        <AnimatePresence mode="wait">
          {activeTab === "scatter" && (
            <motion.div
              key="scatter-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* 2D Quadrant Scatter Grid Canvas */}
              <div className="relative w-full h-[420px] bg-[#072422]/90 rounded-2xl border border-[#163832] p-6 select-none overflow-hidden">
                {/* 4 Strategic Quadrant Background Badges & Faint Grid Lines */}
                {/* Horizontal Divider Line at Median ($15,000 MRR) */}
                <div className="absolute left-10 right-6 top-[50%] h-[1px] bg-[#163832]/80 border-t border-dashed border-[#235347]/40 pointer-events-none" />
                {/* Vertical Divider Line at 50% Churn Risk */}
                <div className="absolute top-6 bottom-10 left-[50%] w-[1px] bg-[#163832]/80 border-l border-dashed border-[#235347]/40 pointer-events-none" />

                {/* Quadrant 1: Top-Right (P0 CRISIS ESCALATION) */}
                <div className="absolute top-3 right-6 text-right pointer-events-none">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/60 border border-rose-800/40 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    P0 Crisis Intervention
                  </div>
                  <div className="text-[10px] font-mono text-rose-400/80 mt-0.5">
                    {quadrantStats.p0.count} Accounts • {formatCurrency(quadrantStats.p0.mrr)} MRR
                  </div>
                </div>

                {/* Quadrant 2: Top-Left (EXPANSION & UPSELL) */}
                <div className="absolute top-3 left-14 text-left pointer-events-none">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/60 border border-emerald-800/40 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Expansion & Upsell
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400/80 mt-0.5">
                    {quadrantStats.expansion.count} Accounts • {formatCurrency(quadrantStats.expansion.mrr)} MRR
                  </div>
                </div>

                {/* Quadrant 3: Bottom-Right (AUTOMATED NURTURE) */}
                <div className="absolute bottom-12 right-6 text-right pointer-events-none">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/60 border border-amber-800/40 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                    <Zap className="w-3 h-3 text-amber-400" />
                    Automated Playbooks
                  </div>
                  <div className="text-[10px] font-mono text-amber-400/80 mt-0.5">
                    {quadrantStats.automated.count} Accounts • {formatCurrency(quadrantStats.automated.mrr)} MRR
                  </div>
                </div>

                {/* Quadrant 4: Bottom-Left (STABLE SELF-SERVE) */}
                <div className="absolute bottom-12 left-14 text-left pointer-events-none">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-700/40 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
                    Stable Core Platform
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    {quadrantStats.stable.count} Accounts • {formatCurrency(quadrantStats.stable.mrr)} MRR
                  </div>
                </div>

                {/* Y-Axis Label */}
                <div className="absolute left-2 top-[45%] -rotate-90 origin-center text-[10px] font-mono font-bold uppercase tracking-widest text-[#FAF0E6]/50">
                  ▲ Contract Value (MRR)
                </div>

                {/* X-Axis Label */}
                <div className="absolute bottom-2 left-[50%] -translate-x-1/2 text-[10px] font-mono font-bold uppercase tracking-widest text-[#FAF0E6]/50 flex items-center gap-2">
                  <span>0% Safe</span>
                  <span>─────────────</span>
                  <span className="text-amber-400">50% Risk Horizon</span>
                  <span>─────────────</span>
                  <span className="text-rose-400">100% Imminent Churn ►</span>
                </div>

                {/* Plotting Bubbles */}
                <div className="absolute inset-x-12 top-8 bottom-12">
                  {filteredAccounts.map((account) => {
                    const prob = account.churn_probability ?? 0;
                    const mrr = account.contract_mrr;
                    const isSelected = selectedAccount?.account_id === account.account_id;
                    const isHovered = hoveredAccount?.account_id === account.account_id;

                    // Calculate position percentages (5% to 95% padding to keep bubbles inside)
                    const leftPct = Math.min(Math.max(prob * 90 + 5, 4), 96);
                    const bottomPct = Math.min(Math.max((mrr / maxMrr) * 85 + 5, 6), 94);

                    // Dynamic color & glow based on risk tier
                    let colorClass = "bg-emerald-400 text-emerald-950 shadow-[0_0_12px_rgba(52,211,153,0.4)]";
                    let ringClass = "border-emerald-300";
                    if (prob >= 0.75) {
                      colorClass = "bg-rose-500 text-white shadow-[0_0_16px_rgba(244,63,94,0.6)]";
                      ringClass = "border-rose-400";
                    } else if (prob >= 0.5) {
                      colorClass = "bg-amber-400 text-amber-950 shadow-[0_0_12px_rgba(251,191,36,0.5)]";
                      ringClass = "border-amber-300";
                    }

                    // Node radius scaling by MRR ($5k -> 24px, $35k -> 40px)
                    const bubbleSize = Math.max(Math.min(22 + (mrr / 35000) * 16, 40), 22);

                    return (
                      <motion.div
                        key={account.account_id}
                        onClick={() => {
                          playBlip();
                          onSelectAccount(account);
                        }}
                        onMouseEnter={() => {
                          playTick();
                          setHoveredAccount(account);
                        }}
                        onMouseLeave={() => setHoveredAccount(null)}
                        style={{
                          left: `${leftPct}%`,
                          bottom: `${bottomPct}%`,
                          width: `${bubbleSize}px`,
                          height: `${bubbleSize}px`,
                        }}
                        className={`absolute -translate-x-1/2 translate-y-1/2 rounded-full cursor-pointer flex items-center justify-center font-mono font-bold text-[9px] transition-transform duration-200 ${colorClass} ${
                          isSelected ? "ring-4 ring-white scale-125 z-30" : "hover:scale-135 hover:z-20 opacity-90 hover:opacity-100"
                        }`}
                        whileHover={{ scale: 1.35 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {/* Company Initials */}
                        {account.company_name.substring(0, 2).toUpperCase()}

                        {/* Pulse Ring for Selected Account or Critical Risk */}
                        {(isSelected || prob >= 0.8) && (
                          <span className={`absolute -inset-1 rounded-full border-2 ${ringClass} animate-ping opacity-40`} />
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* Floating Telemetry Badge on Hover */}
                <AnimatePresence>
                  {hoveredAccount && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 5 }}
                      className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#0B2B26]/95 backdrop-blur-md border border-emerald-500/40 rounded-xl px-4 py-2.5 shadow-2xl z-40 pointer-events-none flex items-center gap-4"
                    >
                      <div>
                        <div className="text-[10px] font-mono text-emerald-300 font-bold uppercase">
                          {hoveredAccount.account_id} • {hoveredAccount.company_name}
                        </div>
                        <div className="text-xs font-mono text-white flex items-center gap-2 mt-0.5">
                          <span>MRR: <strong className="text-emerald-400">{formatCurrency(hoveredAccount.contract_mrr)}</strong></span>
                          <span>•</span>
                          <span>Risk: <strong className={(hoveredAccount.churn_probability ?? 0) > 0.5 ? "text-rose-400" : "text-emerald-400"}>{Math.round((hoveredAccount.churn_probability ?? 0) * 100)}%</strong></span>
                        </div>
                      </div>
                      <div className="pl-3 border-l border-[#163832] text-[10px] font-mono text-[#FAF0E6]/70">
                        <div>Usage: <span className={(hoveredAccount.usage_change_pct_30d ?? 0) < 0 ? "text-rose-300" : "text-emerald-300"}>{hoveredAccount.usage_change_pct_30d ?? 0}%</span></div>
                        <div>Renewal: <span>{hoveredAccount.days_until_renewal ?? 60}d</span></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Quadrant Metric Summary Badges */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div className="bg-[#072422] border border-rose-900/40 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-rose-400 font-bold">P0 Crisis Exposure</div>
                    <div className="text-lg font-serif font-bold text-white">{formatCurrency(quadrantStats.p0.mrr)}</div>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-rose-950/80 text-rose-300 font-mono text-xs font-bold">
                    {quadrantStats.p0.count} accts
                  </span>
                </div>

                <div className="bg-[#072422] border border-emerald-900/40 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Expansion ARR</div>
                    <div className="text-lg font-serif font-bold text-white">{formatCurrency(quadrantStats.expansion.mrr * 12)}</div>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-emerald-950/80 text-emerald-300 font-mono text-xs font-bold">
                    {quadrantStats.expansion.count} accts
                  </span>
                </div>

                <div className="bg-[#072422] border border-amber-900/40 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">Digital Nurture Load</div>
                    <div className="text-lg font-serif font-bold text-white">{formatCurrency(quadrantStats.automated.mrr)}</div>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-amber-950/80 text-amber-300 font-mono text-xs font-bold">
                    {quadrantStats.automated.count} accts
                  </span>
                </div>

                <div className="bg-[#072422] border border-slate-700/40 rounded-2xl p-3.5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">Stable Platform Base</div>
                    <div className="text-lg font-serif font-bold text-white">{formatCurrency(quadrantStats.stable.mrr)}</div>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-slate-900/80 text-slate-300 font-mono text-xs font-bold">
                    {quadrantStats.stable.count} accts
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "heatmap" && (
            <motion.div
              key="heatmap-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {/* Heatmap Matrix Table */}
              <div className="bg-[#072422]/90 rounded-2xl border border-[#163832] p-5 overflow-x-auto">
                <div className="text-xs font-mono font-bold text-[#FAF0E6]/70 mb-3 flex items-center justify-between">
                  <span>VERTICAL: 30-Day Telemetry Usage Delta vs. HORIZONTAL: Renewal Horizon Window</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Click cell to inspect cohort accounts</span>
                </div>

                <div className="min-w-[620px]">
                  {/* Column Header (Renewal Horizon) */}
                  <div className="grid grid-cols-5 gap-2.5 pb-2 text-[11px] font-mono font-bold text-[#FAF0E6]/60 text-center">
                    <div className="text-left font-serif text-emerald-300">Usage Band \ Renewal</div>
                    <div>&lt; 30 Days</div>
                    <div>30 - 60 Days</div>
                    <div>60 - 90 Days</div>
                    <div>&gt; 90 Days</div>
                  </div>

                  {/* Rows */}
                  <div className="space-y-2.5">
                    {heatmapData.map((row) => (
                      <div key={row.usageBand.id} className="grid grid-cols-5 gap-2.5 items-center">
                        <div className="text-xs font-mono font-bold text-[#FAF0E6]/90 pr-2">
                          {row.usageBand.label}
                        </div>
                        {row.cells.map((cell, idx) => {
                          const hasAccounts = cell.count > 0;
                          const hasHeavyLoss = cell.totalLoss > 15000;
                          
                          // Color density
                          let bgCell = "bg-[#0B2B26]/60 border-[#163832]";
                          let textLoss = "text-emerald-400";
                          if (hasHeavyLoss || (hasAccounts && cell.renewalBand.id === "urgent" && row.usageBand.id === "severe_drop")) {
                            bgCell = "bg-rose-950/70 border-rose-700/60 hover:border-rose-500 shadow-[0_0_14px_rgba(244,63,94,0.2)]";
                            textLoss = "text-rose-300";
                          } else if (hasAccounts && row.usageBand.id === "severe_drop") {
                            bgCell = "bg-amber-950/60 border-amber-700/50 hover:border-amber-400";
                            textLoss = "text-amber-300";
                          } else if (hasAccounts) {
                            bgCell = "bg-[#163832]/80 border-emerald-800/40 hover:border-emerald-500";
                          }

                          return (
                            <button
                              key={idx}
                              onClick={() => {
                                if (cell.accounts.length > 0) {
                                  playBlip();
                                  onSelectAccount(cell.accounts[0]);
                                }
                              }}
                              disabled={!hasAccounts}
                              className={`h-20 rounded-xl border p-2.5 flex flex-col justify-between text-left transition-all ${bgCell} ${
                                hasAccounts ? "cursor-pointer hover:scale-[1.02] hover:shadow-lg" : "opacity-30 cursor-not-allowed"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-white">
                                  {cell.count} {cell.count === 1 ? "Acct" : "Accts"}
                                </span>
                                {hasHeavyLoss && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                )}
                              </div>
                              <div>
                                <div className="text-[10px] font-mono text-[#FAF0E6]/50">MRR at Risk</div>
                                <div className={`text-xs font-mono font-bold ${textLoss}`}>
                                  {cell.totalLoss > 0 ? formatCurrency(cell.totalLoss) : "$0"}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
