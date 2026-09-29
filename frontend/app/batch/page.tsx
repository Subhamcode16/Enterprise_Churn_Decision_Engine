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
  RefreshCw
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
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Editorial Header */}
      <div className="border-b border-[#22201E] pb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400">
                Vectorized Ingestion Engine
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif text-[#FAF8F5] tracking-tight">
              Batch CSV Decision Processor
            </h1>
            <p className="mt-1 text-xs text-stone-400 max-w-2xl leading-relaxed">
              Upload customer account datasets for high-throughput vectorized churn risk scoring, financial loss quantification, and automatic playbook dispatching.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadSample}
              className="px-3 py-1.5 rounded-lg bg-[#181716] border border-[#22201E] hover:border-stone-700 text-stone-300 text-xs font-medium transition-colors"
            >
              Load Sample Data
            </button>
            <button
              onClick={downloadSampleTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] text-[#0E0D0C] hover:bg-stone-200 text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Template CSV
            </button>
          </div>
        </div>
      </div>

      {/* Upload Dropzone Container */}
      <div className="p-8 rounded-xl border border-dashed border-[#2E2B28] hover:border-amber-400/40 bg-[#181716]/60 backdrop-blur-sm transition-all text-center relative">
        <UploadCloud className="w-10 h-10 mx-auto text-amber-400/80 mb-3" />
        
        <h3 className="text-sm font-medium text-[#FAF8F5]">
          {file ? file.name : "Select or drag & drop customer CSV dataset"}
        </h3>
        <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
          Vectorized batch engine accepts up to 10,000 accounts per upload with sub-second ML scoring.
        </p>

        {file && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0E0D0C] border border-[#22201E] text-[11px] font-mono text-stone-300">
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>{(file.size / 1024).toFixed(1)} KB • CSV Ready</span>
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-3">
          <label className="cursor-pointer px-4 py-2 rounded-lg bg-[#22201E] hover:bg-[#2A2825] border border-[#33302C] text-stone-200 text-xs font-medium transition-colors">
            Browse File
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {file && (
            <button
              onClick={handleUpload}
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-950 text-xs font-semibold shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Zap className="w-3.5 h-3.5 animate-spin text-stone-950" />
                  <span>Processing Batch Pipeline...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-stone-950" />
                  <span>Run Batch Inference</span>
                </>
              )}
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 max-w-md mx-auto rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Batch Results Output */}
      {results && (
        <div className="space-y-6 pt-2">
          {/* Executive Scoreboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#181716] border border-[#22201E]">
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">Total Evaluated</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-[#FAF8F5] mt-1">
                {results.total_processed} <span className="text-xs font-normal text-stone-500 font-sans">Accounts</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#181716] border border-[#22201E]">
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">Total MRR at Risk</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400 mt-1">
                {formatCurrency(results.total_mrr_at_risk)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#181716] border border-[#22201E]">
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">Critical Risk</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400 mt-1 flex items-baseline gap-1.5">
                {results.critical_risk_count}
                <span className="text-xs font-normal text-stone-500 font-sans">
                  ({((results.critical_risk_count / results.total_processed) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#181716] border border-[#22201E]">
              <span className="text-[10px] uppercase font-mono tracking-wider text-stone-400">High Risk</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1 flex items-baseline gap-1.5">
                {results.high_risk_count}
                <span className="text-xs font-normal text-stone-500 font-sans">
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
                  className={`px-3 py-1 rounded-md text-[11px] font-mono tracking-wider uppercase transition-colors ${
                    filterTier === tier
                      ? "bg-[#FAF8F5] text-[#0E0D0C] font-bold"
                      : "bg-[#181716] text-stone-400 hover:text-stone-200 border border-[#22201E]"
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            {/* Search and Queue Actions */}
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="text"
                  placeholder="Filter accounts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#181716] border border-[#22201E] focus:border-amber-400/50 rounded-lg pl-7 pr-2.5 py-1 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none transition-colors"
                />
              </div>

              <button
                onClick={handleQueueAllCritical}
                className={`px-3 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  queuedAll
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-[#181716] hover:bg-[#22201E] border border-[#22201E] text-stone-300 hover:text-[#FAF8F5]"
                }`}
              >
                {queuedAll ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Queued Critical Workflows</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 text-amber-400" />
                    <span>Queue All Critical</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Enriched Scored Table */}
          <div className="rounded-xl border border-[#22201E] bg-[#181716] shadow-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-[#0E0D0C] text-stone-400 uppercase font-mono text-[10px] tracking-wider border-b border-[#22201E]">
                  <tr>
                    <th className="py-3 px-4">Account ID & Name</th>
                    <th className="py-3 px-4">Contract MRR</th>
                    <th className="py-3 px-4">Churn Probability</th>
                    <th className="py-3 px-4">Risk Tier</th>
                    <th className="py-3 px-4">MRR Exposure</th>
                    <th className="py-3 px-4">Recommended Playbook</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22201E]/60">
                  {filteredAccounts.map((item) => (
                    <tr key={item.account_id} className="hover:bg-[#1E1D1B] transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#FAF8F5]">{item.company_name}</div>
                        <div className="text-[10px] font-mono text-stone-500">{item.account_id}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-stone-300">
                        {formatCurrency(item.contract_mrr)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-[#0E0D0C] overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                item.churn_probability >= 0.7
                                  ? "bg-rose-500"
                                  : item.churn_probability >= 0.4
                                  ? "bg-amber-400"
                                  : "bg-emerald-500"
                              }`}
                              style={{ width: `${item.churn_probability * 100}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs font-bold text-stone-200">
                            {(item.churn_probability * 100).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${getRiskBadgeClasses(item.risk_tier)}`}>
                          {item.risk_tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-400">
                        {formatCurrency(item.mrr_at_risk)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0E0D0C] border border-[#22201E] text-stone-300 font-mono text-[11px]">
                          <span className="text-amber-400">▶</span>
                          {item.primary_playbook}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredAccounts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-stone-500">
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
