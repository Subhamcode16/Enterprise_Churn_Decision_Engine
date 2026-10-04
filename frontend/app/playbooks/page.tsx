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
import { getPlaybooks, getDispatchedPlaybooks, dispatchPlaybook, updateDispatchedPlaybookStatus } from "@/lib/api";
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
  const [dispatchedList, setDispatchedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<"idle" | "dispatching" | "dispatched">("idle");
  const [copiedPayload, setCopiedPayload] = useState(false);

  useEffect(() => {
    Promise.all([
      getPlaybooks(),
      getDispatchedPlaybooks().catch(() => [])
    ])
      .then(([pbRes, dispRes]) => {
        setPlaybooks(pbRes.playbooks);
        setDispatchedList(dispRes || []);
        if (pbRes.playbooks.length > 0) {
          setSelectedPlaybook(pbRes.playbooks[0]);
        }
      })
      .catch((err) => console.error("Failed to load playbooks:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (recordId: number, status: "completed" | "escalated") => {
    try {
      playBlip();
      await updateDispatchedPlaybookStatus(recordId, status);
      setDispatchedList((prev) =>
        prev.map((item) => (item.id === recordId ? { ...item, status } : item))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

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
        return "bg-rose-50 text-rose-800 border-rose-200";
      case "P1":
        return "bg-[#FAF0E6] text-[#8C3A27] border-[#E8C4B8]";
      case "P2":
        return "bg-[#DAF1DE] text-[#0B2B26] border-[#8EB69B]/40";
      default:
        return "bg-[#DAF1DE] text-[#051F20] border-[#8EB69B]/60";
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
      webhook_endpoint: "https://api.valence.internal/v1/orchestrator/webhook"
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
      <div className="pb-4 border-b border-[#E2EAE4]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#235347]"></span>
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-[#163832]/60">
                Decision Intelligence Protocol
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#051F20] tracking-tight">
              Retention Playbook Master Catalog
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#163832]/70 max-w-2xl leading-relaxed">
              Deterministic, SLA-bound intervention workflows mapped automatically to root-cause SHAP drivers and expected MRR loss.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-full bg-white border border-[#E2EAE4] text-[#051F20] text-xs font-mono font-semibold shadow-xs">
              <span className="text-[#235347] font-bold">{playbooks.length}</span> Active Workflows
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
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  activeFilter === f.id
                    ? "bg-[#235347] text-white shadow-xs font-bold"
                    : "bg-white text-[#163832]/70 hover:text-[#051F20] border border-[#E2EAE4]"
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
              className="w-full bg-white border border-[#E2EAE4] focus:border-[#235347] rounded-full pl-8 pr-3 py-1.5 text-xs text-[#051F20] placeholder:text-stone-400 focus:outline-none transition-colors shadow-2xs"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-[#163832]/50">
          <Zap className="w-6 h-6 mx-auto text-[#235347] animate-spin mb-3" />
          <p className="text-xs font-mono">Loading playbook orchestrator catalog...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
          {/* Playbook Cards Grid (Left 7 Columns - White Bento Cards) */}
          <div className="lg:col-span-7 space-y-3.5">
            <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#163832]/60 px-1 font-bold">
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
                    className={`cursor-pointer p-5 rounded-[28px] border transition-all duration-200 text-left relative overflow-hidden ${
                      isSelected
                        ? "bg-[#DAF1DE]/30 border-[#235347] shadow-sm ring-1 ring-[#235347]/20"
                        : "bg-white border-[#E2EAE4] hover:border-[#8EB69B]/60 hover:shadow-xs"
                    }`}
                  >
                    {/* Active Accent Bar */}
                    {isSelected && (
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#235347]" />
                    )}

                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${getPriorityBadge(pb.priority)}`}>
                          {pb.priority}
                        </span>
                        <span className="text-xs font-mono font-bold text-[#051F20]">
                          {pb.playbook_id}
                        </span>
                      </div>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#F4F8F5] border border-[#E2EAE4] text-[#163832]/70 font-medium">
                        {pb.category}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-[#051F20] mb-1.5">
                      {pb.title}
                    </h3>

                    <p className="text-xs text-[#163832]/80 leading-relaxed bg-[#F4F8F5] p-3 rounded-2xl border border-[#E2EAE4] mb-3 font-sans">
                      {pb.action_summary}
                    </p>

                    <div className="flex items-center justify-between text-xs text-[#163832]/70 pt-2 border-t border-[#E2EAE4]">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#235347]" />
                        <span>Owner: <strong className="text-[#051F20] font-semibold">{pb.assignee_role}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono">
                        <Clock className="w-3.5 h-3.5 text-[#235347]" />
                        <span>SLA: <strong className="text-[#235347] font-bold">{pb.sla_hours}h</strong></span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredPlaybooks.length === 0 && (
                <div className="p-12 text-center rounded-[28px] bg-white border border-[#E2EAE4] text-[#163832]/60">
                  <BookOpen className="w-8 h-8 mx-auto text-[#235347] mb-2" />
                  <p className="text-xs font-medium">No playbooks found matching filter or query.</p>
                </div>
              )}
            </div>
          </div>

          {/* Webhook & Orchestrator Inspector (Right 5 Columns) */}
          <div className="lg:col-span-5">
            <div className="sticky top-20 space-y-4">
              <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#163832]/60 px-1 font-bold">
                <span>Webhook Dispatch Inspector</span>
                <span className="text-[#235347] font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#235347] animate-pulse"></span>
                  Ready
                </span>
              </div>

              {selectedPlaybook ? (
                <div className="p-6 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-5">
                  {/* Header info */}
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-[#235347]">
                        Active Target
                      </span>
                      <span className="text-xs font-mono text-[#163832]/60 font-bold">
                        {selectedPlaybook.playbook_id}
                      </span>
                    </div>
                    <h2 className="text-base font-serif font-bold text-[#051F20] mt-1">
                      {selectedPlaybook.title}
                    </h2>
                  </div>

                  {/* Dispatch Route Info */}
                  <div className="p-3.5 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] space-y-2 text-xs">
                    <div className="flex justify-between items-center text-[#163832]/70">
                      <span>Method & Route</span>
                      <span className="font-mono text-[#235347] font-bold">POST /v1/orchestrator/dispatch</span>
                    </div>
                    <div className="flex justify-between items-center text-[#163832]/70">
                      <span>Assigned Department</span>
                      <span className="text-[#051F20] font-semibold">{selectedPlaybook.assignee_role}</span>
                    </div>
                    <div className="flex justify-between items-center text-[#163832]/70">
                      <span>Resolution Target</span>
                      <span className="font-mono text-[#235347] font-bold">{selectedPlaybook.sla_hours} Hours Maximum</span>
                    </div>
                  </div>

                  {/* Live JSON Payload Inspector */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 text-xs text-[#051F20] font-semibold">
                        <Terminal className="w-3.5 h-3.5 text-[#235347]" />
                        <span>Simulated Webhook Payload</span>
                      </div>
                      <button
                        onClick={handleCopyPayload}
                        className="flex items-center gap-1 text-[11px] text-[#163832]/60 hover:text-[#051F20] transition-colors font-medium cursor-pointer"
                      >
                        {copiedPayload ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-[#235347]" />
                            <span className="text-[#235347] font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy JSON</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre className="p-4 rounded-2xl bg-[#0B2B26] text-[#DAF1DE] text-[11px] font-mono overflow-x-auto max-h-[260px] leading-relaxed shadow-inner border border-[#163832]">
                      {currentPayloadJson}
                    </pre>
                  </div>

                  {/* Dispatch Trigger CTA */}
                  <div className="pt-2">
                    <button
                      onClick={handleSimulateDispatch}
                      disabled={dispatchStatus === "dispatching"}
                      className={`w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer ${
                        dispatchStatus === "dispatched"
                          ? "bg-[#DAF1DE] text-[#051F20] border border-[#8EB69B]/60 font-bold"
                          : "bg-[#235347] hover:bg-[#163832] text-white active:scale-[0.99] border border-[#8EB69B]/40"
                      }`}
                    >
                      {dispatchStatus === "dispatching" ? (
                        <>
                          <Zap className="w-4 h-4 animate-spin text-white" />
                          <span>Dispatching Webhook Signal...</span>
                        </>
                      ) : dispatchStatus === "dispatched" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#051F20]" />
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
                <div className="p-8 text-center rounded-[28px] bg-white border border-[#E2EAE4] text-[#163832]/50 text-xs">
                  Select a playbook from the list to view its schema payload.
                </div>
              )}
            </div>
          </div>

          {/* Active Dispatched Workflows & SLA Timers Section */}
          <div className="mt-12 p-6 rounded-[28px] bg-white border border-[#E2EAE4] shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-xl bg-[#DAF1DE] border border-[#8EB69B]/40 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-[#0B2B26]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#051F20] tracking-tight">Active Dispatched Retention Workflows</h3>
                  <p className="text-[11px] text-[#163832]/60">Live operational audit trail and SLA resolution tracker</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold font-mono bg-[#DAF1DE] text-[#0B2B26] border border-[#8EB69B]/40">
                  {dispatchedList.filter(d => d.status === "active").length} Active Workflows
                </span>
              </div>
            </div>

            {dispatchedList.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#F4F8F5] border border-dashed border-[#E2EAE4] text-[#163832]/50 text-xs">
                No dispatched retention playbooks recorded yet. Trigger one from the catalog above or from the main dashboard copilot.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E2EAE4] text-[11px] text-[#163832]/60 font-medium">
                      <th className="pb-3 pl-2">Account ID</th>
                      <th className="pb-3">Company Name</th>
                      <th className="pb-3">Playbook</th>
                      <th className="pb-3">Priority</th>
                      <th className="pb-3">Assignee Role</th>
                      <th className="pb-3">SLA Target</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 pr-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2EAE4]/60">
                    {dispatchedList.map((item) => (
                      <tr key={item.id} className="hover:bg-[#F4F8F5] transition-colors">
                        <td className="py-3 pl-2 font-mono font-bold text-[#051F20]">{item.account_id}</td>
                        <td className="py-3 font-medium text-[#051F20]">{item.company_name}</td>
                        <td className="py-3 font-mono text-[#163832]/70">{item.playbook_id}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                            item.priority === "P0" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-[#FAF0E6] text-[#8C3A27] border-[#E8C4B8]"
                          }`}>
                            {item.priority}
                          </span>
                        </td>
                        <td className="py-3 text-[#163832]/70">{item.assignee_role}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-1 text-[11px] font-mono font-semibold text-[#8C3A27]">
                            <Clock className="w-3 h-3" />
                            <span>{item.sla_hours}h Max</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            item.status === "completed"
                              ? "bg-[#DAF1DE] text-[#051F20] border border-[#8EB69B]/40"
                              : item.status === "escalated"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-[#DAF1DE]/80 text-[#0B2B26] border border-[#8EB69B]/40 animate-pulse"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-right">
                          {item.status === "active" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleStatusChange(item.id, "completed")}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#235347] hover:bg-[#163832] text-white transition-all shadow-xs cursor-pointer"
                              >
                                Resolve
                              </button>
                              <button
                                onClick={() => handleStatusChange(item.id, "escalated")}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#F4F8F5] hover:bg-rose-50 text-[#051F20] hover:text-rose-700 transition-all border border-[#E2EAE4] cursor-pointer"
                              >
                                Escalate
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[#163832]/50 font-mono">Archived</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
