import "./globals.css";
import type { Metadata } from "next";
import AppSidebar from "@/components/AppSidebar";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";
import GlobalAuthModals from "@/components/GlobalAuthModals";

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
      <body className="min-h-screen bg-[#F4F8F5] text-[#051F20] antialiased selection:bg-[#DAF1DE] selection:text-[#051F20] font-sans">
        <SmoothScrollProvider>
          <div className="min-h-screen flex flex-row bg-[#F4F8F5]">
            {/* Unified Vertical Sidebar */}
            <AppSidebar />

            {/* Main Studio Canvas */}
            <main className="flex-1 min-w-0 bg-[#F4F8F5] p-5 lg:p-6 xl:p-8 overflow-y-auto">
              {children}
            </main>
          </div>

          {/* Global Auth & User Profile Modals / Drawers */}
          <GlobalAuthModals />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
