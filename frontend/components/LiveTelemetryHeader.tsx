"use client";

import { useEffect, useState, useRef } from "react";
import { Calendar, ChevronDown, Plus, Bot, RefreshCw, Activity, ShieldCheck, Check, Zap } from "lucide-react";
import { sound, playTick } from "@/lib/sound";
import AnimatedCounter from "@/components/AnimatedCounter";
import Image from "next/image";

interface LiveTelemetryHeaderProps {
  onOpenCopilot: () => void;
  copilotOpen?: boolean;
  onRefresh: () => void;
  loading: boolean;
  accountsCount: number;
  urgentCount: number;
  workspaceMode?: "demo" | "live";
  hasConnectedData?: boolean;
  connectedSource?: string | null;
  onToggleMode?: (mode: "demo" | "live") => void;
  onOpenConnectModal?: () => void;
}

const DATE_PRESETS = [
  {
    id: "q2",
    label: "Q2 2025 (Current)",
    range: "29 Jun, 2025 - 29 August, 2025",
    tag: "Active Cycle",
  },
  {
    id: "30d",
    label: "Last 30 Days",
    range: "01 Sep, 2025 - 30 Sep, 2025",
    tag: "Telemetry Window",
  },
  {
    id: "60d",
    label: "Last 60 Days",
    range: "01 Aug, 2025 - 30 Sep, 2025",
    tag: "Quarterly Trend",
  },
  {
    id: "ytd",
    label: "Year to Date (YTD)",
    range: "01 Jan, 2025 - 29 August, 2025",
    tag: "Annual Baseline",
  },
];

export default function LiveTelemetryHeader({
  onOpenCopilot,
  copilotOpen = false,
  onRefresh,
  loading,
  accountsCount,
  urgentCount,
  workspaceMode = "demo",
  hasConnectedData = false,
  connectedSource = null,
  onToggleMode,
  onOpenConnectModal,
}: LiveTelemetryHeaderProps) {
  const [latency, setLatency] = useState(12);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState("29 Jun, 2025 - 29 August, 2025");
  const [selectedPresetId, setSelectedPresetId] = useState("q2");
  const dateDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(Math.floor(10 + Math.random() * 6));
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Handle outside click & escape key to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(e.target as Node)) {
        setIsDateOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDateOpen(false);
      }
    };

    if (isDateOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDateOpen]);

  const handleSelectPreset = (preset: typeof DATE_PRESETS[0]) => {
    playTick();
    setSelectedDateRange(preset.range);
    setSelectedPresetId(preset.id);
    setIsDateOpen(false);
    onRefresh(); // Refresh telemetry dataset for the selected window
  };

  return (
    <div className="space-y-4 pb-2 font-sans">
      {/* Executive Persistent Data Status & Connection Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 px-4 rounded-2xl bg-white border border-[#E2EAE4] shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold ${
            workspaceMode === "live"
              ? "bg-[#DAF1DE] text-[#0B2B26] border border-[#8EB69B]/50"
              : "bg-amber-50 text-amber-900 border border-amber-200"
          }`}>
            <span className={`w-2 h-2 rounded-full ${workspaceMode === "live" ? "bg-emerald-600 animate-pulse" : "bg-amber-500"}`} />
            <span>{workspaceMode === "live" ? `🔒 Live Workspace (${connectedSource ? connectedSource.toUpperCase() : "Active"})` : "⚡ Viewing Demo Data (Sandbox)"}</span>
          </div>

          <span className="hidden md:inline text-xs text-stone-500">
            {workspaceMode === "live"
              ? "Analyzing your actual enterprise accounts & live retention risk."
              : "Viewing 100 sample accounts. Connect your company data to run real predictions."}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-full bg-[#F4F8F5] border border-[#E2EAE4] text-xs">
            <button
              onClick={() => {
                playTick();
                if (onToggleMode) onToggleMode("demo");
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                workspaceMode === "demo"
                  ? "bg-[#051F20] text-[#DAF1DE] shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Demo Mode
            </button>
            <button
              onClick={() => {
                playTick();
                if (onToggleMode) onToggleMode("live");
              }}
              className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                workspaceMode === "live"
                  ? "bg-[#235347] text-white shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Live Workspace
            </button>
          </div>

          {/* Dynamic Connect / Manage Data CTA Button */}
          {hasConnectedData ? (
            <button
              onClick={() => {
                playTick();
                if (onOpenConnectModal) onOpenConnectModal();
              }}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50/90 hover:bg-emerald-100 border border-emerald-300/80 text-[#051F20] text-xs font-bold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap group"
              title="Click to manage live data, re-sync, or upload fresh dataset"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
              </span>
              <RefreshCw className="w-3.5 h-3.5 text-[#235347] group-hover:rotate-180 transition-transform duration-500" />
              <span>Manage Ingestion</span>
              <span className="text-[10px] font-mono uppercase bg-emerald-200/70 text-emerald-900 px-1.5 py-0.2 rounded font-bold">
                {connectedSource || "Live"}
              </span>
            </button>
          ) : (
            <button
              onClick={() => {
                playTick();
                if (onOpenConnectModal) onOpenConnectModal();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#235347] to-[#163832] hover:from-[#163832] hover:to-[#0B2B26] text-[#DAF1DE] text-xs font-bold shadow-2xs hover:shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-300" />
              <span>Connect Company Data</span>
            </button>
          )}
        </div>
      </div>
      {/* Top Header Row (Matching Reference 'Welcome Back, Sujon' + Date Pill + Add Button) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Welcome Greeting */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#051F20] tracking-tight font-sans">
            Welcome Back, <span className="text-[#235347]">Director</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Real-time churn diagnostics monitoring <strong className="text-[#051F20]">{accountsCount} enterprise accounts</strong> with <strong className="text-rose-600 font-bold">{urgentCount} critical escalations</strong>.
          </p>
        </div>

        {/* Action Controls & Date Range Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Functional Date Range Pill with Dropdown Popover */}
          <div ref={dateDropdownRef} className="relative">
            <button
              onClick={() => {
                playTick();
                setIsDateOpen((prev) => !prev);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all shadow-2xs cursor-pointer select-none active:scale-95 ${
                isDateOpen
                  ? "bg-[#F4F8F5] border-2 border-[#235347] text-[#051F20]"
                  : "bg-white border border-[#E2EAE4] text-[#051F20] hover:border-[#8EB69B]"
              }`}
              title="Click to change date range window"
            >
              <Calendar className="w-3.5 h-3.5 text-stone-500" />
              <span>{selectedDateRange}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-stone-400 ml-1 transition-transform duration-200 ${isDateOpen ? "rotate-180 text-[#235347]" : ""}`} />
            </button>

            {/* Popover Dropdown Menu */}
            {isDateOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white border border-[#E2EAE4] shadow-[0_12px_36px_-4px_rgba(5,31,32,0.12)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-[#F0F4F1] flex items-center justify-between">
                  <span className="text-[11px] font-mono uppercase font-bold text-stone-500">
                    Telemetry Windows
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-[#DAF1DE] px-1.5 py-0.5 rounded">
                    Live Sync
                  </span>
                </div>

                <div className="py-1 space-y-1">
                  {DATE_PRESETS.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset)}
                        className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between group ${
                          isSelected
                            ? "bg-[#DAF1DE]/50 text-[#051F20] font-bold"
                            : "hover:bg-[#F4F8F5] text-stone-700"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-medium flex items-center gap-1.5">
                            <span>{preset.label}</span>
                            <span className="text-[10px] font-mono text-stone-400 font-normal">
                              ({preset.tag})
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-stone-500 mt-0.5">
                            {preset.range}
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#235347] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 px-2 pb-1 border-t border-[#F0F4F1] flex items-center justify-between text-[10px] font-mono text-stone-400">
                  <span>Press Esc to close</span>
                  <span className="text-[#235347] font-semibold">UTC+05:30</span>
                </div>
              </div>
            )}
          </div>

          {/* Reference Add Account / Refresh Button */}
          <button
            onClick={() => {
              playTick();
              onRefresh();
            }}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#F4F8F5] border border-[#E2EAE4] text-[#051F20] text-xs font-bold shadow-2xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-[#235347]" />
            <span>Add Account</span>
          </button>

          {/* AI Copilot Trigger with Bear Mascot Avatar */}
          <button
            onClick={() => {
              playTick();
              onOpenCopilot();
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs active:scale-95 group ${
              copilotOpen
                ? "bg-[#235347] text-white shadow-xs"
                : "bg-white hover:bg-[#F4F8F5] text-[#051F20] border border-[#E2EAE4] hover:border-[#8EB69B]"
            }`}
          >
            <div className="relative w-6 h-6 rounded-full overflow-hidden border border-[#235347]/30 shadow-2xs group-hover:scale-105 transition-transform">
              <Image
                src="/mascot_bear.png"
                alt="Valence Bear Copilot Mascot"
                fill
                sizes="24px"
                className="object-cover"
              />
            </div>
            <span>{copilotOpen ? "Copilot Active" : "AI Copilot"}</span>
          </button>
        </div>
      </div>

      {/* Sub-bar Telemetry Status */}
      <div className="flex items-center gap-2.5 pt-1">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B2B26] text-[#DAF1DE] text-[10px] font-mono font-bold tracking-wide shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#8EB69B] animate-ping" />
          <span className="w-1.5 h-1.5 rounded-full bg-[#8EB69B] -ml-3" />
          <span>TreeSHAP + XGBoost Calibrated</span>
        </div>

        <span className="text-[11px] font-mono text-stone-500">
          Inference Latency: <strong className="text-[#051F20] font-bold"><AnimatedCounter value={latency} suffix="ms" duration={300} /></strong>
        </span>
      </div>
    </div>
  );
}
