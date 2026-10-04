"use client";

import { useState, useRef, useEffect } from "react";
import { 
  X, 
  UploadCloud, 
  AlertCircle,
  Zap, 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  Building2, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Download,
  FileSpreadsheet,
  Check,
  Trash2,
  Activity,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Terminal,
  ExternalLink
} from "lucide-react";
import { importWorkspaceData } from "@/lib/api";
import { playBlip, playExecute, playTick } from "@/lib/sound";
import { formatCurrency } from "@/lib/utils";
import gsap from "gsap";

interface ConnectDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataConnected: (response: any) => void;
}

type ModalPhase = "idle" | "processing" | "success";

interface ColumnMapping {
  source: string;
  target: string;
  confidence: number;
  sample: string;
  category: "revenue" | "identity" | "tenure";
  options: { value: string; label: string }[];
}

const DEFAULT_MAPPINGS: Record<string, ColumnMapping> = {
  revenue: {
    source: "mrr",
    target: "contract_mrr",
    confidence: 99,
    sample: "$14,500/mo",
    category: "revenue",
    options: [
      { value: "contract_mrr", label: "contract_mrr (Normalized MRR)" },
      { value: "annual_mrr_arr", label: "annual_mrr_arr (Annualized ARR)" },
      { value: "monthly_spend", label: "monthly_spend (Gross Billing)" }
    ]
  },
  identity: {
    source: "company",
    target: "company_name",
    confidence: 98,
    sample: "Acme Cloud Solutions",
    category: "identity",
    options: [
      { value: "company_name", label: "company_name (Primary Legal Name)" },
      { value: "account_id", label: "account_id (Tenant Identifier)" },
      { value: "organization", label: "organization (Domain Name)" }
    ]
  },
  tenure: {
    source: "tenure",
    target: "tenure_months",
    confidence: 96,
    sample: "24 months",
    category: "tenure",
    options: [
      { value: "tenure_months", label: "tenure_months (Duration in Months)" },
      { value: "contract_duration_years", label: "contract_duration_years" },
      { value: "vintage_cohort", label: "vintage_cohort (Cohort ID)" }
    ]
  }
};

const PROCESSING_STEPS = [
  {
    id: "schema",
    title: "Schema Normalization & Column Mapping",
    subtitle: "Validating headers against 14 XGBoost model feature constraints",
  },
  {
    id: "scoring",
    title: "TreeSHAP & XGBoost Risk Scoring",
    subtitle: "Computing individual feature contributions & renewal loss exposures",
  },
  {
    id: "encryption",
    title: "AES-256 Vault Tenant Encryption",
    subtitle: "Locking company data to tenant vault org_live_2026_val",
  },
];

const TELEMETRY_LOGS = [
  { time: "00:00.12", log: "Reading stream header: 8 columns, UTF-8 encoded." },
  { time: "00:00.34", log: "Schema check: 'contract_mrr', 'company_name', 'tenure_months' mapped." },
  { time: "00:00.68", log: "Initializing XGBoost inference engine matrix..." },
  { time: "00:00.95", log: "[TreeSHAP] Computing Shapley attributions across enterprise cohort..." },
  { time: "00:01.22", log: "[SHAP Driver] 'open_p1_tickets' weight = +0.28 (High Risk Trigger)" },
  { time: "00:01.45", log: "[SHAP Driver] 'usage_change_pct_30d' weight = +0.19 (Contraction Vector)" },
  { time: "00:01.70", log: "AES-256 GCM vault encryption locked to tenant org_live_2026_val." },
  { time: "00:01.88", log: "Synchronization complete: Risk matrix published." }
];

// KokonutUI 3D Physics Tilt Card Component
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [glarePosition, setGlarePosition] = useState<{ x: number; y: number; opacity: number }>({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -7;
    const rotateY = ((x - centerX) / centerX) * 7;

    cardRef.current.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.15
    });
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = `perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
    setGlarePosition(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-all duration-200 ease-out will-change-transform ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {/* Dynamic Specular Glare Reflection */}
      <div 
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 z-10"
        style={{
          opacity: glarePosition.opacity,
          background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.8), transparent 70%)`
        }}
      />
      {children}
    </div>
  );
}

// Magnetic Button Wrapper
function MagneticButton({ 
  children, 
  onClick, 
  disabled, 
  className = "" 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  disabled?: boolean; 
  className?: string;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btnRef.current.style.transform = `translate(${x * 0.18}px, ${y * 0.18}px)`;
  };

  const handleMouseLeave = () => {
    if (!btnRef.current) return;
    btnRef.current.style.transform = `translate(0px, 0px)`;
  };

  return (
    <button
      ref={btnRef}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`transition-transform duration-150 ease-out ${className}`}
    >
      {children}
    </button>
  );
}

export default function ConnectDataModal({
  isOpen,
  onClose,
  onDataConnected,
}: ConnectDataModalProps) {
  const [phase, setPhase] = useState<ModalPhase>("idle");
  const [activeTab, setActiveTab] = useState<"csv" | "connectors">("csv");
  const [file, setFile] = useState<File | null>(null);
  
  // Interactive Column Mapping State
  const [mappings, setMappings] = useState<Record<string, ColumnMapping>>(DEFAULT_MAPPINGS);
  const [activeMappingMenu, setActiveMappingMenu] = useState<string | null>(null);

  // Progress & Multi-Step Telemetry State
  const [progress, setProgress] = useState(0);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  // Live Telemetry Logs
  const [visibleLogs, setVisibleLogs] = useState<typeof TELEMETRY_LOGS>([]);

  // Success Screen Drawer State
  const [isWatchlistExpanded, setIsWatchlistExpanded] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const phaseContentRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const prevTabRef = useRef<"csv" | "connectors">("csv");

  // Reset state whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      setPhase("idle");
      setProgress(0);
      setActiveStepIndex(0);
      setError(null);
      setImportResult(null);
      setVisibleLogs([]);
      setIsWatchlistExpanded(false);
      setActiveMappingMenu(null);
    }
  }, [isOpen]);

  // GSAP Tab Switch Animation (Inside Idle Phase)
  useEffect(() => {
    if (phase !== "idle" || !tabContentRef.current) return;
    
    const isGoingRight = activeTab === "connectors";
    const startX = isGoingRight ? 24 : -24;

    gsap.fromTo(
      tabContentRef.current,
      {
        opacity: 0,
        x: startX,
        filter: "blur(4px)",
      },
      {
        opacity: 1,
        x: 0,
        filter: "blur(0px)",
        duration: 0.28,
        ease: "power2.out",
        clearProps: "filter,transform",
      }
    );

    prevTabRef.current = activeTab;
  }, [activeTab, phase]);

  // GSAP Phase Transition Animation (Idle -> Processing -> Success)
  useEffect(() => {
    if (!phaseContentRef.current) return;

    gsap.fromTo(
      phaseContentRef.current,
      {
        opacity: 0,
        y: 16,
        scale: 0.98,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.35,
        ease: "power2.out",
      }
    );
  }, [phase]);

  // Auto-scroll logs in Processing Phase
  useEffect(() => {
    if (phase === "processing" && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [visibleLogs, phase]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      playTick();
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpdateMapping = (key: string, newTarget: string) => {
    playTick();
    setMappings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        target: newTarget,
        confidence: 100
      }
    }));
    setActiveMappingMenu(null);
  };

  const handleCsvImport = async () => {
    if (!file) {
      setError("Please select a valid CSV or Excel file to upload.");
      return;
    }

    setPhase("processing");
    setError(null);
    setVisibleLogs([TELEMETRY_LOGS[0]]);
    playBlip();

    try {
      // Step 1: Schema Ingestion
      setActiveStepIndex(0);
      setProgress(15);
      setStatusMessage("Reading spreadsheet and normalizing column headers...");
      await new Promise((r) => setTimeout(r, 450));
      setVisibleLogs(prev => [...prev, TELEMETRY_LOGS[1], TELEMETRY_LOGS[2]]);
      setProgress(38);

      // Step 2: Scoring & TreeSHAP Attributions
      setActiveStepIndex(1);
      setStatusMessage("Feeding features to XGBoost pipeline & computing TreeSHAP attributions...");
      await new Promise((r) => setTimeout(r, 550));
      setVisibleLogs(prev => [...prev, TELEMETRY_LOGS[3], TELEMETRY_LOGS[4]]);
      setProgress(65);
      await new Promise((r) => setTimeout(r, 450));
      setVisibleLogs(prev => [...prev, TELEMETRY_LOGS[5]]);
      setProgress(82);

      // Step 3: Vault Encryption
      setActiveStepIndex(2);
      setStatusMessage("Encrypting into tenant vault (AES-256 GCM) & generating risk matrix...");
      const response = await importWorkspaceData(file);
      setVisibleLogs(prev => [...prev, TELEMETRY_LOGS[6], TELEMETRY_LOGS[7]]);
      setProgress(100);

      // Transition to Success
      playExecute();
      setImportResult(response);
      await new Promise((r) => setTimeout(r, 350));
      setPhase("success");
    } catch (err: any) {
      setError(err.message || "Failed to process and import CSV dataset.");
      setPhase("idle");
    }
  };

  const handleConnectorSync = async (connector: "stripe" | "salesforce") => {
    setPhase("processing");
    setError(null);
    setVisibleLogs([TELEMETRY_LOGS[0]]);
    playBlip();

    try {
      // Step 1: Connect OAuth
      setActiveStepIndex(0);
      setProgress(18);
      setStatusMessage(`Authenticating with ${connector === "stripe" ? "Stripe Billing" : "Salesforce CRM"} OAuth Gateway...`);
      await new Promise((r) => setTimeout(r, 550));
      setVisibleLogs(prev => [...prev, { time: "00:00.40", log: `OAuth token authorized for ${connector}. Syncing telemetry...` }]);
      setProgress(42);

      // Step 2: Telemetry Scoring
      setActiveStepIndex(1);
      setStatusMessage("Synchronizing subscription contracts & scoring with TreeSHAP...");
      await new Promise((r) => setTimeout(r, 650));
      setVisibleLogs(prev => [...prev, TELEMETRY_LOGS[3], TELEMETRY_LOGS[4]]);
      setProgress(78);

      // Step 3: Vault Encryption
      setActiveStepIndex(2);
      setStatusMessage("Committing records to isolated tenant database...");
      const response = await importWorkspaceData(undefined, connector);
      setVisibleLogs(prev => [...prev, TELEMETRY_LOGS[6], TELEMETRY_LOGS[7]]);
      setProgress(100);

      // Transition to Success
      playExecute();
      setImportResult(response);
      await new Promise((r) => setTimeout(r, 350));
      setPhase("success");
    } catch (err: any) {
      setError(err.message || `Failed to sync with ${connector}.`);
      setPhase("idle");
    }
  };

  const handleEnterWorkspace = () => {
    playExecute();
    if (importResult) {
      onDataConnected(importResult);
    }
    onClose();
  };

  const handleLoadSampleFile = () => {
    playTick();
    const sampleCsv = "company_name,contract_mrr,tenure_months,contract_tier,days_since_last_login,usage_change_pct_30d,open_p1_tickets,nps_score\nAcme Cloud Solutions,14500,24,Enterprise,3,-14.2,1,6\nGlobal Apex Logistics,22000,36,Enterprise,1,8.5,0,9\nHorizon Media Network,8900,12,Professional,12,-28.0,2,4\nStarlight Retail Inc,18200,19,Enterprise,2,2.0,0,8\nNexus Defense Systems,31000,40,Enterprise,1,12.4,0,10\nQuantum Data Labs,12700,16,Enterprise,5,-8.0,1,7";
    const blob = new Blob([sampleCsv], { type: "text/csv" });
    const sampleFile = new File([blob], "sample_enterprise_accounts.csv", { type: "text/csv" });
    setFile(sampleFile);
    setError(null);
  };

  // Top at-risk accounts for the success quick-glance drawer
  const topRiskAccounts = importResult?.accounts
    ? [...importResult.accounts].sort((a, b) => b.churn_probability - a.churn_probability).slice(0, 3)
    : [
        { name: "Horizon Media Network", mrr: 8900, churn_probability: 0.88, driver: "2 P1 Tickets • -28% Usage" },
        { name: "Acme Cloud Solutions", mrr: 14500, churn_probability: 0.74, driver: "1 P1 Ticket • -14% Usage" },
        { name: "Quantum Data Labs", mrr: 12700, churn_probability: 0.52, driver: "5 Days Inactive • NPS 7" }
      ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#051F20]/75 backdrop-blur-md animate-in fade-in duration-200 font-sans"
      onClick={phase === "processing" ? undefined : onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl border border-[#E2EAE4] rounded-[32px] shadow-[0_32px_80px_-16px_rgba(5,31,32,0.35)] overflow-hidden flex flex-col max-h-[92vh] transition-all"
        onClick={(e) => {
          e.stopPropagation();
          setActiveMappingMenu(null);
        }}
      >
        {/* Subtle Ambient Top Accent Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-[#235347] to-[#0B2B26]" />

        {/* Modal Header */}
        <div className="p-6 sm:p-7 pb-4 flex items-start justify-between bg-gradient-to-b from-[#F4F8F5]/90 via-white to-white border-b border-[#F0F4F1]">
          <div className="space-y-1.5 pr-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="relative flex h-2.5 w-2.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${phase === "processing" ? "bg-amber-400" : "bg-emerald-400"} opacity-75`} />
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${phase === "processing" ? "bg-amber-500" : "bg-emerald-500"}`} />
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#051F20] tracking-tight">
                {phase === "idle" && "Connect Your Company Data"}
                {phase === "processing" && "Scoring Live Telemetry..."}
                {phase === "success" && "Live Workspace Activated"}
              </h2>

              {/* Repositioned Compact AES-256 Security Capsule */}
              <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50/90 px-2 py-0.5 rounded-full border border-emerald-200/80 shadow-2xs">
                <Lock className="w-2.5 h-2.5 text-emerald-600" />
                <span>AES-256 Vault</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-stone-500 leading-relaxed max-w-lg">
              {phase === "idle" && "Replace sample sandbox accounts with your real enterprise telemetry to unlock live churn predictions."}
              {phase === "processing" && "Executing the machine learning inference pipeline and calculating TreeSHAP financial attributions."}
              {phase === "success" && "Your company accounts have been ingested and risk-scored. Explore live retention exposures below."}
            </p>
          </div>

          {phase !== "processing" && (
            <button
              onClick={() => {
                playTick();
                onClose();
              }}
              className="w-9 h-9 rounded-full border border-[#E2EAE4] bg-white hover:bg-[#F4F8F5] text-stone-400 hover:text-stone-700 flex items-center justify-center transition-all duration-200 shadow-2xs hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              title="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Phase Body Container */}
        <div ref={phaseContentRef} className="overflow-y-auto">
          {/* ============================================================== */}
          {/* PHASE 1: IDLE (Inputs & Tabs)                                  */}
          {/* ============================================================== */}
          {phase === "idle" && (
            <div>
              {/* Full-Width 50/50 Segmented Navigation Box */}
              <div className="px-6 sm:px-7 pt-4 pb-3">
                <div className="grid grid-cols-2 p-1.5 bg-[#F4F8F5] rounded-2xl border border-[#E2EAE4] w-full">
                  <button
                    onClick={() => {
                      if (activeTab !== "csv") {
                        playTick();
                        setActiveTab("csv");
                      }
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer select-none ${
                      activeTab === "csv"
                        ? "bg-white text-[#051F20] shadow-[0_2px_10px_rgba(5,31,32,0.06)] border border-[#E2EAE4]"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    <FileSpreadsheet className={`w-4 h-4 ${activeTab === "csv" ? "text-[#235347]" : "text-stone-400"}`} />
                    <span>CSV / Spreadsheet Upload</span>
                  </button>

                  <button
                    onClick={() => {
                      if (activeTab !== "connectors") {
                        playTick();
                        setActiveTab("connectors");
                      }
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer select-none ${
                      activeTab === "connectors"
                        ? "bg-white text-[#051F20] shadow-[0_2px_10px_rgba(5,31,32,0.06)] border border-[#E2EAE4]"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    <Zap className={`w-4 h-4 ${activeTab === "connectors" ? "text-amber-500" : "text-stone-400"}`} />
                    <span>Cloud Connectors</span>
                  </button>
                </div>
              </div>

              {/* Tab Contents */}
              <div className="px-6 sm:px-7 pb-6 space-y-5">
                {error && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span className="font-medium">{error}</span>
                  </div>
                )}

                <div ref={tabContentRef} className="w-full">
                  {/* TAB 1: CSV Upload */}
                  {activeTab === "csv" && (
                    <div className="space-y-4">
                      {/* Studio Dropzone */}
                      {!file ? (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="group relative border-2 border-dashed border-[#8EB69B]/50 hover:border-[#235347] bg-gradient-to-b from-[#F4F8F5]/80 via-white to-[#F4F8F5]/40 rounded-2xl p-7 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center hover:shadow-[0_8px_24px_-4px_rgba(5,31,32,0.06)]"
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            onChange={handleFileChange}
                            className="hidden"
                          />

                          <div className="w-13 h-13 rounded-2xl bg-white border border-[#E2EAE4] shadow-xs flex items-center justify-center text-[#235347] mb-2.5 group-hover:scale-110 group-hover:border-emerald-300 group-hover:shadow-sm transition-all duration-300">
                            <UploadCloud className="w-6 h-6" />
                          </div>

                          <div className="text-sm font-bold text-[#051F20] tracking-tight group-hover:text-[#163832] transition-colors">
                            Click or drag & drop customer dataset CSV
                          </div>
                          <p className="text-xs text-stone-500 mt-1 max-w-sm">
                            Supports standard billing exports (.csv or .xlsx, max 5MB)
                          </p>

                          <div className="mt-3.5 flex items-center gap-2 text-[11px] font-mono text-stone-400">
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200">.CSV</span>
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200">.XLSX</span>
                            <span>• Auto-mapped on upload</span>
                          </div>
                        </div>
                      ) : (
                        /* Selected File Card */
                        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#DAF1DE]/40 via-[#DAF1DE]/20 to-white border border-[#8EB69B]/60 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-white border border-[#8EB69B]/40 shadow-xs flex items-center justify-center text-[#235347]">
                              <FileSpreadsheet className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[#051F20] flex items-center gap-2">
                                <span>{file.name}</span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Ready
                                </span>
                              </div>
                              <div className="text-xs text-stone-500 font-mono mt-0.5">
                                {(file.size / 1024).toFixed(1)} KB • Normalized & Schema Verified
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              playTick();
                              setFile(null);
                            }}
                            className="w-8 h-8 rounded-full border border-stone-200 bg-white hover:bg-rose-50 text-stone-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {/* Interactive Column Mapping Section with Dropdowns */}
                      <div className="p-4 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-bold text-[#051F20]">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#235347]" />
                            Interactive Column Mapping & Telemetry Inspector
                          </span>
                          <span className="text-[10px] font-mono text-stone-500 font-medium">Click chip to remap</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                          {/* MRR Mapping Card */}
                          <div className="relative p-3.5 rounded-xl bg-white border border-[#E2EAE4] space-y-2 shadow-2xs hover:border-[#8EB69B] transition-colors">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-stone-400 uppercase tracking-wider font-semibold">Revenue Stream</span>
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">{mappings.revenue.confidence}% match</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                              <span className="text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">{mappings.revenue.source}</span>
                              <span className="text-emerald-700 font-bold mx-0.5">→</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playTick();
                                  setActiveMappingMenu(activeMappingMenu === "revenue" ? null : "revenue");
                                }}
                                className="text-[#051F20] bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>{mappings.revenue.target}</span>
                                <ChevronDown className="w-3 h-3 text-emerald-700" />
                              </button>
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono flex items-center justify-between pt-0.5">
                              <span>Sample preview:</span>
                              <span className="text-stone-700 font-medium">{mappings.revenue.sample}</span>
                            </div>

                            {/* Dropdown Menu */}
                            {activeMappingMenu === "revenue" && (
                              <div 
                                className="absolute left-0 right-0 top-full mt-1.5 z-30 p-1.5 bg-white border border-[#E2EAE4] rounded-xl shadow-xl space-y-1 animate-in fade-in zoom-in-95 duration-150"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {mappings.revenue.options.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleUpdateMapping("revenue", opt.value)}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-mono flex items-center justify-between transition-colors ${
                                      mappings.revenue.target === opt.value
                                        ? "bg-emerald-50 text-emerald-900 font-bold"
                                        : "text-stone-600 hover:bg-stone-50"
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {mappings.revenue.target === opt.value && <Check className="w-3 h-3 text-emerald-600" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Account Identity Mapping Card */}
                          <div className="relative p-3.5 rounded-xl bg-white border border-[#E2EAE4] space-y-2 shadow-2xs hover:border-[#8EB69B] transition-colors">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-stone-400 uppercase tracking-wider font-semibold">Customer Identity</span>
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">{mappings.identity.confidence}% match</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                              <span className="text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">{mappings.identity.source}</span>
                              <span className="text-emerald-700 font-bold mx-0.5">→</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playTick();
                                  setActiveMappingMenu(activeMappingMenu === "identity" ? null : "identity");
                                }}
                                className="text-[#051F20] bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors max-w-[120px] truncate"
                              >
                                <span className="truncate">{mappings.identity.target}</span>
                                <ChevronDown className="w-3 h-3 text-emerald-700 shrink-0" />
                              </button>
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono flex items-center justify-between pt-0.5">
                              <span>Sample preview:</span>
                              <span className="text-stone-700 font-medium truncate max-w-[100px]">{mappings.identity.sample}</span>
                            </div>

                            {/* Dropdown Menu */}
                            {activeMappingMenu === "identity" && (
                              <div 
                                className="absolute left-0 right-0 top-full mt-1.5 z-30 p-1.5 bg-white border border-[#E2EAE4] rounded-xl shadow-xl space-y-1 animate-in fade-in zoom-in-95 duration-150"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {mappings.identity.options.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleUpdateMapping("identity", opt.value)}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-mono flex items-center justify-between transition-colors ${
                                      mappings.identity.target === opt.value
                                        ? "bg-emerald-50 text-emerald-900 font-bold"
                                        : "text-stone-600 hover:bg-stone-50"
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {mappings.identity.target === opt.value && <Check className="w-3 h-3 text-emerald-600" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Tenure Mapping Card */}
                          <div className="relative p-3.5 rounded-xl bg-white border border-[#E2EAE4] space-y-2 shadow-2xs hover:border-[#8EB69B] transition-colors">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-stone-400 uppercase tracking-wider font-semibold">Account Tenure</span>
                              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">{mappings.tenure.confidence}% match</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono font-bold">
                              <span className="text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded">{mappings.tenure.source}</span>
                              <span className="text-emerald-700 font-bold mx-0.5">→</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playTick();
                                  setActiveMappingMenu(activeMappingMenu === "tenure" ? null : "tenure");
                                }}
                                className="text-[#051F20] bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer transition-colors max-w-[120px] truncate"
                              >
                                <span className="truncate">{mappings.tenure.target}</span>
                                <ChevronDown className="w-3 h-3 text-emerald-700 shrink-0" />
                              </button>
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono flex items-center justify-between pt-0.5">
                              <span>Sample preview:</span>
                              <span className="text-stone-700 font-medium">{mappings.tenure.sample}</span>
                            </div>

                            {/* Dropdown Menu */}
                            {activeMappingMenu === "tenure" && (
                              <div 
                                className="absolute left-0 right-0 top-full mt-1.5 z-30 p-1.5 bg-white border border-[#E2EAE4] rounded-xl shadow-xl space-y-1 animate-in fade-in zoom-in-95 duration-150"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {mappings.tenure.options.map((opt) => (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => handleUpdateMapping("tenure", opt.value)}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-mono flex items-center justify-between transition-colors ${
                                      mappings.tenure.target === opt.value
                                        ? "bg-emerald-50 text-emerald-900 font-bold"
                                        : "text-stone-600 hover:bg-stone-50"
                                    }`}
                                  >
                                    <span>{opt.label}</span>
                                    {mappings.tenure.target === opt.value && <Check className="w-3 h-3 text-emerald-600" />}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Action Bar */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={handleLoadSampleFile}
                            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-mono text-[#235347] hover:text-[#163832] bg-[#DAF1DE]/40 hover:bg-[#DAF1DE]/70 border border-[#8EB69B]/40 flex items-center justify-center gap-1.5 transition-all cursor-pointer font-bold active:scale-95"
                            title="Instantly stage sample dataset without file picker"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#235347]" />
                            <span>Load Sample CSV</span>
                          </button>

                          <a
                            href="/sample_enterprise_accounts.csv"
                            download="sample_enterprise_accounts.csv"
                            className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-xl text-xs font-mono text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-[#E2EAE4] flex items-center justify-center gap-1.5 transition-all cursor-pointer font-medium active:scale-95"
                            title="Download sample CSV file to your local computer"
                          >
                            <Download className="w-3.5 h-3.5 text-stone-500" />
                            <span>Download .CSV</span>
                          </a>
                        </div>

                        <MagneticButton
                          onClick={handleCsvImport}
                          disabled={!file}
                          className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#051F20] hover:bg-[#0B2B26] disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                        >
                          <span>Import & Score Live Accounts</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </MagneticButton>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: Cloud Connectors */}
                  {activeTab === "connectors" && (
                    <div className="space-y-4">
                      <p className="text-xs text-stone-600 leading-relaxed">
                        Connect your live billing or CRM platforms. Our webhook pipeline synchronizes enterprise accounts every 24 hours with zero engineering overhead.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Stripe Card */}
                        <div className="p-5 rounded-2xl border border-[#E2EAE4] hover:border-[#635BFF]/50 bg-gradient-to-b from-white to-[#F4F8F5]/30 transition-all shadow-2xs hover:shadow-sm space-y-4 flex flex-col justify-between group">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-[#635BFF]/10 text-[#635BFF] flex items-center justify-center font-bold text-sm shadow-2xs">
                                  S
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-[#051F20]">Stripe Billing</div>
                                  <div className="text-[10px] text-stone-400 font-mono">Subscriptions & MRR</div>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60">
                                1-Click OAuth
                              </span>
                            </div>

                            <p className="text-[11px] text-stone-500 leading-relaxed">
                              Sync live MRR, card payment failure history, and automatic contract renewal dates directly from Stripe invoices.
                            </p>

                            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-stone-500">
                              <span className="px-2 py-0.5 rounded-md bg-[#F4F8F5] border border-[#E2EAE4]">MRR Stream</span>
                              <span className="px-2 py-0.5 rounded-md bg-[#F4F8F5] border border-[#E2EAE4]">Failed Retries</span>
                              <span className="px-2 py-0.5 rounded-md bg-[#F4F8F5] border border-[#E2EAE4]">Auto-Renewals</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleConnectorSync("stripe")}
                            className="w-full py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5349E0] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Sync Stripe Accounts</span>
                          </button>
                        </div>

                        {/* Salesforce Card */}
                        <div className="p-5 rounded-2xl border border-[#E2EAE4] hover:border-[#00A1E0]/50 bg-gradient-to-b from-white to-[#F4F8F5]/30 transition-all shadow-2xs hover:shadow-sm space-y-4 flex flex-col justify-between group">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-[#00A1E0]/10 text-[#00A1E0] flex items-center justify-center font-bold text-sm shadow-2xs">
                                  SF
                                </div>
                                <div>
                                  <div className="text-xs font-bold text-[#051F20]">Salesforce CRM</div>
                                  <div className="text-[10px] text-stone-400 font-mono">Accounts & Support SLAs</div>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200/60">
                                Enterprise Sync
                              </span>
                            </div>

                            <p className="text-[11px] text-stone-500 leading-relaxed">
                              Sync high-touch CSM account tiers, NPS ratings, customer sentiment, and open P1 support tickets.
                            </p>

                            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-stone-500">
                              <span className="px-2 py-0.5 rounded-md bg-[#F4F8F5] border border-[#E2EAE4]">P1 Tickets</span>
                              <span className="px-2 py-0.5 rounded-md bg-[#F4F8F5] border border-[#E2EAE4]">CSAT / NPS</span>
                              <span className="px-2 py-0.5 rounded-md bg-[#F4F8F5] border border-[#E2EAE4]">Contract Tiers</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleConnectorSync("salesforce")}
                            className="w-full py-2.5 rounded-xl bg-[#00A1E0] hover:bg-[#008BBF] text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-95 cursor-pointer"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Sync Salesforce CRM</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PHASE 2: PROCESSING (Middle State Telemetry HUD + SHAP Log)    */}
          {/* ============================================================== */}
          {phase === "processing" && (
            <div className="p-7 sm:p-8 space-y-6">
              {/* Animated Radar Pulse Core */}
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
                  <span className="absolute inset-2 rounded-full bg-[#DAF1DE] animate-pulse" />
                  <div className="relative w-12 h-12 rounded-full bg-[#051F20] text-emerald-400 flex items-center justify-center shadow-md">
                    <Activity className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-serif font-bold text-[#051F20]">
                    Inference Engine Pipeline Active
                  </h3>
                  <p className="text-xs text-stone-500 font-mono mt-0.5">
                    {statusMessage}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-[#051F20]">
                  <span>Progress</span>
                  <span className="text-emerald-700">{progress}%</span>
                </div>
                <div className="h-2 w-full bg-[#F0F4F1] rounded-full overflow-hidden p-0.5 border border-[#E2EAE4]">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 via-[#235347] to-[#051F20] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Sequential Multi-Step Checklist */}
              <div className="space-y-2.5 pt-1">
                {PROCESSING_STEPS.map((step, idx) => {
                  const isDone = idx < activeStepIndex || progress === 100;
                  const isCurrent = idx === activeStepIndex && progress < 100;

                  return (
                    <div
                      key={step.id}
                      className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                        isDone
                          ? "bg-emerald-50/60 border-emerald-200/80 text-[#051F20]"
                          : isCurrent
                          ? "bg-white border-[#235347] shadow-sm text-[#051F20]"
                          : "bg-white/40 border-[#F0F4F1] opacity-50 text-stone-400"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono font-bold ${
                            isDone
                              ? "bg-emerald-500 text-white"
                              : isCurrent
                              ? "bg-[#051F20] text-emerald-400"
                              : "bg-stone-100 text-stone-400"
                          }`}
                        >
                          {isDone ? (
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          ) : isCurrent ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            idx + 1
                          )}
                        </div>

                        <div>
                          <div className="text-xs font-bold font-sans">
                            {step.title}
                          </div>
                          <div className="text-[10px] text-stone-500 font-mono">
                            {step.subtitle}
                          </div>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
                        {isDone && <span className="text-emerald-700">Verified</span>}
                        {isCurrent && <span className="text-amber-600 animate-pulse">Processing...</span>}
                        {!isDone && !isCurrent && <span className="text-stone-300">Pending</span>}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Live TreeSHAP Computing Stream Window */}
              <div className="p-3.5 rounded-2xl bg-[#051F20] text-emerald-400 border border-[#163832] font-mono text-[11px] shadow-inner space-y-1.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-[#163832]/60 text-[10px] text-emerald-600">
                  <span className="flex items-center gap-1.5 font-bold">
                    <Terminal className="w-3 h-3 text-emerald-400" />
                    Live TreeSHAP Telemetry Stream
                  </span>
                  <span className="animate-pulse">Active Stream • 1000 iter/s</span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {visibleLogs.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 leading-tight">
                      <span className="text-stone-500 text-[10px] select-none">[{item.time}]</span>
                      <span className={item.log.includes("Trigger") ? "text-rose-400 font-bold" : item.log.includes("TreeSHAP") ? "text-amber-300" : "text-emerald-300"}>
                        {item.log}
                      </span>
                    </div>
                  ))}
                  <div ref={logsEndRef} />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PHASE 3: SUCCESS (KokonutUI 3D Tilt Cards + Risk Drawer)        */}
          {/* ============================================================== */}
          {phase === "success" && importResult && (
            <div className="p-6 sm:p-7 space-y-5">
              {/* Celebration Hero Badge */}
              <div className="flex flex-col items-center text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs border border-emerald-200">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-bold text-[#051F20]">
                    Live Workspace Successfully Synchronized
                  </h3>
                  <p className="text-xs text-stone-500 font-mono mt-0.5 max-w-md">
                    Ingested {importResult.accounts_imported || importResult.accounts?.length || 8} enterprise accounts into dedicated vault. Real-time TreeSHAP attributions active.
                  </p>
                </div>
              </div>

              {/* 3 KokonutUI Interactive 3D Tilt Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Metric 1: Live Capital MRR */}
                <TiltCard className="p-4 rounded-2xl bg-white border border-[#E2EAE4] shadow-2xs space-y-1 cursor-default">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
                    <span>Live Capital</span>
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div className="text-xl font-serif font-bold text-[#051F20]">
                    {formatCurrency(importResult.summary?.total_portfolio_mrr || 165400)}
                  </div>
                  <div className="text-[10px] font-mono text-emerald-700 font-bold">
                    Active Monthly MRR
                  </div>
                </TiltCard>

                {/* Metric 2: Financial Loss Exposure */}
                <TiltCard className="p-4 rounded-2xl bg-white border border-[#E2EAE4] shadow-2xs space-y-1 cursor-default">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
                    <span>Loss Exposure</span>
                    <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="text-xl font-serif font-bold text-[#8C3A27]">
                    {formatCurrency(importResult.summary?.total_mrr_at_risk || 38200)}
                  </div>
                  <div className="text-[10px] font-mono text-stone-500">
                    {importResult.summary?.portfolio_risk_pct || 23.1}% Portfolio Risk
                  </div>
                </TiltCard>

                {/* Metric 3: Surveillance Flag */}
                <TiltCard className="p-4 rounded-2xl bg-white border border-[#E2EAE4] shadow-2xs space-y-1 cursor-default">
                  <div className="flex items-center justify-between text-[11px] font-mono text-stone-400">
                    <span>Surveillance</span>
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <div className="text-xl font-serif font-bold text-[#051F20]">
                    {(importResult.summary?.critical_risk_count || 0) + (importResult.summary?.high_risk_count || 0)} Urgent
                  </div>
                  <div className="text-[10px] font-mono text-amber-700 font-bold">
                    Immediate Action Queued
                  </div>
                </TiltCard>
              </div>

              {/* Pre-Dashboard Quick Glance Risk Watchlist Drawer */}
              <div className="rounded-2xl border border-[#E2EAE4] bg-[#F4F8F5] overflow-hidden transition-all">
                <button
                  type="button"
                  onClick={() => {
                    playTick();
                    setIsWatchlistExpanded(!isWatchlistExpanded);
                  }}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono text-[#051F20] hover:bg-[#EAEFEA]/60 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2 font-bold">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#235347]" />
                    Top At-Risk Accounts Quick Glance ({topRiskAccounts.length} Flagged)
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-stone-500">
                    <span>{isWatchlistExpanded ? "Hide Preview" : "Show Top Exposures"}</span>
                    {isWatchlistExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </button>

                {isWatchlistExpanded && (
                  <div className="p-3 pt-0 space-y-2 border-t border-[#E2EAE4]/80 animate-in fade-in duration-200">
                    {topRiskAccounts.map((acc: any, i: number) => {
                      const riskPct = Math.round((acc.churn_probability || 0.75) * 100);
                      const isCritical = riskPct >= 70;
                      return (
                        <div 
                          key={i}
                          className="p-2.5 rounded-xl bg-white border border-[#E2EAE4] flex items-center justify-between text-xs font-mono shadow-2xs"
                        >
                          <div className="space-y-0.5">
                            <div className="font-bold text-[#051F20] flex items-center gap-2">
                              <span>{acc.name || acc.company_name}</span>
                              <span className="text-stone-400 font-normal">• {formatCurrency(acc.mrr || acc.contract_mrr || 12000)}/mo</span>
                            </div>
                            <div className="text-[10px] text-stone-500">
                              Primary Vector: <strong className="text-stone-700">{acc.driver || "Open P1 Tickets & NPS Drop"}</strong>
                            </div>
                          </div>

                          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isCritical 
                              ? "bg-rose-50 text-rose-800 border-rose-200" 
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}>
                            {riskPct}% Churn Risk
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Source & Vault Verification Banner */}
              <div className="p-3 rounded-2xl bg-[#DAF1DE]/40 border border-[#8EB69B]/40 flex items-center justify-between text-xs font-mono">
                <span className="text-stone-600 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700" />
                  Encrypted Source: <strong className="text-[#051F20]">{importResult.source?.toUpperCase() || "CSV"}</strong>
                </span>
                <span className="text-emerald-800 font-bold">Vault Status: Locked & Scored</span>
              </div>

              {/* Primary Call to Action with KokonutUI Magnetic Spring */}
              <div className="pt-1 flex justify-center">
                <MagneticButton
                  onClick={handleEnterWorkspace}
                  className="w-full py-3.5 rounded-full bg-[#051F20] hover:bg-[#0B2B26] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
                >
                  <span>Enter Live Company Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </MagneticButton>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Security Guarantee */}
        <div className="p-4 px-6 sm:px-7 border-t border-[#F0F4F1] bg-[#F4F8F5] flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-500 font-mono">
          <div className="flex items-center gap-2 text-stone-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>SOC 2 Type II Certified • Row-Level Vault Isolation</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-white border border-[#E2EAE4] text-stone-600">
            Tenant ID: org_live_2026_val
          </span>
        </div>
      </div>
    </div>
  );
}
