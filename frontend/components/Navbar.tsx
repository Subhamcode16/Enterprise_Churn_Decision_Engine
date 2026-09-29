"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Sliders, UploadCloud, BookOpen, Volume2, VolumeX, Bot, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getHealthStatus } from "@/lib/api";
import { sound, playTick } from "@/lib/sound";

export default function Navbar() {
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

  const handleOpenCopilot = () => {
    playTick();
    window.dispatchEvent(new CustomEvent("toggle-churniq-copilot"));
  };

  const navLinks = [
    { name: "Executive Suite", href: "/", icon: BarChart3 },
    { name: "What-If Simulator", href: "/simulator", icon: Sliders },
    { name: "Batch Processor", href: "/batch", icon: UploadCloud },
    { name: "Playbooks Catalog", href: "/playbooks", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#22201E] bg-[#0E0D0C]/90 backdrop-blur-2xl">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Swiss Typography */}
          <Link
            href="/"
            onClick={() => sound.playClick(600)}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-glowGold group-hover:scale-105 transition-transform duration-200">
              <Activity className="w-4.5 h-4.5 text-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#FAF8F5] group-hover:text-amber-300 transition-colors">
                  CHURN<span className="text-amber-400">IQ</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/25 font-mono">
                  Swiss Editorial
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-medium">Enterprise Revenue Decision Engine</p>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-[#181716] border border-[#262422] backdrop-blur-md">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => sound.playClick(750)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-[#FAF8F5] text-[#0E0D0C] shadow-sm font-bold"
                      : "text-stone-400 hover:text-stone-200 hover:bg-[#22201E]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Decision Copilot Trigger */}
          <div className="flex items-center gap-2.5">
            {/* Copilot Toggle Trigger */}
            <button
              onClick={handleOpenCopilot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-glowGold transition-all active:scale-[0.98]"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Copilot</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={isMuted ? "Unmute UI audio effects" : "Mute UI audio effects"}
              className="p-2 rounded-lg bg-[#181716] border border-[#242220] text-stone-400 hover:text-stone-200 hover:border-stone-700 transition-all text-xs"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-stone-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Live Model Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181716] border border-[#242220] text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isHealthy === true
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]"
                    : isHealthy === false
                    ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]"
                    : "bg-amber-400 animate-ping"
                }`}
              />
              <span className="text-stone-300 font-bold text-[11px] font-mono">
                {isHealthy === true
                  ? "XGBoost + SHAP Live"
                  : isHealthy === false
                  ? "Local Cache Active"
                  : "Syncing..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
