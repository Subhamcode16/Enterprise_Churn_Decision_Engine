"use client";

import { useEffect, useState } from "react";
import { Activity, Sparkles, Zap, ShieldCheck, Clock, RefreshCw, Bot } from "lucide-react";
import { sound, playTick } from "@/lib/sound";
import AnimatedCounter from "@/components/AnimatedCounter";

interface LiveTelemetryHeaderProps {
  onOpenCopilot: () => void;
  copilotOpen: boolean;
  onRefresh: () => void;
  loading: boolean;
  accountsCount: number;
  urgentCount: number;
}

export default function LiveTelemetryHeader({
  onOpenCopilot,
  copilotOpen,
  onRefresh,
  loading,
  accountsCount,
  urgentCount,
}: LiveTelemetryHeaderProps) {
  const [latency, setLatency] = useState(12);

  // Micro-fluctuation in inference latency to give live telemetry feel
  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(10 + Math.random() * 6));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E8E5DD]/60 font-sans">
      <div className="space-y-1">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[#7A5800] text-[10px] font-mono font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 -ml-2.5" />
            <span className="t-shimmer">XGBoost + TreeSHAP Active</span>
          </div>

          <span className="text-[11px] font-mono text-stone-400">
            Inference Latency: <strong className="text-stone-700 font-bold"><AnimatedCounter value={latency} suffix="ms" duration={300} /></strong>
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight t-texts-reveal">
          Good morning, Revenue Director
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-stone-600 leading-relaxed font-sans max-w-2xl t-texts-reveal">
          Deterministic ML engine actively monitoring <strong className="text-stone-900 font-semibold">{accountsCount} enterprise accounts</strong>. <strong className="text-rose-600 font-bold">{urgentCount} accounts</strong> flagged for immediate intervention.
        </p>
      </div>

      {/* Action Controls & Telemetry Waveform */}
      <div className="flex items-center gap-3">
        {/* Kinetic Equalizer Waveform */}
        <div className="hidden xl:flex items-center gap-1 px-3.5 py-2 rounded-xl bg-white border border-[#E8E5DD] shadow-2xs">
          <Activity className="w-3.5 h-3.5 text-amber-500 mr-1.5" />
          <div className="flex items-end gap-1 h-4">
            {[40, 75, 55, 90, 65, 80, 50].map((h, idx) => (
              <div
                key={idx}
                className="w-1 bg-amber-500 rounded-full animate-pulse"
                style={{
                  height: `${h}%`,
                  animationDuration: `${0.8 + idx * 0.15}s`,
                }}
              />
            ))}
          </div>
          <span className="text-[10px] font-mono text-stone-500 font-bold ml-1.5">LIVE</span>
        </div>

        {/* AI Copilot Action Button */}
        <button
          onClick={() => {
            playTick();
            onOpenCopilot();
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all duration-150 active:scale-[0.97] ${
            copilotOpen
              ? "bg-amber-500 text-stone-950 font-bold"
              : "bg-[#141312] hover:bg-stone-800 text-[#FAF8F5]"
          }`}
        >
          <Bot className={`w-4 h-4 ${copilotOpen ? "text-stone-950" : "text-amber-400"}`} />
          <span>{copilotOpen ? "Copilot Active" : "AI Copilot"}</span>
        </button>

        {/* Manual Sync Button */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-[#E8E5DD] hover:border-stone-400 text-stone-700 hover:text-stone-950 text-xs font-medium shadow-sm transition-all duration-150 active:scale-[0.97]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-amber-500" : ""}`} />
          <span>Sync</span>
        </button>
      </div>
    </div>
  );
}
