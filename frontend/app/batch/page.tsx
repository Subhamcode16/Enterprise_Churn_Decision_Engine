"use client";

import { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Download, Layers, ArrowRight } from "lucide-react";
import { uploadBatchCsv } from "@/lib/api";
import { BatchResponse, BatchItem } from "@/lib/types";
import { formatCurrency, getRiskBadgeClasses } from "@/lib/utils";

export default function BatchPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const data = await uploadBatchCsv(file);
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Failed to process batch CSV file.");
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleTemplate = () => {
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

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Batch CSV Decision Processor
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Upload bulk customer records for vectorized churn probability scoring, financial loss quantification, and playbook mapping.
          </p>
        </div>

        <button
          onClick={downloadSampleTemplate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold shadow-sm transition-all"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          Download CSV Template
        </button>
      </div>

      {/* Upload Box */}
      <div className="rounded-2xl border-2 border-dashed border-slate-800 hover:border-indigo-500/50 bg-[#0F1626]/60 backdrop-blur-xl p-8 text-center transition-all">
        <UploadCloud className="w-12 h-12 mx-auto text-indigo-400 mb-3" />
        <h3 className="text-base font-bold text-white">
          {file ? file.name : "Select or drag & drop customer CSV dataset"}
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Supports up to 10,000 accounts per batch. Columns should match telemetry schema definitions.
        </p>

        <div className="mt-5 flex items-center justify-center gap-3">
          <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors">
            Choose CSV File
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
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-glow transition-all"
            >
              {loading ? "Processing Batch..." : "Run Vectorized Scoring"}
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 max-w-md mx-auto rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Batch Results Output */}
      {results && (
        <div className="space-y-6">
          {/* Summary Scoreboard */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0F1626] border border-slate-800">
              <span className="text-xs uppercase text-slate-400 font-semibold">Total Evaluated</span>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {results.total_processed} Accounts
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#0F1626] border border-slate-800">
              <span className="text-xs uppercase text-slate-400 font-semibold">Total MRR at Risk</span>
              <div className="text-2xl font-bold font-mono text-red-400 mt-1">
                {formatCurrency(results.total_mrr_at_risk)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#0F1626] border border-slate-800">
              <span className="text-xs uppercase text-slate-400 font-semibold">Critical Risk Count</span>
              <div className="text-2xl font-bold font-mono text-red-400 mt-1">
                {results.critical_risk_count}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#0F1626] border border-slate-800">
              <span className="text-xs uppercase text-slate-400 font-semibold">High Risk Count</span>
              <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
                {results.high_risk_count}
              </div>
            </div>
          </div>

          {/* Scored Accounts Table */}
          <div className="rounded-2xl border border-slate-800 bg-[#0F1626] shadow-card overflow-hidden">
            <div className="p-4 border-b border-slate-800 font-bold text-sm text-white">
              Enriched Decision Output
            </div>
            <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 bg-slate-900 text-slate-400 uppercase font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Account</th>
                    <th className="py-3 px-4">Contract MRR</th>
                    <th className="py-3 px-4">P(Churn)</th>
                    <th className="py-3 px-4">Risk Tier</th>
                    <th className="py-3 px-4">MRR Exposure</th>
                    <th className="py-3 px-4">Primary Playbook</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {results.accounts.map((item) => (
                    <tr key={item.account_id} className="hover:bg-slate-800/30">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200">{item.company_name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{item.account_id}</div>
                      </td>
                      <td className="py-3 px-4 font-mono">{formatCurrency(item.contract_mrr)}</td>
                      <td className="py-3 px-4 font-mono font-bold text-red-400">
                        {(item.churn_probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-semibold ${getRiskBadgeClasses(item.risk_tier)}`}>
                          {item.risk_tier}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-red-400">
                        {formatCurrency(item.mrr_at_risk)}
                      </td>
                      <td className="py-3 px-4 font-mono text-indigo-300">
                        {item.primary_playbook}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
