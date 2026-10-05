"use client";

import React from "react";

interface BorderBeamProps {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}

export const BorderBeam = ({
  className = "",
  size = 250,
  duration = 12,
  borderWidth = 1.5,
  anchor = 90,
  colorFrom = "#00E599",
  colorTo = "#0B2B26",
  delay = 0,
}: BorderBeamProps) => {
  return (
    <div
      style={
        {
          "--size": `${size}px`,
          "--duration": `${duration}s`,
          "--anchor": `${anchor}%`,
          "--border-width": `${borderWidth}px`,
          "--color-from": colorFrom,
          "--color-to": colorTo,
          "--delay": `-${delay}s`,
        } as React.CSSProperties
      }
      className={`pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)] ${className}`}
    >
      <div
        className="absolute aspect-square w-[var(--size)] [animation:border-beam_var(--duration)_infinite_linear] [animation-delay:var(--delay)] [background:radial-gradient(ellipse_at_center,var(--color-from),var(--color-to),transparent_70%)] [offset-anchor:calc(var(--anchor))_50%] [offset-path:rect(0_auto_auto_0_round_calc(var(--size)))]"
        style={{
          offsetPath: "rect(0 100% 100% 0 round 32px)",
        }}
      />
    </div>
  );
};

export default BorderBeam;
