import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { AccountRecord, RiskTier } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function resolvePrimaryPlaybook(account: AccountRecord): string {
  if (account.primary_playbook) return account.primary_playbook;
  if (account.open_p1_tickets > 0) return "PB-SUPP-01";
  if (account.usage_change_pct_30d < -20) return "PB-ENGAGE-02";
  if (account.payment_failures_past_quarter > 0) return "PB-FIN-03";
  if (account.days_until_renewal <= 60 && account.churn_probability > 0.6) return "PB-EXEC-04";
  if (account.csat_score < 3.0 || account.nps_score < 6) return "PB-CSAT-05";
  return "PB-NURTURE-06";
}

export function getRiskBadgeClasses(tier: RiskTier): string {
  switch (tier) {
    case "Critical":
      return "bg-rose-500/15 text-rose-400 border border-rose-500/30 animate-pulse";
    case "High":
      return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    case "Medium":
      return "bg-stone-500/15 text-stone-300 border border-stone-500/30";
    case "Low":
      return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    default:
      return "bg-stone-800 text-stone-400 border border-stone-700";
  }
}

export function getRiskColorHex(tier: RiskTier): string {
  switch (tier) {
    case "Critical":
      return "#EF4444";
    case "High":
      return "#F59E0B";
    case "Medium":
      return "#78716C";
    case "Low":
      return "#10B981";
    default:
      return "#57534E";
  }
}
