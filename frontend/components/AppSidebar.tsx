"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Activity, 
  BarChart3, 
  Sliders, 
  UploadCloud, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Bot, 
  ShieldCheck, 
  Sparkles,
  Layers,
  ChevronRight,
  User,
  Settings
} from "lucide-react";
import { useEffect, useState } from "react";
import { getHealthStatus } from "@/lib/api";
import { sound, playTick } from "@/lib/sound";

export default function AppSidebar() {
  const pathname = usePathname();
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(sound.getMuted());
    getHealthStatus()
      .then((res) => setIsHealthy(res.status === "healthy"))
      .catch(() => setIsHealthy(false));
  }, []);

  const toggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const navLinks = [
    { name: "Executive Suite", href: "/", icon: BarChart3, badge: "Live" },
    { name: "What-If Simulator", href: "/simulator", icon: Sliders },
    { name: "Batch Processor", href: "/batch", icon: UploadCloud },
    { name: "Playbooks Catalog", href: "/playbooks", icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-[#141312] text-stone-200 shrink-0 min-h-screen flex flex-col justify-between p-5 border-r border-[#262422] select-none">
      <div className="space-y-7">
        {/* Brandmark / Logo */}
        <Link 
          href="/" 
          onClick={() => sound.playClick(600)}
          className="flex items-center gap-3 px-2 group"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-stone-950 shadow-glowGold group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-[#FAF8F5]">
                CHURN<span className="text-amber-400">IQ</span>
              </span>
            </div>
            <span className="text-[10px] text-stone-400 font-medium tracking-wide">
              Revenue Decision Shield
            </span>
          </div>
        </Link>

        {/* General Navigation Section */}
        <div className="space-y-1.5">
          <div className="px-3 text-[10px] font-mono uppercase tracking-widest text-stone-500 font-semibold mb-2">
            Intelligence Suite
          </div>

          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => sound.playClick(750)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[#2A2825] text-[#FAF8F5] shadow-sm font-semibold border border-[#3A3733]"
                      : "text-stone-400 hover:text-stone-200 hover:bg-[#1E1D1B]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-amber-400" : "text-stone-400"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* System & Telemetry Controls */}
        <div className="space-y-1.5">
          <div className="px-3 text-[10px] font-mono uppercase tracking-widest text-stone-500 font-semibold mb-2">
            Decision Engine
          </div>

          {/* Model Status Tile */}
          <div className="mx-1 p-3 rounded-xl bg-[#1C1B19] border border-[#2B2926] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-stone-400">ML Calibrated</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isHealthy === true
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                    : isHealthy === false
                    ? "bg-amber-400"
                    : "bg-amber-400 animate-ping"
                }`}
              />
            </div>
            <div className="text-[11px] font-mono text-stone-200 font-bold">
              {isHealthy === true ? "XGBoost + SHAP Live" : "Local Cache Active"}
            </div>
            <div className="text-[10px] text-stone-500 font-sans">
              ROC-AUC 0.886 • TreeSHAP
            </div>
          </div>

          {/* Audio Synthesizer Toggle */}
          <button
            onClick={toggleSound}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-stone-400 hover:text-stone-200 hover:bg-[#1E1D1B] transition-colors"
          >
            <div className="flex items-center gap-3">
              {isMuted ? <VolumeX className="w-4 h-4 text-stone-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              <span>Tactile UI Audio</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-stone-500">
              {isMuted ? "OFF" : "ON"}
            </span>
          </button>
        </div>
      </div>

      {/* User / Executive Avatar Footer */}
      <div className="pt-4 border-t border-[#262422] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-stone-700 to-stone-600 flex items-center justify-center text-[#FAF8F5] font-bold text-xs shadow-inner">
            ED
          </div>
          <div>
            <div className="text-xs font-semibold text-[#FAF8F5]">
              Executive Desk
            </div>
            <div className="text-[10px] text-stone-400">
              VP Revenue Retention
            </div>
          </div>
        </div>

        <button 
          onClick={() => {
            playTick();
            window.dispatchEvent(new CustomEvent("toggle-churniq-copilot"));
          }}
          title="Open AI Decision Copilot"
          className="p-2 rounded-lg bg-[#22201E] hover:bg-[#2A2825] text-amber-400 transition-colors"
        >
          <Bot className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
