"use client";

import React, { useState, useMemo, useRef } from "react";
import { AccountRecord, PortfolioSummary } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { sound, playTick, playBlip } from "@/lib/sound";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Compass, 
  Flame, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Sparkles,
  SlidersHorizontal,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
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
  const [activeTab, setActiveTab] = useState<"scatter" | "heatmap">("scatter");
  const [filterMode, setFilterMode] = useState<"all" | "high_mrr" | "critical">("all");
  const [minMrrFilter, setMinMrrFilter] = useState<number>(0);
  const [hoveredAccount, setHoveredAccount] = useState<AccountRecord | null>(null);
  const [canvasMousePos, setCanvasMousePos] = useState<{ x: number; y: number; pctX: number; pctY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Max MRR for dynamic Y-scaling
  const maxMrr = useMemo(() => {
    if (accounts.length === 0) return 35000;
    const maxVal = Math.max(...accounts.map((a) => a.contract_mrr));
    return Math.max(maxVal, 30000);
  }, [accounts]);

  // Filtered dataset based on selection & slider
  const filteredAccounts = useMemo(() => {
    let list = accounts.filter((a) => a.contract_mrr >= minMrrFilter);
    if (filterMode === "high_mrr") {
      list = list.filter((a) => a.contract_mrr >= 15000);
    } else if (filterMode === "critical") {
      list = list.filter((a) => (a.churn_probability ?? 0) >= 0.5 || a.risk_tier === "Critical");
    }
    return list;
  }, [accounts, filterMode, minMrrFilter]);

  // Total Portfolio MRR
  const totalPortfolioMrr = useMemo(() => {
    return accounts.reduce((sum, a) => sum + a.contract_mrr, 0) || 1;
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
      p0: { count: p0Count, mrr: p0Mrr, pct: (p0Mrr / totalPortfolioMrr) * 100 },
      expansion: { count: expansionCount, mrr: expansionMrr, pct: (expansionMrr / totalPortfolioMrr) * 100 },
      automated: { count: automatedCount, mrr: automatedMrr, pct: (automatedMrr / totalPortfolioMrr) * 100 },
      stable: { count: stableCount, mrr: stableMrr, pct: (stableMrr / totalPortfolioMrr) * 100 },
    };
  }, [accounts, totalPortfolioMrr]);

  // 4x4 Heatmap Matrix Builder (Usage Change vs Renewal Horizon)
  const heatmapData = useMemo(() => {
    const usageBands = [
      { id: "severe_drop", label: "Critical Drop (<-25%)", badge: "P0 CRITICAL", filter: (u: number) => u < -25 },
      { id: "mod_drop", label: "Moderate Drop (-25% to -5%)", badge: "WATCH", filter: (u: number) => u >= -25 && u < -5 },
      { id: "stable", label: "Equilibrium (-5% to +10%)", badge: "STABLE", filter: (u: number) => u >= -5 && u <= 10 },
      { id: "expansion", label: "High Growth (> +10%)", badge: "EXPANSION", filter: (u: number) => u > 10 },
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

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pctX = Math.min(Math.max(x / rect.width, 0), 1);
    const pctY = Math.min(Math.max(1 - y / rect.height, 0), 1);
    setCanvasMousePos({ x, y, pctX, pctY });
  };

  return (
    <div className="w-full bg-white border border-[#E2EAE4] rounded-[28px] p-6 lg:p-7 text-[#051F20] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.04)] relative overflow-hidden transition-all">
      {/* Top Header & Executive Segmented Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#E2EAE4]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#235347] animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-[#235347]">
              Decision Matrix Intelligence
            </span>
            <span className="text-[11px] font-mono text-[#163832]/30">•</span>
            <span className="text-[11px] font-mono text-[#163832]/60">
              TreeSHAP Calibrated (N={accounts.length})
            </span>
          </div>
          <h3 className="text-xl lg:text-2xl font-serif font-bold text-[#051F20] tracking-tight">
            Portfolio Revenue & Risk Matrix
          </h3>
        </div>

        {/* View Toggle Tabs & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Pills */}
          <div className="flex items-center bg-[#F4F8F5] p-1 rounded-xl border border-[#E2EAE4]">
            <button
              onClick={() => {
                playTick();
                setFilterMode("all");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                filterMode === "all" 
                  ? "bg-[#0B2B26] text-[#FAF0E6] shadow-sm" 
                  : "text-[#163832]/70 hover:text-[#051F20] hover:bg-white/60"
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
                filterMode === "high_mrr" 
                  ? "bg-[#0B2B26] text-[#FAF0E6] shadow-sm" 
                  : "text-[#163832]/70 hover:text-[#051F20] hover:bg-white/60"
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
                filterMode === "critical" 
                  ? "bg-[#8C3A27] text-white shadow-sm" 
                  : "text-[#163832]/70 hover:text-[#8C3A27] hover:bg-white/60"
              }`}
            >
              Critical Risk
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#F4F8F5] p-1 rounded-xl border border-[#E2EAE4]">
            <button
              onClick={() => {
                playBlip();
                setActiveTab("scatter");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === "scatter"
                  ? "bg-white text-[#051F20] border border-[#E2EAE4] shadow-sm"
                  : "text-[#163832]/70 hover:text-[#051F20]"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#235347]" />
              2D Quadrant Map
            </button>
            <button
              onClick={() => {
                playBlip();
                setActiveTab("heatmap");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === "heatmap"
                  ? "bg-white text-[#051F20] border border-[#E2EAE4] shadow-sm"
                  : "text-[#163832]/70 hover:text-[#051F20]"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-[#D97706]" />
              4×4 Heatmap
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="pt-5">
        <AnimatePresence mode="wait">
          {activeTab === "scatter" && (
            <motion.div
              key="scatter-view"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-5"
            >
              {/* 2D Quadrant Scatter Grid Canvas */}
              <div 
                ref={canvasRef}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={() => setCanvasMousePos(null)}
                className="relative w-full h-[430px] bg-[#F8FAF9] rounded-2xl border border-[#E2EAE4] p-6 select-none overflow-hidden group shadow-inner"
              >
                {/* 4 Soft Tinted Quadrant Background Zones */}
                {/* Q1: Top-Right (P0 Crisis Escalation) */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#FFF5F5]/60 border-b border-l border-dashed border-rose-200/80 pointer-events-none" />
                {/* Q2: Top-Left (Expansion & Upsell) */}
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-[#F0FAF4]/60 border-b border-r border-dashed border-emerald-200/80 pointer-events-none" />
                {/* Q3: Bottom-Right (Automated Nurture) */}
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[#FFFDF0]/60 border-t border-l border-dashed border-amber-200/80 pointer-events-none" />
                {/* Q4: Bottom-Left (Stable Core) */}
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#F8FAFC]/60 border-t border-r border-dashed border-slate-200/80 pointer-events-none" />

                {/* Subtle Coordinate Grid Lines */}
                <div 
                  className="absolute inset-0 opacity-25 pointer-events-none"
                  style={{
                    backgroundImage: `linear-gradient(to right, #E2EAE4 1px, transparent 1px), linear-gradient(to bottom, #E2EAE4 1px, transparent 1px)`,
                    backgroundSize: `48px 48px`
                  }}
                />

                {/* Quadrant Strategic Designation Labels */}
                {/* Q1: Top-Right (P0 CRISIS INTERVENTION) */}
                <div className="absolute top-3.5 right-5 text-right pointer-events-none z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-700 shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    P0 Crisis Intervention
                  </div>
                  <div className="text-[11px] font-mono text-rose-800 font-bold mt-1">
                    {quadrantStats.p0.count} Accounts • {formatCurrency(quadrantStats.p0.mrr)} MRR
                  </div>
                </div>

                {/* Q2: Top-Left (EXPANSION & UPSELL) */}
                <div className="absolute top-3.5 left-14 text-left pointer-events-none z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-800 shadow-sm">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Expansion & Upsell
                  </div>
                  <div className="text-[11px] font-mono text-emerald-800 font-bold mt-1">
                    {quadrantStats.expansion.count} Accounts • {formatCurrency(quadrantStats.expansion.mrr)} MRR
                  </div>
                </div>

                {/* Q3: Bottom-Right (AUTOMATED NURTURE) */}
                <div className="absolute bottom-11 right-5 text-right pointer-events-none z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 shadow-sm">
                    <Zap className="w-3 h-3 text-amber-600" />
                    Automated Playbooks
                  </div>
                  <div className="text-[11px] font-mono text-amber-800 font-bold mt-1">
                    {quadrantStats.automated.count} Accounts • {formatCurrency(quadrantStats.automated.mrr)} MRR
                  </div>
                </div>

                {/* Q4: Bottom-Left (STABLE CORE) */}
                <div className="absolute bottom-11 left-14 text-left pointer-events-none z-10">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 shadow-sm">
                    <Sparkles className="w-3 h-3 text-slate-500" />
                    Stable Core Retention
                  </div>
                  <div className="text-[11px] font-mono text-slate-700 font-bold mt-1">
                    {quadrantStats.stable.count} Accounts • {formatCurrency(quadrantStats.stable.mrr)} MRR
                  </div>
                </div>

                {/* Interactive Dynamic Cursor Laser Crosshair */}
                {canvasMousePos && (
                  <div className="pointer-events-none absolute inset-0 z-15">
                    <div 
                      className="absolute top-0 bottom-0 w-[1px] bg-[#235347]/30 border-r border-dashed border-[#235347]/50"
                      style={{ left: `${canvasMousePos.x}px` }}
                    />
                    <div 
                      className="absolute left-0 right-0 h-[1px] bg-[#235347]/30 border-b border-dashed border-[#235347]/50"
                      style={{ top: `${canvasMousePos.y}px` }}
                    />
                    <div 
                      className="absolute bg-[#051F20] text-[#FAF0E6] border border-[#163832] rounded-lg px-2.5 py-1 text-[10px] font-mono shadow-md backdrop-blur-md -translate-x-1/2 -translate-y-8"
                      style={{ left: `${canvasMousePos.x}px`, top: `${canvasMousePos.y}px` }}
                    >
                      Risk: {Math.round(canvasMousePos.pctX * 100)}% • MRR: ${Math.round(canvasMousePos.pctY * maxMrr).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Y-Axis Label */}
                <div className="absolute left-2 top-[48%] -rotate-90 origin-center text-[10px] font-mono font-bold uppercase tracking-widest text-[#163832]/60 flex items-center gap-1">
                  <span>▲ Contract Value (MRR)</span>
                </div>

                {/* X-Axis Label */}
                <div className="absolute bottom-2 left-[50%] -translate-x-1/2 text-[10px] font-mono font-bold uppercase tracking-widest text-[#163832]/60 flex items-center gap-3">
                  <span className="text-emerald-700">0% Safe</span>
                  <span>─────────────</span>
                  <span className="text-amber-700">50% Risk Horizon</span>
                  <span>─────────────</span>
                  <span className="text-rose-700">100% Imminent Churn ►</span>
                </div>

                {/* Plotting Bubbles Canvas Container */}
                <div className="absolute inset-x-14 top-10 bottom-14">
                  {filteredAccounts.map((account) => {
                    const prob = account.churn_probability ?? 0;
                    const mrr = account.contract_mrr;
                    const isSelected = selectedAccount?.account_id === account.account_id;
                    const isHovered = hoveredAccount?.account_id === account.account_id;

                    const leftPct = Math.min(Math.max(prob * 90 + 5, 4), 96);
                    const bottomPct = Math.min(Math.max((mrr / maxMrr) * 85 + 5, 6), 94);

                    // Polished Clean Palette
                    let colorClass = "bg-[#DAF1DE] text-[#163832] border-[#8EB69B] shadow-sm";
                    let ringColor = "ring-[#235347]";
                    if (prob >= 0.75) {
                      colorClass = "bg-[#FFE9E9] text-[#8E2424] border-[#FFC2C2] shadow-sm";
                      ringColor = "ring-[#8E2424]";
                    } else if (prob >= 0.5) {
                      colorClass = "bg-[#FFF7D1] text-[#7A5800] border-[#FFE885] shadow-sm";
                      ringColor = "ring-[#7A5800]";
                    }

                    const bubbleSize = Math.max(Math.min(26 + (mrr / 35000) * 16, 44), 26);

                    return (
                      <React.Fragment key={account.account_id}>
                        {/* Interactive Axis Vector Ties on Hover/Selection */}
                        {(isHovered || isSelected) && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none z-15 overflow-visible">
                            <line 
                              x1={`${leftPct}%`} 
                              y1={`${100 - bottomPct}%`} 
                              x2={`${leftPct}%`} 
                              y2="100%" 
                              stroke={prob >= 0.5 ? "#8C3A27" : "#235347"} 
                              strokeWidth="1.5" 
                              strokeDasharray="3 3" 
                              opacity="0.8"
                            />
                            <line 
                              x1={`${leftPct}%`} 
                              y1={`${100 - bottomPct}%`} 
                              x2="0%" 
                              y2={`${100 - bottomPct}%`} 
                              stroke={prob >= 0.5 ? "#8C3A27" : "#235347"} 
                              strokeWidth="1.5" 
                              strokeDasharray="3 3" 
                              opacity="0.8"
                            />
                          </svg>
                        )}

                        {/* Interactive Node Emblem */}
                        <motion.div
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
                          className={`absolute -translate-x-1/2 translate-y-1/2 rounded-full cursor-pointer flex items-center justify-center font-mono font-bold text-[10px] border-2 transition-transform duration-200 ${colorClass} ${
                            isSelected 
                              ? `ring-4 ${ringColor} scale-125 z-30 shadow-md` 
                              : "hover:scale-130 hover:z-25 opacity-90 hover:opacity-100"
                          }`}
                          whileHover={{ scale: 1.3 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="font-extrabold tracking-tight">
                            {account.company_name.substring(0, 2).toUpperCase()}
                          </span>

                          {(isSelected || prob >= 0.8) && (
                            <span className="absolute -inset-1.5 rounded-full border-2 border-rose-400 animate-ping opacity-40" />
                          )}
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Clean Floating Telemetry Tooltip on Hover */}
                <AnimatePresence>
                  {hoveredAccount && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 6 }}
                      className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#051F20] text-[#FAF0E6] border border-[#163832] rounded-2xl px-5 py-3 shadow-2xl z-40 pointer-events-none flex items-center gap-5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono text-[#8EB69B] font-bold uppercase">
                            {hoveredAccount.account_id}
                          </span>
                          <span className="text-xs font-serif text-white font-bold">
                            {hoveredAccount.company_name}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-white flex items-center gap-3 mt-1">
                          <span>MRR: <strong className="text-[#DAF1DE]">{formatCurrency(hoveredAccount.contract_mrr)}</strong></span>
                          <span>•</span>
                          <span>Risk: <strong className={(hoveredAccount.churn_probability ?? 0) >= 0.5 ? "text-rose-300" : "text-emerald-300"}>{Math.round((hoveredAccount.churn_probability ?? 0) * 100)}%</strong></span>
                        </div>
                      </div>
                      <div className="pl-4 border-l border-[#163832] text-[11px] font-mono text-[#FAF0E6]/80 space-y-0.5">
                        <div>Usage Δ: <span className={(hoveredAccount.usage_change_pct_30d ?? 0) < 0 ? "text-rose-300 font-bold" : "text-emerald-300 font-bold"}>{hoveredAccount.usage_change_pct_30d ?? 0}%</span></div>
                        <div>Renewal: <span className="text-amber-300 font-bold">{hoveredAccount.days_until_renewal ?? 60}d</span></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 4 Clean Editorial Bento KPI Pods */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                {/* P0 Crisis Pod */}
                <div className="bg-[#FFE9E9]/70 border border-[#FFC2C2] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#8E2424] font-bold tracking-wider">
                      P0 Crisis Exposure
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#8E2424] font-mono text-[10px] font-bold border border-[#FFC2C2]">
                      {quadrantStats.p0.count} accts
                    </span>
                  </div>
                  <div className="text-xl font-serif font-bold text-[#8E2424] mt-2">
                    {formatCurrency(quadrantStats.p0.mrr)}
                  </div>
                  <div className="w-full bg-[#FFC2C2]/60 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-[#8E2424] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(quadrantStats.p0.pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Expansion Pod */}
                <div className="bg-[#EAF5E8]/70 border border-[#C1E7BC] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#235E23] font-bold tracking-wider">
                      Expansion ARR Pool
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#235E23] font-mono text-[10px] font-bold border border-[#C1E7BC]">
                      {quadrantStats.expansion.count} accts
                    </span>
                  </div>
                  <div className="text-xl font-serif font-bold text-[#235E23] mt-2">
                    {formatCurrency(quadrantStats.expansion.mrr * 12)}
                  </div>
                  <div className="w-full bg-[#C1E7BC]/60 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-[#235E23] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(quadrantStats.expansion.pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Automated Nurture Pod */}
                <div className="bg-[#FFF7D1]/70 border border-[#FFE885] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#7A5800] font-bold tracking-wider">
                      Automated Playbooks
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#7A5800] font-mono text-[10px] font-bold border border-[#FFE885]">
                      {quadrantStats.automated.count} accts
                    </span>
                  </div>
                  <div className="text-xl font-serif font-bold text-[#7A5800] mt-2">
                    {formatCurrency(quadrantStats.automated.mrr)}
                  </div>
                  <div className="w-full bg-[#FFE885]/60 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-[#7A5800] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(quadrantStats.automated.pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stable Base Pod */}
                <div className="bg-[#EDF0FF]/70 border border-[#CCD4FF] rounded-2xl p-4 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#2C3D8F] font-bold tracking-wider">
                      Stable Core Retention
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#2C3D8F] font-mono text-[10px] font-bold border border-[#CCD4FF]">
                      {quadrantStats.stable.count} accts
                    </span>
                  </div>
                  <div className="text-xl font-serif font-bold text-[#2C3D8F] mt-2">
                    {formatCurrency(quadrantStats.stable.mrr)}
                  </div>
                  <div className="w-full bg-[#CCD4FF]/60 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-[#2C3D8F] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(quadrantStats.stable.pct, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "heatmap" && (
            <motion.div
              key="heatmap-view"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Heatmap Matrix Table in Editorial Light Theme */}
              <div className="bg-[#F8FAF9] rounded-2xl border border-[#E2EAE4] p-5 overflow-x-auto shadow-inner">
                <div className="text-xs font-mono font-bold text-[#051F20] mb-3.5 flex items-center justify-between border-b border-[#E2EAE4] pb-2.5">
                  <span className="flex items-center gap-2 text-[#235347]">
                    <Layers className="w-4 h-4" /> 4×4 MULTIDIMENSIONAL COHORT DENSITY GRID
                  </span>
                  <span className="text-[11px] text-[#235347] font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Click any cell to inspect cohort accounts
                  </span>
                </div>

                <div className="min-w-[640px]">
                  {/* Column Header (Renewal Horizon) */}
                  <div className="grid grid-cols-5 gap-3 pb-2.5 text-[11px] font-mono font-bold text-[#163832]/70 text-center">
                    <div className="text-left font-serif text-[#051F20]">Usage Metric \ Renewal</div>
                    <div className="bg-[#FFE9E9] text-[#8E2424] border border-[#FFC2C2] rounded-lg py-1.5">&lt; 30 Days (Urgent)</div>
                    <div className="bg-[#FFF7D1] text-[#7A5800] border border-[#FFE885] rounded-lg py-1.5">30 - 60 Days</div>
                    <div className="bg-[#EAF5E8] text-[#235E23] border border-[#C1E7BC] rounded-lg py-1.5">60 - 90 Days</div>
                    <div className="bg-[#EDF0FF] text-[#2C3D8F] border border-[#CCD4FF] rounded-lg py-1.5">&gt; 90 Days</div>
                  </div>

                  {/* Rows */}
                  <div className="space-y-2.5">
                    {heatmapData.map((row) => (
                      <div key={row.usageBand.id} className="grid grid-cols-5 gap-3 items-center">
                        <div className="text-xs font-mono font-bold text-[#051F20] pr-2 flex items-center justify-between">
                          <span>{row.usageBand.label}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-white border border-[#E2EAE4] text-[#163832]/80 font-mono">{row.usageBand.badge}</span>
                        </div>
                        {row.cells.map((cell, idx) => {
                          const hasAccounts = cell.count > 0;
                          const hasHeavyLoss = cell.totalLoss > 15000;
                          
                          let bgCell = "bg-white border-[#E2EAE4]";
                          let textLoss = "text-[#235347]";
                          if (hasHeavyLoss || (hasAccounts && cell.renewalBand.id === "urgent" && row.usageBand.id === "severe_drop")) {
                            bgCell = "bg-[#FFE9E9] border-[#FFC2C2] text-[#8E2424] hover:shadow-md";
                            textLoss = "text-[#8E2424]";
                          } else if (hasAccounts && row.usageBand.id === "severe_drop") {
                            bgCell = "bg-[#FFF7D1] border-[#FFE885] text-[#7A5800] hover:shadow-md";
                            textLoss = "text-[#7A5800]";
                          } else if (hasAccounts) {
                            bgCell = "bg-[#EAF5E8] border-[#C1E7BC] text-[#235E23] hover:shadow-md";
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
                                hasAccounts ? "cursor-pointer hover:scale-[1.02] shadow-sm" : "opacity-30 cursor-not-allowed"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-[#051F20] flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#235347]" />
                                  {cell.count} {cell.count === 1 ? "Acct" : "Accts"}
                                </span>
                                {hasHeavyLoss && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                )}
                              </div>
                              <div>
                                <div className="text-[10px] font-mono text-[#163832]/60">MRR at Risk</div>
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
