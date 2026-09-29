"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  Tooltip,
} from "recharts";
import { AccountRecord } from "@/lib/types";

interface AccountRadarProps {
  account: AccountRecord;
}

export default function AccountRadar({ account }: AccountRadarProps) {
  const radarData = useMemo(() => {
    // 1. Usage Score (0 - 100)
    const usageScore = Math.max(0, Math.min(100, Math.round(50 + account.usage_change_pct_30d * 0.8)));

    // 2. Support Vitality (0 - 100)
    const supportScore = Math.max(0, 100 - (account.open_p1_tickets * 35 + (account.avg_resolution_time_hrs > 24 ? 20 : 0)));

    // 3. Customer Sentiment (0 - 100)
    const sentimentScore = Math.round(((account.nps_score / 10) * 0.5 + (account.csat_score / 5) * 0.5) * 100);

    // 4. Billing Stability (0 - 100)
    const billingScore = Math.max(0, 100 - account.payment_failures_past_quarter * 30);

    // 5. Account Maturity (0 - 100)
    const maturityScore = Math.min(100, Math.round((account.tenure_months / 36) * 100));

    return [
      { subject: "Usage Momentum", value: usageScore, benchmark: 75 },
      { subject: "Support Health", value: supportScore, benchmark: 85 },
      { subject: "NPS Sentiment", value: sentimentScore, benchmark: 80 },
      { subject: "Billing Purity", value: billingScore, benchmark: 95 },
      { subject: "Maturity", value: maturityScore, benchmark: 70 },
    ];
  }, [account]);

  const CustomRadarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-2.5 rounded-xl bg-white border border-[#E8E5DD] shadow-lg text-xs">
          <span className="font-semibold text-stone-900">{data.subject}: </span>
          <span className="font-mono font-bold text-amber-600">{data.value}/100</span>
          <span className="text-stone-500 text-[10px] ml-1.5">(Target: {data.benchmark})</span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
          <PolarGrid stroke="#E8E5DD" />
          <PolarAngleAxis dataKey="subject" stroke="#57534E" fontSize={11} tickLine={false} />
          <Tooltip content={<CustomRadarTooltip />} />
          <Radar
            name={account.company_name}
            dataKey="value"
            stroke="#F59E0B"
            fill="#F59E0B"
            fillOpacity={0.3}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
