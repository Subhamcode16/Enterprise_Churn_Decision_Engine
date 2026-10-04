"use client";

import { useState } from "react";
import { 
  Plus, 
  Minus, 
  Sparkles, 
  ArrowRight,
  HelpCircle
} from "lucide-react";
import { playTick } from "@/lib/sound";

interface FaqItem {
  id: string;
  index: string;
  category: "product" | "data" | "security" | "troubleshooting";
  tag: string;
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "what-is-valence",
    index: "01",
    category: "product",
    tag: "Core Engine",
    question: "What is VALENCE and how does it predict enterprise churn?",
    answer: "VALENCE is an autonomous B2B retention intelligence engine. It continuously evaluates customer telemetry (MRR, usage velocity, open P1 tickets, NPS sentiment) using calibrated XGBoost gradient-boosted decision trees. Rather than calculating arbitrary 1–100 health scores, VALENCE computes real-time churn probability, calculates exact dollar loss exposure ($MRR × Churn Probability), and assigns TreeSHAP mathematical feature attributions."
  },
  {
    id: "how-to-connect-data",
    index: "02",
    category: "data",
    tag: "Data Ingestion",
    question: "How do I connect and upload my company dataset?",
    answer: "Click 'Connect Company Data' in the header navigation. You can either drag & drop a standard billing CSV/XLSX export or click 'Load Sample CSV' for instant testing. Alternatively, navigate to the 'Cloud Connectors' tab to initiate 1-click OAuth synchronization with Stripe Billing (for MRR & invoice failures) or Salesforce CRM (for accounts & support SLAs)."
  },
  {
    id: "csv-schema-requirements",
    index: "03",
    category: "data",
    tag: "Schema Specs",
    question: "What CSV schema headers does the ML inference pipeline expect?",
    answer: "The engine natively recognizes standard telemetry headers including: 'company_name', 'contract_mrr', 'tenure_months', 'contract_tier', 'days_since_last_login', 'usage_change_pct_30d', 'open_p1_tickets', and 'nps_score'. Our flexible header normalizer auto-detects common aliases (e.g. 'mrr' -> 'contract_mrr', 'tenure' -> 'tenure_months') with an interactive dropdown inspector to override mappings prior to scoring."
  },
  {
    id: "data-encryption-security",
    index: "04",
    category: "security",
    tag: "AES-256 Vault",
    question: "How is company data encrypted and isolated?",
    answer: "All uploaded datasets and ingested telemetry are encrypted at rest using AES-256 GCM in an isolated tenant vault partition (e.g. org_live_2026_val). Raw customer data is never shared across tenant boundaries or used to train public models. The system complies with SOC 2 Type II strict access control standards."
  },
  {
    id: "treeshap-attributions",
    index: "05",
    category: "product",
    tag: "Explainability",
    question: "What are TreeSHAP attributions and how do they explain churn drivers?",
    answer: "TreeSHAP (SHapley Additive exPlanations) is a game-theoretic approach that breaks down the machine learning prediction into exact positive and negative feature contributions. For each enterprise account, VALENCE calculates which specific factors are driving risk up (e.g. +0.28 from open P1 tickets) or anchoring retention down (e.g. -0.14 from high contract tenure), enabling Customer Success teams to take targeted, evidence-based actions."
  },
  {
    id: "troubleshooting-upload",
    index: "06",
    category: "troubleshooting",
    tag: "Troubleshooting",
    question: "What should I do if my CSV columns don't auto-detect or if upload times out?",
    answer: "If your column headers have custom names, use the interactive column mapping chips in the upload modal to manually route your source fields to the target XGBoost features. If an upload times out, verify your file is under 5MB and encoded in UTF-8. You can also download our verified template with the 'Download .CSV' button in the modal to inspect the standard structure."
  }
];

export default function FaqSection({ onOpenConnectModal }: { onOpenConnectModal?: () => void }) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>("what-is-valence");

  const categories = [
    { id: "all", label: "All Questions" },
    { id: "product", label: "Core Product" },
    { id: "data", label: "Data Ingestion" },
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
    <section className="w-full max-w-4xl mx-auto mt-24 mb-36 px-4 sm:px-6">
      {/* Editorial Header - Directly on Canvas */}
      <div className="flex flex-col items-center text-center space-y-4 pb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DAF1DE]/60 border border-[#8EB69B]/40 text-[#163832] text-xs font-mono font-bold shadow-2xs">
          <HelpCircle className="w-3.5 h-3.5 text-[#235347]" />
          <span>Architecture & System Intelligence</span>
        </div>

        <h3 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#051F20] tracking-tight">
          Frequently Asked Questions
        </h3>

        <p className="text-xs sm:text-sm text-stone-500 max-w-lg leading-relaxed font-sans">
          Deep-dive into the VALENCE retention engine, TreeSHAP explainability formulas, and multi-tenant security architecture.
        </p>

        {onOpenConnectModal && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                playTick();
                onOpenConnectModal();
              }}
              className="px-5 py-2.5 rounded-full bg-[#051F20] hover:bg-[#0B2B26] text-white text-xs font-bold font-sans flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Launch Data Ingestion Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Editorial Filter Category Pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-10">
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
                ? "bg-[#051F20] text-[#DAF1DE] font-bold shadow-xs"
                : "bg-white/60 text-stone-600 hover:text-stone-900 border border-[#E2EAE4] hover:bg-white"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Editorial Hairline Accordion List (No Bento Box, Pure Seamless Canvas) */}
      <div className="border-t border-[#051F20]/15 divide-y divide-[#051F20]/10">
        {filteredFaqs.map((faq) => {
          const isOpen = openFaqId === faq.id;

          return (
            <div
              key={faq.id}
              className={`group transition-colors duration-200 ${
                isOpen ? "bg-[#F4F8F5]/50" : "hover:bg-white/40"
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFaq(faq.id)}
                className="w-full py-6 px-3 sm:px-5 text-left flex items-start justify-between gap-5 cursor-pointer select-none"
              >
                <div className="flex items-start gap-4 sm:gap-6">
                  {/* Large Editorial Index Numeral */}
                  <span className={`text-base sm:text-lg font-serif font-bold transition-colors pt-0.5 ${
                    isOpen ? "text-emerald-700" : "text-stone-400 group-hover:text-stone-700"
                  }`}>
                    {faq.index}
                  </span>

                  <div className="space-y-1.5">
                    {/* Category Tag */}
                    <div className="inline-block text-[10px] font-mono uppercase tracking-widest text-[#235347] font-bold bg-[#DAF1DE]/40 px-2 py-0.5 rounded">
                      {faq.tag}
                    </div>

                    {/* Question Title */}
                    <div className={`text-base sm:text-lg font-serif font-bold transition-colors leading-snug ${
                      isOpen ? "text-[#051F20]" : "text-stone-800 group-hover:text-[#051F20]"
                    }`}>
                      {faq.question}
                    </div>
                  </div>
                </div>

                {/* Kinetic [+] / [−] Trigger Button */}
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 mt-1 ${
                  isOpen 
                    ? "bg-[#051F20] text-emerald-300 border-[#051F20] rotate-180 scale-105" 
                    : "bg-white border-[#E2EAE4] text-stone-500 group-hover:border-[#8EB69B] group-hover:text-stone-800 shadow-2xs"
                }`}>
                  {isOpen ? (
                    <Minus className="w-4 h-4 transition-transform duration-200" />
                  ) : (
                    <Plus className="w-4 h-4 transition-transform duration-200" />
                  )}
                </div>
              </button>

              {/* Expanding Answer Body */}
              {isOpen && (
                <div className="px-3 sm:px-5 pl-12 sm:pl-16 pb-7 pr-8 sm:pr-12 text-xs sm:text-sm text-stone-600 leading-relaxed font-sans animate-in fade-in slide-in-from-top-2 duration-200">
                  <p className="max-w-2xl text-stone-700">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
