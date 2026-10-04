"use client";

import { useState } from "react";
import { AccountRecord, Playbook } from "@/lib/types";
import { dispatchPlaybook } from "@/lib/api";
import { sound } from "@/lib/sound";
import { ShieldAlert, Send, CheckCircle2, Clock, UserCheck, Zap, Layers } from "lucide-react";

interface PlaybookActionHudProps {
  account: AccountRecord;
  playbooks: Playbook[];
}

export default function PlaybookActionHud({ account, playbooks }: PlaybookActionHudProps) {
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [dispatchedMap, setDispatchedMap] = useState<Record<string, boolean>>({});
  const [auditLog, setAuditLog] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] Surveillance initialized for ${account.company_name}`,
  ]);

  const handleDispatch = async (pb: Playbook) => {
    sound.playDispatch();
    setDispatchingId(pb.playbook_id);
    try {
      const res = await dispatchPlaybook({
        account_id: account.account_id,
        playbook_id: pb.playbook_id,
        assignee: pb.assignee_role,
      });
      setDispatchedMap((prev) => ({ ...prev, [pb.playbook_id]: true }));
      setAuditLog((prev) => [
        `[${new Date().toLocaleTimeString()}] ${pb.playbook_id} routed to ${pb.assignee_role}`,
        ...prev.slice(0, 5),
      ]);
    } catch (err) {
      console.error("Playbook dispatch error:", err);
    } finally {
      setDispatchingId(null);
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "P0":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "P1":
        return "bg-[#FAF0E6] text-[#8C3A27] border-[#8C3A27]/30";
      case "P2":
        return "bg-[#E2EAE4] text-[#163832] border-[#8EB69B]/30";
      default:
        return "bg-[#DAF1DE] text-[#0B2B26] border-[#8EB69B]/40";
    }
  };

  return (
    <div className="rounded-[28px] border border-[#E2EAE4] bg-white p-5 shadow-[0_4px_24px_-2px_rgba(5,31,32,0.03)] space-y-5 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-[#E2EAE4]">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[#235347]" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#051F20]">
            Action Command HUD
          </h3>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#DAF1DE] text-[#0B2B26] border border-[#8EB69B]/40">
          {playbooks.length} Active
        </span>
      </div>

      {/* Target Account Summary */}
      <div className="p-3.5 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] text-xs">
        <div className="flex justify-between items-baseline">
          <span className="font-bold text-[#051F20] text-sm truncate">{account.company_name}</span>
          <span className="text-[#163832]/60 font-mono text-[11px]">{account.account_id}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-[#163832]/80">
          <span>MRR Loss Exposure:</span>
          <span className="font-mono font-bold text-rose-700">${account.mrr_at_risk.toLocaleString()}</span>
        </div>
      </div>

      {/* Playbooks List */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {playbooks.map((pb) => {
          const isDone = dispatchedMap[pb.playbook_id];
          const isLoading = dispatchingId === pb.playbook_id;

          return (
            <div
              key={pb.playbook_id}
              className="p-3.5 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] hover:border-[#8EB69B] transition-all text-xs space-y-2.5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${
                      pb.priority === "P0"
                        ? "bg-rose-100 text-rose-800 border-rose-200"
                        : pb.priority === "P1"
                        ? "bg-[#FAF0E6] text-[#8C3A27] border-[#8C3A27]/30"
                        : "bg-[#DAF1DE] text-[#0B2B26] border-[#8EB69B]/40"
                    }`}>
                      {pb.priority}
                    </span>
                    <span className="font-mono text-[10px] text-[#163832]/60">{pb.playbook_id}</span>
                  </div>
                  <h4 className="font-bold text-[#051F20] text-xs mt-1 leading-snug">
                    {pb.title}
                  </h4>
                </div>

                {isDone ? (
                  <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DAF1DE] text-[#0B2B26] border border-[#8EB69B]/40 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Sent
                  </span>
                ) : (
                  <button
                    onClick={() => handleDispatch(pb)}
                    disabled={isLoading}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#235347] hover:bg-[#163832] disabled:opacity-50 text-white font-bold text-[11px] shadow-xs transition-all cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    {isLoading ? "Queuing..." : "Dispatch"}
                  </button>
                )}
              </div>

              <p className="text-[11px] text-[#163832]/80 leading-relaxed bg-white p-2.5 rounded-xl border border-[#E2EAE4]">
                {pb.action_summary}
              </p>

              <div className="flex items-center justify-between text-[10px] text-[#163832]/60 pt-1 border-t border-[#E2EAE4]">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-[#235347]" />
                  {pb.assignee_role}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#235347]" />
                  SLA: {pb.sla_hours}h
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Dispatch Log Ribbon */}
      <div className="p-3 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] text-[10px] space-y-1">
        <span className="font-bold uppercase tracking-wider text-[#163832]/60 flex items-center gap-1">
          <Zap className="w-3 h-3 text-[#235347]" /> Dispatch Audit Stream
        </span>
        <div className="space-y-0.5 text-[#051F20] font-mono">
          {auditLog.map((log, i) => (
            <p key={i} className="truncate">{log}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
