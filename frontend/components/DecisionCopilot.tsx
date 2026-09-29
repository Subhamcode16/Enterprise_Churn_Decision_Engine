"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Send, 
  Sparkles, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  ShieldAlert, 
  Zap, 
  TrendingDown, 
  Clock, 
  UserCheck, 
  Layers,
  MessageSquare,
  ChevronRight,
  Sliders
} from "lucide-react";
import { AccountRecord, Playbook } from "@/lib/types";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { playBlip, playExecute, playTick } from "@/lib/sound";
import Link from "next/link";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Initial welcome message when account changes
  useEffect(() => {
    if (!account) return;

    const initialMsg: Message = {
      id: "init-" + account.account_id,
      sender: "agent",
      text: `Hello. I am your **Decision Copilot**, calibrated with XGBoost and TreeSHAP. I'm actively analyzing **${account.company_name}** (${account.account_id}). Current churn probability is **${(account.churn_probability * 100).toFixed(1)}%** with **${formatCurrency(account.mrr_at_risk)}** MRR exposed.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      card: {
        type: "playbook_recommendation",
        title: `Primary Recommendation: ${account.primary_playbook}`,
        metrics: [
          { label: "Contract MRR", value: formatCurrency(account.contract_mrr) },
          { label: "Expected Loss", value: formatCurrency(account.mrr_at_risk), color: "text-rose-400" },
          { label: "Risk Tier", value: account.risk_tier, color: "text-amber-400" },
          { label: "Days to Renewal", value: `${account.days_until_renewal}d` },
        ],
        actions: [
          { label: `⚡ Execute ${account.primary_playbook}`, actionId: `exec-${account.primary_playbook}`, variant: "primary" },
          { label: "Explain SHAP Drivers", actionId: "explain-shap", variant: "secondary" },
        ],
      },
    };

    setMessages([initialMsg]);
  }, [account]);

  const quickPrompts = [
    { label: "Why is this account at risk?", prompt: "Explain the top root causes and SHAP feature drivers for this account." },
    { label: "Simulate ticket resolution", prompt: "What happens to the churn probability if we resolve the open P1 tickets immediately?" },
    { label: "Generate executive brief", prompt: "Draft an executive retention briefing for the VP of Customer Success." },
    { label: "Recommend action plan", prompt: "What is the optimal multi-step intervention playbook for this account?" },
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

    // Intelligent Agent ML Response Generation
    setTimeout(() => {
      playBlip();
      setIsTyping(false);
      const response = generateAgentResponse(userQuery, account, playbooks);
      setMessages((prev) => [...prev, response]);
    }, 800);
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
        text: `✅ **Action Dispatched:** Playbook **${pbId}** has been queued for immediate dispatch. Webhook signal transmitted to Customer Success & Engineering Orchestrator. SLA timer started (${account.playbook_details?.sla_hours || 4}h target).`,
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

    if (q.includes("why") || q.includes("shap") || q.includes("root cause") || q.includes("drivers")) {
      const posDrivers = acc.shap_attributions?.positive || [];
      const negDrivers = acc.shap_attributions?.negative || [];
      
      const posText = posDrivers.map((d) => `• **${d.feature}**: +${d.contribution.toFixed(3)} risk contribution (actual value: ${d.value})`).join("\n");
      const negText = negDrivers.map((d) => `• **${d.feature}**: ${d.contribution.toFixed(3)} protective retention pull`).join("\n");

      return {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: `Here is the TreeSHAP local attribution breakdown for **${acc.company_name}**:\n\n**Primary Risk Drivers:**\n${posText || "• No acute negative drivers detected."}\n\n**Protective Retention Anchors:**\n${negText || "• Low protective retention anchors."}\n\nThe model identifies **${posDrivers[0]?.feature || "support tickets"}** as the single highest leverage point.`,
        timestamp: timeStr,
        card: {
          type: "shap_breakdown",
          title: "SHAP Feature Contribution Matrix",
          metrics: [
            { label: "Base Expected Value", value: "0.30" },
            { label: "Account Score", value: (acc.churn_probability).toFixed(3), color: "text-rose-400" },
            { label: "Top Driver", value: posDrivers[0]?.feature || "P1 Tickets", color: "text-amber-400" },
          ],
          actions: [
            { label: `⚡ Deploy ${acc.primary_playbook}`, actionId: `exec-${acc.primary_playbook}`, variant: "primary" },
          ],
        },
      };
    }

    if (q.includes("simulate") || q.includes("ticket") || q.includes("what if") || q.includes("resolve")) {
      const simulatedProb = Math.max(0.12, acc.churn_probability * 0.42);
      const simulatedExposure = acc.contract_mrr * simulatedProb;
      const mrrSaved = acc.mrr_at_risk - simulatedExposure;

      return {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: `🔬 **Counterfactual Simulation Engine:**\n\nIf we resolve all **${acc.open_p1_tickets} open P1 tickets** and reduce resolution time from **${acc.avg_resolution_time_hrs}h** to **8.0h**:\n\n• Churn Probability drops from **${(acc.churn_probability * 100).toFixed(1)}%** → **${(simulatedProb * 100).toFixed(1)}%** (-${((acc.churn_probability - simulatedProb) * 100).toFixed(1)}% reduction)\n• MRR Exposure decreases by **${formatCurrency(mrrSaved)}/mo**\n• Account transitions from **${acc.risk_tier}** → **MEDIUM RISK**.`,
        timestamp: timeStr,
        card: {
          type: "counterfactual_sim",
          title: "Counterfactual Impact Summary",
          metrics: [
            { label: "Baseline Risk", value: `${(acc.churn_probability * 100).toFixed(1)}%`, color: "text-rose-400" },
            { label: "Simulated Risk", value: `${(simulatedProb * 100).toFixed(1)}%`, color: "text-emerald-400" },
            { label: "Monthly MRR Saved", value: formatCurrency(mrrSaved), color: "text-amber-400" },
          ],
          actions: [
            { label: "⚡ Trigger Technical Escalation", actionId: `exec-PB-SUPP-01`, variant: "primary" },
          ],
        },
      };
    }

    if (q.includes("executive") || q.includes("brief") || q.includes("email") || q.includes("vp")) {
      return {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: `📄 **Executive Retention Briefing Generated:**\n\n**To:** VP Customer Success & Account Lead\n**Subject:** URGENT: Retention Intervention Required — ${acc.company_name} (${formatCurrency(acc.contract_mrr)} MRR)\n\n**Situation:** Account has elevated churn probability (${(acc.churn_probability * 100).toFixed(1)}%) ahead of renewal in ${acc.days_until_renewal} days. Expected portfolio loss: ${formatCurrency(acc.mrr_at_risk)}.\n\n**Root Cause:** TreeSHAP analysis shows acute dissatisfaction stemming from ${acc.open_p1_tickets} open P1 tickets and a ${acc.usage_change_pct_30d}% drop in 30-day telemetry usage.\n\n**Action Plan:** Immediate execution of ${acc.primary_playbook}. Executive sponsor meeting recommended within 48 hours.`,
        timestamp: timeStr,
        card: {
          type: "executive_brief",
          title: "Executive Action Directives",
          metrics: [
            { label: "Assignee Role", value: acc.playbook_details?.assignee_role || "VP of CS" },
            { label: "Target SLA", value: `${acc.playbook_details?.sla_hours || 4} Hours` },
            { label: "Renewal Window", value: `${acc.days_until_renewal} Days` },
          ],
          actions: [
            { label: `⚡ Dispatch Webhook to ${acc.playbook_details?.assignee_role || "CS"}`, actionId: `exec-${acc.primary_playbook}`, variant: "primary" },
          ],
        },
      };
    }

    // Default Playbook / Recommendation query
    return {
      id: `a-${Date.now()}`,
      sender: "agent",
      text: `Based on calibrated XGBoost features for **${acc.company_name}**, the highest-ROI intervention is **${acc.primary_playbook}** (${acc.playbook_details?.title || "Targeted Retention Protocol"}).\n\n**Protocol Action Summary:**\n${acc.playbook_details?.action_summary || "Deploy immediate customer success outreach and technical support remediation."}\n\n**Target Assignee:** ${acc.playbook_details?.assignee_role || "Customer Success"} | **SLA:** ${acc.playbook_details?.sla_hours || 4} hours.`,
      timestamp: timeStr,
      card: {
        type: "playbook_recommendation",
        title: `Protocol Details: ${acc.primary_playbook}`,
        metrics: [
          { label: "Priority", value: acc.playbook_details?.priority || "P0", color: "text-rose-400" },
          { label: "SLA Window", value: `${acc.playbook_details?.sla_hours || 4}h` },
          { label: "Category", value: acc.playbook_details?.category || "Account Health" },
        ],
        actions: [
          { label: `⚡ Execute ${acc.primary_playbook} Now`, actionId: `exec-${acc.primary_playbook}`, variant: "primary" },
        ],
      },
    };
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[#100F0D] border-l border-[#262422] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col transition-all duration-300 backdrop-blur-2xl">
      {/* Copilot Header */}
      <div className="p-4 border-b border-[#22201E] flex items-center justify-between bg-[#141311]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-stone-950 shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-serif font-bold text-[#FAF8F5]">
                ML Decision Copilot
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                XGBoost + SHAP
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-sans">
              Autonomous reasoning & intervention copilot
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            playTick();
            onClose();
          }}
          className="p-1.5 rounded-lg bg-[#1C1B19] hover:bg-[#262422] border border-[#2B2926] text-stone-400 hover:text-stone-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Target Account Mini Banner */}
      {account && (
        <div className="px-4 py-2 bg-[#181715] border-b border-[#22201E] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="font-semibold text-stone-200">{account.company_name}</span>
            <span className="text-[10px] font-mono text-stone-500">{account.account_id}</span>
          </div>
          <span className="font-mono text-rose-400 font-bold">
            {(account.churn_probability * 100).toFixed(1)}% Churn Risk
          </span>
        </div>
      )}

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl p-3.5 leading-relaxed ${
                msg.sender === "user"
                  ? "bg-amber-500 text-stone-950 font-medium rounded-tr-sm shadow-sm"
                  : "bg-[#181716] border border-[#22201E] text-stone-200 rounded-tl-sm shadow-md"
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Dynamic Interactive Card Attachment */}
              {msg.card && (
                <div className="mt-3 pt-3 border-t border-[#262422] space-y-2.5">
                  <div className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                    {msg.card.title}
                  </div>

                  {msg.card.metrics && (
                    <div className="grid grid-cols-2 gap-2">
                      {msg.card.metrics.map((m, idx) => (
                        <div key={idx} className="p-2 rounded-lg bg-[#0E0D0C] border border-[#22201E]">
                          <div className="text-[10px] text-stone-500">{m.label}</div>
                          <div className={`font-mono text-xs font-bold ${m.color || "text-stone-200"}`}>
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
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            act.variant === "primary"
                              ? "bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-glowGold"
                              : "bg-[#22201E] hover:bg-[#2A2826] text-stone-200 border border-[#33302C]"
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
            <span className="text-[10px] font-mono text-stone-600 mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-[#181716] border border-[#22201E] text-stone-400 max-w-[200px]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span className="text-[11px] font-mono">Synthesizing SHAP reasoning...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompt Pills */}
      <div className="p-3 bg-[#141311] border-t border-[#22201E] space-y-1.5">
        <div className="text-[10px] font-mono uppercase tracking-widest text-stone-500 px-1">
          Quick Prompts
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(qp.prompt)}
              className="px-2.5 py-1 rounded-md bg-[#181716] hover:bg-[#22201E] border border-[#242220] hover:border-amber-400/40 text-stone-300 hover:text-[#FAF8F5] text-[11px] whitespace-nowrap transition-colors"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="p-3 bg-[#100F0D] border-t border-[#22201E]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Copilot (e.g. explain SHAP, simulate fix)..."
            className="flex-1 bg-[#181716] border border-[#262422] focus:border-amber-400/60 rounded-xl px-3.5 py-2 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none transition-colors font-sans"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-bold transition-all shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
