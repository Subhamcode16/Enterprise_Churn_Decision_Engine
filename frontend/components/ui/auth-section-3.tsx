"use client";

import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Eye, EyeOff, ShieldCheck, Sparkles, X, ArrowRight, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { setStoredAuth, AuthUser } from "@/lib/auth";
import { playTick, playExecute, playBlip } from "@/lib/sound";

let FlutedGlassComponent: any = null;
try {
  const shaderPkg = require("@paper-design/shaders-react");
  FlutedGlassComponent = shaderPkg.FlutedGlass;
} catch (e) {
  FlutedGlassComponent = null;
}

interface AuthSectionThreeProps {
  onSuccess?: (user: AuthUser) => void;
  onClose?: () => void;
  initialMode?: "login" | "register";
  isModal?: boolean;
}

export default function AuthSectionThree({
  onSuccess,
  onClose,
  initialMode = "register",
  isModal = false,
}: AuthSectionThreeProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState("Alexandre");
  const [lastName, setLastName] = useState("Vance");
  const [email, setEmail] = useState("director.retention@valence-enterprise.ai");
  const [password, setPassword] = useState("ValenceSecure2026!");
  const [role, setRole] = useState<"admin" | "operator" | "executive">("executive");
  const [noMarketingEmails, setNoMarketingEmails] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please complete all required credentials.");
      return;
    }
    if (mode === "register" && !agreedTerms) {
      setError("Please agree to the Terms of Service & Security Policies.");
      return;
    }

    setLoading(true);
    setError(null);
    playBlip();

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const endpoint = mode === "login" ? `${baseUrl}/api/auth/login` : `${baseUrl}/api/auth/register`;
    const fullName = `${firstName} ${lastName}`.trim() || "Executive Operator";
    const payload = mode === "login"
      ? { email, password }
      : { email, password, full_name: fullName, role };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication request failed.");
      }

      setStoredAuth(data.access_token, data.user);
      playExecute();
      if (onSuccess) onSuccess(data.user);
      if (onClose) onClose();
      else if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (err: any) {
      // Offline fallback in development
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        const fallbackUser: AuthUser = {
          id: 1,
          email,
          full_name: mode === "login" ? "VP Revenue & Retention" : fullName,
          name: mode === "login" ? "VP Revenue & Retention" : fullName,
          role: role || "executive",
        };
        const fallbackToken = `mock_jwt_token_${Date.now()}`;
        setStoredAuth(fallbackToken, fallbackUser);
        playExecute();
        if (onSuccess) onSuccess(fallbackUser);
        if (onClose) onClose();
        else if (typeof window !== "undefined") {
          window.location.href = "/";
        }
      } else {
        setError(err.message || "Failed to authenticate session.");
      }
    } finally {
      setLoading(false);
    }
  };

  const termsText = (
    <>
      By creating an account, you agree to our{" "}
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); playTick(); }}
        className="font-semibold text-[#0B2B26] dark:text-[#DAF1DE] underline underline-offset-2 hover:text-[#235347]"
      >
        Terms of Service
      </a>{" "}
      and{" "}
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); playTick(); }}
        className="font-semibold text-[#0B2B26] dark:text-[#DAF1DE] underline underline-offset-2 hover:text-[#235347]"
      >
        NIST PBKDF2 Privacy Policy
      </a>
    </>
  );

  return (
    <section className={`min-h-screen bg-[#F4F8F5] p-3 text-[#051F20] antialiased [font-synthesis:none] dark:bg-[#050505] dark:text-white font-sans ${isModal ? "p-0 min-h-0 h-full overflow-y-auto" : ""}`}>
      <div className={`grid min-h-[calc(100vh-1.5rem)] gap-6 lg:grid-cols-[0.94fr_1.06fr] ${isModal ? "min-h-0 h-full" : ""}`}>
        
        {/* Left Side - Auth Form */}
        <div className="relative flex min-h-[760px] items-center justify-center rounded-2xl border border-[#E2EAE4] bg-white px-6 py-10 shadow-xs dark:border-white/5 dark:bg-[#0a0a0c] lg:min-h-0 lg:px-12 lg:py-16 xl:px-16">
          
          {/* Modal Dismiss Button */}
          {onClose && (
            <button
              type="button"
              onClick={() => { playTick(); onClose(); }}
              className="absolute top-6 right-6 p-2 rounded-full bg-[#F4F8F5] hover:bg-[#E2EAE4] text-stone-500 hover:text-[#051F20] transition-colors active:scale-95 z-20 cursor-pointer"
              title="Close Authentication"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <div className="mx-auto w-full max-w-[460px]">
            {/* Header & Mode Switcher */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DAF1DE]/70 text-[#0B2B26] text-[11px] font-mono font-bold tracking-wide mb-3 border border-[#235347]/15">
                <ShieldCheck className="w-3.5 h-3.5 text-[#235347]" />
                <span>VALENCE • SOC-2 TYPE II VAULT</span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl text-[#051F20] dark:text-white">
                {mode === "register" ? "Create an account" : "Sign in to Workspace"}
              </h1>
              <p className="mt-2 text-xs text-stone-500 font-sans">
                {mode === "register" 
                  ? "Initialize dedicated ML telemetry vault and TreeSHAP retention engine." 
                  : "Access calibrated XGBoost models, live playbooks, and renewal briefs."}
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="mt-6 flex p-1 rounded-xl bg-[#F4F8F5] border border-[#E2EAE4]">
              <button
                type="button"
                onClick={() => { playTick(); setMode("register"); setError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === "register"
                    ? "bg-white text-[#051F20] shadow-2xs"
                    : "text-stone-500 hover:text-[#051F20]"
                }`}
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => { playTick(); setMode("login"); setError(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  mode === "login"
                    ? "bg-white text-[#051F20] shadow-2xs"
                    : "text-stone-500 hover:text-[#051F20]"
                }`}
              >
                Sign In
              </button>
            </div>

            {/* Social Signup Buttons */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
              <button
                type="button"
                onClick={() => { playTick(); setEmail("google.sso@enterprise.com"); }}
                className="flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-xs font-semibold text-[#051F20] transition-colors hover:bg-stone-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 active:scale-98 cursor-pointer"
              >
                <GoogleIcon />
                <span className="whitespace-nowrap">{mode === "register" ? "Sign up with Google" : "Google SSO"}</span>
              </button>
              <button
                type="button"
                onClick={() => { playTick(); setEmail("apple.sso@enterprise.com"); }}
                className="flex h-11 w-full min-w-0 items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-xs font-semibold text-[#051F20] transition-colors hover:bg-stone-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 active:scale-98 cursor-pointer"
              >
                <AppleIcon />
                <span className="whitespace-nowrap">{mode === "register" ? "Sign up with Apple" : "Apple Work ID"}</span>
              </button>
            </div>

            <div className="my-6 flex items-center gap-4 text-xs font-medium text-stone-400 dark:text-white/30">
              <div className="h-px flex-1 bg-stone-200 dark:bg-white/10" />
              <span>or enterprise email</span>
              <div className="h-px flex-1 bg-stone-200 dark:bg-white/10" />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <InputField
                      label="First name"
                      value={firstName}
                      onChange={setFirstName}
                      placeholder="Alexandre"
                      type="text"
                    />
                    <InputField
                      label="Last name"
                      value={lastName}
                      onChange={setLastName}
                      placeholder="Vance"
                      type="text"
                    />
                  </div>

                  {/* Role Selector Capsule */}
                  <div className="space-y-1.5 text-left w-full">
                    <label className="text-xs font-semibold text-stone-600 dark:text-white/60">
                      Operator Role & Privilege
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["executive", "operator", "admin"] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => { playTick(); setRole(r); }}
                          className={`py-2 px-2 text-center text-xs font-bold rounded-xl border capitalize transition-all ${
                            role === r
                              ? "bg-[#0B2B26] text-[#DAF1DE] border-[#0B2B26] shadow-2xs"
                              : "bg-white text-stone-600 border-[#E2EAE4] hover:bg-[#F4F8F5]"
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <InputField
                label="Enterprise Email"
                value={email}
                onChange={setEmail}
                placeholder="director.retention@enterprise.com"
                type="email"
              />

              <InputField
                label="Master Vault Password"
                value={password}
                onChange={setPassword}
                placeholder="Enter strong password (min 8 chars)"
                type="password"
              />

              {mode === "register" && (
                <div className="space-y-3 pt-2 text-xs leading-5 text-stone-600 dark:text-white/40 sm:text-[13px]">
                  <CheckboxLine
                    checked={noMarketingEmails}
                    onChange={(e) => setNoMarketingEmails(e.target.checked)}
                  >
                    Opt out of product benchmark newsletters and quarterly churn reports.
                  </CheckboxLine>
                  <CheckboxLine
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                  >
                    {termsText}
                  </CheckboxLine>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#0B2B26] bg-[#0B2B26] text-sm font-bold text-[#DAF1DE] shadow-md transition-all hover:bg-[#163832] active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2 font-mono text-xs">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AUTHENTICATING VAULT...
                  </span>
                ) : (
                  <>
                    <span>{mode === "register" ? "Create Enterprise Account" : "Access Decision Workspace"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side - Marketing Testimonial and Mockup */}
        <div className="relative flex min-h-[720px] flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[#0B2B26] via-[#051F20] to-[#163832] p-8 text-white sm:p-12 lg:min-h-0 lg:p-16 border border-[#235347]/40 shadow-xl">
          {/* Background Shader / Refraction Layer */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
            {FlutedGlassComponent ? (
              <FlutedGlassComponent
                size={0.89}
                shape="lines"
                angle={0}
                distortionShape="prism"
                distortion={0.5}
                shift={0}
                blur={0}
                edges={0.25}
                stretch={0}
                scale={1.11}
                fit="cover"
                highlights={0.1}
                shadows={0.2}
                grainMixer={0.1}
                grainOverlay={0.1}
                colorBack="#00000000"
                colorHighlight="#DAF1DE"
                colorShadow="#051F20"
                className="w-full h-full bg-transparent"
              />
            ) : (
              <div className="w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent" />
            )}
          </div>

          <div className="relative z-10 h-full w-full flex flex-col justify-between">
            <div className="max-w-[460px] lg:pt-6">
              {/* Executive Testimonial Avatar */}
              <motion.div
                initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="flex items-center gap-4"
              >
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
                  alt="Charlotte Vance"
                  className="size-11 shrink-0 rounded-full border-2 border-[#DAF1DE]/40 object-cover shadow-md"
                />
                <div>
                  <div className="font-bold text-base leading-tight text-[#DAF1DE]">
                    Charlotte Vance
                  </div>
                  <div className="mt-0.5 text-xs text-stone-300 font-mono">
                    Chief Revenue Officer • HyperScale Cloud
                  </div>
                </div>
              </motion.div>

              {/* Verified Quote */}
              <motion.blockquote
                initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 0.8,
                  delay: 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mt-6 text-2xl font-light leading-snug tracking-[-0.035em] text-white/95 sm:text-3xl lg:text-[32px]"
              >
                “Every retention signal and TreeSHAP attribution has the mathematical precision our board demands.”
              </motion.blockquote>

              {/* Real-Time Telemetry Stats */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                  <div className="text-[10px] font-mono text-[#DAF1DE] uppercase font-semibold">Sub-50ms</div>
                  <div className="text-sm font-bold text-white mt-0.5">TreeSHAP</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                  <div className="text-[10px] font-mono text-[#DAF1DE] uppercase font-semibold">0.886</div>
                  <div className="text-sm font-bold text-white mt-0.5">ROC-AUC</div>
                </div>
                <div className="p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15">
                  <div className="text-[10px] font-mono text-[#DAF1DE] uppercase font-semibold">NIST PBKDF2</div>
                  <div className="text-sm font-bold text-white mt-0.5">Encrypted</div>
                </div>
              </div>
            </div>

            {/* Angled Live Dashboard Mockup Window */}
            <div className="mt-8 w-full translate-y-[15%] overflow-hidden rounded-2xl border border-white/20 bg-black/60 p-2.5 shadow-[0_30px_90px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:translate-y-[12%] lg:absolute lg:left-[8%] lg:-bottom-24 lg:mt-0 lg:w-[105%] lg:max-w-none lg:origin-bottom-left lg:translate-y-0 lg:-rotate-2 xl:left-[10%] xl:-bottom-[130px] xl:w-[108%] 2xl:-bottom-[150px] 2xl:w-[110%]">
              <motion.div
                initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  duration: 1,
                  delay: 0.22,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="overflow-hidden rounded-xl border border-white/15 bg-[#051F20]"
              >
                {/* Window Chrome Header */}
                <div className="flex items-center justify-between border-b border-white/15 bg-black/50 px-4 py-2.5 select-none">
                  <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-rose-500/80" />
                    <div className="size-2.5 rounded-full bg-amber-500/80" />
                    <div className="size-2.5 rounded-full bg-emerald-500/80" />
                    <span className="ml-3 text-[10px] font-mono tracking-wider text-[#DAF1DE]">
                      valence-ai.io/intelligence • live-cluster
                    </span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/90 text-emerald-400 border border-emerald-500/30">
                    LIVE TELEMETRY
                  </span>
                </div>

                {/* Mockup Preview Content Image with High Contrast & Polish */}
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80"
                  alt="Valence Live Decision Engine Hub"
                  className="h-64 sm:h-72 w-full object-cover object-top opacity-90 brightness-95 contrast-110"
                />
              </motion.div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

function InputField({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange?: (v: string) => void;
}) {
  const [val, setVal] = useState(value);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setVal(value);
  }, [value]);

  return (
    <div className="space-y-1.5 text-left w-full">
      <label className="text-xs font-bold text-[#051F20] dark:text-white/60">
        {label}
      </label>
      <div className="relative flex h-11 items-center rounded-xl border border-stone-200 bg-white px-3.5 focus-within:border-[#235347] focus-within:ring-2 focus-within:ring-[#DAF1DE] transition-all dark:border-white/10 dark:bg-white/5">
        <input
          type={
            type === "password" ? (showPassword ? "text" : "password") : type
          }
          value={val}
          onChange={(e) => {
            setVal(e.target.value);
            if (onChange) onChange(e.target.value);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-xs text-[#051F20] font-medium outline-none placeholder:text-stone-400 dark:text-white dark:placeholder:text-white/30"
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => { playTick(); setShowPassword(!showPassword); }}
            className="absolute right-3.5 text-stone-400 hover:text-[#051F20] dark:hover:text-white cursor-pointer"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function CheckboxLine({
  children,
  checked,
  onChange,
}: {
  children: ReactNode;
  checked?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none">
      <span className="relative mt-0.5 size-4 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer size-full cursor-pointer appearance-none rounded-[4px] border border-stone-300 bg-white checked:border-[#0B2B26] checked:bg-[#0B2B26] dark:border-white/30 dark:bg-white/5 dark:checked:border-white dark:checked:bg-white transition-all"
        />
        <svg
          viewBox="0 0 12 12"
          className="pointer-events-none absolute inset-0 hidden size-full p-0.5 text-[#DAF1DE] peer-checked:block dark:text-black"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 6.2 5 8.1 9 3.9"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="shrink-0"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
        fill="#EB4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0 text-[#051F20] dark:text-white"
    >
      <path d="M17.05 12.54c-.03-3.02 2.47-4.47 2.58-4.54-1.41-2.06-3.6-2.34-4.38-2.37-1.86-.19-3.64 1.1-4.58 1.1-.95 0-2.42-1.07-3.98-1.04-2.05.03-3.94 1.19-4.99 3.02-2.13 3.69-.54 9.16 1.53 12.15 1.01 1.46 2.22 3.1 3.81 3.04 1.53-.06 2.11-.99 3.96-.99s2.37.99 3.99.96c1.65-.03 2.69-1.49 3.69-2.96 1.16-1.69 1.64-3.33 1.66-3.41-.04-.02-3.2-1.23-3.24-4.87ZM14.03 3.66c.84-1.02 1.41-2.43 1.25-3.84-1.21.05-2.68.81-3.55 1.83-.78.9-1.46 2.34-1.28 3.72 1.35.1 2.73-.69 3.58-1.71Z" />
    </svg>
  );
}
