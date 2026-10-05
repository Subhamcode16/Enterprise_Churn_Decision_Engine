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
  Eye,
  EyeOff
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
  const [showDensityContour, setShowDensityContour] = useState<boolean>(true);
  const [hoveredAccount, setHoveredAccount] = useState<AccountRecord | null>(null);
  const [hoveredHeatCell, setHoveredHeatCell] = useState<{
    usageLabel: string;
    renewalLabel: string;
    accounts: AccountRecord[];
    totalLoss: number;
    totalMrr: number;
  } | null>(null);
  const [canvasMousePos, setCanvasMousePos] = useState<{ x: number; y: number; pctX: number; pctY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Max MRR for dynamic Y-scaling
  const maxMrr = useMemo(() => {
    if (accounts.length === 0) return 35000;
    const maxVal = Math.max(...accounts.map((a) => a.contract_mrr));
    return Math.max(maxVal, 30000);
  }, [accounts]);

  // Filtered dataset based on selection
  const filteredAccounts = useMemo(() => {
    if (filterMode === "high_mrr") {
      return accounts.filter((a) => a.contract_mrr >= 15000);
    }
    if (filterMode === "critical") {
      return accounts.filter((a) => (a.churn_probability ?? 0) >= 0.5 || a.risk_tier === "Critical");
    }
    return accounts;
  }, [accounts, filterMode]);

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

  // WHOOP-Style 6-Horizon x 4-Health Band Telemetry Heatmap Data
  const heatmapData = useMemo(() => {
    const usageBands = [
      { id: "severe_drop", label: "Critical Drop (<-25%)", badge: "P0 CRITICAL", filter: (u: number) => u < -25 },
      { id: "mod_drop", label: "Moderate Attrition (-25% to -5%)", badge: "WATCH", filter: (u: number) => u >= -25 && u < -5 },
      { id: "stable", label: "Equilibrium (-5% to +10%)", badge: "STABLE", filter: (u: number) => u >= -5 && u <= 10 },
      { id: "expansion", label: "Expansion Growth (> +10%)", badge: "EXPANSION", filter: (u: number) => u > 10 },
    ];

    const renewalBands = [
      { id: "urgent", label: "< 30 Days", tag: "Q1 Urgent", filter: (d: number) => d <= 30 },
      { id: "m2", label: "30 - 60 Days", tag: "Q1 Mid", filter: (d: number) => d > 30 && d <= 60 },
      { id: "m3", label: "60 - 90 Days", tag: "Q1 Late", filter: (d: number) => d > 60 && d <= 90 },
      { id: "q2", label: "90 - 180 Days", tag: "Q2 Horizon", filter: (d: number) => d > 90 && d <= 180 },
      { id: "q3", label: "180 - 270 Days", tag: "Q3 Horizon", filter: (d: number) => d > 180 && d <= 270 },
      { id: "q4", label: "> 270 Days", tag: "Q4 Long-Range", filter: (d: number) => d > 270 },
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
    <div className="w-full bg-white border border-[#E2EAE4] rounded-[28px] p-6 lg:p-8 text-[#051F20] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.04)] relative overflow-hidden transition-all">
      {/* Top Header & Executive Segmented Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E2EAE4]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#235347] animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-[#235347]">
              Strategic Intelligence Matrix
            </span>
            <span className="text-[11px] font-mono text-[#163832]/30">•</span>
            <span className="text-[11px] font-mono text-[#163832]/60">
              Gartner 2×2 / WHOOP Telemetry Calibrated (N={accounts.length})
            </span>
          </div>
          <h3 className="text-xl lg:text-2xl font-serif font-bold text-[#051F20] tracking-tight">
            Portfolio Revenue & Risk Matrix
          </h3>
        </div>

        {/* View Toggle Tabs & Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Gaussian Contour Toggle (Only for Scatter view) */}
          {activeTab === "scatter" && (
            <button
              onClick={() => {
                playTick();
                setShowDensityContour((prev) => !prev);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all ${
                showDensityContour 
                  ? "bg-[#EAF5E8] border-[#C1E7BC] text-[#235347] font-bold" 
                  : "bg-white border-[#E2EAE4] text-[#163832]/60 hover:text-[#051F20]"
              }`}
              title="Toggle Gaussian Density Contours"
            >
              {showDensityContour ? <Eye className="w-3.5 h-3.5 text-[#235347]" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Density Heatmap</span>
            </button>
          )}

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
                  ? "bg-[#C86D51] text-white shadow-sm" 
                  : "text-[#163832]/70 hover:text-[#C86D51] hover:bg-white/60"
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
              2D Magic Quadrant
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
              <Flame className="w-3.5 h-3.5 text-[#C86D51]" />
              WHOOP Cohort Heatmap
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="pt-6">
        <AnimatePresence mode="wait">
          {activeTab === "scatter" && (
            <motion.div
              key="scatter-view"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Gartner / Clutch Style 2x2 Magic Quadrant Canvas */}
              <div 
                ref={canvasRef}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={() => setCanvasMousePos(null)}
                className="relative w-full h-[450px] bg-[#FAFDFB] rounded-2xl border-2 border-[#E2EAE4] p-6 select-none overflow-hidden group shadow-sm"
              >
                {/* Optional Gaussian Density Contours (Reference: Dataviz image) */}
                {showDensityContour && (
                  <div className="absolute inset-0 pointer-events-none opacity-45 transition-opacity duration-500">
                    {/* Top-Right P0 Critical Cluster Aura */}
                    <div 
                      className="absolute top-12 right-16 w-64 h-64 rounded-full blur-3xl"
                      style={{ background: "radial-gradient(circle, rgba(200, 109, 81, 0.35) 0%, rgba(200, 109, 81, 0.1) 50%, transparent 70%)" }}
                    />
                    {/* Top-Left Expansion Cluster Aura */}
                    <div 
                      className="absolute top-14 left-24 w-60 h-60 rounded-full blur-3xl"
                      style={{ background: "radial-gradient(circle, rgba(35, 83, 71, 0.3) 0%, rgba(35, 83, 71, 0.08) 50%, transparent 70%)" }}
                    />
                    {/* Center Convergence Flux Aura */}
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-44 rounded-full blur-3xl"
                      style={{ background: "radial-gradient(ellipse, rgba(217, 119, 6, 0.2) 0%, transparent 60%)" }}
                    />
                  </div>
                )}

                {/* Clutch/Gartner Dot Grid Ticks */}
                <div 
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(#163832 1px, transparent 1px)`,
                    backgroundSize: `28px 28px`
                  }}
                />

                {/* Crisp Gartner Crosshair Axes (Solid 1.5px lines with prominent labels) */}
                {/* Horizontal Center Axis */}
                <div className="absolute left-8 right-8 top-1/2 h-[1.5px] bg-[#163832]/25 pointer-events-none" />
                {/* Vertical Center Axis */}
                <div className="absolute top-8 bottom-8 left-1/2 w-[1.5px] bg-[#163832]/25 pointer-events-none" />

                {/* Gartner Strategic Quadrant Header Designations */}
                {/* Q1: Top-Right (P0 CRISIS INTERVENTION) */}
                <div className="absolute top-4 right-6 text-right pointer-events-none z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FFF0EB] border border-[#F4C4B7] text-xs font-mono font-bold uppercase tracking-wider text-[#A44328] shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-[#C86D51] animate-ping" />
                    P0 Crisis Intervention
                  </div>
                  <div className="text-xs font-mono text-[#A44328] font-bold mt-1">
                    {quadrantStats.p0.count} Enterprise Accounts • {formatCurrency(quadrantStats.p0.mrr)} MRR
                  </div>
                </div>

                {/* Q2: Top-Left (MARKET LEADERS / EXPANSION) */}
                <div className="absolute top-4 left-14 text-left pointer-events-none z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#EAF5E8] border border-[#C1E7BC] text-xs font-mono font-bold uppercase tracking-wider text-[#235347] shadow-sm">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#235347]" />
                    Market Leaders & Expansion
                  </div>
                  <div className="text-xs font-mono text-[#235347] font-bold mt-1">
                    {quadrantStats.expansion.count} Enterprise Accounts • {formatCurrency(quadrantStats.expansion.mrr)} MRR
                  </div>
                </div>

                {/* Q3: Bottom-Right (AUTOMATED NURTURE) */}
                <div className="absolute bottom-11 right-6 text-right pointer-events-none z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] text-xs font-mono font-bold uppercase tracking-wider text-[#92400E] shadow-sm">
                    <Zap className="w-3.5 h-3.5 text-[#D97706]" />
                    Automated Playbooks
                  </div>
                  <div className="text-xs font-mono text-[#92400E] font-bold mt-1">
                    {quadrantStats.automated.count} Mid-Market Accounts • {formatCurrency(quadrantStats.automated.mrr)} MRR
                  </div>
                </div>

                {/* Q4: Bottom-Left (STABLE CORE) */}
                <div className="absolute bottom-11 left-14 text-left pointer-events-none z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F1F5F9] border border-[#CBD5E1] text-xs font-mono font-bold uppercase tracking-wider text-[#334155] shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-[#475569]" />
                    Stable Core Retention
                  </div>
                  <div className="text-xs font-mono text-[#475569] font-bold mt-1">
                    {quadrantStats.stable.count} Accounts • {formatCurrency(quadrantStats.stable.mrr)} MRR
                  </div>
                </div>

                {/* Interactive Dynamic Cursor Laser Crosshair */}
                {canvasMousePos && (
                  <div className="pointer-events-none absolute inset-0 z-15">
                    <div 
                      className="absolute top-0 bottom-0 w-[1px] bg-[#235347]/40 border-r border-dashed border-[#235347]/60"
                      style={{ left: `${canvasMousePos.x}px` }}
                    />
                    <div 
                      className="absolute left-0 right-0 h-[1px] bg-[#235347]/40 border-b border-dashed border-[#235347]/60"
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

                {/* Y-Axis Label (Contract MRR) */}
                <div className="absolute left-2 top-[48%] -rotate-90 origin-center text-[10px] font-mono font-bold uppercase tracking-widest text-[#163832]/60 flex items-center gap-1">
                  <span>▲ Contract Value (MRR)</span>
                </div>

                {/* X-Axis Label (Risk Horizon) */}
                <div className="absolute bottom-2 left-[50%] -translate-x-1/2 text-[10px] font-mono font-bold uppercase tracking-widest text-[#163832]/70 flex items-center gap-3">
                  <span className="text-[#235347] font-extrabold">0% Safe</span>
                  <span>─────────────</span>
                  <span className="text-[#D97706] font-extrabold">50% Risk Horizon</span>
                  <span>─────────────</span>
                  <span className="text-[#C86D51] font-extrabold">100% Imminent Churn ►</span>
                </div>

                {/* Plotting Bubbles Canvas Container */}
                <div className="absolute inset-x-14 top-10 bottom-14">
                  {filteredAccounts.map((account) => {
                    const prob = account.churn_probability ?? 0;
                    const mrr = account.contract_mrr;
                    const isSelected = selectedAccount?.account_id === account.account_id;
                    const isHovered = hoveredAccount?.account_id === account.account_id;
                    const isHighValue = mrr >= 18000;

                    const leftPct = Math.min(Math.max(prob * 90 + 5, 4), 96);
                    const bottomPct = Math.min(Math.max((mrr / maxMrr) * 85 + 5, 6), 94);

                    // Refined Sage Pine & Terracotta Coral palette
                    let colorClass = "bg-[#235347] text-[#FAF0E6] border-white shadow-md";
                    let ringColor = "ring-[#235347]";
                    if (prob >= 0.75) {
                      colorClass = "bg-[#C86D51] text-white border-white shadow-md";
                      ringColor = "ring-[#C86D51]";
                    } else if (prob >= 0.5) {
                      colorClass = "bg-[#D97706] text-white border-white shadow-md";
                      ringColor = "ring-[#D97706]";
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
                              stroke={prob >= 0.5 ? "#C86D51" : "#235347"} 
                              strokeWidth="1.5" 
                              strokeDasharray="3 3" 
                              opacity="0.85"
                            />
                            <line 
                              x1={`${leftPct}%`} 
                              y1={`${100 - bottomPct}%`} 
                              x2="0%" 
                              y2={`${100 - bottomPct}%`} 
                              stroke={prob >= 0.5 ? "#C86D51" : "#235347"} 
                              strokeWidth="1.5" 
                              strokeDasharray="3 3" 
                              opacity="0.85"
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
                              ? `ring-4 ${ringColor} scale-125 z-30 shadow-lg` 
                              : "hover:scale-130 hover:z-25 opacity-95 hover:opacity-100"
                          }`}
                          whileHover={{ scale: 1.3 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <span className="font-extrabold tracking-tight">
                            {account.company_name.substring(0, 2).toUpperCase()}
                          </span>

                          {(isSelected || prob >= 0.8) && (
                            <span className="absolute -inset-1.5 rounded-full border-2 border-[#C86D51] animate-ping opacity-40" />
                          )}
                        </motion.div>

                        {/* Direct Company Label Callout for Top High-Value Accounts */}
                        {isHighValue && (
                          <div
                            style={{
                              left: `${leftPct}%`,
                              bottom: `${bottomPct}%`,
                            }}
                            className="absolute -translate-y-6 translate-x-4 pointer-events-none z-10 hidden sm:flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#E2EAE4] px-2 py-0.5 rounded-md shadow-xs"
                          >
                            <span className="text-[10px] font-sans font-bold text-[#051F20] whitespace-nowrap">
                              {account.company_name}
                            </span>
                            <span className="text-[9px] font-mono font-bold text-[#235347]">
                              {formatCurrency(account.contract_mrr)}
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Floating Telemetry Tooltip on Hover */}
                <AnimatePresence>
                  {hoveredAccount && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 6 }}
                      className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#051F20] text-[#FAF0E6] border border-[#163832] rounded-2xl px-5 py-3 shadow-2xl z-40 pointer-events-none flex items-center gap-5 ring-1 ring-white/10"
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
                          <span>Risk: <strong className={(hoveredAccount.churn_probability ?? 0) >= 0.5 ? "text-[#F4C4B7]" : "text-[#DAF1DE]"}>{Math.round((hoveredAccount.churn_probability ?? 0) * 100)}%</strong></span>
                        </div>
                      </div>
                      <div className="pl-4 border-l border-[#163832] text-[11px] font-mono text-[#FAF0E6]/80 space-y-0.5">
                        <div>Usage Δ: <span className={(hoveredAccount.usage_change_pct_30d ?? 0) < 0 ? "text-[#F4C4B7] font-bold" : "text-[#DAF1DE] font-bold"}>{hoveredAccount.usage_change_pct_30d ?? 0}%</span></div>
                        <div>Renewal: <span className="text-amber-300 font-bold">{hoveredAccount.days_until_renewal ?? 60}d</span></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom 4 KPI Pods in Sage Pine & Terracotta Coral Palette */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                {/* P0 Crisis Exposure */}
                <div className="bg-[#FFF0EB] border border-[#F4C4B7] rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#A44328] font-bold tracking-wider">
                      P0 Crisis Exposure
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#A44328] font-mono text-[10px] font-bold border border-[#F4C4B7]">
                      {quadrantStats.p0.count} accts
                    </span>
                  </div>
                  <div className="text-xl font-serif font-bold text-[#A44328] mt-2">
                    {formatCurrency(quadrantStats.p0.mrr)}
                  </div>
                  <div className="w-full bg-[#F4C4B7]/60 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-[#C86D51] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(quadrantStats.p0.pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Expansion ARR Pool */}
                <div className="bg-[#EAF5E8] border border-[#C1E7BC] rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#235347] font-bold tracking-wider">
                      Expansion ARR Pool
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#235347] font-mono text-[10px] font-bold border border-[#C1E7BC]">
                      {quadrantStats.expansion.count} accts
                    </span>
                  </div>
                  <div className="text-xl font-serif font-bold text-[#235347] mt-2">
                    {formatCurrency(quadrantStats.expansion.mrr * 12)}
                  </div>
                  <div className="w-full bg-[#C1E7BC]/60 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-[#235347] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(quadrantStats.expansion.pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Automated Nurture Load */}
                <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#92400E] font-bold tracking-wider">
                      Automated Playbooks
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#92400E] font-mono text-[10px] font-bold border border-[#FDE68A]">
                      {quadrantStats.automated.count} accts
                    </span>
                  </div>
                  <div className="text-xl font-serif font-bold text-[#92400E] mt-2">
                    {formatCurrency(quadrantStats.automated.mrr)}
                  </div>
                  <div className="w-full bg-[#FDE68A]/60 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-[#D97706] h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(quadrantStats.automated.pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stable Core Platform */}
                <div className="bg-[#F1F5F9] border border-[#CBD5E1] rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#334155] font-bold tracking-wider">
                      Stable Core Retention
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#334155] font-mono text-[10px] font-bold border border-[#CBD5E1]">
                      {quadrantStats.stable.count} accts
                    </span>
                  </div>
                  <div className="text-xl font-serif font-bold text-[#334155] mt-2">
                    {formatCurrency(quadrantStats.stable.mrr)}
                  </div>
                  <div className="w-full bg-[#CBD5E1]/60 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-[#475569] h-full rounded-full transition-all duration-500"
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
              {/* WHOOP-Style 5-Tier Telemetry Density Matrix */}
              <div className="bg-[#F8FAF9] rounded-2xl border border-[#E2EAE4] p-6 overflow-x-auto shadow-inner">
                {/* Heatmap Top Bar with WHOOP Legend */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2EAE4] pb-4 mb-5">
                  <div>
                    <div className="text-xs font-mono font-bold text-[#051F20] flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#235347]" /> WHOOP-STYLE COHORT TELEMETRY MATRIX
                    </div>
                    <div className="text-[11px] font-mono text-[#163832]/60 mt-0.5">
                      Cross-analyzing 30-Day Product Telemetry vs. Renewal Horizon Windows
                    </div>
                  </div>

                  {/* 5-Tier Legend: Less Risk -> More Risk */}
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E2EAE4] shadow-xs">
                    <span className="text-[10px] font-mono font-bold text-[#163832]/60 uppercase">Less Risk</span>
                    <div className="flex items-center gap-1">
                      <span className="w-3.5 h-3.5 rounded bg-[#EAF5E8] border border-[#C1E7BC]" title="Level 1: Minimal Risk" />
                      <span className="w-3.5 h-3.5 rounded bg-[#FEF3C7] border border-[#FDE68A]" title="Level 2: Low Exposure" />
                      <span className="w-3.5 h-3.5 rounded bg-[#FED7AA] border border-[#FDBA74]" title="Level 3: Moderate Risk" />
                      <span className="w-3.5 h-3.5 rounded bg-[#FCA5A5] border border-[#F87171]" title="Level 4: High Loss" />
                      <span className="w-3.5 h-3.5 rounded bg-[#C86D51] border border-[#A44328]" title="Level 5: P0 Critical Intervention" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#C86D51] uppercase">More Risk</span>
                  </div>
                </div>

                <div className="min-w-[720px]">
                  {/* Column Headers (6 Renewal Horizons) */}
                  <div className="grid grid-cols-7 gap-3 pb-3 text-[11px] font-mono font-bold text-[#163832]/80 text-center">
                    <div className="text-left font-serif text-[#051F20] text-xs">Telemetry Health \ Renewal</div>
                    <div className="bg-[#FFF0EB] text-[#A44328] border border-[#F4C4B7] rounded-lg py-1.5 font-bold">&lt; 30d (Urgent)</div>
                    <div className="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-lg py-1.5">30 - 60d</div>
                    <div className="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] rounded-lg py-1.5">60 - 90d</div>
                    <div className="bg-white text-[#163832] border border-[#E2EAE4] rounded-lg py-1.5">90 - 180d</div>
                    <div className="bg-white text-[#163832] border border-[#E2EAE4] rounded-lg py-1.5">180 - 270d</div>
                    <div className="bg-white text-[#163832] border border-[#E2EAE4] rounded-lg py-1.5">&gt; 270d</div>
                  </div>

                  {/* Rows */}
                  <div className="space-y-3">
                    {heatmapData.map((row) => (
                      <div key={row.usageBand.id} className="grid grid-cols-7 gap-3 items-center">
                        {/* Row Header */}
                        <div className="text-xs font-mono font-bold text-[#051F20] pr-2 flex items-center justify-between">
                          <span className="truncate">{row.usageBand.label}</span>
                        </div>

                        {/* 6 Micro-Cells per Row */}
                        {row.cells.map((cell, idx) => {
                          const hasAccounts = cell.count > 0;
                          const loss = cell.totalLoss;

                          // 5-Tier Color Grading Scaled by Loss Severity
                          let cellStyle = "bg-[#F4F8F5] border-[#E2EAE4] text-[#163832]/40";
                          let textLossColor = "text-[#163832]/60";
                          let pulseBeacon = false;

                          if (hasAccounts) {
                            if (loss >= 25000 || (cell.renewalBand.id === "urgent" && row.usageBand.id === "severe_drop")) {
                              // Level 5: P0 Critical
                              cellStyle = "bg-[#C86D51] border-[#A44328] text-white shadow-sm hover:scale-[1.03]";
                              textLossColor = "text-white font-extrabold";
                              pulseBeacon = true;
                            } else if (loss >= 12000 || row.usageBand.id === "severe_drop") {
                              // Level 4: High Loss
                              cellStyle = "bg-[#FCA5A5] border-[#F87171] text-[#7F1D1D] hover:scale-[1.03]";
                              textLossColor = "text-[#7F1D1D] font-bold";
                            } else if (loss >= 5000 || row.usageBand.id === "mod_drop") {
                              // Level 3: Moderate Risk
                              cellStyle = "bg-[#FED7AA] border-[#FDBA74] text-[#7C2D12] hover:scale-[1.03]";
                              textLossColor = "text-[#7C2D12] font-bold";
                            } else if (loss > 0) {
                              // Level 2: Low Exposure
                              cellStyle = "bg-[#FEF3C7] border-[#FDE68A] text-[#78350F] hover:scale-[1.03]";
                              textLossColor = "text-[#78350F]";
                            } else {
                              // Level 1: Minimal Risk / Expansion
                              cellStyle = "bg-[#EAF5E8] border-[#C1E7BC] text-[#235347] hover:scale-[1.03]";
                              textLossColor = "text-[#235347]";
                            }
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
                              onMouseEnter={() => {
                                if (hasAccounts) {
                                  setHoveredHeatCell({
                                    usageLabel: row.usageBand.label,
                                    renewalLabel: cell.renewalBand.label,
                                    accounts: cell.accounts,
                                    totalLoss: cell.totalLoss,
                                    totalMrr: cell.totalMrr,
                                  });
                                }
                              }}
                              onMouseLeave={() => setHoveredHeatCell(null)}
                              disabled={!hasAccounts}
                              className={`h-20 rounded-xl border p-2.5 flex flex-col justify-between text-left transition-all duration-200 ${cellStyle} ${
                                hasAccounts ? "cursor-pointer shadow-xs hover:shadow-md" : "opacity-35 cursor-not-allowed"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono font-bold">
                                  {cell.count} {cell.count === 1 ? "Acct" : "Accts"}
                                </span>
                                {pulseBeacon && (
                                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                                )}
                              </div>
                              <div>
                                <div className="text-[9px] font-mono opacity-80">MRR at Risk</div>
                                <div className={`text-xs font-mono ${textLossColor}`}>
                                  {loss > 0 ? formatCurrency(loss) : "$0"}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating Heatmap Micro-Telemetry Tooltip */}
                <AnimatePresence>
                  {hoveredHeatCell && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      className="mt-4 p-3.5 bg-white border border-[#E2EAE4] rounded-xl flex items-center justify-between shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#C86D51]" />
                        <span className="text-xs font-mono font-bold text-[#051F20]">
                          {hoveredHeatCell.usageLabel} × {hoveredHeatCell.renewalLabel}
                        </span>
                        <span className="text-xs font-mono text-[#163832]/60">
                          ({hoveredHeatCell.accounts.length} Accounts • {formatCurrency(hoveredHeatCell.totalLoss)} at risk)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {hoveredHeatCell.accounts.slice(0, 3).map((a) => (
                          <span key={a.account_id} className="text-[10px] font-mono font-bold bg-[#F4F8F5] border border-[#E2EAE4] px-2 py-0.5 rounded text-[#051F20]">
                            {a.company_name}
                          </span>
                        ))}
                        {hoveredHeatCell.accounts.length > 3 && (
                          <span className="text-[10px] font-mono text-[#163832]/60">+{hoveredHeatCell.accounts.length - 3} more</span>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
