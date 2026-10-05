"use client";

import React, { useState, useMemo, useRef } from "react";
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
  Sparkles,
  Activity,
  Crosshair,
  Radio,
  BarChart3,
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
  const [activeTab, setActiveTab] = useState<"scatter" | "heatmap">("scatter");
  const [filterMode, setFilterMode] = useState<"all" | "high_mrr" | "critical">("all");
  const [hoveredAccount, setHoveredAccount] = useState<AccountRecord | null>(null);
  const [canvasMousePos, setCanvasMousePos] = useState<{ x: number; y: number; pctX: number; pctY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

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

  // Max MRR for dynamic Y-scaling
  const maxMrr = useMemo(() => {
    if (accounts.length === 0) return 35000;
    const maxVal = Math.max(...accounts.map((a) => a.contract_mrr));
    return Math.max(maxVal, 30000);
  }, [accounts]);

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
      { id: "severe_drop", label: "Critical Drop (<-25%)", badge: "CRITICAL", filter: (u: number) => u < -25 },
      { id: "mod_drop", label: "Moderate Attrition (-25% to -5%)", badge: "WATCH", filter: (u: number) => u >= -25 && u < -5 },
      { id: "stable", label: "Equilibrium (-5% to +10%)", badge: "HEALTHY", filter: (u: number) => u >= -5 && u <= 10 },
      { id: "expansion", label: "High Growth (> +10%)", badge: "PRIME", filter: (u: number) => u > 10 },
    ];

    const renewalBands = [
      { id: "urgent", label: "< 30 Days", urgency: "high", filter: (d: number) => d <= 30 },
      { id: "q1", label: "30 - 60 Days", urgency: "med", filter: (d: number) => d > 30 && d <= 60 },
      { id: "q2", label: "60 - 90 Days", urgency: "low", filter: (d: number) => d > 60 && d <= 90 },
      { id: "distant", label: "> 90 Days", urgency: "safe", filter: (d: number) => d > 90 },
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
    <div className="w-full bg-[#031614] border border-[#00E599]/20 rounded-[32px] p-6 lg:p-8 text-[#FAF0E6] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.7)] relative overflow-hidden backdrop-blur-xl">
      {/* Dynamic Ambient Cyber Aura Glows */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-[#00E599]/15 via-[#235347]/10 to-transparent blur-3xl pointer-events-none -z-0 animate-pulse" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-[#EF4444]/15 via-[#8C3A27]/10 to-transparent blur-3xl pointer-events-none -z-0" />
      
      {/* Top Header & Segmented Cyber Toolbar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#163832]">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E599] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00E599]" />
            </span>
            <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-[#00E599]">
              Surveillance Array & Risk Matrix
            </span>
            <span className="text-[11px] font-mono text-[#FAF0E6]/30">•</span>
            <span className="text-[11px] font-mono text-[#FAF0E6]/60 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-[#00E599] animate-pulse" /> Live Telemetry Synced (N={accounts.length})
            </span>
          </div>
          <h3 className="text-xl lg:text-2xl font-serif font-bold text-white tracking-tight flex items-center gap-3">
            Portfolio Revenue & Risk Matrix
          </h3>
        </div>

        {/* View Toggle Tabs & Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Pills */}
          <div className="flex items-center bg-[#072422] p-1 rounded-xl border border-[#163832] shadow-inner">
            <button
              onClick={() => {
                playTick();
                setFilterMode("all");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                filterMode === "all" ? "bg-[#00E599] text-[#031614] shadow-[0_0_12px_rgba(0,229,153,0.3)]" : "text-[#FAF0E6]/60 hover:text-white"
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
                filterMode === "high_mrr" ? "bg-[#00E599] text-[#031614] shadow-[0_0_12px_rgba(0,229,153,0.3)]" : "text-[#FAF0E6]/60 hover:text-white"
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
                filterMode === "critical" ? "bg-[#EF4444] text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]" : "text-[#FAF0E6]/60 hover:text-white"
              }`}
            >
              Critical Risk
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-[#072422] p-1 rounded-xl border border-[#163832]">
            <button
              onClick={() => {
                playBlip();
                setActiveTab("scatter");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === "scatter"
                  ? "bg-gradient-to-r from-[#00E599]/20 to-[#0B2B26] text-[#00E599] border border-[#00E599]/40 shadow-sm"
                  : "text-[#FAF0E6]/60 hover:text-white"
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-[#00E599]" />
              2D Quadrant Matrix
            </button>
            <button
              onClick={() => {
                playBlip();
                setActiveTab("heatmap");
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                activeTab === "heatmap"
                  ? "bg-gradient-to-r from-amber-500/20 to-[#0B2B26] text-amber-300 border border-amber-500/40 shadow-sm"
                  : "text-[#FAF0E6]/60 hover:text-white"
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              4×4 Cohort Heatmap
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="relative z-10 pt-6">
        <AnimatePresence mode="wait">
          {activeTab === "scatter" && (
            <motion.div
              key="scatter-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* 2D Quadrant Scatter Grid Canvas */}
              <div 
                ref={canvasRef}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={() => setCanvasMousePos(null)}
                className="relative w-full h-[460px] bg-[#041a18] rounded-2xl border border-[#163832] p-6 select-none overflow-hidden group shadow-inner"
              >
                {/* Cyber Laser Grid Background Pattern */}
                <div 
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(#00E599 0.75px, transparent 0.75px), linear-gradient(to right, #163832 1px, transparent 1px), linear-gradient(to bottom, #163832 1px, transparent 1px)`,
                    backgroundSize: `24px 24px, 48px 48px, 48px 48px`
                  }}
                />

                {/* Ambient Glowing Quadrant Radiation Fields */}
                {/* Q1: Top-Right P0 Crisis Flare */}
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-rose-600/10 via-rose-950/5 to-transparent pointer-events-none border-b border-l border-dashed border-rose-900/30" />
                {/* Q2: Top-Left Expansion Flare */}
                <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-gradient-to-br from-emerald-500/10 via-emerald-950/5 to-transparent pointer-events-none border-b border-r border-dashed border-emerald-900/30" />
                {/* Q3: Bottom-Right Automated Nurture Flare */}
                <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-amber-500/10 via-amber-950/5 to-transparent pointer-events-none border-t border-l border-dashed border-amber-900/30" />
                {/* Q4: Bottom-Left Stable Platform Flare */}
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-cyan-600/5 via-slate-900/5 to-transparent pointer-events-none border-t border-r border-dashed border-cyan-900/20" />

                {/* Rotating Cyber Surveillance Radar Sweep Scanline */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
                    className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -translate-x-1/2 -translate-y-1/2 origin-center"
                    style={{
                      background: `conic-gradient(from 0deg at 50% 50%, rgba(0, 229, 153, 0.14) 0deg, rgba(0, 229, 153, 0.03) 45deg, transparent 90deg, transparent 360deg)`
                    }}
                  />
                </div>

                {/* Corner Tactical Cyber Brackets */}
                <div className="absolute top-2 left-2 text-[#00E599]/40 font-mono text-[10px] pointer-events-none">⌜ 00.00° / LAT-N</div>
                <div className="absolute top-2 right-2 text-rose-400/40 font-mono text-[10px] pointer-events-none">P0-QUAD ⌝</div>
                <div className="absolute bottom-2 left-2 text-cyan-400/40 font-mono text-[10px] pointer-events-none">⌞ BASE-CORE</div>
                <div className="absolute bottom-2 right-2 text-amber-400/40 font-mono text-[10px] pointer-events-none">NURTURE-ZONE ⌟</div>

                {/* Quadrant Strategic Designation Headers */}
                {/* Q1: Top-Right (P0 CRISIS INTERVENTION) */}
                <div className="absolute top-4 right-6 text-right pointer-events-none z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-950/80 border border-rose-600/50 text-[10px] font-mono font-bold uppercase tracking-wider text-rose-300 shadow-[0_0_16px_rgba(244,63,94,0.3)]">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    P0 Crisis Intervention
                  </div>
                  <div className="text-[11px] font-mono text-rose-300/90 font-bold mt-1">
                    {quadrantStats.p0.count} Accounts • {formatCurrency(quadrantStats.p0.mrr)} MRR ({quadrantStats.p0.pct.toFixed(1)}%)
                  </div>
                </div>

                {/* Q2: Top-Left (EXPANSION & UPSELL) */}
                <div className="absolute top-4 left-14 text-left pointer-events-none z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.3)]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Expansion & Upsell Prime
                  </div>
                  <div className="text-[11px] font-mono text-emerald-300/90 font-bold mt-1">
                    {quadrantStats.expansion.count} Accounts • {formatCurrency(quadrantStats.expansion.mrr)} MRR ({quadrantStats.expansion.pct.toFixed(1)}%)
                  </div>
                </div>

                {/* Q3: Bottom-Right (AUTOMATED NURTURE) */}
                <div className="absolute bottom-12 right-6 text-right pointer-events-none z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-500/50 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.3)]">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Automated Playbooks
                  </div>
                  <div className="text-[11px] font-mono text-amber-300/90 font-bold mt-1">
                    {quadrantStats.automated.count} Accounts • {formatCurrency(quadrantStats.automated.mrr)} MRR
                  </div>
                </div>

                {/* Q4: Bottom-Left (STABLE CORE) */}
                <div className="absolute bottom-12 left-14 text-left pointer-events-none z-10">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-700/60 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    Stable Core Retention
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 font-bold mt-1">
                    {quadrantStats.stable.count} Accounts • {formatCurrency(quadrantStats.stable.mrr)} MRR
                  </div>
                </div>

                {/* Interactive Dynamic Cursor Laser Crosshair */}
                {canvasMousePos && (
                  <div className="pointer-events-none absolute inset-0 z-15">
                    {/* Vertical Laser Crosshair */}
                    <div 
                      className="absolute top-0 bottom-0 w-[1px] bg-[#00E599]/30 border-r border-dashed border-[#00E599]/50"
                      style={{ left: `${canvasMousePos.x}px` }}
                    />
                    {/* Horizontal Laser Crosshair */}
                    <div 
                      className="absolute left-0 right-0 h-[1px] bg-[#00E599]/30 border-b border-dashed border-[#00E599]/50"
                      style={{ top: `${canvasMousePos.y}px` }}
                    />
                    {/* Live Telemetry Coordinate Chip */}
                    <div 
                      className="absolute bg-[#031614]/90 border border-[#00E599]/40 rounded-lg px-2.5 py-1 text-[10px] font-mono text-[#00E599] shadow-xl backdrop-blur-md -translate-x-1/2 -translate-y-10"
                      style={{ left: `${canvasMousePos.x}px`, top: `${canvasMousePos.y}px` }}
                    >
                      Risk: {Math.round(canvasMousePos.pctX * 100)}% • MRR: ${Math.round(canvasMousePos.pctY * maxMrr).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Y-Axis Label */}
                <div className="absolute left-2 top-[48%] -rotate-90 origin-center text-[10px] font-mono font-bold uppercase tracking-widest text-[#FAF0E6]/60 flex items-center gap-1">
                  <span>▲ Contract Value (MRR)</span>
                </div>

                {/* X-Axis Label */}
                <div className="absolute bottom-2 left-[50%] -translate-x-1/2 text-[10px] font-mono font-bold uppercase tracking-widest text-[#FAF0E6]/60 flex items-center gap-3">
                  <span className="text-emerald-400">0% Safe</span>
                  <span>─────────────</span>
                  <span className="text-amber-400">50% Churn Horizon</span>
                  <span>─────────────</span>
                  <span className="text-rose-400">100% Imminent Loss ►</span>
                </div>

                {/* Plotting Bubbles Canvas Container */}
                <div className="absolute inset-x-14 top-10 bottom-14">
                  {filteredAccounts.map((account, idx) => {
                    const prob = account.churn_probability ?? 0;
                    const mrr = account.contract_mrr;
                    const isSelected = selectedAccount?.account_id === account.account_id;
                    const isHovered = hoveredAccount?.account_id === account.account_id;

                    // Calculate position percentages
                    const leftPct = Math.min(Math.max(prob * 90 + 5, 4), 96);
                    const bottomPct = Math.min(Math.max((mrr / maxMrr) * 85 + 5, 6), 94);

                    // Dynamic color & glow based on risk tier
                    let colorClass = "bg-emerald-400 text-emerald-950 shadow-[0_0_16px_rgba(52,211,153,0.5)] border-emerald-300";
                    let ringClass = "border-emerald-400";
                    if (prob >= 0.75) {
                      colorClass = "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.7)] border-rose-300";
                      ringClass = "border-rose-400";
                    } else if (prob >= 0.5) {
                      colorClass = "bg-amber-400 text-amber-950 shadow-[0_0_16px_rgba(251,191,36,0.6)] border-amber-200";
                      ringClass = "border-amber-400";
                    }

                    // Node radius scaling by MRR ($5k -> 26px, $35k -> 44px)
                    const bubbleSize = Math.max(Math.min(24 + (mrr / 35000) * 18, 44), 24);

                    return (
                      <React.Fragment key={account.account_id}>
                        {/* Interactive Vector Line on Hover or Selection */}
                        {(isHovered || isSelected) && (
                          <svg className="absolute inset-0 w-full h-full pointer-events-none z-15 overflow-visible">
                            {/* Line to X-Axis */}
                            <line 
                              x1={`${leftPct}%`} 
                              y1={`${100 - bottomPct}%`} 
                              x2={`${leftPct}%`} 
                              y2="100%" 
                              stroke={prob >= 0.5 ? "#EF4444" : "#00E599"} 
                              strokeWidth="1.5" 
                              strokeDasharray="4 4" 
                              opacity="0.8"
                            />
                            {/* Line to Y-Axis */}
                            <line 
                              x1={`${leftPct}%`} 
                              y1={`${100 - bottomPct}%`} 
                              x2="0%" 
                              y2={`${100 - bottomPct}%`} 
                              stroke={prob >= 0.5 ? "#EF4444" : "#00E599"} 
                              strokeWidth="1.5" 
                              strokeDasharray="4 4" 
                              opacity="0.8"
                            />
                          </svg>
                        )}

                        {/* Interactive Floating Node */}
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
                          animate={{
                            y: [0, idx % 2 === 0 ? -3 : 3, 0],
                          }}
                          transition={{
                            duration: 3 + (idx % 3),
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          style={{
                            left: `${leftPct}%`,
                            bottom: `${bottomPct}%`,
                            width: `${bubbleSize}px`,
                            height: `${bubbleSize}px`,
                          }}
                          className={`absolute -translate-x-1/2 translate-y-1/2 rounded-full cursor-pointer flex items-center justify-center font-mono font-bold text-[10px] border-2 transition-all duration-300 ${colorClass} ${
                            isSelected 
                              ? "ring-4 ring-white scale-135 z-35 shadow-[0_0_24px_rgba(255,255,255,0.8)]" 
                              : "hover:scale-140 hover:z-30 opacity-95 hover:opacity-100"
                          }`}
                          whileHover={{ scale: 1.4 }}
                          whileTap={{ scale: 0.92 }}
                        >
                          {/* Company Code Tag */}
                          <span className="drop-shadow-sm font-extrabold tracking-tighter">
                            {account.company_name.substring(0, 2).toUpperCase()}
                          </span>

                          {/* Pulsing Sonar Halos for High-Risk & Selected Nodes */}
                          {(isSelected || prob >= 0.75) && (
                            <>
                              <span className={`absolute -inset-1.5 rounded-full border-2 ${ringClass} animate-ping opacity-60`} />
                              <span className={`absolute -inset-3 rounded-full border border-dashed ${ringClass} animate-spin-slow opacity-30`} />
                            </>
                          )}
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Floating Telemetry HUD Glass Card on Hover */}
                <AnimatePresence>
                  {hoveredAccount && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.92, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.92, y: 8 }}
                      className="absolute top-4 left-1/2 -translate-x-1/2 bg-[#021110]/95 backdrop-blur-xl border border-[#00E599]/60 rounded-2xl px-5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.8)] z-40 pointer-events-none flex items-center gap-5 ring-1 ring-white/10"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-[#00E599] font-bold uppercase tracking-wider">
                            {hoveredAccount.account_id}
                          </span>
                          <span className="text-xs font-serif text-white font-bold">
                            {hoveredAccount.company_name}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-white flex items-center gap-3 mt-1">
                          <span>MRR: <strong className="text-[#00E599]">{formatCurrency(hoveredAccount.contract_mrr)}</strong></span>
                          <span>•</span>
                          <span>Churn Risk: <strong className={(hoveredAccount.churn_probability ?? 0) >= 0.5 ? "text-rose-400" : "text-emerald-400"}>{Math.round((hoveredAccount.churn_probability ?? 0) * 100)}%</strong></span>
                        </div>
                      </div>
                      <div className="pl-4 border-l border-[#163832] text-[11px] font-mono text-[#FAF0E6]/80 space-y-0.5">
                        <div>Usage Δ: <span className={(hoveredAccount.usage_change_pct_30d ?? 0) < 0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>{hoveredAccount.usage_change_pct_30d ?? 0}%</span></div>
                        <div>Renewal Horizon: <span className="text-amber-300 font-bold">{hoveredAccount.days_until_renewal ?? 60}d</span></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bottom Cyber Quadrant Metric Summary HUD Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-1">
                {/* P0 Card */}
                <div className="bg-[#041a18] border border-rose-600/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-rose-500/60 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-rose-400 font-bold tracking-wider">P0 Crisis Exposure</span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 font-mono text-[10px] font-bold border border-rose-800/60">
                      {quadrantStats.p0.count} accts
                    </span>
                  </div>
                  <div className="text-xl font-serif font-bold text-white mt-2">
                    {formatCurrency(quadrantStats.p0.mrr)}
                  </div>
                  {/* Progress Rail */}
                  <div className="w-full bg-rose-950/60 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"
                      style={{ width: `${Math.min(quadrantStats.p0.pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Expansion Card */}
                <div className="bg-[#041a18] border border-emerald-600/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-emerald-500/60 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold tracking-wider">Expansion ARR Pool</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono text-[10px] font-bold border border-emerald-800/60">
                      {quadrantStats.expansion.count} accts
                    </span>
                  </div>
                  <div className="text-xl font-serif font-bold text-white mt-2">
                    {formatCurrency(quadrantStats.expansion.mrr * 12)}
                  </div>
                  {/* Progress Rail */}
                  <div className="w-full bg-emerald-950/60 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                      style={{ width: `${Math.min(quadrantStats.expansion.pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Nurture Card */}
                <div className="bg-[#041a18] border border-amber-600/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-amber-500/60 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-wider">Automated Nurture</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 font-mono text-[10px] font-bold border border-amber-800/60">
                      {quadrantStats.automated.count} accts
                    </span>
                  </div>
                  <div className="text-xl font-serif font-bold text-white mt-2">
                    {formatCurrency(quadrantStats.automated.mrr)}
                  </div>
                  {/* Progress Rail */}
                  <div className="w-full bg-amber-950/60 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                      style={{ width: `${Math.min(quadrantStats.automated.pct, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Stable Base Card */}
                <div className="bg-[#041a18] border border-cyan-700/30 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-cyan-500/60 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider">Stable Core Retention</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 font-mono text-[10px] font-bold border border-slate-700/60">
                      {quadrantStats.stable.count} accts
                    </span>
                  </div>
                  <div className="text-xl font-serif font-bold text-white mt-2">
                    {formatCurrency(quadrantStats.stable.mrr)}
                  </div>
                  {/* Progress Rail */}
                  <div className="w-full bg-slate-900/60 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div 
                      className="bg-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
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
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Heatmap Matrix Table */}
              <div className="bg-[#041a18] rounded-2xl border border-[#163832] p-5 lg:p-6 overflow-x-auto shadow-inner">
                <div className="text-xs font-mono font-bold text-[#FAF0E6]/80 mb-4 flex items-center justify-between border-b border-[#163832] pb-3">
                  <span className="flex items-center gap-2 text-[#00E599]">
                    <Layers className="w-4 h-4" /> 4×4 MULTIDIMENSIONAL TELEMETRY DENSITY GRID
                  </span>
                  <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Select any cell to isolate & inspect cohort
                  </span>
                </div>

                <div className="min-w-[660px]">
                  {/* Column Header (Renewal Horizon) */}
                  <div className="grid grid-cols-5 gap-3 pb-3 text-[11px] font-mono font-bold text-[#FAF0E6]/70 text-center">
                    <div className="text-left font-serif text-[#00E599] text-xs">Usage Metric \ Renewal</div>
                    <div className="bg-rose-950/40 border border-rose-800/30 rounded-lg py-1.5 text-rose-300">&lt; 30 Days (Urgent)</div>
                    <div className="bg-amber-950/40 border border-amber-800/30 rounded-lg py-1.5 text-amber-300">30 - 60 Days</div>
                    <div className="bg-[#0B2B26] border border-[#163832] rounded-lg py-1.5 text-emerald-300">60 - 90 Days</div>
                    <div className="bg-[#0B2B26] border border-[#163832] rounded-lg py-1.5 text-cyan-300">&gt; 90 Days</div>
                  </div>

                  {/* Rows */}
                  <div className="space-y-3">
                    {heatmapData.map((row) => (
                      <div key={row.usageBand.id} className="grid grid-cols-5 gap-3 items-center">
                        <div className="text-xs font-mono font-bold text-[#FAF0E6]/90 pr-2 flex items-center justify-between">
                          <span>{row.usageBand.label}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#163832] text-[#00E599] font-mono">{row.usageBand.badge}</span>
                        </div>
                        {row.cells.map((cell, idx) => {
                          const hasAccounts = cell.count > 0;
                          const hasHeavyLoss = cell.totalLoss > 15000;
                          
                          // Cyber Color Density Grid
                          let bgCell = "bg-[#072422]/60 border-[#163832]";
                          let textLoss = "text-[#00E599]";
                          if (hasHeavyLoss || (hasAccounts && cell.renewalBand.id === "urgent" && row.usageBand.id === "severe_drop")) {
                            bgCell = "bg-rose-950/80 border-rose-500/70 hover:border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]";
                            textLoss = "text-rose-300";
                          } else if (hasAccounts && row.usageBand.id === "severe_drop") {
                            bgCell = "bg-amber-950/70 border-amber-500/60 hover:border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.2)]";
                            textLoss = "text-amber-300";
                          } else if (hasAccounts) {
                            bgCell = "bg-[#0B2B26] border-emerald-500/40 hover:border-emerald-400";
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
                              className={`h-22 rounded-xl border p-3 flex flex-col justify-between text-left transition-all ${bgCell} ${
                                hasAccounts ? "cursor-pointer hover:scale-[1.03] hover:shadow-2xl" : "opacity-25 cursor-not-allowed"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-mono font-bold text-white flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E599]" />
                                  {cell.count} {cell.count === 1 ? "Account" : "Accounts"}
                                </span>
                                {hasHeavyLoss && (
                                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
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
