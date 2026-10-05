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
  Activity,
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
      { id: "severe_drop", label: "Critical Drop (<-25%)", shortLabel: "<-25% Drop", filter: (u: number) => u < -25 },
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
    <div className="w-full bg-[#051816] border border-[#163832] rounded-[28px] p-6 lg:p-7 text-[#FAF0E6] shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-xl">
      {/* Ambient Gradient Flares */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Top Header & Executive Segmented Controls */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#163832]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#00E599] animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#00E599]">
              Enterprise Surveillance Array
            </span>
            <span className="text-[10px] font-mono text-[#FAF0E6]/30">•</span>
            <span className="text-[10px] font-mono text-[#FAF0E6]/60">
              Gartner 2×2 & WHOOP Density Telemetry (N={accounts.length})
            </span>
          </div>
          <h3 className="text-xl font-serif font-bold text-white tracking-tight flex items-center gap-2.5">
            Portfolio Revenue & Risk Intelligence
          </h3>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center bg-[#072422] p-1 rounded-xl border border-[#163832] shadow-inner">
          <button
            onClick={() => {
              playTick();
              setFilterMode("all");
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              filterMode === "all" 
                ? "bg-[#00E599] text-[#031614] shadow-[0_0_10px_rgba(0,229,153,0.3)]" 
                : "text-[#FAF0E6]/60 hover:text-white"
            }`}
          >
            All ({accounts.length})
          </button>
          <button
            onClick={() => {
              playTick();
              setFilterMode("high_mrr");
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              filterMode === "high_mrr" 
                ? "bg-[#00E599] text-[#031614] shadow-[0_0_10px_rgba(0,229,153,0.3)]" 
                : "text-[#FAF0E6]/60 hover:text-white"
            }`}
          >
            MRR &gt; $15k
          </button>
          <button
            onClick={() => {
              playTick();
              setFilterMode("critical");
            }}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
              filterMode === "critical" 
                ? "bg-[#EF4444] text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]" 
                : "text-[#FAF0E6]/60 hover:text-white"
            }`}
          >
            Critical Risk
          </button>
        </div>
      </div>

      {/* DUAL-CARD SPLIT COMMAND VIEW */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5 pt-5 items-stretch">
        
        {/* LEFT COLUMN (7 COLS): Gartner Strategic 2x2 Magic Quadrant */}
        <div className="lg:col-span-7 flex flex-col space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-mono">
            <span className="text-[#00E599] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[#00E599]" /> 2D Strategic Magic Quadrant
            </span>
            <span className="text-[10px] text-[#FAF0E6]/50">Hover node for telemetry</span>
          </div>

          <div 
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={() => setCanvasMousePos(null)}
            className="relative w-full h-[360px] bg-[#031311] rounded-2xl border border-[#163832] p-4 select-none overflow-hidden group shadow-inner flex-1"
          >
            {/* Subtle Gartner Dot Grid */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#00E599 1px, transparent 1px)`,
                backgroundSize: `24px 24px`
              }}
            />

            {/* Quadrant Ambient Color Glows */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-rose-600/10 border-b border-l border-dashed border-rose-900/30 pointer-events-none" />
            <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-emerald-500/10 border-b border-r border-dashed border-emerald-900/30 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-amber-500/10 border-t border-l border-dashed border-amber-900/30 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-cyan-600/5 border-t border-r border-dashed border-cyan-900/20 pointer-events-none" />

            {/* Gartner Center Crosshair Axes */}
            <div className="absolute left-6 right-6 top-1/2 h-[1px] bg-[#163832] pointer-events-none" />
            <div className="absolute top-6 bottom-6 left-1/2 w-[1px] bg-[#163832] pointer-events-none" />

            {/* Quadrant Classification Tags */}
            {/* Q1: P0 Crisis */}
            <div className="absolute top-2.5 right-3.5 text-right pointer-events-none z-10">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/80 border border-rose-600/40 text-[9px] font-mono font-bold text-rose-300">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                P0 Crisis ({quadrantStats.p0.count})
              </span>
            </div>
            {/* Q2: Market Leaders / Expansion */}
            <div className="absolute top-2.5 left-3.5 text-left pointer-events-none z-10">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-[9px] font-mono font-bold text-emerald-300">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Expansion Prime ({quadrantStats.expansion.count})
              </span>
            </div>
            {/* Q3: Automated Nurture */}
            <div className="absolute bottom-8 right-3.5 text-right pointer-events-none z-10">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-[9px] font-mono font-bold text-amber-300">
                <Zap className="w-3 h-3 text-amber-400" />
                Nurture Load ({quadrantStats.automated.count})
              </span>
            </div>
            {/* Q4: Stable Core */}
            <div className="absolute bottom-8 left-3.5 text-left pointer-events-none z-10">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900/80 border border-slate-700/60 text-[9px] font-mono font-bold text-slate-300">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Stable Core ({quadrantStats.stable.count})
              </span>
            </div>

            {/* Interactive Dynamic Cursor Laser Crosshair */}
            {canvasMousePos && (
              <div className="pointer-events-none absolute inset-0 z-15">
                <div 
                  className="absolute top-0 bottom-0 w-[1px] bg-[#00E599]/30 border-r border-dashed border-[#00E599]/40"
                  style={{ left: `${canvasMousePos.x}px` }}
                />
                <div 
                  className="absolute left-0 right-0 h-[1px] bg-[#00E599]/30 border-b border-dashed border-[#00E599]/40"
                  style={{ top: `${canvasMousePos.y}px` }}
                />
                <div 
                  className="absolute bg-[#031614]/95 border border-[#00E599]/40 rounded px-2 py-0.5 text-[9px] font-mono text-[#00E599] shadow-xl backdrop-blur-md -translate-x-1/2 -translate-y-7"
                  style={{ left: `${canvasMousePos.x}px`, top: `${canvasMousePos.y}px` }}
                >
                  {Math.round(canvasMousePos.pctX * 100)}% Risk • ${Math.round(canvasMousePos.pctY * maxMrr).toLocaleString()}
                </div>
              </div>
            )}

            {/* Axes Ticks */}
            <div className="absolute left-1 top-1/2 -rotate-90 origin-center text-[8px] font-mono font-bold uppercase text-[#FAF0E6]/40">
              ▲ MRR
            </div>
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold uppercase text-[#FAF0E6]/50 flex items-center gap-2">
              <span className="text-emerald-400">0% Safe</span>
              <span>────</span>
              <span className="text-amber-400">50% Risk</span>
              <span>────</span>
              <span className="text-rose-400">100% Churn ►</span>
            </div>

            {/* Scatter Plot Nodes */}
            <div className="absolute inset-x-10 top-7 bottom-10">
              {filteredAccounts.map((account) => {
                const prob = account.churn_probability ?? 0;
                const mrr = account.contract_mrr;
                const isSelected = selectedAccount?.account_id === account.account_id;
                const isHovered = hoveredAccount?.account_id === account.account_id;
                const isHighValue = mrr >= 20000;

                const leftPct = Math.min(Math.max(prob * 90 + 5, 4), 96);
                const bottomPct = Math.min(Math.max((mrr / maxMrr) * 85 + 5, 6), 94);

                let colorClass = "bg-emerald-400 text-emerald-950 shadow-[0_0_12px_rgba(52,211,153,0.5)] border-emerald-200";
                let ringClass = "border-emerald-400";
                if (prob >= 0.75) {
                  colorClass = "bg-rose-500 text-white shadow-[0_0_16px_rgba(244,63,94,0.7)] border-rose-200";
                  ringClass = "border-rose-400";
                } else if (prob >= 0.5) {
                  colorClass = "bg-amber-400 text-amber-950 shadow-[0_0_12px_rgba(251,191,36,0.6)] border-amber-200";
                  ringClass = "border-amber-400";
                }

                const bubbleSize = Math.max(Math.min(22 + (mrr / 35000) * 14, 38), 22);

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
                          stroke={prob >= 0.5 ? "#EF4444" : "#00E599"} 
                          strokeWidth="1.5" 
                          strokeDasharray="3 3" 
                          opacity="0.8"
                        />
                        <line 
                          x1={`${leftPct}%`} 
                          y1={`${100 - bottomPct}%`} 
                          x2="0%" 
                          y2={`${100 - bottomPct}%`} 
                          stroke={prob >= 0.5 ? "#EF4444" : "#00E599"} 
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
                          ? "ring-4 ring-white scale-125 z-30 shadow-[0_0_18px_rgba(255,255,255,0.8)]" 
                          : "hover:scale-135 hover:z-25 opacity-90 hover:opacity-100"
                      }`}
                      whileHover={{ scale: 1.35 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span>{account.company_name.substring(0, 2).toUpperCase()}</span>

                      {(isSelected || prob >= 0.8) && (
                        <span className={`absolute -inset-1 rounded-full border-2 ${ringClass} animate-ping opacity-50`} />
                      )}
                    </motion.div>

                    {/* Name tag on top tier */}
                    {isHighValue && (
                      <div
                        style={{
                          left: `${leftPct}%`,
                          bottom: `${bottomPct}%`,
                        }}
                        className="absolute -translate-y-5 translate-x-3 pointer-events-none z-10 hidden sm:flex items-center gap-1 bg-[#021110]/90 border border-[#163832] px-1.5 py-0.5 rounded text-[8px] font-mono text-[#00E599] whitespace-nowrap"
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
                  className="absolute top-2 left-1/2 -translate-x-1/2 bg-[#021110]/95 backdrop-blur-md border border-[#00E599]/60 rounded-xl px-4 py-2 shadow-2xl z-40 pointer-events-none flex items-center gap-4 ring-1 ring-white/10"
                >
                  <div>
                    <div className="text-[10px] font-mono text-[#00E599] font-bold">
                      {hoveredAccount.account_id} • {hoveredAccount.company_name}
                    </div>
                    <div className="text-[11px] font-mono text-white mt-0.5">
                      MRR: <strong className="text-[#00E599]">{formatCurrency(hoveredAccount.contract_mrr)}</strong> • Risk: <strong className={(hoveredAccount.churn_probability ?? 0) >= 0.5 ? "text-rose-400" : "text-emerald-400"}>{Math.round((hoveredAccount.churn_probability ?? 0) * 100)}%</strong>
                    </div>
                  </div>
                  <div className="pl-3 border-l border-[#163832] text-[10px] font-mono text-[#FAF0E6]/80">
                    <div>Usage: <span className={(hoveredAccount.usage_change_pct_30d ?? 0) < 0 ? "text-rose-400" : "text-emerald-400"}>{hoveredAccount.usage_change_pct_30d ?? 0}%</span></div>
                    <div>Renewal: <span className="text-amber-300">{hoveredAccount.days_until_renewal ?? 60}d</span></div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT COLUMN (5 COLS): WHOOP / GitHub High-Density Micro-Tile Matrix */}
        <div className="lg:col-span-5 flex flex-col space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-mono">
            <span className="text-[#C86D51] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#C86D51]" /> WHOOP Telemetry Heatmap
            </span>
            {/* WHOOP Legend */}
            <div className="flex items-center gap-1 text-[9px] font-mono text-[#FAF0E6]/50">
              <span>Less</span>
              <span className="w-2.5 h-2.5 rounded-sm bg-[#082622] border border-[#163832]" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#00E599]/40 border border-[#00E599]/60" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B]/50 border border-[#F59E0B]/70" />
              <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444] border border-[#F87171]" />
              <span>More</span>
            </div>
          </div>

          <div className="bg-[#031311] rounded-2xl border border-[#163832] p-4 flex-1 flex flex-col justify-between shadow-inner">
            {/* Column Horizon Headers */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-mono text-[#FAF0E6]/50 pb-1.5 border-b border-[#163832]/60">
              <div className="text-left font-bold text-[#00E599]">Health \ Horizon</div>
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
                  <div className="text-[9px] font-mono font-medium text-[#FAF0E6]/80 truncate pr-1" title={row.usageBand.label}>
                    {row.usageBand.shortLabel}
                  </div>

                  {/* 6 Micro-Tiles */}
                  {row.cells.map((cell, idx) => {
                    const hasAccounts = cell.count > 0;
                    const loss = cell.totalLoss;

                    // 5-Tier Intensity Grading
                    let tileStyle = "bg-[#072422]/60 border-[#163832]/80 opacity-40";
                    let glowRing = "";
                    let indicatorColor = "text-[#FAF0E6]/40";

                    if (hasAccounts) {
                      if (loss >= 25000 || (cell.renewalBand.id === "urgent" && row.usageBand.id === "severe_drop")) {
                        tileStyle = "bg-[#EF4444] border-[#F87171] shadow-[0_0_12px_rgba(239,68,68,0.6)]";
                        indicatorColor = "text-white font-extrabold";
                        glowRing = "animate-pulse";
                      } else if (loss >= 10000 || row.usageBand.id === "severe_drop") {
                        tileStyle = "bg-[#F97316] border-[#FB923C] shadow-[0_0_8px_rgba(249,115,22,0.4)]";
                        indicatorColor = "text-white font-bold";
                      } else if (loss >= 4000 || row.usageBand.id === "mod_drop") {
                        tileStyle = "bg-[#F59E0B] border-[#FCD34D]";
                        indicatorColor = "text-[#78350F] font-bold";
                      } else if (loss > 0) {
                        tileStyle = "bg-[#00E599]/40 border-[#00E599]/60";
                        indicatorColor = "text-[#00E599] font-bold";
                      } else {
                        tileStyle = "bg-[#00E599] border-[#6EE7B7]";
                        indicatorColor = "text-[#031614] font-extrabold";
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
                        className={`h-11 rounded-lg border flex flex-col items-center justify-center transition-all duration-150 ${tileStyle} ${glowRing} ${
                          hasAccounts ? "cursor-pointer hover:scale-110 hover:z-20 hover:brightness-125" : "cursor-not-allowed"
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
                          <span className="text-[8px] font-mono text-[#FAF0E6]/20">·</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Hovered Tile Dynamic Telemetry Micro-HUD */}
            <div className="min-h-[38px] bg-[#021110] border border-[#163832] rounded-xl px-3 py-1.5 flex items-center justify-between text-[10px] font-mono">
              {hoveredTile ? (
                <>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-ping" />
                    <span className="text-white font-bold truncate">{hoveredTile.usageLabel} ({hoveredTile.renewalLabel})</span>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-rose-400 font-bold">{formatCurrency(hoveredTile.totalLoss)} at risk</span>
                    <span className="text-[#FAF0E6]/50"> • {hoveredTile.count} accts</span>
                  </div>
                </>
              ) : (
                <div className="text-[#FAF0E6]/40 flex items-center gap-1.5 w-full justify-center">
                  <Sparkles className="w-3 h-3 text-[#00E599]" />
                  <span>Hover any active micro-tile for instant cohort telemetry</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 4 Compact KPI Summary Pods */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-[#163832] mt-4">
        {/* P0 Crisis Exposure */}
        <div className="bg-[#031311] border border-rose-600/30 rounded-xl p-3 flex flex-col justify-between shadow-sm hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase text-rose-400 font-bold tracking-wider">P0 Crisis Exposure</span>
            <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 font-mono text-[9px] font-bold border border-rose-800/60">
              {quadrantStats.p0.count} accts
            </span>
          </div>
          <div className="text-lg font-serif font-bold text-white mt-1">
            {formatCurrency(quadrantStats.p0.mrr)}
          </div>
          <div className="w-full bg-rose-950/60 h-1 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-rose-500 h-full rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]"
              style={{ width: `${Math.min(quadrantStats.p0.pct, 100)}%` }}
            />
          </div>
        </div>

        {/* Expansion ARR Pool */}
        <div className="bg-[#031311] border border-emerald-600/30 rounded-xl p-3 flex flex-col justify-between shadow-sm hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase text-emerald-400 font-bold tracking-wider">Expansion ARR Pool</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[9px] font-bold border border-emerald-800/60">
              {quadrantStats.expansion.count} accts
            </span>
          </div>
          <div className="text-lg font-serif font-bold text-white mt-1">
            {formatCurrency(quadrantStats.expansion.mrr * 12)}
          </div>
          <div className="w-full bg-emerald-950/60 h-1 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
              style={{ width: `${Math.min(quadrantStats.expansion.pct, 100)}%` }}
            />
          </div>
        </div>

        {/* Automated Nurture */}
        <div className="bg-[#031311] border border-amber-600/30 rounded-xl p-3 flex flex-col justify-between shadow-sm hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase text-amber-400 font-bold tracking-wider">Automated Nurture</span>
            <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-mono text-[9px] font-bold border border-amber-800/60">
              {quadrantStats.automated.count} accts
            </span>
          </div>
          <div className="text-lg font-serif font-bold text-white mt-1">
            {formatCurrency(quadrantStats.automated.mrr)}
          </div>
          <div className="w-full bg-amber-950/60 h-1 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-amber-400 h-full rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
              style={{ width: `${Math.min(quadrantStats.automated.pct, 100)}%` }}
            />
          </div>
        </div>

        {/* Stable Core Platform */}
        <div className="bg-[#031311] border border-cyan-700/30 rounded-xl p-3 flex flex-col justify-between shadow-sm hover:border-cyan-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono uppercase text-cyan-400 font-bold tracking-wider">Stable Core Retention</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-300 font-mono text-[9px] font-bold border border-slate-700/60">
              {quadrantStats.stable.count} accts
            </span>
          </div>
          <div className="text-lg font-serif font-bold text-white mt-1">
            {formatCurrency(quadrantStats.stable.mrr)}
          </div>
          <div className="w-full bg-slate-900/60 h-1 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_6px_rgba(34,211,238,0.8)]"
              style={{ width: `${Math.min(quadrantStats.stable.pct, 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
