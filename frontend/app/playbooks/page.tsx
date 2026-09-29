"use client";

import { useEffect, useState } from "react";
import { 
  BookOpen, 
  ShieldCheck, 
  Clock, 
  UserCheck, 
  AlertTriangle, 
  Layers, 
  Zap, 
  Search, 
  Send, 
  CheckCircle2, 
  Terminal, 
  Copy, 
  ExternalLink,
  Filter,
  Flame,
  ArrowUpRight
} from "lucide-react";
import { getPlaybooks } from "@/lib/api";
import { Playbook } from "@/lib/types";
import { playBlip, playExecute, playTick } from "@/lib/sound";

const DEPARTMENT_FILTERS = [
  { id: "ALL", label: "All Departments" },
  { id: "CS", label: "Customer Success", category: "Account Health & Usage" },
  { id: "ENG", label: "Engineering & SRE", category: "Technical & Reliability" },
  { id: "FIN", label: "Billing & FinOps", category: "Commercial & Billing" },
  { id: "EXEC", label: "Executive Leadership", category: "Commercial" },
  { id: "GROWTH", label: "Product & Adoption", category: "Feature Adoption" },
];

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<"idle" | "dispatching" | "dispatched">("idle");
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    getPlaybooks()
      .then((res) => {
        setPlaybooks(res.playbooks);
        if (res.playbooks.length > 0) {
          setSelectedPlaybook(res.playbooks[0]);
        }
      })
      .catch((err) => console.error("Failed to load playbooks:", err))
      .finally(() => setLoading(false));
  }, []);

  const filteredPlaybooks = playbooks.filter((pb) => {
    const matchesSearch = 
      pb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pb.playbook_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pb.assignee_role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pb.action_summary.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeFilter === "ALL") return true;
    if (activeFilter === "CS") return pb.category.includes("Account Health") || pb.assignee_role.includes("Customer");
    if (activeFilter === "ENG") return pb.category.includes("Technical") || pb.assignee_role.includes("Engineering");
    if (activeFilter === "FIN") return pb.category.includes("Billing") || pb.assignee_role.includes("Billing") || pb.assignee_role.includes("Finance");
    if (activeFilter === "EXEC") return pb.assignee_role.includes("Executive") || pb.assignee_role.includes("VP");
    if (activeFilter === "GROWTH") return pb.category.includes("Adoption") || pb.assignee_role.includes("Product");
    return true;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "P0":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "P1":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "P2":
        return "bg-stone-100 text-stone-700 border-stone-200";
      default:
        return "bg-stone-100 text-stone-700 border-stone-200";
    }
  };

  const handleSelectPlaybook = (pb: Playbook) => {
    playTick();
    setSelectedPlaybook(pb);
    setDispatchStatus("idle");
  };

  const handleSimulateDispatch = () => {
    if (!selectedPlaybook) return;
    playBlip();
    setDispatchStatus("dispatching");
    setTimeout(() => {
      playExecute();
      setDispatchStatus("dispatched");
    }, 800);
  };

  const currentPayloadJson = selectedPlaybook ? JSON.stringify({
    event_id: `evt_test_${Date.now().toString(36)}`,
    event_type: "REVENUE_RETENTION_INTERVENTION",
    timestamp: new Date().toISOString(),
    playbook: {
      id: selectedPlaybook.playbook_id,
      priority: selectedPlaybook.priority,
      target_sla_hours: selectedPlaybook.sla_hours,
      assignee: selectedPlaybook.assignee_role,
    },
    target_account: {
      account_id: "ACC-904",
      company_name: "Stratis Financial",
      contract_mrr: 8900,
      churn_probability: 0.814,
      mrr_at_risk: 7244.6,
    },
    execution_context: {
      trigger: selectedPlaybook.title,
      protocol: selectedPlaybook.action_summary,
      webhook_endpoint: "https://api.churniq.internal/v1/orchestrator/webhook"
    }
  }, null, 2) : "";

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(currentPayloadJson);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="w-full space-y-7 pb-16 font-sans">
      {/* Editorial Page Header */}
      <div className="pb-4 border-b border-[#E8E5DD]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-stone-500">
                Decision Intelligence Protocol
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
              Retention Playbook Master Catalog
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-stone-600 max-w-2xl leading-relaxed">
              Deterministic, SLA-bound intervention workflows mapped automatically to root-cause SHAP drivers and expected MRR loss.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E5DD] text-stone-800 text-xs font-mono font-semibold shadow-sm">
              <span className="text-amber-600 font-bold">{playbooks.length}</span> Active Workflows
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Department Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {DEPARTMENT_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  playTick();
                  setActiveFilter(f.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  activeFilter === f.id
                    ? "bg-[#141312] text-[#FAF8F5] shadow-sm font-bold"
                    : "bg-white text-stone-600 hover:text-stone-900 border border-[#E8E5DD]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search playbooks or roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#E8E5DD] focus:border-stone-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-stone-400">
          <Zap className="w-6 h-6 mx-auto text-amber-500 animate-spin mb-3" />
          <p className="text-xs font-mono">Loading playbook orchestrator catalog...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          {/* Playbook Cards Grid (Left 7 Columns - White Bento Cards) */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-stone-500 px-1 font-bold">
              <span>Catalog Entries ({filteredPlaybooks.length})</span>
              <span>Click to inspect payload</span>
            </div>

            <div className="space-y-3">
              {filteredPlaybooks.map((pb) => {
                const isSelected = selectedPlaybook?.playbook_id === pb.playbook_id;
                return (
                  <div
                    key={pb.playbook_id}
                    onClick={() => handleSelectPlaybook(pb)}
                    className={`cursor-pointer p-5 rounded-2xl border transition-all duration-200 text-left relative overflow-hidden ${
                      isSelected
                        ? "bg-[#FFFDF7] border-amber-400 shadow-md ring-2 ring-amber-400/30"
                        : "bg-white border-[#E8E5DD] hover:border-stone-400 hover:shadow-sm"
                    }`}
                  >
                    {/* Active Accent Bar */}
                    {isSelected && (
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500" />
                    )}

                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border ${getPriorityBadge(pb.priority)}`}>
                          {pb.priority}
                        </span>
                        <span className="text-xs font-mono font-bold text-stone-900">
                          {pb.playbook_id}
                        </span>
                      </div>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E8E5DD] text-stone-600 font-medium">
                        {pb.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-stone-900 mb-1.5">
                      {pb.title}
                    </h3>

                    <p className="text-xs text-stone-600 leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-[#EFECE4] mb-3 font-sans">
                      {pb.action_summary}
                    </p>

                    <div className="flex items-center justify-between text-xs text-stone-600 pt-2 border-t border-[#F0ECE1]">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-stone-500" />
                        <span>Owner: <strong className="text-stone-900 font-semibold">{pb.assignee_role}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>SLA: <strong className="text-amber-700 font-bold">{pb.sla_hours}h</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredPlaybooks.length === 0 && (
                <div className="p-12 text-center rounded-2xl bg-white border border-[#E8E5DD] text-stone-500">
                  <BookOpen className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                  <p className="text-xs font-medium">No playbooks found matching filter or query.</p>
                </div>
              )}
            </div>
          </div>

          {/* Webhook & Orchestrator Inspector (Right 5 Columns) */}
          <div className="lg:col-span-5">
            <div className="sticky top-20 space-y-4">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-stone-500 px-1 font-bold">
                <span>Webhook Dispatch Inspector</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Ready
                </span>
              </div>

              {selectedPlaybook ? (
                <div className="p-6 rounded-2xl bg-white border border-[#E8E5DD] shadow-sm space-y-5">
                  {/* Header info */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-amber-600">
                        Active Target
                      </span>
                      <span className="text-xs font-mono text-stone-500 font-bold">
                        {selectedPlaybook.playbook_id}
                      </span>
                    </div>
                    <h2 className="text-base font-serif font-bold text-stone-900 mt-1">
                      {selectedPlaybook.title}
                    </h2>
                  </div>

                  {/* Dispatch Route Info */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EFECE4] space-y-2 text-xs">
                    <div className="flex justify-between items-center text-stone-600">
                      <span>Method & Route</span>
                      <span className="font-mono text-emerald-700 font-bold">POST /v1/orchestrator/dispatch</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-600">
                      <span>Assigned Department</span>
                      <span className="text-stone-900 font-semibold">{selectedPlaybook.assignee_role}</span>
                    </div>
                    <div className="flex justify-between items-center text-stone-600">
                      <span>Resolution Target</span>
                      <span className="font-mono text-amber-700 font-bold">{selectedPlaybook.sla_hours} Hours Maximum</span>
                    </div>
                  </div>

                  {/* Live JSON Payload Inspector */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs text-stone-700 font-semibold">
                        <Terminal className="w-3.5 h-3.5 text-stone-900" />
                        <span>Simulated Webhook Payload</span>
                      </div>
                      <button
                        onClick={handleCopyPayload}
                        className="flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-900 transition-colors font-medium"
                      >
                        {copiedPayload ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-4 rounded-xl bg-[#141312] text-[#FAF8F5] text-[11px] font-mono overflow-x-auto max-h-[260px] leading-relaxed shadow-inner">
                      {currentPayloadJson}
                    </pre>
                  </div>

                  {/* Dispatch Trigger CTA */}
                  <div className="pt-2">
                    <button
                      onClick={handleSimulateDispatch}
                      disabled={dispatchStatus === "dispatching"}
                      className={`w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${
                        dispatchStatus === "dispatched"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-amber-500 hover:bg-amber-400 text-stone-950 active:scale-[0.99]"
                      }`}
                    >
                      {dispatchStatus === "dispatching" ? (
                        <>
                          <Zap className="w-4 h-4 animate-spin text-stone-950" />
                          <span>Dispatching Webhook Signal...</span>
                        </>
                      ) : dispatchStatus === "dispatched" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>Intervention Dispatched to {selectedPlaybook.assignee_role}</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Simulate Playbook Webhook Dispatch</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center rounded-2xl bg-white border border-[#E8E5DD] text-stone-400 text-xs">
                  Select a playbook from the list to view its schema payload.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
