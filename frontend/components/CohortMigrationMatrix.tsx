"use client";

import { useRef, useEffect } from "react";
import { ArrowRight, ShieldCheck, AlertTriangle, TrendingDown, Users, Sparkles, CheckCircle2 } from "lucide-react";
import { PortfolioSummary } from "@/lib/types";
import { playTick } from "@/lib/sound";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  MOTION_ARCHETYPES, 
  createCardTilt, 
  isReducedMotion 
} from "@/lib/motionArchetypes";

interface CohortMigrationMatrixProps {
  summary: PortfolioSummary;
  onFilterTier?: (tier: string) => void;
  selectedTier?: string;
}

export default function CohortMigrationMatrix({
  summary,
  onFilterTier,
  selectedTier = "All",
}: CohortMigrationMatrixProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const acuteCardRef = useRef<HTMLDivElement>(null);

  const tiers = [
    {
      id: "Low",
      label: "Healthy Core",
      count: summary.low_risk_count,
      pct: ((summary.low_risk_count / summary.total_accounts) * 100).toFixed(0),
      desc: "High telemetry usage & stable CSAT (>4.0)",
      color: "border-[#8EB69B]/40 bg-[#DAF1DE]/30 text-[#051F20]",
      badge: "bg-[#DAF1DE] text-[#0B2B26] border-[#8EB69B]/50",
      status: "Stable Retention",
      archetype: "corporate" as const,
    },
    {
      id: "Medium",
      label: "Vulnerable Cohort",
      count: summary.medium_risk_count,
      pct: ((summary.medium_risk_count / summary.total_accounts) * 100).toFixed(0),
      desc: "Usage dip >15% or detractor NPS rating",
      color: "border-[#E2EAE4] bg-[#F4F8F5] text-[#051F20]",
      badge: "bg-[#E2EAE4] text-[#163832] border-[#8EB69B]/30",
      status: "Early Warning",
      archetype: "corporate" as const,
    },
    {
      id: "Critical",
      label: "Acute Risk (P0)",
      count: summary.critical_risk_count + summary.high_risk_count,
      pct: (((summary.critical_risk_count + summary.high_risk_count) / summary.total_accounts) * 100).toFixed(0),
      desc: "Open P1 tickets or renewal <60 days",
      color: "border-[#8C3A27]/25 bg-[#FAF0E6]/60 text-[#8C3A27]",
      badge: "bg-[#FAF0E6] text-[#8C3A27] border-[#8C3A27]/30",
      status: "Immediate SLA",
      archetype: "energetic" as const,
    },
  ];

  // GSAP Choreographed Entry
  useGSAP(
    () => {
      if (isReducedMotion() || !cardsContainerRef.current) return;

      const cards = cardsContainerRef.current.children;
      gsap.fromTo(
        cards,
        { y: 18, opacity: 0, scale: 0.98 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: MOTION_ARCHETYPES.corporate.duration,
          ease: MOTION_ARCHETYPES.corporate.ease,
          stagger: 0.08,
          delay: 0.15,
        }
      );

      // Ambient energetic pulse on Acute Risk card
      if (acuteCardRef.current) {
        gsap.to(acuteCardRef.current, {
          boxShadow: "0 0 16px rgba(140, 58, 39, 0.15)",
          repeat: -1,
          yoyo: true,
          duration: 1.4,
          ease: "sine.inOut",
        });
      }
    },
    { scope: containerRef }
  );

  // Setup GSAP 3D tilts for each card
  useEffect(() => {
    if (!cardsContainerRef.current) return;
    const cleanups: (() => void)[] = [];
    const elements = Array.from(cardsContainerRef.current.children) as HTMLElement[];

    elements.forEach((el, index) => {
      const arch = tiers[index]?.archetype || "corporate";
      cleanups.push(createCardTilt(el, arch));
    });

    return () => cleanups.forEach((c) => c());
  }, []);

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>, tierId: string) => {
    playTick();
    if (!isReducedMotion()) {
      gsap.fromTo(
        e.currentTarget,
        { scale: 0.97 },
        { scale: 1, duration: 0.22, ease: "back.out(2)", overwrite: "auto" }
      );
    }
    if (onFilterTier) {
      onFilterTier(selectedTier === tierId ? "All" : tierId);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="p-5 sm:p-6 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-4 font-sans"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F0F4F1]">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#235347]" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#051F20]">
            Portfolio Risk Migration Flow & Cohort Health
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#163832]/60">
          <span>Click tier to filter watchlist</span>
        </div>
      </div>

      {/* 3 Tier Stages Flow */}
      <div ref={cardsContainerRef} className="grid grid-cols-1 md:grid-cols-3 gap-3.5 items-stretch">
        {tiers.map((tier) => {
          const isSelected = selectedTier === tier.id;
          const isCritical = tier.archetype === "energetic";

          return (
            <div
              key={tier.id}
              ref={isCritical ? acuteCardRef : undefined}
              onClick={(e) => handleCardClick(e, tier.id)}
              className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative overflow-hidden select-none ${
                isSelected
                  ? "ring-2 ring-[#235347] bg-white border-[#235347] shadow-sm"
                  : `${tier.color} hover:shadow-md`
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-serif font-bold text-stone-900">
                    {tier.label}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${tier.badge}`}>
                    {tier.count} Accounts ({tier.pct}%)
                  </span>
                </div>

                <p className="text-[11px] text-stone-600 leading-relaxed">
                  {tier.desc}
                </p>
              </div>

              <div className="pt-2.5 mt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-mono">
                <span className="font-semibold text-stone-700">{tier.status}</span>
                <span className="text-stone-500 flex items-center gap-0.5">
                  Filter <ArrowRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
