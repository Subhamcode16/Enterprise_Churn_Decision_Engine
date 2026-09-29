"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Sliders, UploadCloud, BookOpen, Volume2, VolumeX, Sparkles, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { getHealthStatus } from "@/lib/api";
import { sound } from "@/lib/sound";

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

  const navLinks = [
    { name: "Executive Suite", href: "/", icon: BarChart3 },
    { name: "What-If Simulator", href: "/simulator", icon: Sliders },
    { name: "Batch Processor", href: "/batch", icon: UploadCloud },
    { name: "Playbooks Catalog", href: "/playbooks", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-stone-800/80 bg-[#0E0D0C]/90 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Swiss Typography */}
          <Link
            href="/"
            onClick={() => sound.playClick(600)}
            className="flex items-center gap-3 group"
          >
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center shadow-glowGold group-hover:scale-105 transition-transform duration-200">
              <Activity className="w-5 h-5 text-stone-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-stone-100 group-hover:text-amber-300 transition-colors">
                  CHURN<span className="text-amber-400">IQ</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest font-extrabold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Swiss Editorial
                </span>
              </div>
              <p className="text-[10px] text-stone-400 font-semibold tracking-wide">Decision Intelligence & Revenue Shield</p>
            </div>
          </Link>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-stone-900/80 border border-stone-800 backdrop-blur-md">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => sound.playClick(750)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? "bg-amber-500 text-stone-950 shadow-sm"
                      : "text-stone-400 hover:text-stone-100 hover:bg-stone-800/60"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions & Health Telemetry */}
          <div className="flex items-center gap-2.5">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={isMuted ? "Unmute UI audio effects" : "Mute UI audio effects"}
              className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-400 hover:text-stone-100 hover:border-stone-700 transition-all text-xs"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-stone-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Live Model Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 text-xs">
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
                  : "Syncing Engine..."}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
