import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import AuroraBackground from "@/components/AuroraBackground";

export const metadata: Metadata = {
  title: "CHURNIQ • Enterprise Revenue & Churn Decision Intelligence",
  description: "Swiss Editorial Decision Intelligence Suite with calibrated XGBoost, TreeSHAP attributions, and retention playbooks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0A0908] text-stone-100 antialiased selection:bg-amber-500/20 selection:text-amber-200">
        <div className="relative min-h-screen flex flex-col">
          {/* Subtle Ambient Mesh */}
          <AuroraBackground />
          
          <Navbar />
          
          <main className="flex-1 relative z-10 w-full px-4 sm:px-6 lg:px-10 xl:px-12 py-6">
            {children}
          </main>
          
          <footer className="relative z-10 border-t border-[#1C1A18] py-6 px-6 text-center text-xs text-stone-500 bg-[#0A0908]/90 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row items-center justify-between max-w-7xl mx-auto gap-2">
              <span className="font-serif text-stone-400">CHURNIQ Enterprise Decision Intelligence Platform</span>
              <span className="font-mono text-[11px] text-stone-600">Calibrated XGBoost • TreeSHAP Explainer • SLA Retention Engine</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
