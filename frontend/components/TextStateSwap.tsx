"use client";

import React, { useEffect, useState } from "react";

interface TextStateSwapProps {
  children: React.ReactNode;
  className?: string;
  triggerKey?: string | number;
}

export default function TextStateSwap({
  children,
  className = "",
  triggerKey,
}: TextStateSwapProps) {
  const [keyState, setKeyState] = useState(triggerKey);
  const [animClass, setAnimClass] = useState("t-text-swap-in");

  useEffect(() => {
    if (triggerKey !== keyState) {
      setKeyState(triggerKey);
      setAnimClass("");
      const frame = requestAnimationFrame(() => {
        setAnimClass("t-text-swap-in");
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [triggerKey, keyState]);

  return (
    <span key={String(triggerKey)} className={`inline-block ${animClass} ${className}`}>
      {children}
    </span>
  );
}
