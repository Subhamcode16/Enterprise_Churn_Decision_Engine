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
      return "bg-rose-100 text-rose-800 border border-rose-200";
    case "High":
      return "bg-[#FAF0E6] text-[#8C3A27] border border-[#8C3A27]/30";
    case "Medium":
      return "bg-[#E2EAE4] text-[#163832] border border-[#8EB69B]/30";
    case "Low":
      return "bg-[#DAF1DE] text-[#0B2B26] border border-[#8EB69B]/40";
    default:
      return "bg-[#F4F8F5] text-[#051F20] border border-[#E2EAE4]";
  }
}

export function getRiskColorHex(tier: RiskTier): string {
  switch (tier) {
    case "Critical":
      return "#BE123C";
    case "High":
      return "#8C3A27";
    case "Medium":
      return "#235347";
    case "Low":
      return "#163832";
    default:
      return "#051F20";
  }
}
