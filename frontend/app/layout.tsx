import "./globals.css";
import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import AuroraBackground from "@/components/AuroraBackground";

export const metadata: Metadata = {
  title: "CHURNIQ • Enterprise Revenue & Churn Decision Intelligence",
  description: "Cyber-Lux AI Churn Prediction Engine with TreeSHAP attributions and automated retention playbooks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#060911] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <div className="relative min-h-screen flex flex-col">
          {/* Animated Iridescent Aurora Canvas Mesh */}
          <AuroraBackground />
          
          <Navbar />
          
          <main className="flex-1 relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          
          <footer className="relative z-10 border-t border-slate-800/60 py-6 text-center text-xs text-slate-500 bg-[#060911]/80 backdrop-blur-md">
            CHURNIQ Decision Intelligence Suite • Cyber-Lux Edition • Calibrated XGBoost & TreeSHAP
          </footer>
        </div>
      </body>
    </html>
  );
}
