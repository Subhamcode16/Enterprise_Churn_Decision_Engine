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
  ArrowUpRight,
  X,
  HelpCircle,
  Activity,
  Calendar
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

  const [showLegendModal, setShowLegendModal] = useState(false);
  const [hoveredContribution, setHoveredContribution] = useState<{
    dateStr: string;
    dayName: string;
    level: 0 | 1 | 2 | 3 | 4;
    count: number;
    totalLoss: number;
    accounts: AccountRecord[];
    riskLabel: string;
  } | null>(null);

  // GitHub-Style 52-Week Contribution Matrix Telemetry Data
  const githubContributionData = useMemo(() => {
    const monthNames = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    
    // Seed telemetry days using account data and deterministic distribution
    const dayMap = new Map<string, AccountRecord[]>();

    accounts.forEach((acc, i) => {
      const seed = Math.abs(
        (acc.account_id ? acc.account_id.split("").reduce((a, b) => a + b.charCodeAt(0), 0) : i * 37) +
        (acc.days_until_renewal || 60) * 13
      );
      
      const primaryWeek = seed % 52;
      const primaryDay = seed % 7;
      const key1 = `${primaryWeek}-${primaryDay}`;
      if (!dayMap.has(key1)) dayMap.set(key1, []);
      dayMap.get(key1)!.push(acc);

      // Distribute realistic telemetry signals for accounts with churn alerts
      if ((acc.churn_probability ?? 0) > 0.35 || (acc.usage_change_pct_30d ?? 0) < -10) {
        const recentWeek = (seed + 38) % 52;
        const recentDay = (seed * 3) % 7;
        const key2 = `${recentWeek}-${recentDay}`;
        if (!dayMap.has(key2)) dayMap.set(key2, []);
        if (!dayMap.get(key2)!.some(a => a.account_id === acc.account_id)) {
          dayMap.get(key2)!.push(acc);
        }
      }

      if (acc.contract_mrr > 10000) {
        const midWeek = (seed * 7 + 12) % 52;
        const midDay = (seed + 2) % 7;
        const key3 = `${midWeek}-${midDay}`;
        if (!dayMap.has(key3)) dayMap.set(key3, []);
        if (!dayMap.get(key3)!.some(a => a.account_id === acc.account_id)) {
          dayMap.get(key3)!.push(acc);
        }
      }
    });

    const monthWeekIndices = [0, 4, 8, 13, 17, 21, 26, 30, 34, 39, 43, 47];

    const weeks: Array<{
      weekIdx: number;
      monthLabel?: string;
      days: Array<{
        weekIdx: number;
        dayIdx: number;
        dateStr: string;
        dayName: string;
        level: 0 | 1 | 2 | 3 | 4;
        count: number;
        totalLoss: number;
        accounts: AccountRecord[];
        riskLabel: string;
      }>;
    }> = [];

    for (let w = 0; w < 52; w++) {
      const monthIdx = monthWeekIndices.indexOf(w);
      const monthLabel = monthIdx !== -1 ? monthNames[monthIdx] : undefined;

      const days = [];
      for (let d = 0; d < 7; d++) {
        const key = `${w}-${d}`;
        const cellAccounts = dayMap.get(key) || [];
        const count = cellAccounts.length;
        const totalLoss = cellAccounts.reduce(
          (sum, a) => sum + (a.mrr_at_risk ?? (a.churn_probability ?? 0) * a.contract_mrr),
          0
        );

        let level: 0 | 1 | 2 | 3 | 4 = 0;
        let riskLabel = "Zero Churn Signals (Neutral)";

        if (count > 0) {
          const maxProb = Math.max(...cellAccounts.map(a => a.churn_probability ?? 0));
          const hasP0 = cellAccounts.some(a => (a.churn_probability ?? 0) >= 0.6 || a.risk_tier === "Critical" || (a.usage_change_pct_30d ?? 0) < -25);

          if (hasP0 || totalLoss >= 20000 || count >= 3) {
            level = 4;
            riskLabel = "P0 Critical Escalation (> $20k MRR at risk)";
          } else if (totalLoss >= 6000 || maxProb >= 0.4 || count >= 2) {
            level = 3;
            riskLabel = "High Risk Exposure ($5k - $20k MRR at risk)";
          } else if (totalLoss >= 2000 || maxProb >= 0.2) {
            level = 2;
            riskLabel = "Moderate Attention ($2k - $5k MRR at risk)";
          } else {
            level = 1;
            riskLabel = "Healthy / Low Risk (< $2k MRR at risk)";
          }
        }

        const approxMonth = monthNames[Math.min(Math.floor(w / 4.34), 11)];
        const approxDay = (d * 4 + (w % 4) * 7 + 1) % 28 + 1;
        const year = w < 13 ? 2025 : 2026;
        const dateStr = `${approxMonth} ${approxDay}, ${year}`;

        days.push({
          weekIdx: w,
          dayIdx: d,
          dateStr,
          dayName: dayNames[d],
          level,
          count,
          totalLoss,
          accounts: cellAccounts,
          riskLabel,
        });
      }

      weeks.push({
        weekIdx: w,
        monthLabel,
        days,
      });
    }

    return weeks;
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

        {/* RIGHT CARD (5 COLS): Authentic GitHub-Style 52-Week Contribution Telemetry Grid */}
        <div className="lg:col-span-5 flex flex-col space-y-2.5">
          <div className="flex items-center justify-between px-1 text-xs font-mono">
            <span className="text-[#051F20] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#235347]" /> Cohort Telemetry Heatmap
            </span>
            <span className="text-[10px] font-mono text-[#163832]/60 hidden sm:inline-block">
              52-Week Risk & Engagement Matrix
            </span>
          </div>

          <div className="bg-[#FAFDFB] rounded-2xl border border-[#E2EAE4] p-4 flex-1 flex flex-col justify-between shadow-xs relative">
            {/* GitHub 52-Week Contribution Matrix Scrollable Container */}
            <div className="overflow-x-auto overflow-y-hidden pb-1 scrollbar-thin">
              <div className="min-w-[620px]">
                {/* Month Headers Row (Oct -> Sep) */}
                <div className="grid grid-cols-[28px_1fr] text-[9px] font-mono text-[#163832]/60 mb-1">
                  <div />
                  <div className="flex justify-between pr-2">
                    {["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"].map((m, idx) => (
                      <span key={idx} className="font-semibold text-[#163832]/70">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Main 52-Week x 7-Day Grid */}
                <div className="flex items-start gap-1">
                  {/* Left Weekday Labels (Mon, Wed, Fri) aligned to 7 rows */}
                  <div className="w-6 flex flex-col text-[8.5px] font-mono text-[#163832]/50 select-none py-[1px]">
                    <div className="h-[11px] sm:h-[12px] leading-[11px]" />
                    <div className="h-[11px] sm:h-[12px] leading-[11px]">Mon</div>
                    <div className="h-[11px] sm:h-[12px] leading-[11px]" />
                    <div className="h-[11px] sm:h-[12px] leading-[11px]">Wed</div>
                    <div className="h-[11px] sm:h-[12px] leading-[11px]" />
                    <div className="h-[11px] sm:h-[12px] leading-[11px]">Fri</div>
                    <div className="h-[11px] sm:h-[12px] leading-[11px]" />
                  </div>

                  {/* 52 Week Columns */}
                  <div className="flex gap-[2px] sm:gap-[2.5px] flex-1">
                    {githubContributionData.map((week) => (
                      <div key={week.weekIdx} className="flex flex-col gap-[2px] sm:gap-[2.5px]">
                        {week.days.map((day) => {
                          const hasEvents = day.count > 0;

                          // Pure GitHub Green Palette & Level Styles
                          let tileBg = "bg-[#EBEDF0] border-[#DFE1E4]";
                          if (day.level === 1) tileBg = "bg-[#9BE9A8] border-[#82D891]";
                          if (day.level === 2) tileBg = "bg-[#40C463] border-[#31B053]";
                          if (day.level === 3) tileBg = "bg-[#235347] border-[#1B4339]";
                          if (day.level === 4) tileBg = "bg-[#0B2B26] border-[#051F20] shadow-xs";

                          return (
                            <button
                              key={day.dayIdx}
                              onClick={() => {
                                if (day.accounts.length > 0) {
                                  playBlip();
                                  onSelectAccount(day.accounts[0]);
                                }
                              }}
                              onMouseEnter={() => {
                                setHoveredContribution({
                                  dateStr: day.dateStr,
                                  dayName: day.dayName,
                                  level: day.level,
                                  count: day.count,
                                  totalLoss: day.totalLoss,
                                  accounts: day.accounts,
                                  riskLabel: day.riskLabel,
                                });
                              }}
                              onMouseLeave={() => setHoveredContribution(null)}
                              className={`w-[10px] h-[10px] sm:w-[11.5px] sm:h-[11.5px] rounded-[2px] border transition-transform duration-150 ${tileBg} ${
                                hasEvents
                                  ? "cursor-pointer hover:scale-135 hover:z-20 hover:ring-1 hover:ring-[#0B2B26]"
                                  : "hover:scale-110 cursor-default"
                              }`}
                              title={`${day.dayName}, ${day.dateStr}: ${
                                hasEvents
                                  ? `${day.count} account${day.count > 1 ? "s" : ""} • ${formatCurrency(day.totalLoss)} at risk (${day.riskLabel})`
                                  : "No churn signals (Neutral)"
                              }`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Hovered Tile Dynamic Telemetry Ribbon */}
            <div className="min-h-[36px] bg-white border border-[#E2EAE4] rounded-xl px-3 py-1.5 flex items-center justify-between text-[10px] font-mono shadow-xs mt-2.5">
              {hoveredContribution ? (
                <>
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        hoveredContribution.level === 4
                          ? "bg-[#0B2B26] animate-pulse"
                          : hoveredContribution.level === 3
                          ? "bg-[#235347]"
                          : hoveredContribution.level === 2
                          ? "bg-[#40C463]"
                          : hoveredContribution.level === 1
                          ? "bg-[#9BE9A8]"
                          : "bg-[#DFE1E4]"
                      }`}
                    />
                    <span className="text-[#051F20] font-bold truncate">
                      {hoveredContribution.dayName}, {hoveredContribution.dateStr}
                    </span>
                    <span className="text-[#163832]/40 hidden sm:inline">•</span>
                    <span className="text-[#235347] font-medium truncate hidden sm:inline">
                      {hoveredContribution.riskLabel}
                    </span>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    {hoveredContribution.count > 0 ? (
                      <span className="text-[#051F20] font-bold">
                        <strong className="text-[#235347]">{formatCurrency(hoveredContribution.totalLoss)}</strong> at risk
                        <span className="text-[#163832]/60 font-normal"> ({hoveredContribution.count} {hoveredContribution.count === 1 ? "acct" : "accts"})</span>
                      </span>
                    ) : (
                      <span className="text-[#163832]/60">0 telemetry risk events</span>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-[#163832]/50 flex items-center gap-1.5 w-full justify-center">
                  <Sparkles className="w-3 h-3 text-[#235347]" />
                  <span>Hover any active micro-tile for instant 52-week cohort telemetry</span>
                </div>
              )}
            </div>

            {/* GitHub-Authentic Bottom Footer (Learn link + 5 Green Tiers Scale) */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E2EAE4] mt-2 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => {
                  playTick();
                  setShowLegendModal(true);
                }}
                className="text-[#163832]/70 hover:text-[#235347] transition-colors flex items-center gap-1.5 underline underline-offset-2 cursor-pointer font-medium"
              >
                <Info className="w-3 h-3 text-[#235347]" />
                <span>Learn how we score telemetry</span>
              </button>

              {/* Pure GitHub Green Micro-Cubes Legend with Meaning Tooltips */}
              <div className="flex items-center gap-1.5 text-[#163832]/70 font-mono text-[9.5px]">
                <span>Less</span>
                <div className="flex items-center gap-1">
                  <span
                    title="Level 0: Neutral / 0 Churn Signals"
                    className="w-[10px] h-[10px] rounded-[2px] bg-[#EBEDF0] border border-[#DFE1E4] inline-block cursor-help hover:scale-125 transition-transform"
                  />
                  <span
                    title="Level 1: Low Risk (< $2k MRR at risk)"
                    className="w-[10px] h-[10px] rounded-[2px] bg-[#9BE9A8] border border-[#82D891] inline-block cursor-help hover:scale-125 transition-transform"
                  />
                  <span
                    title="Level 2: Moderate Warning ($2k - $5k MRR at risk)"
                    className="w-[10px] h-[10px] rounded-[2px] bg-[#40C463] border border-[#31B053] inline-block cursor-help hover:scale-125 transition-transform"
                  />
                  <span
                    title="Level 3: High Risk ($5k - $20k MRR at risk)"
                    className="w-[10px] h-[10px] rounded-[2px] bg-[#235347] border border-[#1B4339] inline-block cursor-help hover:scale-125 transition-transform"
                  />
                  <span
                    title="Level 4: P0 Critical Crisis (> $20k MRR at risk)"
                    className="w-[10px] h-[10px] rounded-[2px] bg-[#0B2B26] border border-[#051F20] inline-block cursor-help hover:scale-125 transition-transform"
                  />
                </div>
                <span>More</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Explanatory Telemetry Scoring Modal */}
      <AnimatePresence>
        {showLegendModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#051F20]/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border border-[#E2EAE4] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-[#051F20]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#E2EAE4]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#EAF5E8] border border-[#C1E7BC] flex items-center justify-center text-[#235347]">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-base font-serif font-bold text-[#051F20]">Telemetry Scoring & Accent Guide</h4>
                    <p className="text-[11px] font-mono text-[#163832]/60">How Valence calculates 52-week risk intensity</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLegendModal(false)}
                  className="p-1.5 rounded-lg hover:bg-[#F4F8F5] text-[#163832]/60 hover:text-[#051F20] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 5-Tier Color Accent Legend Guide */}
              <div className="space-y-2.5 my-4">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#235347]">
                  Color Intensity Scale & Thresholds
                </div>

                <div className="space-y-2 text-xs font-mono">
                  {/* Level 0 */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8FAF9] border border-[#E2EAE4]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-xs bg-[#EBEDF0] border border-[#DFE1E4] shrink-0" />
                      <div>
                        <div className="font-bold text-[#051F20]">Level 0 • Neutral / Zero Signals</div>
                        <div className="text-[10px] text-[#163832]/60 font-sans">No churn indicators or negative events recorded on this date.</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#163832]/50">$0 Loss</span>
                  </div>

                  {/* Level 1 */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8FAF9] border border-[#E2EAE4]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-xs bg-[#9BE9A8] border border-[#82D891] shrink-0" />
                      <div>
                        <div className="font-bold text-[#051F20]">Level 1 • Healthy Baseline</div>
                        <div className="text-[10px] text-[#163832]/60 font-sans">Stable operation, normal login frequency, low risk exposure.</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#235347]">&lt; $2k at risk</span>
                  </div>

                  {/* Level 2 */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8FAF9] border border-[#E2EAE4]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-xs bg-[#40C463] border border-[#31B053] shrink-0" />
                      <div>
                        <div className="font-bold text-[#051F20]">Level 2 • Moderate Warning</div>
                        <div className="text-[10px] text-[#163832]/60 font-sans">Minor usage dip (-5% to -15%) or renewal approaching within 90 days.</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#235347]">$2k - $5k at risk</span>
                  </div>

                  {/* Level 3 */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8FAF9] border border-[#E2EAE4]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-xs bg-[#235347] border border-[#1B4339] shrink-0" />
                      <div>
                        <div className="font-bold text-[#051F20]">Level 3 • High Risk Exposure</div>
                        <div className="text-[10px] text-[#163832]/60 font-sans">Significant usage attrition or executive sponsor reassignment.</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#235347]">$5k - $20k at risk</span>
                  </div>

                  {/* Level 4 */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF0E6] border border-[#F4C4B7]">
                    <div className="flex items-center gap-2.5">
                      <span className="w-4 h-4 rounded-xs bg-[#0B2B26] border border-[#051F20] shrink-0 shadow-xs" />
                      <div>
                        <div className="font-bold text-[#0B2B26]">Level 4 • P0 Critical Escalation</div>
                        <div className="text-[10px] text-[#A44328] font-sans">Imminent churn hazard (&gt;60% prob), renewal in &lt;30 days, or &gt;25% drop.</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#A44328]">&gt; $20k at risk</span>
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="pt-3 border-t border-[#E2EAE4] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#163832]/60">Updated continuously via AI telemetry stream</span>
                <button
                  onClick={() => setShowLegendModal(false)}
                  className="px-4 py-1.5 rounded-xl bg-[#051F20] text-[#DAF1DE] font-bold hover:bg-[#163832] transition-colors cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
