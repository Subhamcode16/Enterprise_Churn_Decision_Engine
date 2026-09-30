import "./globals.css";
import type { Metadata } from "next";
import AppSidebar from "@/components/AppSidebar";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";

export const metadata: Metadata = {
  title: "VALENCE AI • Enterprise Churn & Revenue Decision Engine",
  description: "Swiss Editorial & Studio Bento Enterprise Churn Decision Engine calibrated with XGBoost and TreeSHAP.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F6F4EE] text-stone-900 antialiased selection:bg-amber-400 selection:text-stone-950 font-sans">
        <SmoothScrollProvider>
          <div className="min-h-screen flex flex-row">
            {/* Iconic Dark Charcoal Sidebar */}
            <AppSidebar />

            {/* Main Studio Canvas */}
            <main className="flex-1 min-w-0 bg-[#F6F4EE] p-6 lg:p-8 xl:p-10 overflow-y-auto">
              {children}
            </main>
          </div>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
