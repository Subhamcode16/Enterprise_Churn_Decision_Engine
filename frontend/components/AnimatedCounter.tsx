"use client";

import React, { useEffect, useState, useRef } from "react";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  showDelta?: boolean;
  className?: string;
}

export default function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
  duration = 600,
  showDelta = false,
  className = "",
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [delta, setDelta] = useState<number | null>(null);
  const [animTrigger, setAnimTrigger] = useState(0);
  const prevValueRef = useRef<number>(value);

  useEffect(() => {
    const startVal = displayValue;
    const endVal = value;
    const diff = endVal - prevValueRef.current;

    if (diff !== 0 && showDelta) {
      setDelta(diff);
      const timer = setTimeout(() => setDelta(null), 2500);
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value, showDelta]);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = displayValue;
    const endVal = value;

    if (startVal === endVal) return;

    setAnimTrigger((prev) => prev + 1);
    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Smooth cubic-bezier(0.22, 1, 0.36, 1) spring curve
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easeProgress;
      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  const formatted =
    decimals > 0
      ? displayValue.toLocaleString("en-US", {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : Math.round(displayValue).toLocaleString("en-US");

  return (
    <span className={`inline-flex items-center gap-1.5 tabular-nums select-none ${className}`}>
      <span key={animTrigger} className="t-num-pop inline-block">
        {prefix}
        {formatted}
        {suffix}
      </span>

      {showDelta && delta !== null && delta !== 0 && (
        <span
          className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded t-num-pop ${
            delta > 0
              ? "bg-rose-100 text-rose-700 border border-rose-200"
              : "bg-emerald-100 text-emerald-700 border border-emerald-200"
          }`}
        >
          {delta > 0 ? "+" : ""}
          {decimals > 0 ? delta.toFixed(decimals) : Math.round(delta)}
          {suffix}
        </span>
      )}
    </span>
  );
}
