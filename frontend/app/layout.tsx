import "./globals.css";
import type { Metadata } from "next";
import AppSidebar from "@/components/AppSidebar";

export const metadata: Metadata = {
  title: "CHURNIQ • Enterprise Revenue Decision Engine",
  description: "Swiss Editorial & Studio Bento Enterprise Churn Decision Engine calibrated with XGBoost and TreeSHAP.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#F6F4EE] text-stone-900 antialiased selection:bg-amber-400 selection:text-stone-950 font-sans">
        <div className="min-h-screen flex flex-row">
          {/* Iconic Dark Charcoal Sidebar (Intelly inspired) */}
          <AppSidebar />

          {/* Main Studio Canvas */}
          <main className="flex-1 min-w-0 bg-[#F6F4EE] p-6 lg:p-8 xl:p-10 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
