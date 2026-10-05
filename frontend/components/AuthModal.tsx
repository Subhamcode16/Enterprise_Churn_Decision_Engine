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
      <div 
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-white/25 dark:bg-[#0a0a0c] dark:border-white/10"
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
