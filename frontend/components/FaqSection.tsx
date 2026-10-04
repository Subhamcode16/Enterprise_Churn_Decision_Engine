"use client";

import { useState, useMemo } from "react";
import { 
  Plus, 
  Minus, 
  ArrowUpRight,
  Search,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { playTick } from "@/lib/sound";

interface FaqItem {
  id: string;
  index: string;
  category: "product" | "data" | "security" | "troubleshooting";
  question: string;
  answer: string;
}

const FAQS: FaqItem[] = [
  {
    id: "what-is-valence",
    index: "01",
    category: "product",
    question: "What is VALENCE and how does it predict enterprise churn?",
    answer: "VALENCE is an autonomous B2B retention intelligence engine. It continuously evaluates customer telemetry (MRR, usage velocity, open P1 tickets, NPS sentiment) using calibrated XGBoost gradient-boosted decision trees. Rather than calculating arbitrary 1–100 health scores, VALENCE computes real-time churn probability, calculates exact dollar loss exposure ($MRR × Churn Probability), and assigns TreeSHAP mathematical feature attributions."
  },
  {
    id: "how-to-connect-data",
    index: "02",
    category: "data",
    question: "How do I connect and upload my company dataset?",
    answer: "Click 'Connect Company Data' in the header navigation. You can either drag & drop a standard billing CSV/XLSX export or click 'Load Sample CSV' for instant testing. Alternatively, navigate to the 'Cloud Connectors' tab to initiate 1-click OAuth synchronization with Stripe Billing (for MRR & invoice failures) or Salesforce CRM (for accounts & support SLAs)."
  },
  {
    id: "csv-schema-requirements",
    index: "03",
    category: "data",
    question: "What CSV schema headers does the ML inference pipeline expect?",
    answer: "The engine natively recognizes standard telemetry headers including: 'company_name', 'contract_mrr', 'tenure_months', 'contract_tier', 'days_since_last_login', 'usage_change_pct_30d', 'open_p1_tickets', and 'nps_score'. Our flexible header normalizer auto-detects common aliases (e.g. 'mrr' -> 'contract_mrr', 'tenure' -> 'tenure_months') with an interactive dropdown inspector to override mappings prior to scoring."
  },
  {
    id: "data-encryption-security",
    index: "04",
    category: "security",
    question: "How is company data encrypted and isolated?",
    answer: "All uploaded datasets and ingested telemetry are encrypted at rest using AES-256 GCM in an isolated tenant vault partition (e.g. org_live_2026_val). Raw customer data is never shared across tenant boundaries or used to train public models. The system complies with SOC 2 Type II strict access control standards."
  },
  {
    id: "treeshap-attributions",
    index: "05",
    category: "product",
    question: "What are TreeSHAP attributions and how do they explain churn drivers?",
    answer: "TreeSHAP (SHapley Additive exPlanations) is a game-theoretic approach that breaks down the machine learning prediction into exact positive and negative feature contributions. For each enterprise account, VALENCE calculates which specific factors are driving risk up (e.g. +0.28 from open P1 tickets) or anchoring retention down (e.g. -0.14 from high contract tenure), enabling Customer Success teams to take targeted, evidence-based actions."
  },
  {
    id: "troubleshooting-upload",
    index: "06",
    category: "troubleshooting",
    question: "What should I do if my CSV columns don't auto-detect or if upload times out?",
    answer: "If your column headers have custom names, use the interactive column mapping chips in the upload modal to manually route your source fields to the target XGBoost features. If an upload times out, verify your file is under 5MB and encoded in UTF-8. You can also download our verified template with the 'Download .CSV' button in the modal to inspect the standard structure."
  }
];

export default function FaqSection({ onOpenConnectModal }: { onOpenConnectModal?: () => void }) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [openFaqId, setOpenFaqId] = useState<string | null>("what-is-valence");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", label: "All Topics" },
    { id: "product", label: "Core Product" },
    { id: "data", label: "Data Ingestion" },
    { id: "security", label: "Security & Vault" },
    { id: "troubleshooting", label: "Troubleshooting" }
  ];

  const filteredFaqs = useMemo(() => {
    return FAQS.filter(faq => {
      const matchesCategory = activeCategory === "all" || faq.category === activeCategory;
      const matchesSearch = searchQuery.trim() === "" || 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const toggleFaq = (id: string) => {
    playTick();
    setOpenFaqId(openFaqId === id ? null : id);
  };

  return (
    <section className="w-full mt-40 sm:mt-48 mb-48 px-1 sm:px-2 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start w-full">
        
        {/* ============================================================== */}
        {/* LEFT COLUMN (4 Cols): Sticky Editorial Title, Search & Filters */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-7">
          <div className="space-y-3">
            <h3 className="text-4xl sm:text-5xl font-serif font-bold text-[#051F20] tracking-tight leading-[1.1]">
              Frequently Asked Questions
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed">
              Deep-dive into the retention engine, TreeSHAP attribution formulas, and multi-tenant security architecture.
            </p>
          </div>

          {/* Minimalist Instant Live Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts, TreeSHAP, OAuth..."
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/70 hover:bg-white focus:bg-white border border-[#E2EAE4] focus:border-[#235347] text-xs font-mono text-[#051F20] placeholder:text-stone-400 focus:outline-none transition-all shadow-2xs focus:shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Filter Switchers */}
          <div className="space-y-2">
            <div className="text-[10px] font-mono text-stone-400 uppercase tracking-wider font-semibold">
              Filter By Topic
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const count = cat.id === "all" ? FAQS.length : FAQS.filter(f => f.category === cat.id).length;
                const isSelected = activeCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      playTick();
                      setActiveCategory(cat.id);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#051F20] text-[#DAF1DE] font-bold shadow-2xs"
                        : "bg-white/60 text-stone-600 hover:text-stone-900 border border-[#E2EAE4] hover:bg-white"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-[#235347] text-white" : "bg-stone-100 text-stone-400"
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Understated Data Vault Link */}
          {onOpenConnectModal && (
            <div className="pt-2 border-t border-[#051F20]/10">
              <button
                type="button"
                onClick={() => {
                  playTick();
                  onOpenConnectModal();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-stone-500 hover:text-[#235347] transition-colors cursor-pointer group"
              >
                <span>Need to ingest live telemetry?</span>
                <span className="font-bold underline underline-offset-4 decoration-emerald-500/40 group-hover:decoration-emerald-700">Open Data Vault</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </button>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN (8 Cols): Full-Width Hairline Accordion Flow     */}
        {/* ============================================================== */}
        <div className="lg:col-span-8 border-t border-[#051F20]/15 divide-y divide-[#051F20]/10 w-full">
          {filteredFaqs.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-stone-400 space-y-2">
              <p>No questions matched your search &quot;{searchQuery}&quot;.</p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("all");
                }}
                className="text-emerald-700 underline font-bold cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;

              return (
                <div
                  key={faq.id}
                  className={`group transition-all duration-200 w-full ${
                    isOpen 
                      ? "border-l-2 border-[#235347] bg-[#F4F8F5]/40 pl-3 sm:pl-5" 
                      : "border-l-2 border-transparent hover:bg-white/40 pl-3 sm:pl-5"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full py-5 pr-2 sm:pr-4 text-left flex items-start justify-between gap-6 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-4 sm:gap-6 flex-1">
                      {/* Large Editorial Index Numeral */}
                      <span className={`text-base font-serif font-bold transition-colors pt-0.5 shrink-0 ${
                        isOpen ? "text-[#235347]" : "text-stone-400 group-hover:text-stone-700"
                      }`}>
                        {faq.index}
                      </span>

                      {/* Question Title */}
                      <div className={`text-base sm:text-lg font-serif font-bold transition-colors leading-snug ${
                        isOpen ? "text-[#051F20]" : "text-stone-800 group-hover:text-[#051F20]"
                      }`}>
                        {faq.question}
                      </div>
                    </div>

                    {/* Kinetic [+] / [−] Trigger Button */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all duration-300 mt-0.5 ${
                      isOpen 
                        ? "bg-[#051F20] text-emerald-300 border-[#051F20] rotate-180 scale-105" 
                        : "bg-white border-[#E2EAE4] text-stone-500 group-hover:border-[#8EB69B] group-hover:text-stone-800 shadow-2xs"
                    }`}>
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5 transition-transform duration-200" />
                      ) : (
                        <Plus className="w-3.5 h-3.5 transition-transform duration-200" />
                      )}
                    </div>
                  </button>

                  {/* Expanding Answer Body with Elastic Spring Motion */}
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0, y: -6 }}
                        animate={{ 
                          height: "auto", 
                          opacity: 1, 
                          y: 0,
                          transition: {
                            height: { type: "spring", stiffness: 320, damping: 28, restDelta: 0.5 },
                            opacity: { duration: 0.25, ease: "easeOut" },
                            y: { type: "spring", stiffness: 400, damping: 25 }
                          }
                        }}
                        exit={{ 
                          height: 0, 
                          opacity: 0, 
                          y: -6,
                          transition: {
                            height: { duration: 0.2, ease: "easeInOut" },
                            opacity: { duration: 0.12 }
                          }
                        }}
                        className="overflow-hidden w-full"
                      >
                        <div className="pl-8 sm:pl-10 pb-6 pr-4 sm:pr-10 text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
                          <p className="max-w-3xl text-stone-700">
                            {faq.answer}
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
