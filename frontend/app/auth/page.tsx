"use client";

import AuthSectionThree from "@/components/ui/auth-section-3";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="relative min-h-screen bg-[#051F20] text-white flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Background gradient ambient rings */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute -top-40 -left-40 size-96 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-teal-500/10 blur-[120px]" />
      </div>

      {/* Back to Workspace navigation button */}
      <div className="absolute top-5 left-6 z-30">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-[#DAF1DE] text-xs font-bold border border-white/15 shadow-2xs backdrop-blur-md transition-all active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span>Back to Decision Workspace</span>
        </Link>
      </div>

      <div className="relative w-full max-w-[480px] p-0.5 rounded-3xl bg-gradient-to-br from-emerald-400/40 via-teal-500/20 to-emerald-900/60 shadow-[0_25px_80px_rgba(5,31,32,0.8)] overflow-hidden my-12">
        <div className="w-full rounded-[23px] overflow-hidden bg-gradient-to-b from-[#0B2B26] via-[#051F20] to-[#0B2B26] border border-white/10">
          <AuthSectionThree isModal={true} />
        </div>
      </div>
    </div>
  );
}
