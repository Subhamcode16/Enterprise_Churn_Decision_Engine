"use client";

import { useState, useEffect } from "react";
import { Bot, X, Sparkles, Zap } from "lucide-react";
import DecisionCopilot from "./DecisionCopilot";
import { AccountRecord, Playbook } from "@/lib/types";
import { getDemoAccounts, getPlaybooks } from "@/lib/api";
import { SEED_ACCOUNTS, SEED_PLAYBOOKS } from "@/lib/mockData";
import { playTick, playExecute } from "@/lib/sound";

interface FloatingDecisionCopilotProps {
  initialAccount?: AccountRecord | null;
}

export default function FloatingDecisionCopilot({
  initialAccount,
}: FloatingDecisionCopilotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [account, setAccount] = useState<AccountRecord | null>(initialAccount || null);
  const [playbooks, setPlaybooks] = useState<Playbook[]>(SEED_PLAYBOOKS);
  const [hovered, setHovered] = useState(false);

  // Load baseline intelligence
  useEffect(() => {
    getPlaybooks()
      .then((data) => {
        if (data && data.playbooks && data.playbooks.length > 0) {
          setPlaybooks(data.playbooks);
        }
      })
      .catch(() => {});

    if (!account) {
      getDemoAccounts()
        .then((res) => {
          if (res.accounts && res.accounts.length > 0) {
            setAccount(res.accounts[0]);
          }
        })
        .catch(() => {
          setAccount(SEED_ACCOUNTS[0]);
        });
    }
  }, []);

  // Update account if prop changes
  useEffect(() => {
    if (initialAccount) {
      setAccount(initialAccount);
    }
  }, [initialAccount]);

  // Global event listeners
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };

    const handleSelectAccount = (e: any) => {
      if (e.detail) {
        setAccount(e.detail);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("toggle-valence-copilot", handleToggle as EventListener);
    window.addEventListener("toggle-churniq-copilot", handleToggle as EventListener);
    window.addEventListener("select-copilot-account", handleSelectAccount as EventListener);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("toggle-valence-copilot", handleToggle as EventListener);
      window.removeEventListener("toggle-churniq-copilot", handleToggle as EventListener);
      window.removeEventListener("select-copilot-account", handleSelectAccount as EventListener);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const togglePanel = () => {
    playTick();
    setIsOpen(!isOpen);
  };

  const handleExecutePlaybook = (playbookId: string) => {
    playExecute();
  };

  return (
    <>
      {/* Floating Agent Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {/* Hover Pill Label */}
        <div
          className={`transition-all duration-300 pointer-events-none hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#051F20] border border-[#163832] text-[#DAF1DE] text-xs font-mono shadow-xl backdrop-blur-md ${
            hovered && !isOpen ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-[#8EB69B] animate-pulse" />
          <span>VALENCE AI Copilot</span>
        </div>

        {/* Floating Action Button */}
        <button
          onClick={togglePanel}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label={isOpen ? "Close AI Decision Copilot" : "Open AI Decision Copilot"}
          className={`group relative flex items-center justify-center w-14 h-14 rounded-2xl border transition-all duration-300 shadow-2xl active:scale-95 cursor-pointer ${
            isOpen
              ? "border-[#235347] bg-[#0B2B26] shadow-[0_0_25px_rgba(35,83,71,0.4)]"
              : "border-[#E2EAE4] bg-[#051F20] hover:border-[#8EB69B] hover:shadow-[0_0_20px_rgba(35,83,71,0.25)] hover:scale-105"
          }`}
        >
          {/* Subtle forest radial backdrop */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#235347]/20 via-transparent to-[#8EB69B]/10 opacity-80" />

          {/* Icon state with rotation morph */}
          <div className="relative z-10 transition-transform duration-300">
            {isOpen ? (
              <X className="w-6 h-6 text-[#DAF1DE] transition-transform duration-300 rotate-90 group-hover:rotate-0" />
            ) : (
              <div className="relative flex items-center justify-center">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#235347] to-[#0B2B26] flex items-center justify-center text-[#DAF1DE] font-bold shadow-md group-hover:scale-105 transition-transform">
                  <Bot className="w-5 h-5 text-[#DAF1DE]" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8EB69B] opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#DAF1DE] shadow-[0_0_6px_rgba(218,241,222,0.8)]" />
                </span>
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Dimmed Backdrop */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-in Copilot Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[440px] md:w-[480px] lg:w-[500px] bg-[#0E0D0C] border-l border-[#24221F] shadow-[0_0_50px_rgba(0,0,0,0.8)] transform transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <DecisionCopilot
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          account={account}
          playbooks={playbooks}
          onExecutePlaybook={handleExecutePlaybook}
        />
      </aside>
    </>
  );
}
