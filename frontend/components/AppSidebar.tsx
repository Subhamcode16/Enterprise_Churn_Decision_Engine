"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { 
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
import { useAuth } from "@/lib/auth";

interface AppSidebarProps {
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
}

function ValenceLogoGlyph({ className = "w-5 h-5 shrink-0" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M3 4.5L12 20.5L21 4.5H16.5L12 12.5L7.5 4.5H3Z"
        fill="url(#valence-sidebar-gradient)"
      />
      <path
        d="M7.5 4.5L12 12.5L16.5 4.5H12.8L12 6L11.2 4.5H7.5Z"
        fill="#DAF1DE"
        fillOpacity="0.85"
      />
      <defs>
        <linearGradient
          id="valence-sidebar-gradient"
          x1="3"
          y1="4.5"
          x2="21"
          y2="20.5"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#34D399" />
          <stop offset="1" stopColor="#059669" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function AppSidebar({ onOpenProfile, onOpenAuth }: AppSidebarProps = {}) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
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
    { name: "Integrations & Settings", href: "/settings", icon: Settings, badge: "Hub" },
  ];

  return (
    <aside className="w-64 bg-[#F4F8F5] text-[#051F20] shrink-0 h-screen sticky top-0 flex flex-col justify-between p-5 border-r border-[#E2EAE4] select-none overflow-y-auto z-30">
      <div className="space-y-7">
        {/* Brandmark / Logo */}
        <Link 
          href="/" 
          onClick={() => sound.playClick(600)}
          className="flex items-center gap-3 px-2 group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#0B2B26] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform shrink-0">
            <ValenceLogoGlyph className="w-5 h-5 shrink-0" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-[#051F20]">
                Valence
              </span>
            </div>
            <span className="text-[10px] text-stone-500 font-medium tracking-wide">
              Enterprise Decision Engine
            </span>
          </div>
        </Link>

        {/* General Navigation Section */}
        <div className="space-y-1.5">
          <div className="px-3 text-[10px] font-mono uppercase tracking-widest text-stone-400 font-semibold mb-2">
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
                  className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-colors duration-150 ${
                    isActive
                      ? "text-[#051F20] font-bold"
                      : "text-stone-600 hover:text-[#051F20] hover:bg-white/60"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavLiquidGlass"
                      className="absolute inset-0 liquid-glass-active z-0"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#235347]" : "text-stone-400"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`relative z-10 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isActive 
                        ? "bg-[#235347] text-white shadow-2xs" 
                        : "bg-white text-stone-600 border border-[#E2EAE4]"
                    }`}>
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
          <div className="px-3 text-[10px] font-mono uppercase tracking-widest text-stone-400 font-semibold mb-2">
            Decision Engine
          </div>

          {/* Model Status Tile with Frosted Glass Texture */}
          <div className="mx-1 p-3.5 rounded-2xl bg-white/90 backdrop-blur-md border border-[#E2EAE4] space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-medium text-stone-500">ML Calibrated</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isHealthy === true
                    ? "bg-[#235347] shadow-[0_0_8px_rgba(35,83,71,0.6)]"
                    : isHealthy === false
                    ? "bg-amber-500"
                    : "bg-[#235347] animate-ping"
                }`}
              />
            </div>
            <div className="text-[11px] font-mono text-[#051F20] font-bold">
              {isHealthy === true ? "XGBoost + SHAP Live" : "Local Cache Active"}
            </div>
            <div className="text-[10px] text-stone-500 font-sans">
              ROC-AUC 0.886 • TreeSHAP
            </div>
          </div>

          {/* Audio Synthesizer Toggle */}
          <button
            onClick={toggleSound}
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-stone-600 hover:text-[#051F20] hover:bg-white/60 transition-colors"
          >
            <div className="flex items-center gap-3">
              {isMuted ? <VolumeX className="w-4 h-4 text-stone-400" /> : <Volume2 className="w-4 h-4 text-[#235347]" />}
              <span>Tactile UI Audio</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-stone-500">
              {isMuted ? "OFF" : "ON"}
            </span>
          </button>
        </div>
      </div>

      {/* User / Executive Avatar Footer */}
      <div className="pt-4 border-t border-[#E2EAE4] flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            playTick();
            if (isAuthenticated) {
              if (onOpenProfile) onOpenProfile();
              else window.dispatchEvent(new CustomEvent("open-valence-profile"));
            } else {
              if (onOpenAuth) onOpenAuth();
              else window.dispatchEvent(new CustomEvent("open-valence-auth"));
            }
          }}
          className="flex items-center gap-3 text-left hover:bg-white/70 p-1.5 -ml-1.5 rounded-2xl transition-all active:scale-95 group"
          title={isAuthenticated ? "Open Profile & Security Console" : "Sign In to Valence Live"}
        >
          <div className="w-9 h-9 rounded-2xl bg-[#0B2B26] flex items-center justify-center text-[#DAF1DE] font-bold text-xs shadow-2xs group-hover:scale-105 transition-transform">
            {user?.name ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "ED"}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-[#051F20] truncate group-hover:text-[#235347]">
              {user?.name || "Executive Desk"}
            </div>
            <div className="text-[10px] text-stone-500 font-mono truncate">
              {isAuthenticated ? (user?.role?.toUpperCase() || "OPERATOR") : "Sign In / Vault Auth"}
            </div>
          </div>
        </button>

        <button 
          onClick={() => {
            playTick();
            window.dispatchEvent(new CustomEvent("toggle-valence-copilot"));
            window.dispatchEvent(new CustomEvent("toggle-churniq-copilot"));
          }}
          title="Open AI Decision Copilot"
          className="p-2 rounded-xl bg-white hover:bg-[#DAF1DE] border border-[#E2EAE4] text-[#235347] transition-all shadow-2xs active:scale-95 cursor-pointer"
        >
          <Bot className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
