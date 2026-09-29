import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { RiskTier } from "./types";

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

export function getRiskBadgeClasses(tier: RiskTier): string {
  switch (tier) {
    case "Critical":
      return "bg-red-500/15 text-red-400 border border-red-500/30 animate-pulse";
    case "High":
      return "bg-orange-500/15 text-orange-400 border border-orange-500/30";
    case "Medium":
      return "bg-amber-500/15 text-amber-400 border border-amber-500/30";
    case "Low":
      return "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30";
    default:
      return "bg-slate-500/15 text-slate-400 border border-slate-500/30";
  }
}

export function getRiskColorHex(tier: RiskTier): string {
  switch (tier) {
    case "Critical":
      return "#EF4444";
    case "High":
      return "#F97316";
    case "Medium":
      return "#F59E0B";
    case "Low":
      return "#10B981";
    default:
      return "#64748B";
  }
}
