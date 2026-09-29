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
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "P1":
        return "bg-amber-500/20 text-amber-300 border-amber-500/40";
      case "P2":
        return "bg-yellow-500/20 text-yellow-300 border-yellow-500/40";
      default:
        return "bg-stone-500/20 text-stone-300 border-stone-500/40";
    }
  };

  return (
    <div className="rounded-3xl border border-stone-800/80 bg-gradient-to-b from-[#181716] via-[#141312] to-[#0E0D0C] backdrop-blur-2xl p-5 shadow-card space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 border-b border-stone-800">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-200">
            Action Command HUD
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-stone-900 text-stone-400 border border-stone-800">
          {playbooks.length} Active
        </span>
      </div>

      {/* Target Account Summary */}
      <div className="p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800/80 text-xs">
        <div className="flex justify-between items-baseline">
          <span className="font-bold text-stone-100 text-sm truncate">{account.company_name}</span>
          <span className="text-stone-400 font-mono text-[11px]">{account.account_id}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
          <span>MRR Loss Exposure:</span>
          <span className="font-mono font-bold text-red-400">${account.mrr_at_risk.toLocaleString()}</span>
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
              className="p-3.5 rounded-2xl bg-[#1A1918]/80 border border-stone-800 hover:border-amber-500/40 transition-all text-xs space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded border ${getPriorityStyle(pb.priority)}`}>
                      {pb.priority}
                    </span>
                    <span className="font-mono text-[10px] text-stone-400">{pb.playbook_id}</span>
                  </div>
                  <h4 className="font-bold text-stone-100 text-xs mt-1 leading-snug">
                    {pb.title}
                  </h4>
                </div>

                {isDone ? (
                  <span className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Sent
                  </span>
                ) : (
                  <button
                    onClick={() => handleDispatch(pb)}
                    disabled={isLoading}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:opacity-50 text-stone-950 font-extrabold text-[11px] shadow-sm transition-all"
                  >
                    <Send className="w-3 h-3" />
                    {isLoading ? "Queuing..." : "Dispatch"}
                  </button>
                )}
              </div>

              <p className="text-[11px] text-stone-400 leading-relaxed bg-stone-950/60 p-2.5 rounded-xl border border-stone-800/60">
                {pb.action_summary}
              </p>

              <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-800/60">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-amber-400" />
                  {pb.assignee_role}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  SLA: {pb.sla_hours}h
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Dispatch Log Ribbon */}
      <div className="p-3 rounded-2xl bg-stone-950/80 border border-stone-800 text-[10px] space-y-1">
        <span className="font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" /> Dispatch Audit Stream
        </span>
        <div className="space-y-0.5 text-stone-400 font-mono">
          {auditLog.map((log, i) => (
            <p key={i} className="truncate">{log}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
