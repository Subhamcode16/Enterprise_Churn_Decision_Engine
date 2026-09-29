"use client";

import { useEffect, useState } from "react";
import { BookOpen, ShieldCheck, Clock, UserCheck, AlertTriangle, Layers, Zap } from "lucide-react";
import { getPlaybooks } from "@/lib/api";
import { Playbook } from "@/lib/types";

export default function PlaybooksPage() {
  const [playbooks, setPlaybooks] = useState<Playbook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlaybooks()
      .then((res) => setPlaybooks(res.playbooks))
      .catch((err) => console.error("Failed to load playbooks:", err))
      .finally(() => setLoading(false));
  }, []);

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
    <div className="space-y-8">
      {/* Hero */}
      <div className="pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-400" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Retention Playbook Master Catalog
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-400">
          Deterministic business rules and automated interventions mapped to customer health signals and root-cause SHAP drivers.
        </p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <Zap className="w-6 h-6 mx-auto text-indigo-400 animate-spin mb-2" />
          Loading playbook catalog...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {playbooks.map((pb) => (
            <div
              key={pb.playbook_id}
              className="p-6 rounded-2xl border border-slate-800 bg-[#0F1626]/80 backdrop-blur-xl shadow-card hover:border-indigo-500/40 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md border ${getPriorityBadge(pb.priority)}`}>
                    {pb.priority}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {pb.playbook_id}
                  </span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-medium">
                  {pb.category}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mt-3">
                {pb.title}
              </h3>

              <p className="mt-2 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                {pb.action_summary}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  <span>Assignee: <strong className="text-slate-200">{pb.assignee_role}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>SLA: <strong className="text-slate-200">{pb.sla_hours} hours</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
