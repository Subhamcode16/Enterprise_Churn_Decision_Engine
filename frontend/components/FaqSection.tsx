"use client";

import { useState } from "react";
import { 
  HelpCircle, 
  ChevronDown, 
  Sparkles, 
  ArrowRight
} from "lucide-react";
import { playTick } from "@/lib/sound";

interface FaqItem {
  id: string;
  category: "product" | "data" | "security" | "troubleshooting";
  question: string;
  answer: string;
  tag: string;
}

const FAQS: FaqItem[] = [
  {
    id: "what-is-valence",
    category: "product",
    tag: "Core Engine",
    question: "What is VALENCE and how does it predict enterprise churn?",
    answer: "VALENCE is an autonomous B2B retention intelligence engine. It continuously evaluates customer telemetry (MRR, usage velocity, open P1 tickets, NPS sentiment) using calibrated XGBoost gradient-boosted trees. Rather than outputting arbitrary 1–100 health scores, VALENCE computes real-time churn probability, calculates exact dollar loss exposure ($MRR × Churn Probability), and assigns TreeSHAP mathematical feature attributions."
  },
  {
    id: "how-to-connect-data",
    category: "data",
    tag: "Data Ingestion",
    question: "How do I connect and upload my company dataset?",
    answer: "Click 'Connect Company Data' in the header navigation. You can either drag & drop a standard billing CSV/XLSX export or click 'Load Sample CSV' for instant testing. Alternatively, navigate to the 'Cloud Connectors' tab to initiate 1-click OAuth synchronization with Stripe Billing (for MRR & invoice failures) or Salesforce CRM (for accounts & support SLAs)."
  },
  {
    id: "csv-schema-requirements",
    category: "data",
    tag: "Schema Specs",
    question: "What CSV schema headers does the ML inference pipeline expect?",
    answer: "The engine natively recognizes standard telemetry headers including: 'company_name', 'contract_mrr', 'tenure_months', 'contract_tier', 'days_since_last_login', 'usage_change_pct_30d', 'open_p1_tickets', and 'nps_score'. Our flexible header normalizer auto-detects common aliases (e.g. 'mrr' -> 'contract_mrr', 'tenure' -> 'tenure_months') with an interactive dropdown inspector to override mappings prior to scoring."
  },
  {
    id: "data-encryption-security",
    category: "security",
    tag: "AES-256 Vault",
    question: "How is company data encrypted and isolated?",
    answer: "All uploaded datasets and ingested telemetry are encrypted at rest using AES-256 GCM in an isolated tenant vault partition (e.g. org_live_2026_val). Raw customer data is never shared across tenant boundaries or used to train public models. The system complies with SOC 2 Type II strict access control standards."
  },
  {
    id: "treeshap-attributions",
    category: "product",
    tag: "Explainability",
    question: "What are TreeSHAP attributions and how do they explain churn drivers?",
    answer: "TreeSHAP (SHapley Additive exPlanations) is a game-theoretic approach that breaks down the machine learning prediction into exact positive and negative feature contributions. For each enterprise account, VALENCE calculates which specific factors are driving risk up (e.g. +0.28 from open P1 tickets) or anchoring retention down (e.g. -0.14 from high contract tenure), enabling Customer Success teams to take targeted, evidence-based actions."
  },
  {
    id: "troubleshooting-upload",
    category: "troubleshooting",
    tag: "Troubleshooting",
    question: "What should I do if my CSV columns don't auto-detect or if upload times out?",
    answer: "If your column headers have custom names, use the interactive column mapping chips in the upload modal to manually route your source fields to the target XGBoost features. If an upload times out, verify your file is under 5MB and encoded in UTF-8. You can also download our verified template with the 'Download .CSV' button in the modal to verify the standard structure."
  }
];

export default function FaqSection({ onOpenConnectModal }: { onOpenConnectModal?: () => void }) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>("what-is-valence");

  const categories = [
    { id: "all", label: "All Questions" },
    { id: "product", label: "Core Product" },
    { id: "data", label: "Data & Ingestion" },
    { id: "security", label: "Security & Vault" },
    { id: "troubleshooting", label: "Troubleshooting" }
  ];

  const filteredFaqs = activeCategory === "all" 
    ? FAQS 
    : FAQS.filter(faq => faq.category === activeCategory);

  const toggleFaq = (id: string) => {
    playTick();
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <section className="w-full max-w-5xl mx-auto mt-20 mb-28 px-4 sm:px-6">
      <div className="rounded-[32px] bg-white border border-[#E2EAE4] p-8 sm:p-12 shadow-[0_20px_60px_-15px_rgba(5,31,32,0.07)] relative overflow-hidden">
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-[#DAF1DE]/40 via-emerald-50/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Center-Aligned Header */}
        <div className="flex flex-col items-center text-center space-y-3 pb-8 border-b border-[#F0F4F1] relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-mono font-bold shadow-2xs">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Knowledge Base & Architecture FAQ</span>
          </div>

          <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#051F20] tracking-tight">
            Frequently Asked Questions
          </h3>

          <p className="text-xs sm:text-sm text-stone-500 max-w-xl leading-relaxed">
            Everything you need to know about the VALENCE autonomous churn prediction engine, TreeSHAP explainability, and secure enterprise telemetry ingestion.
          </p>

          {onOpenConnectModal && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  playTick();
                  onOpenConnectModal();
                }}
                className="px-5 py-2.5 rounded-full bg-[#051F20] hover:bg-[#0B2B26] text-white text-xs font-bold font-sans flex items-center justify-center gap-2 shadow-xs hover:shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Launch Data Connection Modal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Center-Aligned Filter Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-6 pb-6 relative z-10">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                playTick();
                setActiveCategory(cat.id);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-mono transition-all duration-200 cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-[#051F20] text-white font-bold shadow-xs"
                  : "bg-[#F4F8F5] text-stone-600 hover:text-stone-900 border border-[#E2EAE4] hover:bg-stone-100"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Wide Center Collapsible Bento Accordions */}
        <div className="space-y-3 relative z-10 max-w-4xl mx-auto">
          {filteredFaqs.map((faq) => {
            const isOpen = openFaqId === faq.id;

            return (
              <div
                key={faq.id}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? "bg-gradient-to-b from-[#F4F8F5]/80 via-white to-white border-[#8EB69B]/80 shadow-2xs"
                    : "bg-white border-[#E2EAE4] hover:border-[#8EB69B]/50 hover:bg-[#F4F8F5]/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${
                      isOpen 
                        ? "bg-[#051F20] text-emerald-300" 
                        : "bg-stone-100 text-stone-500"
                    }`}>
                      {faq.tag}
                    </span>
                    <span className={`text-sm sm:text-base font-sans font-bold transition-colors ${
                      isOpen ? "text-[#051F20]" : "text-stone-800"
                    }`}>
                      {faq.question}
                    </span>
                  </div>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                    isOpen ? "bg-[#DAF1DE] text-[#051F20] rotate-180" : "bg-stone-100 text-stone-400"
                  }`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-stone-600 leading-relaxed font-sans border-t border-[#F0F4F1] animate-in fade-in duration-200">
                    <p className="pt-2">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
