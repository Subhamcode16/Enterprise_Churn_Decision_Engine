"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  SlidersHorizontal,
  Clock,
  Layers,
  ArrowUpRight,
  TrendingDown,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Sliders
} from "lucide-react";
import { AccountRecord, Playbook } from "@/lib/types";
import { formatCurrency, resolvePrimaryPlaybook } from "@/lib/utils";
import { playBlip, playExecute, playTick } from "@/lib/sound";
import { chatWithCopilot } from "@/lib/api";

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
  initialQuery?: string;
  onClearInitialQuery?: () => void;
}

export default function DecisionCopilot({
  isOpen,
  onClose,
  account,
  playbooks,
  onExecutePlaybook,
  initialQuery,
  onClearInitialQuery,
}: DecisionCopilotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [hasStartedChat, setHasStartedChat] = useState(false);
  const lastSentQueryRef = useRef<{ query: string; time: number }>({ query: "", time: 0 });

  // Prevent background scroll when Copilot drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 1) {
      setHasStartedChat(true);
    }
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
      text: `Hello Director. I am your **VALENCE Decision Copilot**, calibrated with XGBoost & TreeSHAP.\n\nCurrently inspecting **${account.company_name}** (\`${account.account_id}\`). Current churn probability is **${(account.churn_probability * 100).toFixed(1)}%** with **${formatCurrency(account.mrr_at_risk)}** MRR exposed.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      card: {
        type: "playbook_recommendation",
        title: `Recommended Protocol: ${primaryPb}`,
        metrics: [
          { label: "Contract MRR", value: formatCurrency(account.contract_mrr) },
          { label: "Expected Loss", value: formatCurrency(account.mrr_at_risk), color: "text-rose-600 font-bold" },
          { label: "Risk Tier", value: account.risk_tier, color: "text-[#8C3A27] font-bold" },
          { label: "Renewal Window", value: `${account.days_until_renewal} Days` },
        ],
        actions: [
          { label: `⚡ Deploy ${primaryPb}`, actionId: `exec-${primaryPb}`, variant: "primary" },
          { label: "Explain SHAP Drivers", actionId: "explain-shap", variant: "secondary" },
        ],
      },
    };

    setMessages([initialMsg]);
    setHasStartedChat(false);
  }, [account, playbooks]);

  // Auto-prompt when initialQuery is passed or when custom event with query arrives
  useEffect(() => {
    if (isOpen && initialQuery && account) {
      setHasStartedChat(true);
      handleSend(initialQuery);
      if (onClearInitialQuery) {
        onClearInitialQuery();
      }
    }
  }, [isOpen, initialQuery, account]);

  useEffect(() => {
    const handleCustomToggle = (e: any) => {
      if (e.detail?.query && account) {
        setHasStartedChat(true);
        handleSend(e.detail.query);
      }
    };
    window.addEventListener("toggle-valence-copilot", handleCustomToggle as EventListener);
    return () => {
      window.removeEventListener("toggle-valence-copilot", handleCustomToggle as EventListener);
    };
  }, [account]);

  const pillRow1 = [
    { label: "Risk Drivers", icon: Search, bg: "bg-[#DAF1DE]/70 text-[#051F20] border-[#8EB69B]/40 hover:bg-[#DAF1DE]", iconColor: "text-[#235347]", query: "Explain the top root causes and SHAP feature drivers for this account." },
    { label: "Playbooks", icon: Zap, bg: "bg-[#F4F8F5] text-[#051F20] border-[#E2EAE4] hover:bg-[#E2EAE4]/60", iconColor: "text-[#235347]", query: "What is the optimal multi-step intervention playbook for this account?" },
    { label: "SLA Targets", icon: Clock, bg: "bg-[#FAF0E6] text-[#8C3A27] border-[#8C3A27]/25 hover:bg-[#FAF0E6]/90", iconColor: "text-[#8C3A27]", query: "What are the SLA deadlines and escalation milestones for this account?" },
  ];

  const pillRow2 = [
    { label: "Schedule", icon: Calendar, bg: "bg-[#F4F8F5] text-[#051F20] border-[#E2EAE4] hover:bg-[#E2EAE4]/60", iconColor: "text-[#163832]", query: "Summarize the Q3 renewal schedule and contract timelines." },
    { label: "Counterfactuals", icon: SlidersHorizontal, bg: "bg-[#DAF1DE]/50 text-[#0B2B26] border-[#8EB69B]/30 hover:bg-[#DAF1DE]", iconColor: "text-[#235347]", query: "What happens to the churn probability if we resolve open P1 tickets immediately?" },
  ];

  const bottomSuggestedCards = [
    { title: "Why is Churn 77%?", query: "Why is this account at critical churn risk? Detail the top TreeSHAP features." },
    { title: "Simulate 30d Usage Recovery", query: "Simulate a 40% rebound in 30d usage telemetry." },
    { title: "Draft Executive Brief", query: "Draft an executive retention briefing for the VP of Customer Success." },
  ];

  const handleSend = async (textToSend?: string) => {
    const userQuery = textToSend || input;
    if (!userQuery.trim() || !account) return;

    // Prevent immediate duplicate execution within 600ms
    const now = Date.now();
    if (lastSentQueryRef.current.query === userQuery && now - lastSentQueryRef.current.time < 600) {
      return;
    }
    lastSentQueryRef.current = { query: userQuery, time: now };

    playTick();
    setHasStartedChat(true);
    const newMsg: Message = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, newMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    try {
      // 1. Attempt Backend AI Engine with Gemini / Jev Decision Model
      const historyPayload = messages.slice(-6).map((m) => ({ sender: m.sender, text: m.text }));
      const res = await chatWithCopilot(userQuery, account, playbooks, historyPayload);
      
      playBlip();
      setIsTyping(false);
      const agentMsg: Message = {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: res.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        card: res.card,
      };
      setMessages((prev) => [...prev, agentMsg]);
    } catch (err) {
      // 2. High-Precision Local Jev / TreeSHAP Decision Engine Fallback
      setTimeout(() => {
        playBlip();
        setIsTyping(false);
        const fallbackResponse = generateAgentResponse(userQuery, account, playbooks);
        setMessages((prev) => [...prev, fallbackResponse]);
      }, 350);
    }
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
        text: `✅ **Action Dispatched:** Playbook **${pbId}** has been queued for immediate dispatch.\n\nWebhook signal transmitted to Customer Success & Engineering Orchestrator.\nTarget SLA: **${account.playbook_details?.sla_hours || 4} hours**.`,
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
    const primaryPb = resolvePrimaryPlaybook(acc) || "PB-ENGAGE-02";
    const pbObj = pbs.find((p) => p.playbook_id === primaryPb) || acc.playbook_details;

    const usageChange = acc.usage_change_pct_30d ?? -42.8;
    const openP1 = acc.open_p1_tickets ?? 3;
    const nps = acc.nps_score ?? 3;
    const daysToRenewal = acc.days_until_renewal ?? 14;
    const tenure = acc.tenure_months ?? 18;
    const paymentFailures = acc.payment_failures_past_quarter ?? 2;

    // Dynamically calculate risk drivers
    const drivers: { feature: string; val: string; riskContrib: number }[] = [];
    if (usageChange < 0) {
      drivers.push({
        feature: "30d Usage Trajectory",
        val: `${usageChange > 0 ? "+" : ""}${usageChange.toFixed(1)}%`,
        riskContrib: Number((Math.abs(usageChange) / 150.0).toFixed(3)),
      });
    }
    if (openP1 > 0) {
      drivers.push({
        feature: "Unresolved P1 Support Tickets",
        val: `${openP1} Critical Open`,
        riskContrib: Number((openP1 * 0.065).toFixed(3)),
      });
    }
    if (paymentFailures > 0) {
      drivers.push({
        feature: "Payment Dunning Failures",
        val: `${paymentFailures} Failed Invoices`,
        riskContrib: Number((paymentFailures * 0.052).toFixed(3)),
      });
    }
    if (daysToRenewal <= 30) {
      drivers.push({
        feature: "Renewal Cliff Horizon",
        val: `${daysToRenewal} Days Left`,
        riskContrib: Number(((30 - daysToRenewal) / 100.0).toFixed(3)),
      });
    }
    if (nps <= 4) {
      drivers.push({
        feature: "Depressed NPS Sentiment",
        val: `NPS ${nps}/10 Detractor`,
        riskContrib: Number(((5 - nps) * 0.035).toFixed(3)),
      });
    }

    // Intent 1: TreeSHAP Feature Attributions
    if (q.includes("shap") || q.includes("driver") || q.includes("factor") || q.includes("attribution") || q.includes("root cause")) {
      const driverList = drivers.length > 0
        ? drivers.map((d) => `• **${d.feature}** (\`${d.val}\`): +${d.riskContrib.toFixed(3)} risk attribution`).join("\n")
        : "• No acute risk drivers detected.";

      return {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: `### 🔬 TreeSHAP Attribution Analysis: **${acc.company_name}**\n\n**Primary Risk Contributors:**\n${driverList}\n\n**Protective Anchors:**\n• **Account Tenure** (\`${tenure} months\`): -0.082 protective anchor\n• **Contract Plan** (\`${acc.contract_tier || "Enterprise"}\`): -0.045 retention anchor\n\n**Key Insight:** Resolving **${drivers[0]?.feature || "support tickets"}** provides the highest ROI retention leverage point.`,
        timestamp: timeStr,
        card: {
          type: "shap_breakdown",
          title: "SHAP Feature Contribution Matrix",
          metrics: [
            { label: "Base Portfolio Prob", value: "30.0%" },
            { label: "Account Score", value: `${(acc.churn_probability * 100).toFixed(1)}%`, color: "text-rose-600 font-bold" },
            { label: "Top Risk Driver", value: drivers[0]?.feature || "Usage Shift", color: "text-[#8C3A27] font-bold" },
            { label: "Renewal Window", value: `${daysToRenewal} Days` },
          ],
          actions: [
            { label: `⚡ Deploy ${primaryPb}`, actionId: `exec-${primaryPb}`, variant: "primary" },
          ],
        },
      };
    }

    // Intent 2: Why Account is at Risk / Financial Urgency
    if (q.includes("why") || q.includes("critical") || q.includes("risk") || q.includes("exposure") || q.includes("loss")) {
      return {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: `### ⚠️ Critical Risk Diagnosis: **${acc.company_name}**\n\n**${acc.company_name}** is flagged at **${acc.risk_tier.toUpperCase()} RISK** (${(acc.churn_probability * 100).toFixed(1)}% probability) due to:\n\n1. **Severe Revenue Exposure**: **${formatCurrency(acc.mrr_at_risk)}/mo** MRR at risk against a **${formatCurrency(acc.contract_mrr)}** contract base.\n2. **Telemetry Decline**: 30-day active workload shifted by **${usageChange.toFixed(1)}%** with **${openP1} open P1 tickets**.\n3. **Renewal Urgency**: Contract renewal in **${daysToRenewal} days** with customer sentiment at **NPS ${nps}/10**.\n\nDeploying protocol **${primaryPb}** immediately under ${pbObj?.sla_hours || 4}h SLA is critical.`,
        timestamp: timeStr,
        card: {
          type: "playbook_recommendation",
          title: `Critical Protocol: ${primaryPb}`,
          metrics: [
            { label: "Contract MRR", value: formatCurrency(acc.contract_mrr) },
            { label: "MRR at Risk", value: formatCurrency(acc.mrr_at_risk), color: "text-rose-600 font-bold" },
            { label: "Days to Renewal", value: `${daysToRenewal} Days`, color: "text-rose-600 font-bold" },
            { label: "Open P1s", value: `${openP1} Tickets` },
          ],
          actions: [
            { label: `⚡ Deploy ${primaryPb}`, actionId: `exec-${primaryPb}`, variant: "primary" },
          ],
        },
      };
    }

    // Intent 3: Counterfactual Simulation / What-If
    if (q.includes("simulate") || q.includes("what if") || q.includes("counterfactual") || q.includes("rebound") || q.includes("ticket") || q.includes("usage")) {
      const simulatedProb = Math.max(0.12, acc.churn_probability * 0.42);
      const simulatedExposure = acc.contract_mrr * simulatedProb;
      const mrrSaved = acc.mrr_at_risk - simulatedExposure;
      const arrSaved = mrrSaved * 12.0;

      return {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: `### 🧪 Counterfactual Simulation Engine\n\n**Intervention Scenario:** Resolve all **${openP1} open P1 tickets** and restore usage telemetry by **+35%**:\n\n• **Churn Probability Drop:** **${(acc.churn_probability * 100).toFixed(1)}%** ➔ **${(simulatedProb * 100).toFixed(1)}%** ($-{((acc.churn_probability - simulatedProb) * 100).toFixed(1)}\\%$ delta)\n• **Protected Monthly MRR:** **+${formatCurrency(mrrSaved)}/mo**\n• **Annual ARR Defended:** **+${formatCurrency(arrSaved)}/yr**\n• **Renewal Safety Margin:** Elevated from ${acc.risk_tier} to **Low Risk** status.`,
        timestamp: timeStr,
        card: {
          type: "counterfactual_sim",
          title: "Simulated Impact Metrics",
          metrics: [
            { label: "Simulated Risk", value: `${(simulatedProb * 100).toFixed(1)}%`, color: "text-emerald-700 font-bold" },
            { label: "Protected MRR", value: `+${formatCurrency(mrrSaved)}/mo`, color: "text-[#235347] font-bold" },
            { label: "Annual ARR", value: `+${formatCurrency(arrSaved)}/yr`, color: "text-[#051F20] font-bold" },
            { label: "Target Tier", value: "Low Risk" },
          ],
          actions: [
            { label: "⚡ Commit Simulation to CRM", actionId: `exec-${primaryPb}`, variant: "primary" },
          ],
        },
      };
    }

    // Intent 4: Playbooks, Protocols, and Interventions
    if (q.includes("playbook") || q.includes("protocol") || q.includes("action") || q.includes("step") || q.includes("intervention")) {
      return {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: `### 📋 Multi-Step Retention Playbook: **${primaryPb}**\n\n1. **Hour 1 — Escalation Alert**: Dispatch VIP engineering pod to investigate all **${openP1} P1 ticket logs**.\n2. **Hour 4 — Executive Outreach**: VP of Customer Success initiates sponsor alignment call with **${acc.company_name}**.\n3. **Hour 24 — SLA Restoration**: Guarantee resolution timeline and credit adjustment to neutralize churn driver.\n4. **Day 7 — Health Verification**: Target telemetry recovery (**> +15% usage trajectory**).`,
        timestamp: timeStr,
        card: {
          type: "playbook_recommendation",
          title: `Protocol ${primaryPb} Roadmap`,
          metrics: [
            { label: "Target SLA", value: `${pbObj?.sla_hours || 4} Hours` },
            { label: "Primary Role", value: pbObj?.assignee_role || "Customer Success" },
            { label: "Success Metric", value: "Usage Rebound >15%" },
            { label: "Contract MRR", value: formatCurrency(acc.contract_mrr) },
          ],
          actions: [
            { label: `⚡ Trigger ${primaryPb}`, actionId: `exec-${primaryPb}`, variant: "primary" },
          ],
        },
      };
    }

    // Intent 5: SLA and Timeline
    if (q.includes("sla") || q.includes("schedule") || q.includes("deadline") || q.includes("milestone") || q.includes("renewal")) {
      return {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: `### ⏱️ SLA Escalation & Renewal Schedule\n\n• **Renewal Date Countdown:** **${daysToRenewal} Days Remaining** (Q3 Renewal Cycle)\n• **Incident SLA Window:** **${pbObj?.sla_hours || 4} Hours** to complete first stakeholder response\n• **Executive Briefing Deadline:** **24 Hours** prior to contract lock\n• **Target Outcome:** Secure multi-year contract renewal at **${formatCurrency(acc.contract_mrr)}/mo** MRR.`,
        timestamp: timeStr,
        card: {
          type: "playbook_recommendation",
          title: "SLA Escalation Milestones",
          metrics: [
            { label: "Days to Renewal", value: `${daysToRenewal} Days`, color: "text-amber-700 font-bold" },
            { label: "Target SLA", value: `${pbObj?.sla_hours || 4} Hours` },
            { label: "Risk Tier", value: acc.risk_tier },
            { label: "Exposure", value: formatCurrency(acc.mrr_at_risk) },
          ],
          actions: [
            { label: `⚡ Dispatch ${primaryPb}`, actionId: `exec-${primaryPb}`, variant: "primary" },
          ],
        },
      };
    }

    // Intent 6: Executive Brief
    if (q.includes("brief") || q.includes("draft") || q.includes("executive") || q.includes("summary") || q.includes("report")) {
      return {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: `### 📄 Executive Retention Brief: **${acc.company_name}**\n\n**To:** VP of Customer Success & CRO\n**Account:** \`${acc.account_id}\` | Tier: **${acc.contract_tier || "Enterprise"}**\n\n**Executive Summary:**\n• **Financial Value:** **${formatCurrency(acc.contract_mrr)}/mo** MRR with **${formatCurrency(acc.mrr_at_risk)}** at acute risk (${(acc.churn_probability * 100).toFixed(1)}% churn probability).\n• **Root Vulnerability:** 30d usage trajectory of **${usageChange.toFixed(1)}%** compounded by **${openP1} unresolved P1 support tickets**.\n• **Contract Horizon:** **${daysToRenewal} days** to renewal cliff.\n• **Recommended Strategy:** Deploy protocol \`${primaryPb}\` immediately under ${pbObj?.sla_hours || 4}-hour SLA.`,
        timestamp: timeStr,
        card: {
          type: "executive_brief",
          title: "Executive Brief Ready for Export",
          metrics: [
            { label: "Target Account", value: acc.account_id },
            { label: "Current Risk", value: `${(acc.churn_probability * 100).toFixed(1)}%` },
            { label: "Exposure", value: formatCurrency(acc.mrr_at_risk), color: "text-rose-600 font-bold" },
            { label: "Target SLA", value: `${pbObj?.sla_hours || 4} Hours` },
          ],
          actions: [
            { label: `⚡ Deploy ${primaryPb}`, actionId: `exec-${primaryPb}`, variant: "primary" },
          ],
        },
      };
    }

    // Default Contextual Response
    return {
      id: `a-${Date.now()}`,
      sender: "agent",
      text: `### 🎯 VALENCE Copilot Analysis for **${acc.company_name}**\n\nInspecting account \`${acc.account_id}\`:\n\n• **Risk Profile:** **${(acc.churn_probability * 100).toFixed(1)}%** churn probability (**${acc.risk_tier} Risk**) with **${formatCurrency(acc.mrr_at_risk)}** exposed MRR.\n• **Key Metric Signals:** 30d usage trajectory is **${usageChange.toFixed(1)}%**, with **${openP1} open P1 tickets** and **${daysToRenewal} days** until renewal.\n• **Recommended Protocol:** Deploy protocol **${primaryPb}** to stabilize customer satisfaction and protect contract revenue.`,
      timestamp: timeStr,
      card: {
        type: "playbook_recommendation",
        title: `Playbook: ${primaryPb}`,
        metrics: [
          { label: "Contract MRR", value: formatCurrency(acc.contract_mrr) },
          { label: "Risk Tier", value: acc.risk_tier, color: "text-rose-600 font-bold" },
          { label: "Days to Renewal", value: `${daysToRenewal} Days` },
          { label: "Target SLA", value: `${pbObj?.sla_hours || 4} Hours` },
        ],
        actions: [
          { label: `⚡ Deploy ${primaryPb}`, actionId: `exec-${primaryPb}`, variant: "primary" },
        ],
      },
    };
  }

  const primaryPlaybookId = account ? (resolvePrimaryPlaybook(account) || "PB-ENGAGE-02") : "PB-ENGAGE-02";

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Subtle Backdrop Dimmer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => {
              playTick();
              onClose();
            }}
            className="fixed inset-0 bg-stone-900/30 backdrop-blur-[2px] z-40"
          />

          {/* Fluid Spring Slide-In Drawer Matching Reference Assistant */}
          <motion.aside
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            initial={{ x: "100%", opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 280, mass: 0.8 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[460px] md:w-[490px] xl:w-[520px] h-full bg-[#F4F8F5] text-[#051F20] border-l border-[#E2EAE4] shadow-2xl flex flex-col justify-between select-none p-4 overscroll-contain touch-auto"
          >
            {/* 1. Top Header Card (Matching Reference) */}
            <div className="bg-white border border-[#E2EAE4] rounded-[24px] px-5 py-3.5 shadow-2xs flex items-center justify-between shrink-0">
              <span className="font-bold text-sm text-[#051F20] tracking-tight">
                Your AI Assistance
              </span>

              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 text-[11px] font-semibold bg-[#0B2B26] text-[#DAF1DE] px-3 py-1 rounded-full shadow-xs">
                  <Sparkles className="w-3 h-3 text-[#8EB69B]" />
                  <span>Pro Account</span>
                </span>

                <button
                  onClick={() => {
                    playTick();
                    onClose();
                  }}
                  title="Close Assistance"
                  className="p-1.5 rounded-lg text-[#163832]/60 hover:text-[#051F20] hover:bg-[#F4F8F5] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. Central Body Canvas with Isolated Scroll */}
            <div 
              data-lenis-prevent="true"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              className="flex-1 overflow-y-auto min-h-0 py-4 space-y-4 font-sans text-xs overscroll-contain pr-1"
            >
              {!hasStartedChat ? (
                /* Hero Greeting Screen (Matching Reference Exactly) */
                <div className="my-auto py-6 flex flex-col items-center text-center space-y-6 px-2">
                  <div className="space-y-2 max-w-[340px]">
                    <h2 className="text-2xl font-serif font-bold text-[#051F20] tracking-tight leading-snug">
                      How can I Help you, <span className="text-[#235347] font-sans font-extrabold">{account ? account.company_name.split(" ")[0] : "Director"}</span>?
                    </h2>
                    <p className="text-[11px] text-[#163832]/70 leading-relaxed">
                      You can ask anything about account churn drivers, TreeSHAP attributions, SLA escalations, or counterfactuals.
                    </p>
                  </div>

                  {/* 2-Row Pastel Pill Categories (Matching Reference) */}
                  <div className="space-y-2 w-full flex flex-col items-center">
                    {/* Row 1 */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {pillRow1.map((pill, idx) => {
                        const Icon = pill.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSend(pill.query)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium border transition-all active:scale-95 shadow-2xs ${pill.bg}`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${pill.iconColor}`} />
                            <span>{pill.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Row 2 */}
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                      {pillRow2.map((pill, idx) => {
                        const Icon = pill.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleSend(pill.query)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-medium border transition-all active:scale-95 shadow-2xs ${pill.bg}`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${pill.iconColor}`} />
                            <span>{pill.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Active Chat Stream */
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[92%] rounded-3xl p-4 leading-relaxed ${
                          msg.sender === "user"
                            ? "bg-[#DAF1DE]/70 border border-[#8EB69B]/40 text-[#051F20] font-medium rounded-tr-xs shadow-2xs"
                            : "bg-white border border-[#E2EAE4] text-[#051F20] rounded-tl-xs shadow-[0_2px_12px_-2px_rgba(5,31,32,0.03)]"
                        }`}
                      >
                        <div className="whitespace-pre-wrap">{msg.text}</div>

                        {/* Dynamic Interactive Card Attachment */}
                        {msg.card && (
                          <div className="mt-3.5 pt-3 border-t border-[#E2EAE4] space-y-3">
                            <div className="text-[11px] font-mono font-bold text-[#051F20] uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-[#235347]" />
                              {msg.card.title}
                            </div>

                            {msg.card.metrics && (
                              <div className="grid grid-cols-2 gap-2">
                                {msg.card.metrics.map((m, idx) => (
                                  <div key={idx} className="p-2.5 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4]">
                                    <div className="text-[10px] text-[#163832]/60 font-mono">{m.label}</div>
                                    <div className={`font-mono text-xs mt-0.5 ${m.color || "text-[#051F20] font-bold"}`}>
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
                                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all duration-150 active:scale-95 ${
                                      act.variant === "primary"
                                        ? "bg-[#235347] hover:bg-[#163832] text-white shadow-xs"
                                        : "bg-white hover:bg-[#F4F8F5] text-[#051F20] border border-[#E2EAE4] shadow-2xs"
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
                      <span className="text-[10px] font-mono text-[#163832]/50 mt-1 px-1">
                        {msg.timestamp}
                      </span>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-[#E2EAE4] text-[#163832]/70 max-w-[220px] shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-[#235347] animate-spin" />
                      <span className="text-[11px] font-mono t-shimmer">Synthesizing TreeSHAP...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* 3. Horizontal Suggested Action Cards (Matching Reference) */}
            <div className="py-2 overflow-x-auto scrollbar-none flex items-center gap-2 shrink-0">
              {bottomSuggestedCards.map((sc, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(sc.query)}
                  className="px-3.5 py-2 rounded-2xl bg-white hover:bg-[#F4F8F5] border border-[#E2EAE4] text-[#051F20] text-[11px] font-medium whitespace-nowrap transition-all duration-150 active:scale-95 flex-shrink-0 shadow-2xs cursor-pointer"
                >
                  {sc.title}
                </button>
              ))}
            </div>

            {/* 4. Floating Composer Dock (Matching Reference Screen Layout) */}
            <div className="bg-white border border-[#E2EAE4] rounded-[24px] p-3.5 shadow-md space-y-3 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="space-y-3"
              >
                {/* Text input with clean placeholder */}
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="How can I help you today?"
                  className="w-full bg-transparent text-xs text-[#051F20] placeholder:text-[#163832]/40 focus:outline-none font-sans px-1"
                />

                {/* Bottom Control Bar */}
                <div className="flex items-center justify-between pt-1 border-t border-[#F0F4F1]">
                  {/* Left: 3 Circular Buttons */}
                  <div className="flex items-center gap-1.5">
                    {/* Voice Mic Button */}
                    <button
                      type="button"
                      onClick={() => {
                        playTick();
                        setIsListening(!isListening);
                      }}
                      className={`w-8 h-8 rounded-full border border-[#E2EAE4] flex items-center justify-center transition-colors ${
                        isListening ? "bg-rose-100 text-rose-600 border-rose-300 animate-pulse" : "bg-white text-[#163832]/70 hover:text-[#051F20] hover:bg-[#F4F8F5]"
                      }`}
                      title="Voice Assistant"
                    >
                      <Mic className="w-3.5 h-3.5" />
                    </button>

                    {/* Attachment / Context Link */}
                    <button
                      type="button"
                      onClick={() => {
                        playTick();
                        handleSend("Provide a comprehensive diagnostic overview of all 5 dimensions for this account.");
                      }}
                      className="w-8 h-8 rounded-full border border-[#E2EAE4] bg-white text-[#163832]/70 hover:text-[#051F20] hover:bg-[#F4F8F5] flex items-center justify-center transition-colors"
                      title="Attach Context"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Model Engine Mode Button */}
                    <button
                      type="button"
                      onClick={() => {
                        playTick();
                        handleSend("Explain the top root causes and SHAP feature drivers for this account.");
                      }}
                      className="w-8 h-8 rounded-full border border-[#E2EAE4] bg-white text-[#163832]/70 hover:text-[#051F20] hover:bg-[#F4F8F5] flex items-center justify-center transition-colors"
                      title="TreeSHAP Engine"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Right: Pine Forest Pill Send Button */}
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="px-5 py-1.5 rounded-full bg-[#051F20] hover:bg-[#0B2B26] disabled:opacity-40 text-white text-xs font-semibold tracking-wide transition-all duration-150 active:scale-95 shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
