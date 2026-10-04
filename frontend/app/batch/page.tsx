"use client";

import { useState } from "react";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Layers, 
  ArrowRight,
  Zap,
  Search,
  Filter,
  Flame,
  Send,
  SlidersHorizontal,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { uploadBatchCsv } from "@/lib/api";
import { BatchResponse, BatchItem } from "@/lib/types";
import { formatCurrency, getRiskBadgeClasses } from "@/lib/utils";
import { playBlip, playExecute, playTick } from "@/lib/sound";

export default function BatchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [queuedAll, setQueuedAll] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      playTick();
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    playBlip();
    setLoading(true);
    setError(null);
    setQueuedAll(false);
    try {
      const data = await uploadBatchCsv(file);
      setResults(data);
      playExecute();
    } catch (err: any) {
      setError(err.message || "Failed to process batch CSV file.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = () => {
    playTick();
    const csvContent =
      "account_id,company_name,contract_mrr,tenure_months,contract_tier,days_since_last_login,usage_change_pct_30d,active_user_ratio,api_calls_monthly,open_p1_tickets,avg_resolution_time_hrs,nps_score,csat_score,payment_failures_past_quarter,days_until_renewal,auto_renew_enabled\n" +
      "ACC-901,Omni Analytics,14500,24,Enterprise,3,-12.5,0.85,18000,0,8.0,8,4.5,0,120,1\n" +
      "ACC-902,Apex Dynamics,6200,8,Professional,19,-45.0,0.40,4200,2,36.0,4,2.5,1,30,0\n" +
      "ACC-903,Nova Health,22000,36,Enterprise,1,18.0,0.95,35000,0,4.0,9,4.8,0,240,1\n" +
      "ACC-904,Stratis Financial,8900,12,Enterprise,25,-60.0,0.30,3000,3,48.0,3,1.8,2,15,0\n" +
      "ACC-905,Vanguard Tech,18200,18,Enterprise,14,-32.0,0.55,12000,1,28.0,6,3.2,0,45,0\n" +
      "ACC-906,Helios Systems,31000,48,Enterprise,2,5.0,0.91,48000,0,5.0,10,4.9,0,300,1\n" +
      "ACC-907,Krypton Media,7400,6,Professional,22,-52.0,0.35,3800,2,42.0,3,2.0,1,20,0\n" +
      "ACC-908,Nexus Logistics,11500,15,Enterprise,9,-18.0,0.72,16000,0,12.0,7,4.0,0,90,1\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const sampleFile = new File([blob], "sample_enterprise_batch.csv", { type: "text/csv" });
    setFile(sampleFile);
    setError(null);
  };

  const downloadSampleTemplate = () => {
    playTick();
    const csvContent =
      "account_id,company_name,contract_mrr,tenure_months,contract_tier,days_since_last_login,usage_change_pct_30d,active_user_ratio,api_calls_monthly,open_p1_tickets,avg_resolution_time_hrs,nps_score,csat_score,payment_failures_past_quarter,days_until_renewal,auto_renew_enabled\n" +
      "ACC-901,Omni Analytics,14500,24,Enterprise,3,-12.5,0.85,18000,0,8.0,8,4.5,0,120,1\n" +
      "ACC-902,Apex Dynamics,6200,8,Professional,19,-45.0,0.40,4200,2,36.0,4,2.5,1,30,0\n" +
      "ACC-903,Nova Health,22000,36,Enterprise,1,18.0,0.95,35000,0,4.0,9,4.8,0,240,1\n" +
      "ACC-904,Stratis Financial,8900,12,Enterprise,25,-60.0,0.30,3000,3,48.0,3,1.8,2,15,0\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "b2b_churn_batch_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleQueueAllCritical = () => {
    playExecute();
    setQueuedAll(true);
    setTimeout(() => setQueuedAll(false), 3000);
  };

  const filteredAccounts = (results?.accounts || []).filter((acc) => {
    const matchesSearch = 
      acc.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.account_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.primary_playbook.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTier === "ALL") return true;
    return acc.risk_tier.toUpperCase() === filterTier.toUpperCase();
  });

  return (
    <div className="w-full space-y-7 pb-16 font-sans">
      {/* Editorial Header */}
      <div className="pb-4 border-b border-[#E2EAE4]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#235347]"></span>
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#163832]/60">
                Vectorized Ingestion Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#051F20] tracking-tight">
              Batch CSV Decision Processor
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#163832]/70 max-w-2xl leading-relaxed">
              Upload customer account datasets for vectorized churn risk scoring, financial loss quantification, and automatic playbook dispatching.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="px-3.5 py-2 rounded-full bg-white border border-[#E2EAE4] hover:border-[#8EB69B]/60 text-[#051F20] text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Load Sample Data
            </button>
            <button
              onClick={downloadSampleTemplate}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#235347] text-white hover:bg-[#163832] text-xs font-semibold shadow-xs transition-all cursor-pointer border border-[#8EB69B]/40"
            >
              <Download className="w-3.5 h-3.5 text-[#DAF1DE]" />
              Template CSV
            </button>
          </div>
        </div>
      </div>

      {/* Pre-Upload Dual-Column Workspace (Eliminates excessive empty whitespace) */}
      {!results && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Dropzone (7 Cols) */}
          <div className="lg:col-span-7 p-8 rounded-[28px] border-2 border-dashed border-[#E2EAE4] hover:border-[#235347] bg-white shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] transition-all text-center flex flex-col justify-center items-center min-h-[360px] relative">
            <div className="w-14 h-14 rounded-2xl bg-[#DAF1DE] border border-[#8EB69B]/40 flex items-center justify-center mb-4 text-[#0B2B26] shadow-xs">
              <UploadCloud className="w-7 h-7" />
            </div>
            
            <h3 className="text-base font-bold text-[#051F20]">
              {file ? file.name : "Select or drag & drop customer CSV dataset"}
            </h3>
            <p className="text-xs text-[#163832]/70 mt-1 max-w-sm mx-auto leading-relaxed">
              Vectorized batch engine accepts up to 10,000 enterprise accounts per upload with sub-second TreeSHAP ML scoring.
            </p>

            {file && (
              <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F4F8F5] border border-[#E2EAE4] text-xs font-mono text-[#051F20] font-medium shadow-xs">
                <FileText className="w-3.5 h-3.5 text-[#235347]" />
                <span>{(file.size / 1024).toFixed(1)} KB • Valid CSV Selected</span>
              </div>
            )}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <label className="cursor-pointer px-4 py-2.5 rounded-full bg-[#F4F8F5] hover:bg-[#EAEFEA] border border-[#E2EAE4] text-[#051F20] text-xs font-semibold transition-all shadow-xs">
                Browse File
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {file ? (
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-full bg-[#235347] hover:bg-[#163832] disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer border border-[#8EB69B]/40"
                >
                  {loading ? (
                    <>
                      <Zap className="w-3.5 h-3.5 animate-spin text-[#DAF1DE]" />
                      <span>Processing Vectorized Batch...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-white text-white" />
                      <span>Run Batch Scoring</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleLoadSample}
                  className="px-4 py-2.5 rounded-full bg-[#235347] hover:bg-[#163832] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-[#8EB69B]/40"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
                  <span>Try Sample Dataset</span>
                </button>
              )}
            </div>

            {error && (
              <div className="mt-4 p-3 max-w-md mx-auto rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Right Column: Schema Validator & Health Telemetry HUD (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Schema Checklist Card */}
            <div className="p-5 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#E2EAE4]">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-[#235347]" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#051F20]">
                    Required Schema Headers
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-[#0B2B26] bg-[#DAF1DE] px-2 py-0.5 rounded-full border border-[#8EB69B]/40 font-bold">
                  Auto-Mapped
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                {[
                  { name: "account_id", type: "string" },
                  { name: "company_name", type: "string" },
                  { name: "contract_mrr", type: "currency" },
                  { name: "usage_change_pct_30d", type: "float (%)" },
                  { name: "open_p1_tickets", type: "integer" },
                  { name: "days_until_renewal", type: "integer" },
                ].map((col) => (
                  <div key={col.name} className="p-2 rounded-xl bg-[#F4F8F5] border border-[#E2EAE4] flex items-center justify-between">
                    <span className="text-[#051F20] font-semibold truncate">{col.name}</span>
                    <span className="text-[9px] text-[#163832]/60">{col.type}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ingestion Pipeline Specs Card */}
            <div className="p-5 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#051F20] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#235347]" />
                  Vectorized Pipeline Readiness
                </span>
                <span className="text-[10px] font-mono text-[#163832]/60 font-bold">v2.4 Engine</span>
              </div>

              <div className="space-y-2 text-xs text-[#163832]/80">
                <div className="flex justify-between py-1 border-b border-[#E2EAE4]">
                  <span>Throughput Capability</span>
                  <span className="font-mono font-bold text-[#051F20]">~1,200 rows/sec</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#E2EAE4]">
                  <span>Attribution Mechanism</span>
                  <span className="font-mono font-bold text-[#051F20]">TreeSHAP Fast Exact</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Downstream Webhook</span>
                  <span className="font-mono font-bold text-[#235347]">Auto-Dispatch P0 SLA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Results Output */}
      {results && (
        <div className="space-y-6 pt-2">
          {/* Executive Scoreboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)]">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#163832]/60 font-bold">Total Evaluated</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#051F20] mt-1">
                {results.total_processed} <span className="text-xs font-normal text-[#163832]/60 font-sans">Accounts</span>
              </div>
            </div>

            <div className="p-5 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)]">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#163832]/60 font-bold">Total MRR at Risk</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#8C3A27] mt-1">
                {formatCurrency(results.total_mrr_at_risk)}
              </div>
            </div>

            <div className="p-5 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)]">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#163832]/60 font-bold">Critical Risk</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-rose-700 mt-1 flex items-baseline gap-1.5">
                {results.critical_risk_count}
                <span className="text-xs font-normal text-[#163832]/60 font-sans">
                  ({((results.critical_risk_count / results.total_processed) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>

            <div className="p-5 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)]">
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#163832]/60 font-bold">High Risk</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#8C3A27] mt-1 flex items-baseline gap-1.5">
                {results.high_risk_count}
                <span className="text-xs font-normal text-[#163832]/60 font-sans">
                  ({((results.high_risk_count / results.total_processed) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Decision Table Filter & Action Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            {/* Risk Tier Filters */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"].map((tier) => (
                <button
                  key={tier}
                  onClick={() => {
                    playTick();
                    setFilterTier(tier);
                  }}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-mono tracking-wider uppercase transition-colors cursor-pointer ${
                    filterTier === tier
                      ? "bg-[#235347] text-white font-bold shadow-xs"
                      : "bg-white text-[#163832]/70 hover:text-[#051F20] border border-[#E2EAE4]"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            {/* Search and Queue Actions */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="Filter accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#E2EAE4] focus:border-[#235347] rounded-full pl-8 pr-3 py-1.5 text-xs text-[#051F20] placeholder:text-stone-400 focus:outline-none transition-colors shadow-2xs"
                />
              </div>

              <button
                onClick={handleQueueAllCritical}
                className={`px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  queuedAll
                    ? "bg-[#DAF1DE] text-[#051F20] border border-[#8EB69B]/60 font-bold"
                    : "bg-[#235347] hover:bg-[#163832] text-white shadow-xs border border-[#8EB69B]/40"
                }`}
              >
                {queuedAll ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#051F20]" />
                    <span>Queued Critical Workflows</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-[#DAF1DE]" />
                    <span>Queue All Critical</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Enriched Scored Table */}
          <div className="rounded-[28px] border border-[#E2EAE4] bg-white shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] overflow-hidden">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-[#F4F8F5] text-[#163832]/60 uppercase font-mono text-[10px] tracking-wider border-b border-[#E2EAE4]">
                  <tr>
                    <th className="py-3.5 px-5">Account ID & Name</th>
                    <th className="py-3.5 px-5">Contract MRR</th>
                    <th className="py-3.5 px-5">Churn Probability</th>
                    <th className="py-3.5 px-5">Risk Tier</th>
                    <th className="py-3.5 px-5">MRR Exposure</th>
                    <th className="py-3.5 px-5">Recommended Playbook</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2EAE4]/60">
                  {filteredAccounts.map((item) => (
                    <tr key={item.account_id} className="hover:bg-[#F4F8F5] transition-colors">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-[#051F20]">{item.company_name}</div>
                        <div className="text-[10px] font-mono text-[#163832]/60">{item.account_id}</div>
                      </td>
                      <td className="py-3.5 px-5 font-mono text-[#051F20] font-medium">
                        {formatCurrency(item.contract_mrr)}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 rounded-full bg-[#E2EAE4] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.churn_probability >= 0.7
                                  ? "bg-[#8C3A27]"
                                  : item.churn_probability >= 0.4
                                  ? "bg-[#D97706]"
                                  : "bg-[#235347]"
                              }`}
                              style={{ width: `${item.churn_probability * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-[#051F20]">
                            {(item.churn_probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold ${
                          item.risk_tier === "Critical"
                            ? "bg-rose-50 text-rose-800 border border-rose-200"
                            : item.risk_tier === "High"
                            ? "bg-[#FAF0E6] text-[#8C3A27] border border-[#E8C4B8]"
                            : item.risk_tier === "Medium"
                            ? "bg-[#DAF1DE]/70 text-[#0B2B26] border border-[#8EB69B]/40"
                            : "bg-[#DAF1DE] text-[#051F20] border border-[#8EB69B]/60"
                        }`}>
                          {item.risk_tier}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 font-mono font-bold text-rose-700">
                        {formatCurrency(item.mrr_at_risk)}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DAF1DE]/40 border border-[#8EB69B]/40 text-[#051F20] font-mono text-[11px] font-semibold">
                          <span className="text-[#235347]">▶</span>
                          {item.primary_playbook}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredAccounts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#163832]/50 text-xs">
                        No accounts match the selected filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
