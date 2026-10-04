"use client";

import { useState } from "react";
import { 
  X, 
  User, 
  ShieldCheck, 
  Lock, 
  Key, 
  LogOut, 
  Activity, 
  Clock, 
  Database,
  Building2,
  Check
} from "lucide-react";
import { AuthUser, clearStoredAuth, useAuth } from "@/lib/auth";
import { playTick, playExecute } from "@/lib/sound";

interface UserProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user?: AuthUser | null;
  onOpenAuthModal?: () => void;
}

export default function UserProfileDrawer({
  isOpen,
  onClose,
  user: propUser,
  onOpenAuthModal
}: UserProfileDrawerProps) {
  const { user: hookUser } = useAuth();
  const user = propUser !== undefined ? propUser : hookUser;
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen) return null;

  const handleSignOut = () => {
    playExecute();
    clearStoredAuth();
    onClose();
  };

  const handleCopyKey = () => {
    playTick();
    navigator.clipboard.writeText("val_live_pk_9837a4b1c2e3f4g5h6");
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-[#051F20]/60 backdrop-blur-xs animate-in fade-in duration-200 font-sans"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white border-l border-[#E2EAE4] shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="space-y-6">
          <div className="p-6 border-b border-[#F0F4F1] flex items-center justify-between bg-[#F4F8F5]/60">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-base font-serif font-bold text-[#051F20]">
                Executive Operator Desk
              </h3>
            </div>

            <button
              type="button"
              onClick={() => {
                playTick();
                onClose();
              }}
              className="w-8 h-8 rounded-full border border-[#E2EAE4] bg-white hover:bg-[#F4F8F5] text-stone-400 hover:text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Profile Card Body */}
          <div className="px-6 space-y-6">
            {user ? (
              <>
                {/* User Identity Avatar Header */}
                <div className="p-5 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] flex items-center gap-4 shadow-2xs">
                  <div className="w-14 h-14 rounded-2xl bg-[#051F20] text-[#DAF1DE] flex items-center justify-center font-serif font-bold text-xl shadow-xs border border-[#163832]">
                    {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>

                  <div className="space-y-1">
                    <div className="text-base font-bold text-[#051F20] leading-tight">
                      {user.full_name || "Enterprise Operator"}
                    </div>
                    <div className="text-xs text-stone-500 font-mono">
                      {user.email}
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span className="uppercase">{user.role} Privilege</span>
                    </div>
                  </div>
                </div>

                {/* Tenant Vault Parameters */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase font-bold text-stone-400 tracking-wider">
                    Vault & Tenant Environment
                  </div>

                  <div className="p-4 rounded-2xl bg-white border border-[#E2EAE4] space-y-3 text-xs font-mono shadow-2xs">
                    <div className="flex items-center justify-between pb-2 border-b border-[#F0F4F1]">
                      <span className="text-stone-500 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-[#235347]" />
                        Tenant Vault ID
                      </span>
                      <span className="text-[#051F20] font-bold">org_live_2026_val</span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-[#F0F4F1]">
                      <span className="text-stone-500 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-emerald-600" />
                        Encryption Mode
                      </span>
                      <span className="text-emerald-800 font-bold">AES-256 GCM</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        Session Expiration
                      </span>
                      <span className="text-stone-700">7 Days (Auto-Rotate)</span>
                    </div>
                  </div>
                </div>

                {/* API Key Vault Access */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase font-bold text-stone-400 tracking-wider">
                    Client Telemetry API Key
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#051F20] text-[#DAF1DE] border border-[#163832] flex items-center justify-between font-mono text-xs shadow-xs">
                    <span className="text-emerald-400 truncate max-w-[220px]">
                      val_live_pk_9837•••••••••
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyKey}
                      className="px-2.5 py-1 rounded-lg bg-[#163832] hover:bg-[#235347] text-white text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Key className="w-3 h-3 text-stone-400" />}
                      <span>{copiedKey ? "Copied" : "Copy"}</span>
                    </button>
                  </div>
                </div>

                {/* Security Audit Log Stream */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase font-bold text-stone-400 tracking-wider">
                    Recent Security Audit Events
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#F4F8F5] border border-[#E2EAE4] space-y-2 text-[11px] font-mono">
                    <div className="flex items-center justify-between text-stone-600">
                      <span>• USER_LOGIN_SUCCESS</span>
                      <span className="text-stone-400 text-[10px]">Just now</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>• VAULT_ENCRYPTION_VERIFIED</span>
                      <span className="text-stone-400 text-[10px]">12m ago</span>
                    </div>
                    <div className="flex items-center justify-between text-stone-600">
                      <span>• SLA_PLAYBOOK_DISPATCHED</span>
                      <span className="text-stone-400 text-[10px]">1h ago</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-stone-100 border border-stone-200 text-stone-400 mx-auto flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-serif font-bold text-[#051F20]">
                    No Active Operator Session
                  </h4>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto">
                    Sign in to access real-time encrypted telemetry and execute SLA playbooks.
                  </p>
                </div>
                {onOpenAuthModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAuthModal();
                    }}
                    className="px-6 py-2.5 rounded-full bg-[#051F20] hover:bg-[#0B2B26] text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Sign In to Account
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#F0F4F1] bg-[#F4F8F5]/60 space-y-2">
          {user ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full py-3 rounded-full bg-white hover:bg-rose-50 border border-[#E2EAE4] hover:border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out of Operator Desk</span>
            </button>
          ) : (
            <div className="text-center text-[10px] font-mono text-stone-400">
              VALENCE Autonomous Retention Intelligence v1.1.0
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
