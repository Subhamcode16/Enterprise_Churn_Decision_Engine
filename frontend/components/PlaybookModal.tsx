"use client";

import { useState } from "react";
import { Playbook } from "@/lib/types";
import { CheckCircle2, Clock, Send, ShieldCheck, UserCheck, AlertTriangle, X } from "lucide-react";
import { dispatchPlaybook } from "@/lib/api";

interface PlaybookModalProps {
  accountId: string;
  companyName: string;
  playbooks: Playbook[];
  onClose: () => void;
}

export default function PlaybookModal({
  accountId,
  companyName,
  playbooks,
  onClose,
}: PlaybookModalProps) {
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [dispatchedMap, setDispatchedMap] = useState<Record<string, boolean>>({});

  const handleDispatch = async (playbook: Playbook) => {
    try {
      setDispatchingId(playbook.playbook_id);
      await dispatchPlaybook({
        account_id: accountId,
        playbook_id: playbook.playbook_id,
        assignee: playbook.assignee_role,
      });
      setDispatchedMap((prev) => ({ ...prev, [playbook.playbook_id]: true }));
    } catch (err) {
      console.error("Dispatch error:", err);
    } finally {
      setDispatchingId(null);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "P0":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "P1":
        return "bg-orange-500/20 text-orange-400 border-orange-500/40";
      case "P2":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      default:
        return "bg-indigo-500/20 text-indigo-400 border-indigo-500/40";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0F1626] border border-slate-700 shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-bold text-white">
                Automated Retention Playbooks
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Account: <span className="font-semibold text-slate-200">{companyName}</span> ({accountId})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Playbook List */}
        <div className="mt-4 space-y-4 max-h-[460px] overflow-y-auto pr-1">
          {playbooks.map((pb) => {
            const isDispatched = dispatchedMap[pb.playbook_id];
            const isLoading = dispatchingId === pb.playbook_id;

            return (
              <div
                key={pb.playbook_id}
                className="p-4 rounded-xl bg-[#090D16]/80 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getPriorityBadge(
                          pb.priority
                        )}`}
                      >
                        {pb.priority}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {pb.playbook_id}
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400 font-medium">
                        {pb.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-100 mt-1.5">
                      {pb.title}
                    </h4>
                  </div>

                  {/* Dispatch CTA */}
                  {isDispatched ? (
                    <span className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Dispatched
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDispatch(pb)}
                      disabled={isLoading}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all duration-150"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isLoading ? "Queuing..." : "Dispatch"}
                    </button>
                  )}
                </div>

                <p className="mt-2.5 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
                  {pb.action_summary}
                </p>

                <div className="mt-3 flex items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Assignee: <strong className="text-slate-300">{pb.assignee_role}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>SLA: <strong className="text-slate-300">{pb.sla_hours} hrs</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
