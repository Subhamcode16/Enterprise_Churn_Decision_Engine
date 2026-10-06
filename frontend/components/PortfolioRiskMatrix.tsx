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
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Info,
  CheckCircle2,
  ArrowUpRight
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
  const [filterMode, setFilterMode] = useState<"all" | "high_mrr" | "critical">("all");
  const [hoveredAccount, setHoveredAccount] = useState<AccountRecord | null>(null);
  const [hoveredTile, setHoveredTile] = useState<{
    usageLabel: string;
    renewalLabel: string;
    count: number;
    totalLoss: number;
    accounts: AccountRecord[];
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
      { id: "severe_drop", label: "Critical Drop (<-25%)", shortLabel: "<-25% Critical", filter: (u: number) => u < -25 },
      { id: "mod_drop", label: "Moderate Attrition (-25% to -5%)", shortLabel: "-25% to -5%", filter: (u: number) => u >= -25 && u < -5 },
      { id: "stable", label: "Equilibrium (-5% to +10%)", shortLabel: "-5% to +10%", filter: (u: number) => u >= -5 && u <= 10 },
      { id: "expansion", label: "Expansion Growth (> +10%)", shortLabel: ">+10% Growth", filter: (u: number) => u > 10 },
    ];

    const renewalBands = [
      { id: "urgent", label: "< 30 Days", shortLabel: "<30d", filter: (d: number) => d <= 30 },
      { id: "m2", label: "30 - 60 Days", shortLabel: "30-60d", filter: (d: number) => d > 30 && d <= 60 },
      { id: "m3", label: "60 - 90 Days", shortLabel: "60-90d", filter: (d: number) => d > 60 && d <= 90 },
      { id: "q2", label: "90 - 180 Days", shortLabel: "90-180d", filter: (d: number) => d > 90 && d <= 180 },
      { id: "q3", label: "180 - 270 Days", shortLabel: "180-270d", filter: (d: number) => d > 180 && d <= 270 },
      { id: "q4", label: "> 270 Days", shortLabel: ">270d", filter: (d: number) => d > 270 },
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
    <div className="w-full bg-white border border-[#E2EAE4] rounded-[28px] p-6 lg:p-8 text-[#051F20] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] relative overflow-hidden transition-all">
      {/* Top Header & Executive Segmented Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2EAE4]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#235347] animate-pulse" />
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-[#235347]">
              Strategic Decision Intelligence
            </span>
            <span className="text-[11px] font-mono text-[#163832]/30">•</span>
            <span className="text-[11px] font-mono text-[#163832]/60">
              Gartner 2×2 & WHOOP Cohort Calibrated (N={accounts.length})
            </span>
          </div>
          <h3 className="text-xl lg:text-2xl font-serif font-bold text-[#051F20] tracking-tight">
            Portfolio Revenue & Risk Intelligence
          </h3>
        </div>

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
      </div>

      {/* DUAL-CARD SPLIT COMMAND VIEW */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6 items-stretch">
        
        {/* LEFT CARD (7 COLS): Gartner Strategic 2x2 Magic Quadrant */}
        <div className="lg:col-span-7 flex flex-col space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-mono">
            <span className="text-[#051F20] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#235347]" /> 2D Strategic Magic Quadrant
            </span>
            <span className="text-[10px] text-[#163832]/50 font-medium">Hover node for telemetry</span>
          </div>

          <div 
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setCanvasMousePos(null)}
            className="relative w-full h-[380px] bg-[#FAFDFB] rounded-2xl border border-[#E2EAE4] p-5 select-none overflow-hidden group shadow-sm flex-1"
          >
            {/* Subtle Gartner Dot Grid */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#163832 1px, transparent 1px)`,
                backgroundSize: `24px 24px`
              }}
            />

            {/* Soft Quadrant Background Tints */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#FFF5F5]/60 border-b border-l border-dashed border-rose-200 pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-[#F0FAF4]/60 border-b border-r border-dashed border-emerald-200 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[#FFFDF0]/60 border-t border-l border-dashed border-amber-200 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#F8FAFC]/60 border-t border-r border-dashed border-slate-200 pointer-events-none" />

            {/* Gartner Center Crosshair Axes */}
            <div className="absolute left-6 right-6 top-1/2 h-[1px] bg-[#E2EAE4] pointer-events-none" />
            <div className="absolute top-6 bottom-6 left-1/2 w-[1px] bg-[#E2EAE4] pointer-events-none" />

            {/* Quadrant Classification Headers */}
            {/* Q1: P0 Crisis */}
            <div className="absolute top-3 right-4 text-right pointer-events-none z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FFF0EB] border border-[#F4C4B7] text-[10px] font-mono font-bold text-[#A44328]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C86D51] animate-ping" />
                P0 Crisis ({quadrantStats.p0.count})
              </span>
            </div>
            {/* Q2: Market Leaders / Expansion */}
            <div className="absolute top-3 left-4 text-left pointer-events-none z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#EAF5E8] border border-[#C1E7BC] text-[10px] font-mono font-bold text-[#235347]">
                <ShieldCheck className="w-3 h-3 text-[#235347]" />
                Expansion Prime ({quadrantStats.expansion.count})
              </span>
            </div>
            {/* Q3: Automated Nurture */}
            <div className="absolute bottom-8 right-4 text-right pointer-events-none z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#FEF3C7] border border-[#FDE68A] text-[10px] font-mono font-bold text-[#92400E]">
                <Zap className="w-3 h-3 text-[#D97706]" />
                Nurture Load ({quadrantStats.automated.count})
              </span>
            </div>
            {/* Q4: Stable Core */}
            <div className="absolute bottom-8 left-4 text-left pointer-events-none z-10">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-[#F1F5F9] border border-[#CBD5E1] text-[10px] font-mono font-bold text-[#334155]">
                <Sparkles className="w-3 h-3 text-[#475569]" />
                Stable Core ({quadrantStats.stable.count})
              </span>
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
                  className="absolute bg-[#051F20] text-[#FAF0E6] border border-[#163832] rounded-md px-2 py-0.5 text-[9px] font-mono shadow-md backdrop-blur-md -translate-x-1/2 -translate-y-7"
                  style={{ left: `${canvasMousePos.x}px`, top: `${canvasMousePos.y}px` }}
                >
                  {Math.round(canvasMousePos.pctX * 100)}% Risk • ${Math.round(canvasMousePos.pctY * maxMrr).toLocaleString()}
                </div>
              </div>
            )}

            {/* Axes Ticks */}
            <div className="absolute left-1 top-1/2 -rotate-90 origin-center text-[8px] font-mono font-bold uppercase text-[#163832]/50">
              ▲ MRR
            </div>
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold uppercase text-[#163832]/60 flex items-center gap-2">
              <span className="text-[#235347]">0% Safe</span>
              <span>────</span>
              <span className="text-[#D97706]">50% Risk</span>
              <span>────</span>
              <span className="text-[#C86D51]">100% Churn ►</span>
            </div>

            {/* Scatter Plot Nodes */}
            <div className="absolute inset-x-10 top-7 bottom-10">
              {filteredAccounts.map((account) => {
                const prob = account.churn_probability ?? 0;
                const mrr = account.contract_mrr;
                const isSelected = selectedAccount?.account_id === account.account_id;
                const isHovered = hoveredAccount?.account_id === account.account_id;
                const isHighValue = mrr >= 18000;

                const leftPct = Math.min(Math.max(prob * 90 + 5, 4), 96);
                const bottomPct = Math.min(Math.max((mrr / maxMrr) * 85 + 5, 6), 94);

                let colorClass = "bg-[#235347] text-[#FAF0E6] border-white shadow-sm";
                let ringClass = "ring-[#235347]";
                if (prob >= 0.75) {
                  colorClass = "bg-[#C86D51] text-white border-white shadow-sm";
                  ringClass = "ring-[#C86D51]";
                } else if (prob >= 0.5) {
                  colorClass = "bg-[#D97706] text-white border-white shadow-sm";
                  ringClass = "ring-[#D97706]";
                }

                const bubbleSize = Math.max(Math.min(24 + (mrr / 35000) * 14, 38), 24);

                return (
                  <React.Fragment key={account.account_id}>
                    {/* Active Vector Lines on Hover/Selection */}
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
                          opacity="0.8"
                        />
                        <line 
                          x1={`${leftPct}%`} 
                          y1={`${100 - bottomPct}%`} 
                          x2="0%" 
                          y2={`${100 - bottomPct}%`} 
                          stroke={prob >= 0.5 ? "#C86D51" : "#235347"} 
                          strokeWidth="1.5" 
                          strokeDasharray="3 3" 
                          opacity="0.8"
                        />
                      </svg>
                    )}

                    {/* Node */}
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
                      className={`absolute -translate-x-1/2 translate-y-1/2 rounded-full cursor-pointer flex items-center justify-center font-mono font-bold text-[9px] border-2 transition-transform duration-200 ${colorClass} ${
                        isSelected 
                          ? `ring-4 ${ringClass} scale-125 z-30 shadow-md` 
                          : "hover:scale-130 hover:z-25 opacity-90 hover:opacity-100"
                      }`}
                      whileHover={{ scale: 1.3 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>{account.company_name.substring(0, 2).toUpperCase()}</span>

                      {(isSelected || prob >= 0.8) && (
                        <span className="absolute -inset-1 rounded-full border-2 border-[#C86D51] animate-ping opacity-40" />
                      )}
                    </motion.div>

                    {/* Name tag on top tier */}
                    {isHighValue && (
                      <div
                        style={{
                          left: `${leftPct}%`,
                          bottom: `${bottomPct}%`,
                        }}
                        className="absolute -translate-y-5 translate-x-3 pointer-events-none z-10 hidden sm:flex items-center gap-1 bg-white/95 border border-[#E2EAE4] px-1.5 py-0.5 rounded text-[8px] font-mono text-[#051F20] shadow-xs whitespace-nowrap"
                      >
                        {account.company_name}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Floating Telemetry Tooltip */}
            <AnimatePresence>
              {hoveredAccount && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 5 }}
                  className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#051F20] text-[#FAF0E6] border border-[#163832] rounded-xl px-4 py-2.5 shadow-2xl z-40 pointer-events-none flex items-center gap-4"
                >
                  <div>
                    <div className="text-[10px] font-mono text-[#8EB69B] font-bold">
                      {hoveredAccount.account_id} • {hoveredAccount.company_name}
                    </div>
                    <div className="text-[11px] font-mono text-white mt-0.5">
                      MRR: <strong className="text-[#DAF1DE]">{formatCurrency(hoveredAccount.contract_mrr)}</strong> • Risk: <strong className={(hoveredAccount.churn_probability ?? 0) >= 0.5 ? "text-[#F4C4B7]" : "text-[#DAF1DE]"}>{Math.round((hoveredAccount.churn_probability ?? 0) * 100)}%</strong>
                    </div>
                  </div>
                  <div className="pl-3 border-l border-[#163832] text-[10px] font-mono text-[#FAF0E6]/80 space-y-0.5">
                    <div>Usage: <span className={(hoveredAccount.usage_change_pct_30d ?? 0) < 0 ? "text-[#F4C4B7]" : "text-[#DAF1DE]"}>{hoveredAccount.usage_change_pct_30d ?? 0}%</span></div>
                    <div>Renewal: <span className="text-amber-300">{hoveredAccount.days_until_renewal ?? 60}d</span></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT CARD (5 COLS): WHOOP / GitHub High-Density Micro-Tile Matrix */}
        <div className="lg:col-span-5 flex flex-col space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-mono">
            <span className="text-[#051F20] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#235347]" /> Cohort Telemetry Heatmap
            </span>
            {/* Pure Green Scale Legend */}
            <div className="flex items-center gap-1 text-[9px] font-mono text-[#163832]/60">
              <span>Low</span>
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F4F8F5] border border-[#E2EAE4]" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#EAF5E8] border border-[#C1E7BC]" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#C6E7C1] border border-[#A3D99C]" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#65B77B] border border-[#4DA565]" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#235347] border border-[#1B4339]" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0B2B26] border border-[#051F20]" />
              <span>High</span>
            </div>
          </div>

          <div className="bg-[#FAFDFB] rounded-2xl border border-[#E2EAE4] p-4 flex-1 flex flex-col justify-between shadow-sm">
            {/* Column Horizon Headers */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-mono text-[#163832]/60 pb-1.5 border-b border-[#E2EAE4]">
              <div className="text-left font-bold text-[#235347]">Health \ Horizon</div>
              <div>&lt;30d</div>
              <div>30-60d</div>
              <div>60-90d</div>
              <div>90-180d</div>
              <div>180-270d</div>
              <div>&gt;270d</div>
            </div>

            {/* 4 Rows of Micro-Tiles */}
            <div className="space-y-2 py-2">
              {heatmapData.map((row) => (
                <div key={row.usageBand.id} className="grid grid-cols-7 gap-1.5 items-center">
                  {/* Row Label */}
                  <div className="text-[9px] font-mono font-medium text-[#051F20] truncate pr-1" title={row.usageBand.label}>
                    {row.usageBand.shortLabel}
                  </div>

                  {/* 6 Micro-Tiles */}
                  {row.cells.map((cell, idx) => {
                    const hasAccounts = cell.count > 0;
                    const loss = cell.totalLoss;

                    // 5-Tier Pure Green Sequential Intensity Grading
                    let tileStyle = "bg-[#F4F8F5] border-[#E2EAE4] opacity-50";
                    let indicatorColor = "text-[#163832]/40";
                    let pulseBeacon = false;

                    if (hasAccounts) {
                      if (loss >= 25000 || (cell.renewalBand.id === "urgent" && row.usageBand.id === "severe_drop")) {
                        // Level 5: Deep Forest Green (Max Density)
                        tileStyle = "bg-[#0B2B26] border-[#051F20] text-[#DAF1DE] shadow-xs";
                        indicatorColor = "text-[#DAF1DE] font-black";
                        pulseBeacon = true;
                      } else if (loss >= 10000 || row.usageBand.id === "severe_drop") {
                        // Level 4: Dark Emerald Green
                        tileStyle = "bg-[#235347] border-[#1B4339] text-[#DAF1DE]";
                        indicatorColor = "text-[#DAF1DE] font-bold";
                      } else if (loss >= 4000 || row.usageBand.id === "mod_drop") {
                        // Level 3: Medium Jade Green
                        tileStyle = "bg-[#4DA565] border-[#3B8E52] text-white";
                        indicatorColor = "text-white font-bold";
                      } else if (loss > 0) {
                        // Level 2: Soft Sage Green
                        tileStyle = "bg-[#C6E7C1] border-[#A3D99C] text-[#0B2B26]";
                        indicatorColor = "text-[#0B2B26] font-bold";
                      } else {
                        // Level 1: Pale Mint Green
                        tileStyle = "bg-[#EAF5E8] border-[#C1E7BC] text-[#235347]";
                        indicatorColor = "text-[#235347] font-bold";
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
                            setHoveredTile({
                              usageLabel: row.usageBand.label,
                              renewalLabel: cell.renewalBand.label,
                              count: cell.count,
                              totalLoss: cell.totalLoss,
                              accounts: cell.accounts,
                            });
                          }
                        }}
                        onMouseLeave={() => setHoveredTile(null)}
                        disabled={!hasAccounts}
                        className={`h-11 rounded-lg border flex flex-col items-center justify-center transition-all duration-150 ${tileStyle} ${
                          hasAccounts ? "cursor-pointer hover:scale-105 hover:shadow-sm" : "cursor-not-allowed"
                        }`}
                      >
                        {hasAccounts ? (
                          <>
                            <span className={`text-[11px] font-mono ${indicatorColor}`}>
                              {cell.count}
                            </span>
                            <span className={`text-[7px] font-mono leading-none ${indicatorColor}`}>
                              {loss > 0 ? `$${Math.round(loss / 1000)}k` : "Safe"}
                            </span>
                          </>
                        ) : (
                          <span className="text-[8px] font-mono text-[#163832]/20">·</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Hovered Tile Dynamic Telemetry Ribbon */}
            <div className="min-h-[38px] bg-white border border-[#E2EAE4] rounded-xl px-3 py-1.5 flex items-center justify-between text-[10px] font-mono shadow-xs">
              {hoveredTile ? (
                <>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#235347]" />
                    <span className="text-[#051F20] font-bold truncate">{hoveredTile.usageLabel} ({hoveredTile.renewalLabel})</span>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-[#235347] font-bold">{formatCurrency(hoveredTile.totalLoss)} at risk</span>
                    <span className="text-[#163832]/60"> • {hoveredTile.count} accts</span>
                  </div>
                </>
              ) : (
                <div className="text-[#163832]/40 flex items-center gap-1.5 w-full justify-center">
                  <Sparkles className="w-3 h-3 text-[#235347]" />
                  <span>Hover any active micro-tile for instant cohort telemetry</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 4 KPI Summary Pods in Clean Light Palette */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-5 border-t border-[#E2EAE4] mt-5">
        {/* P0 Crisis Exposure */}
        <div className="bg-[#FFF0EB] border border-[#F4C4B7] rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#A44328] font-bold tracking-wider">P0 Crisis Exposure</span>
            <span className="px-2 py-0.5 rounded-full bg-white text-[#A44328] font-mono text-[10px] font-bold border border-[#F4C4B7]">
              {quadrantStats.p0.count} accts
            </span>
          </div>
          <div className="text-xl font-serif font-bold text-[#A44328] mt-1.5">
            {formatCurrency(quadrantStats.p0.mrr)}
          </div>
          <div className="w-full bg-[#F4C4B7]/60 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-[#C86D51] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(quadrantStats.p0.pct, 100)}%` }}
            />
          </div>
        </div>

        {/* Expansion ARR Pool */}
        <div className="bg-[#EAF5E8] border border-[#C1E7BC] rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#235347] font-bold tracking-wider">Expansion ARR Pool</span>
            <span className="px-2 py-0.5 rounded-full bg-white text-[#235347] font-mono text-[10px] font-bold border border-[#C1E7BC]">
              {quadrantStats.expansion.count} accts
            </span>
          </div>
          <div className="text-xl font-serif font-bold text-[#235347] mt-1.5">
            {formatCurrency(quadrantStats.expansion.mrr * 12)}
          </div>
          <div className="w-full bg-[#C1E7BC]/60 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-[#235347] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(quadrantStats.expansion.pct, 100)}%` }}
            />
          </div>
        </div>

        {/* Automated Nurture */}
        <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#92400E] font-bold tracking-wider">Automated Nurture</span>
            <span className="px-2 py-0.5 rounded-full bg-white text-[#92400E] font-mono text-[10px] font-bold border border-[#FDE68A]">
              {quadrantStats.automated.count} accts
            </span>
          </div>
          <div className="text-xl font-serif font-bold text-[#92400E] mt-1.5">
            {formatCurrency(quadrantStats.automated.mrr)}
          </div>
          <div className="w-full bg-[#FDE68A]/60 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-[#D97706] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(quadrantStats.automated.pct, 100)}%` }}
            />
          </div>
        </div>

        {/* Stable Core Platform */}
        <div className="bg-[#F1F5F9] border border-[#CBD5E1] rounded-xl p-3.5 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase text-[#334155] font-bold tracking-wider">Stable Core Retention</span>
            <span className="px-2 py-0.5 rounded-full bg-white text-[#334155] font-mono text-[10px] font-bold border border-[#CBD5E1]">
              {quadrantStats.stable.count} accts
            </span>
          </div>
          <div className="text-xl font-serif font-bold text-[#334155] mt-1.5">
            {formatCurrency(quadrantStats.stable.mrr)}
          </div>
          <div className="w-full bg-[#CBD5E1]/60 h-1.5 rounded-full mt-2.5 overflow-hidden">
            <div 
              className="bg-[#475569] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(quadrantStats.stable.pct, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
