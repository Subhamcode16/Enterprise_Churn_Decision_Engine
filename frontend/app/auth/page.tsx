"use client";

import AuthSectionThree from "@/components/ui/auth-section-3";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="relative min-h-screen bg-[#F4F8F5]">
      {/* Back to Workspace navigation button */}
      <div className="absolute top-5 left-6 z-30">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 hover:bg-white text-[#051F20] text-xs font-bold border border-[#E2EAE4] shadow-2xs backdrop-blur-md transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#235347]" />
          <span>Back to Decision Workspace</span>
        </Link>
      </div>

      <AuthSectionThree />
    </div>
  );
}
