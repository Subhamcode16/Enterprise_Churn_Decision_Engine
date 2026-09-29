import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Enterprise Churn & Revenue Decision Engine",
  description: "AI-powered B2B churn risk prediction, SHAP root-cause explainability, and automated retention playbooks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080C15] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <div className="relative min-h-screen flex flex-col">
          {/* Subtle background radial light glow */}
          <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] z-0" />
          
          <Navbar />
          <main className="flex-1 relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          
          <footer className="relative z-10 border-t border-slate-800/60 py-6 text-center text-xs text-slate-500">
            Enterprise Churn & Revenue Decision Intelligence • Version 1.0.0 (Production Calibrated)
          </footer>
        </div>
      </body>
    </html>
  );
}
