"use client";

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
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-[#051F20]/80 backdrop-blur-xl animate-in fade-in duration-300 font-sans"
    >
      {/* Radiant Perimeter Outer Halo */}
      <div 
        className="relative w-full max-w-6xl max-h-[92vh] p-0.5 rounded-3xl bg-gradient-to-br from-emerald-400/40 via-teal-500/20 to-emerald-900/60 shadow-[0_25px_80px_rgba(5,31,32,0.6)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full h-full rounded-[23px] overflow-hidden bg-white dark:bg-[#0a0a0c]">
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
