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
        <div className="p-3.5 rounded-2xl bg-white border border-[#E8E5DD] shadow-xl text-xs space-y-1.5 min-w-[190px]">
          <div className="font-bold text-stone-900 border-b border-[#F0ECE1] pb-1 flex justify-between">
            <span>Renewal Window:</span>
            <span className="text-amber-700 font-mono">{label}</span>
          </div>
          <div className="flex justify-between text-rose-600 font-medium">
            <span>Critical Risk:</span>
            <span className="font-bold font-mono">{data.critical} accounts</span>
          </div>
          <div className="flex justify-between text-amber-700 font-medium">
            <span>High Risk:</span>
            <span className="font-bold font-mono">{data.high} accounts</span>
          </div>
          <div className="flex justify-between text-stone-600 font-medium">
            <span>Medium Risk:</span>
            <span className="font-bold font-mono">{data.medium} accounts</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-medium">
            <span>Low Risk:</span>
            <span className="font-bold font-mono">{data.low} accounts</span>
          </div>
          <div className="pt-1.5 border-t border-[#F0ECE1] flex justify-between font-bold text-stone-900">
            <span>MRR at Risk:</span>
            <span className="text-rose-600 font-mono">{formatCurrency(data.mrrExposed)}</span>
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
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E5DD" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#78716C"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#E8E5DD" }}
          />
          <YAxis
            stroke="#78716C"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: "#E8E5DD" }}
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
