"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Zap, 
  Calendar, 
  Search, 
  Mic, 
  Link2, 
  Compass, 
  SlidersHorizontal,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldAlert
} from "lucide-react";
import { AccountRecord, Playbook } from "@/lib/types";
import { formatCurrency, resolvePrimaryPlaybook } from "@/lib/utils";
import { playBlip, playExecute, playTick } from "@/lib/sound";

interface Message {
  id: string;
  sender: "agent" | "user";
  text: string;
  timestamp: string;
  card?: {
    type: "shap_breakdown" | "playbook_recommendation" | "counterfactual_sim" | "executive_brief";
    title: string;
    metrics?: { label: string; value: string; color?: string }[];
    actions?: { label: string; actionId: string; variant?: "primary" | "secondary" }[];
  };
}

interface DecisionCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  account: AccountRecord | null;
  playbooks: Playbook[];
  onExecutePlaybook?: (playbookId: string) => void;
}

export default function DecisionCopilot({
  isOpen,
  onClose,
  account,
  playbooks,
  onExecutePlaybook,
}: DecisionCopilotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Reset or initialize context when account changes
  useEffect(() => {
    if (!account) return;

    const primaryPb = resolvePrimaryPlaybook(account) || "PB-SUPP-01";
    const pbObj = playbooks.find((p) => p.playbook_id === primaryPb) || account.playbook_details;

    const initialMsg: Message = {
      id: "init-" + account.account_id,
      sender: "agent",
      text: `Hello Director. I am your **Decision Copilot**, calibrated with XGBoost & TreeSHAP.\n\nCurrently inspecting **${account.company_name}** (${account.account_id}). Current churn risk is **${(account.churn_probability * 100).toFixed(1)}%** with **${formatCurrency(account.mrr_at_risk)}** MRR exposed.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      card: {
        type: "playbook_recommendation",
        title: `Recommended Protocol: ${primaryPb}`,
        metrics: [
          { label: "Contract MRR", value: formatCurrency(account.contract_mrr) },
          { label: "Expected Loss", value: formatCurrency(account.mrr_at_risk), color: "text-rose-600 font-bold" },
          { label: "Risk Tier", value: account.risk_tier, color: "text-amber-700 font-bold" },
          { label: "Renewal Window", value: `${account.days_until_renewal} Days` },
        ],
        actions: [
          { label: `⚡ Deploy ${primaryPb}`, actionId: `exec-${primaryPb}`, variant: "primary" },
          { label: "Explain SHAP Drivers", actionId: "explain-shap", variant: "secondary" },
        ],
      },
    };

    setMessages([initialMsg]);
  }, [account, playbooks]);

  const categoryPills = [
    { label: "Risk Drivers", icon: Search, color: "text-emerald-700 bg-emerald-50 border-emerald-200", query: "Explain the top root causes and SHAP feature drivers for this account." },
    { label: "Playbooks", icon: Zap, color: "text-purple-700 bg-purple-50 border-purple-200", query: "What is the optimal multi-step intervention playbook for this account?" },
    { label: "SLA Targets", icon: Clock, color: "text-amber-700 bg-amber-50 border-amber-200", query: "What are the SLA deadlines and escalation milestones for this account?" },
    { label: "Counterfactuals", icon: SlidersHorizontal, color: "text-blue-700 bg-blue-50 border-blue-200", query: "What happens to the churn probability if we resolve open P1 tickets immediately?" },
    { label: "Schedule", icon: Calendar, color: "text-stone-700 bg-stone-100 border-stone-200", query: "Summarize the Q3 renewal schedule and contract timelines." },
  ];

  const bottomSuggestedCards = [
    { title: "Why is Churn 95%?", query: "Why is this account at critical churn risk? Detail the top TreeSHAP features." },
    { title: "Simulate 30d Usage Recovery", query: "Simulate a 40% rebound in 30d usage telemetry." },
    { title: "Draft Executive Brief", query: "Draft an executive retention briefing for the VP of Customer Success." },
  ];

  const handleSend = (textToSend?: string) => {
    const userQuery = textToSend || input;
    if (!userQuery.trim() || !account) return;

    playTick();
    const newMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    setTimeout(() => {
      playBlip();
      setIsTyping(false);
      const response = generateAgentResponse(userQuery, account, playbooks);
      setMessages((prev) => [...prev, response]);
    }, 400);
  };

  const handleActionClick = (actionId: string) => {
    if (!account) return;

    if (actionId.startsWith("exec-")) {
      const pbId = actionId.replace("exec-", "");
      playExecute();
      if (onExecutePlaybook) {
        onExecutePlaybook(pbId);
      }
      const confirmMsg: Message = {
        id: `sys-${Date.now()}`,
        sender: "agent",
        text: `✅ **Action Dispatched:** Playbook **${pbId}** has been queued for immediate dispatch. Webhook signal transmitted to Customer Success & Engineering Orchestrator. SLA target: ${account.playbook_details?.sla_hours || 4} hours.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, confirmMsg]);
    } else if (actionId === "explain-shap") {
      handleSend("Explain the top root causes and SHAP feature drivers for this account.");
    }
  };

  function generateAgentResponse(query: string, acc: AccountRecord, pbs: Playbook[]): Message {
    const q = query.toLowerCase();
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const primaryPb = resolvePrimaryPlaybook(acc) || "PB-SUPP-01";
    const pbObj = pbs.find((p) => p.playbook_id === primaryPb) || acc.playbook_details;

    if (q.includes("why") || q.includes("shap") || q.includes("driver") || q.includes("cause")) {
      const posDrivers = acc.shap_attributions?.positive || [];
      const negDrivers = acc.shap_attributions?.negative || [];
      
      const posText = posDrivers.map((d) => `• **${d.feature}**: +${d.contribution.toFixed(3)} risk contribution (value: ${d.value})`).join("\n");
      const negText = negDrivers.map((d) => `• **${d.feature}**: ${d.contribution.toFixed(3)} protective retention pull`).join("\n");

      return {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: `TreeSHAP local attribution analysis for **${acc.company_name}**:\n\n**Primary Risk Drivers:**\n${posText || "• No acute risk drivers detected."}\n\n**Protective Anchors:**\n${negText || "• Low protective anchors."}\n\nThe model identifies **${posDrivers[0]?.feature || "support tickets"}** as the highest ROI leverage point.`,
        timestamp: timeStr,
        card: {
          type: "shap_breakdown",
          title: "SHAP Feature Contribution Matrix",
          metrics: [
            { label: "Base Expected Prob", value: "0.300" },
            { label: "Account Score", value: acc.churn_probability.toFixed(3), color: "text-rose-600 font-bold" },
            { label: "Top Driver", value: posDrivers[0]?.feature || "P1 Tickets", color: "text-amber-700 font-bold" },
          ],
          actions: [
            { label: `⚡ Deploy ${primaryPb}`, actionId: `exec-${primaryPb}`, variant: "primary" },
          ],
        },
      };
    }

    if (q.includes("simulate") || q.includes("ticket") || q.includes("rebound") || q.includes("usage") || q.includes("what if")) {
      const simulatedProb = Math.max(0.12, acc.churn_probability * 0.42);
      const simulatedExposure = acc.contract_mrr * simulatedProb;
      const mrrSaved = acc.mrr_at_risk - simulatedExposure;

      return {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: `🔬 **Counterfactual Simulation Engine:**\n\nIf we resolve all **${acc.open_p1_tickets} open P1 tickets** and restore usage telemetry:\n\n• Churn Probability decreases from **${(acc.churn_probability * 100).toFixed(1)}%** → **${(simulatedProb * 100).toFixed(1)}%**\n• Expected Monthly Loss drops by **${formatCurrency(mrrSaved)}/mo**\n• Account tier improves from **${acc.risk_tier}** → **MEDIUM RISK**.`,
        timestamp: timeStr,
        card: {
          type: "counterfactual_sim",
          title: "Simulated Counterfactual Impact",
          metrics: [
            { label: "Baseline Risk", value: `${(acc.churn_probability * 100).toFixed(1)}%`, color: "text-rose-600 font-bold" },
            { label: "Simulated Risk", value: `${(simulatedProb * 100).toFixed(1)}%`, color: "text-emerald-700 font-bold" },
            { label: "Monthly MRR Saved", value: formatCurrency(mrrSaved), color: "text-amber-700 font-bold" },
          ],
          actions: [
            { label: "⚡ Trigger Technical Escalation", actionId: `exec-PB-SUPP-01`, variant: "primary" },
          ],
        },
      };
    }

    if (q.includes("executive") || q.includes("brief") || q.includes("vp")) {
      return {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: `📄 **Executive Retention Briefing Generated:**\n\n**To:** VP Customer Success & Account Lead\n**Subject:** URGENT: Retention Intervention — ${acc.company_name} (${formatCurrency(acc.contract_mrr)} MRR)\n\n**Situation:** Account has elevated churn probability (${(acc.churn_probability * 100).toFixed(1)}%) ahead of renewal in ${acc.days_until_renewal} days. MRR at risk: ${formatCurrency(acc.mrr_at_risk)}.\n\n**Root Cause:** TreeSHAP shows acute dissatisfaction stemming from ${acc.open_p1_tickets} open P1 tickets and ${acc.usage_change_pct_30d}% 30d usage drop.\n\n**Recommendation:** Immediate execution of ${primaryPb}. Executive sponsor meeting recommended within 48h.`,
        timestamp: timeStr,
        card: {
          type: "executive_brief",
          title: "Executive Directives",
          metrics: [
            { label: "Assignee Role", value: pbObj?.assignee_role || "VP of CS" },
            { label: "Target SLA", value: `${pbObj?.sla_hours || 4} Hours` },
            { label: "Renewal Window", value: `${acc.days_until_renewal} Days` },
          ],
          actions: [
            { label: `⚡ Dispatch Webhook to ${pbObj?.assignee_role || "CS"}`, actionId: `exec-${primaryPb}`, variant: "primary" },
          ],
        },
      };
    }

    // Default Playbook Response
    return {
      id: `a-${Date.now()}`,
      sender: "agent",
      text: `Based on calibrated XGBoost features for **${acc.company_name}**, the recommended protocol is **${primaryPb}** (${pbObj?.title || "Targeted Retention Protocol"}).\n\n**Action Summary:**\n${pbObj?.action_summary || "Deploy immediate customer success outreach and technical support remediation."}\n\n**Assignee:** ${pbObj?.assignee_role || "Customer Success"} | **SLA:** ${pbObj?.sla_hours || 4} hours.`,
      timestamp: timeStr,
      card: {
        type: "playbook_recommendation",
        title: `Protocol Details: ${primaryPb}`,
        metrics: [
          { label: "Priority", value: pbObj?.priority || "P0", color: "text-rose-600 font-bold" },
          { label: "SLA Window", value: `${pbObj?.sla_hours || 4}h` },
          { label: "Category", value: pbObj?.category || "Account Health" },
        ],
        actions: [
          { label: `⚡ Execute ${primaryPb} Now`, actionId: `exec-${primaryPb}`, variant: "primary" },
        ],
      },
    };
  }

  return (
    <div className="h-full w-full bg-white border border-[#E8E5DD] rounded-3xl shadow-lg flex flex-col overflow-hidden font-sans">
      {/* 1. Header (Reference Style: You AI Assistance + Black Pro Pill + Sliders/Close) */}
      <div className="p-4 sm:p-5 border-b border-[#EFECE4] flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <span className="text-sm font-serif font-bold text-stone-900 tracking-tight">
            You AI Assistance
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141312] text-[#FAF8F5] text-[11px] font-semibold tracking-wide shadow-sm">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Pro Account</span>
          </div>

          <button
            onClick={() => {
              playTick();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors"
            title="Collapse Copilot"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Hero Greeting & Category Chips */}
      <div className="p-5 pb-3 bg-white text-center space-y-3 border-b border-[#F0ECE1]/60">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 tracking-tight">
            How can I Help you, Director?
          </h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            You can ask anything about churn risks, TreeSHAP attributions, counterfactuals, or playbooks.
          </p>
        </div>

        {/* Quick Category Chips / Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          {categoryPills.map((pill, idx) => {
            const IconComponent = pill.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSend(pill.query)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium transition-all duration-150 hover:scale-105 active:scale-95 shadow-2xs ${pill.color}`}
              >
                <IconComponent className="w-3 h-3" />
                <span>{pill.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Conversation Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#FAF8F5]/50 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl p-4 leading-relaxed ${
                msg.sender === "user"
                  ? "bg-[#141312] text-[#FAF8F5] font-medium rounded-tr-xs shadow-sm"
                  : "bg-white border border-[#E8E5DD] text-stone-800 rounded-tl-xs shadow-xs"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Dynamic Interactive Card Attachment */}
              {msg.card && (
                <div className="mt-3 pt-3 border-t border-[#F0ECE1] space-y-2.5">
                  <div className="text-[11px] font-mono font-bold text-stone-900 uppercase tracking-wider">
                    {msg.card.title}
                  </div>

                  {msg.card.metrics && (
                    <div className="grid grid-cols-2 gap-2">
                      {msg.card.metrics.map((m, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EFECE4]">
                          <div className="text-[10px] text-stone-500">{m.label}</div>
                          <div className={`font-mono text-xs ${m.color || "text-stone-900 font-bold"}`}>
                            {m.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.card.actions && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {msg.card.actions.map((act) => (
                        <button
                          key={act.actionId}
                          onClick={() => handleActionClick(act.actionId)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 active:scale-95 ${
                            act.variant === "primary"
                              ? "bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold shadow-xs"
                              : "bg-[#141312] hover:bg-stone-800 text-white"
                          }`}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <span className="text-[10px] font-mono text-stone-400 mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-[#E8E5DD] text-stone-500 max-w-[220px] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
            <span className="text-[11px] font-mono">Synthesizing TreeSHAP...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Horizontal Suggested Action Prompt Cards */}
      <div className="px-4 py-2.5 bg-white border-t border-[#F0ECE1]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {bottomSuggestedCards.map((sc, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sc.query)}
              className="px-3 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#E8E5DD] text-stone-700 hover:text-stone-950 text-[11px] font-medium whitespace-nowrap transition-all duration-150 hover:shadow-2xs active:scale-95 flex-shrink-0"
            >
              {sc.title}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Bottom Rounded Input Bar */}
      <div className="p-4 bg-white border-t border-[#EFECE4]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-1.5 pl-3 rounded-2xl bg-[#FAF8F5] border border-[#E2DFD6] focus-within:border-stone-800 focus-within:bg-white transition-all flex items-center justify-between gap-2 shadow-2xs"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How can I help you today?"
            className="flex-1 bg-transparent text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none font-sans"
          />

          <div className="flex items-center gap-1.5">
            {/* Mic Action Icon */}
            <button
              type="button"
              onClick={() => {
                playTick();
                setIsListening(!isListening);
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                isListening ? "bg-rose-100 text-rose-600 animate-pulse" : "text-stone-400 hover:text-stone-700 hover:bg-stone-200/60"
              }`}
              title="Voice Assistant"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Link / Context Action Icon */}
            <button
              type="button"
              onClick={() => {
                playTick();
                handleSend("Provide a comprehensive diagnostic overview of all 5 dimensions for this account.");
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
              title="Attach Account Context"
            >
              <Link2 className="w-4 h-4" />
            </button>

            {/* Model / Settings Icon */}
            <button
              type="button"
              onClick={() => {
                playTick();
                handleSend("Explain the calibrated XGBoost model architecture and hyperparameter settings.");
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
              title="Model Telemetry"
            >
              <Compass className="w-4 h-4" />
            </button>

            {/* Black Pill Send Button */}
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-1.5 rounded-xl bg-[#141312] hover:bg-stone-800 disabled:opacity-40 text-white text-xs font-semibold tracking-wide transition-all duration-150 active:scale-95 shadow-sm"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
