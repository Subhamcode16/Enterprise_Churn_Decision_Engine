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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#051F20]/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-[28px] bg-white border border-[#E2EAE4] shadow-2xl p-6 overflow-hidden font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2EAE4]">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#235347]" />
              <h3 className="text-lg font-serif font-bold text-[#051F20]">
                Automated Retention Playbooks
              </h3>
            </div>
            <p className="text-xs text-[#163832]/60 mt-0.5">
              Account: <span className="font-semibold text-[#051F20]">{companyName}</span> ({accountId})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#F4F8F5] text-[#163832]/70 hover:text-[#051F20] hover:bg-[#E2EAE4] transition-colors cursor-pointer"
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
                className="p-4 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] hover:border-[#8EB69B] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${getPriorityBadge(
                          pb.priority
                        )}`}
                      >
                        {pb.priority}
                      </span>
                      <span className="text-xs font-mono text-[#163832]/60">
                        {pb.playbook_id}
                      </span>
                      <span className="text-xs text-[#163832]/40">•</span>
                      <span className="text-xs text-[#163832]/70 font-medium">
                        {pb.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-[#051F20] mt-1.5">
                      {pb.title}
                    </h4>
                  </div>

                  {/* Dispatch CTA */}
                  {isDispatched ? (
                    <span className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#DAF1DE] text-[#0B2B26] border border-[#8EB69B]/40 text-xs font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Dispatched
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDispatch(pb)}
                      disabled={isLoading}
                      className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#235347] hover:bg-[#163832] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-all duration-150 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isLoading ? "Queuing..." : "Dispatch"}
                    </button>
                  )}
                </div>

                <p className="mt-2.5 text-xs text-[#163832]/80 leading-relaxed bg-white p-3 rounded-xl border border-[#E2EAE4]">
                  {pb.action_summary}
                </p>

                <div className="mt-3 flex items-center gap-4 text-xs text-[#163832]/60">
                  <div className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-[#235347]" />
                    <span>Assignee: <strong className="text-[#051F20]">{pb.assignee_role}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#235347]" />
                    <span>SLA: <strong className="text-[#051F20]">{pb.sla_hours} hrs</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-[#E2EAE4] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#F4F8F5] text-[#163832] hover:bg-[#E2EAE4] text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
