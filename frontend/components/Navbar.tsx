"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Sliders, UploadCloud, BookOpen, Volume2, VolumeX, Bot, Sparkles, Settings } from "lucide-react";
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
    window.dispatchEvent(new CustomEvent("toggle-valence-copilot"));
    window.dispatchEvent(new CustomEvent("toggle-churniq-copilot"));
  };

  const navLinks = [
    { name: "Executive Suite", href: "/", icon: BarChart3 },
    { name: "What-If Simulator", href: "/simulator", icon: Sliders },
    { name: "Batch Processor", href: "/batch", icon: UploadCloud },
    { name: "Playbooks Catalog", href: "/playbooks", icon: BookOpen },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2EAE4] bg-white/95 backdrop-blur-2xl font-sans">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Swiss Typography */}
          <Link
            href="/"
            onClick={() => sound.playClick(600)}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#235347] via-[#163832] to-[#0B2B26] flex items-center justify-center text-[#DAF1DE] shadow-sm group-hover:scale-105 transition-transform duration-200">
              <Activity className="w-4.5 h-4.5 text-[#DAF1DE]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#051F20] group-hover:text-[#235347] transition-colors">
                  VALENCE <span className="text-[#235347]">AI</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-[#DAF1DE] text-[#0B2B26] border border-[#8EB69B]/40 font-mono">
                  Enterprise Suite
                </span>
              </div>
              <p className="text-[10px] text-[#163832]/60 font-medium">Enterprise Revenue Decision Engine</p>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-[#F4F8F5] border border-[#E2EAE4] backdrop-blur-md">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => sound.playClick(750)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-white text-[#051F20] shadow-xs font-bold"
                      : "text-[#163832]/70 hover:text-[#051F20] hover:bg-white/60"
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#235347] hover:bg-[#163832] text-white font-bold text-xs shadow-xs transition-all active:scale-[0.98] cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-[#DAF1DE]" />
              <span>AI Copilot</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={isMuted ? "Unmute UI audio effects" : "Mute UI audio effects"}
              className="p-2 rounded-full bg-[#F4F8F5] border border-[#E2EAE4] text-[#163832]/70 hover:text-[#051F20] hover:bg-[#E2EAE4] transition-all text-xs cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-[#163832]/40" /> : <Volume2 className="w-4 h-4 text-[#235347]" />}
            </button>

            {/* Live Model Badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#F4F8F5] border border-[#E2EAE4] text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isHealthy === true
                    ? "bg-[#235347] shadow-[0_0_8px_rgba(35,83,71,0.6)]"
                    : isHealthy === false
                    ? "bg-[#8C3A27]"
                    : "bg-[#235347] animate-ping"
                }`}
              />
              <span className="text-[#051F20] font-bold text-[11px] font-mono">
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
