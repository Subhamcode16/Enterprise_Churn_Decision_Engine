"use client";

import React from "react";
import clsx from "clsx";

interface SkeletonProps {
  className?: string;
  variant?: "rectangular" | "circular" | "text" | "card";
  lines?: number;
}

export default function SkeletonPulse({
  className = "",
  variant = "rectangular",
  lines = 1,
}: SkeletonProps) {
  if (variant === "text" && lines > 1) {
    return (
      <div className="space-y-2 w-full">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx(
              "h-3.5 bg-stone-200/70 rounded-md skeleton-shimmer",
              i === lines - 1 ? "w-3/4" : "w-full",
              className
            )}
          />
        ))}
      </div>
    );
  }

  const baseStyle = clsx(
    "skeleton-shimmer",
    variant === "circular" && "rounded-full",
    variant === "rectangular" && "rounded-xl",
    variant === "card" && "rounded-2xl border border-stone-200/60",
    className
  );

  return <div className={baseStyle} />;
}
