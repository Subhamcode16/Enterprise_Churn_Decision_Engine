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
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-[#051F20]/80 backdrop-blur-lg animate-in fade-in duration-300 font-sans"
    >
      <div 
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-[#E2EAE4] dark:bg-[#0a0a0c] dark:border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <AuthSectionThree
          isModal={true}
          initialMode={initialTab}
          onSuccess={onSuccess}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
