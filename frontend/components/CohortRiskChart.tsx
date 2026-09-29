"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { AccountRecord } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

interface CohortRiskChartProps {
  accounts: AccountRecord[];
}

export default function CohortRiskChart({ accounts }: CohortRiskChartProps) {
  const chartData = useMemo(() => {
    const buckets = [
      { name: "0-30d", critical: 0, high: 0, medium: 0, low: 0, mrrExposed: 0 },
      { name: "31-60d", critical: 0, high: 0, medium: 0, low: 0, mrrExposed: 0 },
      { name: "61-90d", critical: 0, high: 0, medium: 0, low: 0, mrrExposed: 0 },
      { name: "91-180d", critical: 0, high: 0, medium: 0, low: 0, mrrExposed: 0 },
      { name: "181-365d", critical: 0, high: 0, medium: 0, low: 0, mrrExposed: 0 },
    ];

    accounts.forEach((acc) => {
      let bucketIdx = 4;
      if (acc.days_until_renewal <= 30) bucketIdx = 0;
      else if (acc.days_until_renewal <= 60) bucketIdx = 1;
      else if (acc.days_until_renewal <= 90) bucketIdx = 2;
      else if (acc.days_until_renewal <= 180) bucketIdx = 3;

      if (acc.risk_tier === "Critical") buckets[bucketIdx].critical += 1;
      else if (acc.risk_tier === "High") buckets[bucketIdx].high += 1;
      else if (acc.risk_tier === "Medium") buckets[bucketIdx].medium += 1;
      else buckets[bucketIdx].low += 1;

      buckets[bucketIdx].mrrExposed += acc.mrr_at_risk;
    });

    return buckets;
  }, [accounts]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3.5 rounded-xl bg-[#090D16]/95 border border-slate-700 shadow-2xl backdrop-blur-xl text-xs space-y-1.5 min-w-[180px]">
          <div className="font-bold text-white border-b border-slate-800 pb-1 flex justify-between">
            <span>Renewal Window:</span>
            <span className="text-indigo-400 font-mono">{label}</span>
          </div>
          <div className="flex justify-between text-red-400">
            <span>Critical Risk:</span>
            <span className="font-bold font-mono">{data.critical} accounts</span>
          </div>
          <div className="flex justify-between text-orange-400">
            <span>High Risk:</span>
            <span className="font-bold font-mono">{data.high} accounts</span>
          </div>
          <div className="flex justify-between text-amber-400">
            <span>Medium Risk:</span>
            <span className="font-bold font-mono">{data.medium} accounts</span>
          </div>
          <div className="flex justify-between text-emerald-400">
            <span>Low Risk:</span>
            <span className="font-bold font-mono">{data.low} accounts</span>
          </div>
          <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-slate-200">
            <span>MRR at Risk:</span>
            <span className="text-red-400 font-mono">{formatCurrency(data.mrrExposed)}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#334155" }}
          />
          <YAxis
            stroke="#64748B"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#334155" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="critical" name="Critical" stackId="a" fill="#EF4444" radius={[0, 0, 0, 0]} />
          <Bar dataKey="high" name="High" stackId="a" fill="#F97316" radius={[0, 0, 0, 0]} />
          <Bar dataKey="medium" name="Medium" stackId="a" fill="#F59E0B" radius={[0, 0, 0, 0]} />
          <Bar dataKey="low" name="Low" stackId="a" fill="#10B981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
