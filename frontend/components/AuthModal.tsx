"use client";

import { useEffect } from "react";
import { AuthUser } from "@/lib/auth";
import AuthSectionThree from "@/components/ui/auth-section-3";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "login" | "register";
  onSuccess?: (user: AuthUser) => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  initialTab = "login",
  onSuccess
}: AuthModalProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      console.log("%c[VALENCE]%c UI v1.0.1 (Production Auth Modal Scroll Active)", "background:#0B2B26;color:#34D399;font-weight:bold;padding:2px 6px;border-radius:4px;", "color:#0B2B26;font-weight:bold;");
    }
  }, []);

  // Lock body scroll when modal is open to prevent background dashboard scrolling
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    
    // Lock background scroll
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      data-lenis-prevent="true"
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#051F20]/80 backdrop-blur-xl animate-in fade-in duration-300 font-sans overscroll-none"
      onClick={onClose}
    >
      {/* Radiant Perimeter Outer Halo */}
      <div 
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="relative w-full max-w-[490px] max-h-[86vh] flex flex-col p-0.5 rounded-3xl bg-gradient-to-br from-emerald-400/40 via-teal-500/20 to-emerald-900/60 shadow-[0_25px_80px_rgba(5,31,32,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Main Scrollable Modal Card */}
        <div 
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          style={{
            touchAction: "pan-y",
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
          className="w-full flex-1 min-h-0 rounded-[23px] overflow-y-auto overscroll-contain dark-modal-scroll bg-gradient-to-b from-[#0B2B26] via-[#051F20] to-[#0B2B26] border border-white/10"
        >
          <AuthSectionThree
            isModal={true}
            initialMode={initialTab}
            onSuccess={onSuccess}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
