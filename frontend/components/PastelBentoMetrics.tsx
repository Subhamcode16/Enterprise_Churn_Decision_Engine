"use client";

import { useState, useRef, useEffect } from "react";
import { PortfolioSummary } from "@/lib/types";
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowUp, 
  CreditCard, 
  TrendingUp, 
  Radio, 
  Flame,
  ShieldCheck, 
  Sparkles,
  Layers
} from "lucide-react";
import AnimatedCounter from "@/components/AnimatedCounter";
import { playTick, playExecute } from "@/lib/sound";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  MOTION_ARCHETYPES, 
  createCardTilt, 
  triggerSpecularSheen, 
  isReducedMotion 
} from "@/lib/motionArchetypes";

interface PastelBentoMetricsProps {
  summary: PortfolioSummary;
}

export default function PastelBentoMetrics({ summary }: PastelBentoMetricsProps) {
  const [timeframe, setTimeframe] = useState<"monthly" | "annually">("annually");

  // DOM Refs for GSAP Archetype Choreography
  const containerRef = useRef<HTMLDivElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const valenceCardRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const centerCardRef = useRef<HTMLDivElement>(null);
  const barsContainerRef = useRef<HTMLDivElement>(null);
  const peakBadgeRef = useRef<HTMLDivElement>(null);
  const lossCardRef = useRef<HTMLDivElement>(null);
  const wavePathRef = useRef<SVGPathElement>(null);
  const waveFillRef = useRef<SVGPathElement>(null);
  const criticalCardRef = useRef<HTMLDivElement>(null);
  const avatarStackRef = useRef<HTMLDivElement>(null);
  const urgentBadgeRef = useRef<HTMLSpanElement>(null);

  // GSAP Entrance Timeline adhering to Hero-first staggered cascade
  useGSAP(
    () => {
      if (isReducedMotion()) return;

      const tl = gsap.timeline({
        defaults: { ease: MOTION_ARCHETYPES.premium.ease },
      });

      // 1. Primary Layer - Hero: Enterprise Capital (Premium Archetype)
      if (heroCardRef.current) {
        tl.fromTo(
          heroCardRef.current,
          { y: 28, opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: MOTION_ARCHETYPES.premium.duration,
            ease: MOTION_ARCHETYPES.premium.ease,
          },
          0
        );
      }

      // Secondary Layer: Specular shimmer sheen sweep across the Valence card
      if (sheenRef.current) {
        tl.add(() => {
          if (sheenRef.current) triggerSpecularSheen(sheenRef.current);
        }, 0.2);
      }

      // 2. Primary Layer - Retention Velocity (Corporate Archetype)
      if (centerCardRef.current) {
        tl.fromTo(
          centerCardRef.current,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: MOTION_ARCHETYPES.corporate.duration + 0.1,
            ease: MOTION_ARCHETYPES.corporate.ease,
          },
          0.1
        );
      }

      // Retention Velocity Bar Wave Cascade (Wave Stagger Choreography)
      if (barsContainerRef.current) {
        const bars = barsContainerRef.current.querySelectorAll(".metric-bar");
        tl.fromTo(
          bars,
          { scaleY: 0, opacity: 0.4 },
          {
            scaleY: 1,
            opacity: 1,
            transformOrigin: "bottom center",
            duration: 0.45,
            stagger: {
              each: 0.05,
              from: "start",
              ease: "power2.out",
            },
          },
          0.18
        );
      }

      // Floating Peak Month Badge (+17.8%) Tactile Pop
      if (peakBadgeRef.current) {
        tl.fromTo(
          peakBadgeRef.current,
          { scale: 0, y: 10, opacity: 0 },
          {
            scale: 1,
            y: 0,
            opacity: 1,
            duration: 0.35,
            ease: "back.out(2)",
          },
          0.4
        );
      }

      // 3. Primary Layer - Loss Exposure (Premium Archetype)
      if (lossCardRef.current) {
        tl.fromTo(
          lossCardRef.current,
          { y: 20, opacity: 0, scale: 0.98 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: MOTION_ARCHETYPES.premium.duration * 0.9,
            ease: MOTION_ARCHETYPES.premium.ease,
          },
          0.18
        );
      }

      // Loss Exposure SVG Wave Draw (Secondary Motion Layer)
      if (wavePathRef.current) {
        const length = 320;
        gsap.set(wavePathRef.current, {
          strokeDasharray: length,
          strokeDashoffset: length,
        });
        tl.to(
          wavePathRef.current,
          {
            strokeDashoffset: 0,
            duration: 0.75,
            ease: "power2.out",
          },
          0.28
        );
      }

      if (waveFillRef.current) {
        tl.fromTo(
          waveFillRef.current,
          { opacity: 0, scaleY: 0 },
          {
            opacity: 1,
            scaleY: 1,
            transformOrigin: "bottom center",
            duration: 0.6,
            ease: "power2.out",
          },
          0.32
        );
      }

      // 4. Primary Layer - Active Critical Load (Energetic Archetype: Snappy & Alert)
      if (criticalCardRef.current) {
        tl.fromTo(
          criticalCardRef.current,
          { y: 16, opacity: 0, scale: 0.96 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: MOTION_ARCHETYPES.energetic.duration + 0.12,
            ease: MOTION_ARCHETYPES.energetic.ease,
          },
          0.24
        );
      }

      // Critical Response Pod Avatars Cascade
      if (avatarStackRef.current) {
        const avatars = avatarStackRef.current.children;
        tl.fromTo(
          avatars,
          { scale: 0, x: -8 },
          {
            scale: 1,
            x: 0,
            duration: 0.25,
            stagger: 0.04,
            ease: "back.out(1.8)",
          },
          0.36
        );
      }

      // Ambient Motion Layer: Alert beacon pulse on urgent indicator
      if (urgentBadgeRef.current) {
        gsap.to(urgentBadgeRef.current, {
          boxShadow: "0 0 14px rgba(220, 38, 38, 0.4)",
          repeat: -1,
          yoyo: true,
          duration: 1.2,
          ease: "sine.inOut",
        });
      }
    },
    { scope: containerRef }
  );

  // High Performance 3D Tilt setup using GSAP quickTo
  useEffect(() => {
    const cleanups: (() => void)[] = [];

    if (heroCardRef.current) {
      cleanups.push(createCardTilt(heroCardRef.current, "premium"));
    }
    if (centerCardRef.current) {
      cleanups.push(createCardTilt(centerCardRef.current, "corporate"));
    }
    if (lossCardRef.current) {
      cleanups.push(createCardTilt(lossCardRef.current, "premium"));
    }
    if (criticalCardRef.current) {
      cleanups.push(createCardTilt(criticalCardRef.current, "energetic"));
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, []);

  // Tactile button animation helper
  const animateTactileButton = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isReducedMotion()) return;
    const target = e.currentTarget;
    gsap.fromTo(
      target,
      { scale: MOTION_ARCHETYPES.tactile.scalePress },
      {
        scale: 1,
        duration: MOTION_ARCHETYPES.tactile.duration,
        ease: MOTION_ARCHETYPES.tactile.ease,
        overwrite: "auto",
      }
    );
  };

  return (
    <div ref={containerRef} className="grid grid-cols-1 lg:grid-cols-12 gap-5 font-sans">
      {/* 1. Left Widget: Payment Goal / Card Hero Widget (4 Cols) - Premium Archetype */}
      <div 
        ref={heroCardRef}
        onMouseEnter={() => {
          if (sheenRef.current) triggerSpecularSheen(sheenRef.current);
        }}
        className="lg:col-span-4 bg-white border border-[#E2EAE4] rounded-[28px] p-6 shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] hover:shadow-[0_12px_36px_-4px_rgba(5,31,32,0.08)] transition-shadow duration-300 flex flex-col justify-between relative group cursor-default"
      >
        <div>
          {/* Header Row */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#235347]" />
                <h3 className="text-sm font-bold text-[#051F20] tracking-tight">
                  Enterprise Capital
                </h3>
              </div>
              <p className="text-[11px] text-stone-500 font-medium">
                Total portfolio commitment
              </p>
            </div>

            <button 
              onClick={(e) => {
                playTick();
                animateTactileButton(e);
              }}
              className="w-8 h-8 rounded-full border border-[#E2EAE4] bg-[#F4F8F5] hover:bg-[#DAF1DE] text-[#051F20] flex items-center justify-center transition-colors shadow-2xs group-hover:border-[#8EB69B]/50"
              title="View Portfolio Details"
            >
              <ArrowUpRight className="w-4 h-4 text-[#235347] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </div>

          {/* Hero Forest Green Card (Premium Archetype with Dynamic Specular Sheen) */}
          <div 
            ref={valenceCardRef}
            className="relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br from-[#235347] via-[#163832] to-[#0B2B26] shadow-md transition-all duration-300 hover:shadow-xl"
          >
            {/* Ambient Background Radial Glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
            
            {/* Specular Sheen Shimmer Bar */}
            <div 
              ref={sheenRef}
              className="absolute inset-y-0 -left-1/3 w-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] pointer-events-none opacity-0"
            />

            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-1.5 font-mono font-black text-sm tracking-widest text-[#DAF1DE]">
                <span>VALENCE</span>
                <span className="text-[10px] text-emerald-300 font-sans tracking-normal font-medium bg-white/10 px-1.5 py-0.5 rounded backdrop-blur-xs">
                  CORE
                </span>
              </div>
              <Radio className="w-4 h-4 text-emerald-300 rotate-90" />
            </div>

            <div className="text-[11px] font-mono text-emerald-200 uppercase tracking-wider mb-1 relative z-10">
              Active Contracts MRR
            </div>
            
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-5 font-mono relative z-10">
              <AnimatedCounter prefix="$ " value={summary.total_portfolio_mrr} decimals={2} />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-200/90 pt-2 border-t border-emerald-500/20 relative z-10">
              <span>•••• {summary.total_accounts}9090</span>
              <span>EXP 09/26</span>
            </div>
          </div>

          {/* Telemetry Status Breakdown Pills (Eliminates dead empty space) */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="p-2.5 rounded-xl bg-[#DAF1DE]/40 border border-[#8EB69B]/30 text-center">
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Healthy</div>
              <div className="text-xs font-mono font-bold text-[#051F20] mt-0.5">{summary.low_risk_count} Accts</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F4F8F5] border border-[#E2EAE4] text-center">
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Warning</div>
              <div className="text-xs font-mono font-bold text-amber-700 mt-0.5">{summary.medium_risk_count} Accts</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAF0E6] border border-[#8C3A27]/20 text-center">
              <div className="text-[10px] font-mono text-stone-500 uppercase tracking-wider">Critical</div>
              <div className="text-xs font-mono font-bold text-[#8C3A27] mt-0.5">{summary.critical_risk_count + summary.high_risk_count} Accts</div>
            </div>
          </div>
        </div>

        {/* Bottom Metric in Left Card */}
        <div className="pt-4 mt-3 border-t border-[#F0F4F1] flex items-center justify-between">
          <div>
            <span className="text-[11px] text-stone-500 font-medium">Monthly ARR Runrate</span>
            <div className="text-lg font-mono font-extrabold text-[#051F20] mt-0.5">
              +${(summary.total_portfolio_mrr * 12 / 1000).toFixed(0)}k USD
            </div>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#0B2B26] text-[#DAF1DE] text-[11px] font-mono font-bold shadow-2xs hover:bg-[#163832] transition-colors">
            <ArrowUp className="w-3 h-3 text-[#8EB69B]" />
            <span>+12.8%</span>
          </div>
        </div>
      </div>

      {/* 2. Center Widget: Engagement Rate / Hatched Diagonal-Stripe Pill Bar Chart (5 Cols) - Corporate Archetype */}
      <div 
        ref={centerCardRef}
        className="lg:col-span-5 bg-white border border-[#E2EAE4] rounded-[28px] p-6 shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] hover:shadow-[0_12px_36px_-4px_rgba(5,31,32,0.08)] transition-shadow duration-300 flex flex-col justify-between relative cursor-default"
      >
        <div>
          {/* Header Row with Pill Switcher */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#DAF1DE] flex items-center justify-center text-[#235347]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-[#051F20] tracking-tight">
                Retention Velocity
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center p-1 rounded-full bg-[#F4F8F5] border border-[#E2EAE4] text-xs">
                <button
                  onClick={(e) => {
                    playTick();
                    animateTactileButton(e);
                    setTimeframe("monthly");
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    timeframe === "monthly" 
                      ? "bg-[#235347] text-white shadow-xs" 
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={(e) => {
                    playTick();
                    animateTactileButton(e);
                    setTimeframe("annually");
                  }}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    timeframe === "annually" 
                      ? "bg-[#235347] text-white shadow-xs" 
                      : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  Annually
                </button>
              </div>

              <button 
                onClick={(e) => {
                  playTick();
                  animateTactileButton(e);
                }}
                className="w-8 h-8 rounded-full border border-[#E2EAE4] bg-[#F4F8F5] hover:bg-[#DAF1DE] text-[#051F20] flex items-center justify-center transition-colors shadow-2xs"
                title="Expand Attributions"
              >
                <ArrowUpRight className="w-4 h-4 text-[#235347]" />
              </button>
            </div>
          </div>

          {/* Hatched Pill Bar Chart with Wave Choreography */}
          <div className="relative pt-4 pb-2">
            {/* Grid background lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-dashed border-stone-200 w-full" />
              <div className="border-b border-dashed border-stone-200 w-full" />
              <div className="border-b border-dashed border-stone-200 w-full" />
              <div className="border-b border-dashed border-stone-200 w-full" />
            </div>

            <div ref={barsContainerRef} className="grid grid-cols-6 gap-3 sm:gap-4 h-60 items-end relative z-10 px-2">
              {/* JAN */}
              <div className="flex flex-col items-center gap-2 h-full justify-end group/bar">
                <div 
                  className="metric-bar w-full max-w-[42px] h-[48%] rounded-full border border-[#8EB69B]/40 bg-[#DAF1DE]/60 pattern-diagonal-stripes transition-all duration-200 group-hover/bar:bg-[#DAF1DE] group-hover/bar:scale-y-[1.04] origin-bottom"
                  title="January Retention: 48%"
                />
                <span className="text-[10px] font-mono font-medium text-stone-500">JAN</span>
              </div>

              {/* FEB */}
              <div className="flex flex-col items-center gap-2 h-full justify-end group/bar">
                <div 
                  className="metric-bar w-full max-w-[42px] h-[78%] rounded-full border border-[#8EB69B]/40 bg-[#DAF1DE]/60 pattern-diagonal-stripes transition-all duration-200 group-hover/bar:bg-[#DAF1DE] group-hover/bar:scale-y-[1.04] origin-bottom"
                  title="February Retention: 78%"
                />
                <span className="text-[10px] font-mono font-medium text-stone-500">FEB</span>
              </div>

              {/* MAR */}
              <div className="flex flex-col items-center gap-2 h-full justify-end group/bar">
                <div 
                  className="metric-bar w-full max-w-[42px] h-[58%] rounded-full border border-[#8EB69B]/40 bg-[#DAF1DE]/60 pattern-diagonal-stripes transition-all duration-200 group-hover/bar:bg-[#DAF1DE] group-hover/bar:scale-y-[1.04] origin-bottom"
                  title="March Retention: 58%"
                />
                <span className="text-[10px] font-mono font-medium text-stone-500">MAR</span>
              </div>

              {/* APR - Peak Month Highlight (Matching Reference Solid Green with Badge) */}
              <div className="flex flex-col items-center gap-2 h-full justify-end relative group/bar">
                {/* Floating Peak Tooltip */}
                <div 
                  ref={peakBadgeRef}
                  className="absolute -top-7 z-20 flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#0B2B26] text-[#DAF1DE] text-[10px] font-mono font-extrabold shadow-sm whitespace-nowrap"
                >
                  <span>+17.8%</span>
                </div>

                {/* Solid Emerald Peak Bar */}
                <div 
                  className="metric-bar w-full max-w-[42px] h-[92%] rounded-full bg-[#235347] shadow-sm relative transition-all duration-200 group-hover/bar:bg-[#163832] group-hover/bar:scale-y-[1.03] origin-bottom"
                  title="April Peak Retention: 92%"
                >
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white/80 shadow-xs" />
                </div>
                <span className="text-[10px] font-mono font-bold text-[#051F20]">APR</span>
              </div>

              {/* MAY */}
              <div className="flex flex-col items-center gap-2 h-full justify-end group/bar">
                <div 
                  className="metric-bar w-full max-w-[42px] h-[70%] rounded-full border border-[#8EB69B]/40 bg-[#DAF1DE]/60 pattern-diagonal-stripes transition-all duration-200 group-hover/bar:bg-[#DAF1DE] group-hover/bar:scale-y-[1.04] origin-bottom"
                  title="May Retention: 70%"
                />
                <span className="text-[10px] font-mono font-medium text-stone-500">MAY</span>
              </div>

              {/* JUN */}
              <div className="flex flex-col items-center gap-2 h-full justify-end group/bar">
                <div 
                  className="metric-bar w-full max-w-[42px] h-[75%] rounded-full border border-[#8EB69B]/40 bg-[#DAF1DE]/60 pattern-diagonal-stripes transition-all duration-200 group-hover/bar:bg-[#DAF1DE] group-hover/bar:scale-y-[1.04] origin-bottom"
                  title="June Retention: 75%"
                />
                <span className="text-[10px] font-mono font-medium text-stone-500">JUN</span>
              </div>
            </div>

            {/* Velocity Trend Callout strip (Eliminates dead vertical space) */}
            <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] font-mono">
              <span className="text-stone-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#235347]" />
                Peak Defense: APR (+17.8% MoM)
              </span>
              <span className="text-[#235347] font-semibold">Trend: Accelerated</span>
            </div>
          </div>
        </div>

        <div className="pt-3.5 mt-2 border-t border-[#F0F4F1] flex items-center justify-between text-xs text-stone-500">
          <span>Q2 Model Retention Benchmark</span>
          <span className="font-mono font-bold text-[#235347]">92.4% Net ARR Defense</span>
        </div>
      </div>

      {/* 3. Right Stack: Wave Sparkline & Mandatory Protocols (3 Cols) */}
      <div className="lg:col-span-3 space-y-5">
        {/* Top: Total Balance & Wave Sparkline - Premium Archetype */}
        <div 
          ref={lossCardRef}
          className="bg-white border border-[#E2EAE4] rounded-[28px] p-5 shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] hover:shadow-[0_12px_36px_-4px_rgba(5,31,32,0.08)] transition-shadow duration-300 relative cursor-default"
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-bold text-[#051F20] tracking-tight">Loss Exposure</span>
              <p className="text-[10px] text-stone-500">Total amount at risk</p>
            </div>

            <button 
              onClick={(e) => {
                playTick();
                animateTactileButton(e);
              }}
              className="w-7 h-7 rounded-full border border-[#E2EAE4] bg-[#F4F8F5] hover:bg-[#DAF1DE] text-[#051F20] flex items-center justify-center transition-colors shadow-2xs"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-[#235347]" />
            </button>
          </div>

          <div className="text-center my-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">Current Exposure</span>
            <div className="text-2xl font-mono font-extrabold text-[#051F20] tracking-tight mt-0.5">
              <AnimatedCounter prefix="$" value={summary.total_mrr_at_risk} decimals={2} />
            </div>
          </div>

          {/* Smooth Multi-Stop Wave Sparkline with GSAP draw animation */}
          <div className="w-full h-14 my-2 relative">
            <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="mintWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8EB69B" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#DAF1DE" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {/* Shaded Area */}
              <path
                ref={waveFillRef}
                d="M 0 45 Q 25 15 50 35 T 100 20 T 150 40 T 200 15 L 200 60 L 0 60 Z"
                fill="url(#mintWaveGrad)"
              />
              {/* Curve Stroke */}
              <path
                ref={wavePathRef}
                d="M 0 45 Q 25 15 50 35 T 100 20 T 150 40 T 200 15"
                fill="none"
                stroke="#235347"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Tactile Action Buttons (Matching Send / Receive) */}
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-[#F0F4F1]">
            <button
              onClick={(e) => {
                playExecute();
                animateTactileButton(e);
              }}
              className="py-1.5 px-3 rounded-full bg-[#235347] hover:bg-[#163832] text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-2xs active:scale-95"
            >
              <span>Deploy</span>
              <ArrowUp className="w-3 h-3" />
            </button>

            <button
              onClick={(e) => {
                playTick();
                animateTactileButton(e);
              }}
              className="py-1.5 px-3 rounded-full bg-[#F4F8F5] hover:bg-[#DAF1DE] border border-[#E2EAE4] text-[#051F20] text-[11px] font-semibold flex items-center justify-center gap-1 transition-all shadow-2xs active:scale-95"
            >
              <span>Simulate</span>
              <ArrowDownLeft className="w-3 h-3 text-stone-500" />
            </button>
          </div>
        </div>

        {/* Bottom: Active Critical Load - Energetic Archetype (High Alert & Rapid Response) */}
        <div 
          ref={criticalCardRef}
          className="bg-white border border-[#E2EAE4] rounded-[28px] p-5 shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] hover:shadow-[0_12px_36px_-4px_rgba(140,58,39,0.12)] transition-all duration-300 relative cursor-default group/crit"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-[#DAF1DE] flex items-center justify-center text-[#235347] group-hover/crit:bg-[#FAF0E6] group-hover/crit:text-[#8C3A27] transition-colors">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#051F20] tracking-tight">Active Critical Load</span>
                <p className="text-[10px] text-stone-500">Urgent intervention required</p>
              </div>
            </div>

            {/* Ambient Alert Indicator */}
            <span 
              ref={urgentBadgeRef} 
              className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white shadow-xs" 
              title="Urgent Critical SLA"
            />
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div className="text-2xl font-mono font-extrabold text-[#051F20] group-hover/crit:text-[#8C3A27] transition-colors">
              <AnimatedCounter value={summary.critical_risk_count + summary.high_risk_count} decimals={0} suffix=" Accts" />
            </div>

            <span className="px-2 py-0.5 rounded-full bg-[#0B2B26] text-[#DAF1DE] text-[10px] font-mono font-bold shadow-2xs">
              +12.8%
            </span>
          </div>

          {/* Stacked Customer Team Avatars with Cascade micro-motion */}
          <div className="mt-4 pt-3 border-t border-[#F0F4F1] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500">Response Pods</span>
              <div ref={avatarStackRef} className="flex items-center -space-x-2 mt-1">
                <div className="w-7 h-7 rounded-full bg-[#DAF1DE] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#0B2B26] hover:z-10 hover:scale-110 transition-transform">
                  CS
                </div>
                <div className="w-7 h-7 rounded-full bg-[#E2EAE4] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#163832] hover:z-10 hover:scale-110 transition-transform">
                  ENG
                </div>
                <div className="w-7 h-7 rounded-full bg-[#8EB69B]/40 border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#051F20] hover:z-10 hover:scale-110 transition-transform">
                  VP
                </div>
                <div className="w-7 h-7 rounded-full bg-[#0B2B26] border-2 border-white flex items-center justify-center text-[9px] font-mono font-bold text-[#DAF1DE] hover:z-10 hover:scale-110 transition-transform">
                  +2
                </div>
              </div>
            </div>

            <button 
              onClick={(e) => {
                playTick();
                animateTactileButton(e);
              }}
              className="w-7 h-7 rounded-full border border-[#E2EAE4] bg-[#F4F8F5] hover:bg-[#DAF1DE] text-[#051F20] flex items-center justify-center transition-colors shadow-2xs group-hover/crit:border-[#8C3A27]/30"
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-[#235347] group-hover/crit:text-[#8C3A27] transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
