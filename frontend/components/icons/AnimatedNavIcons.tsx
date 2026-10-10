"use client";

import React from "react";
import { motion, Transition, Variants } from "framer-motion";

interface AnimatedIconProps {
  isHovered: boolean;
  isActive?: boolean;
  className?: string;
}

const springTransition: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 22,
};

/**
 * Animated Executive Suite Bar Chart Icon
 * Bars stagger and rise dynamically on hover once.
 */
export function AnimatedBarChartIcon({ isHovered, isActive, className = "w-4 h-4" }: AnimatedIconProps) {
  const barVariants: Variants = {
    idle: { scaleY: 1, originY: 1 },
    hover: (custom: number) => ({
      scaleY: [1, 1.45, 0.9, 1],
      originY: 1,
      transition: {
        duration: 0.55,
        delay: custom * 0.08,
        ease: [0.34, 1.56, 0.64, 1],
      },
    }),
  };

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Bar 1 (Left: shortest) */}
      <motion.line
        x1="6"
        y1="20"
        x2="6"
        y2="14"
        custom={0}
        variants={barVariants}
        animate={isHovered ? "hover" : "idle"}
      />
      {/* Bar 2 (Middle: medium) */}
      <motion.line
        x1="12"
        y1="20"
        x2="12"
        y2="10"
        custom={1}
        variants={barVariants}
        animate={isHovered ? "hover" : "idle"}
      />
      {/* Bar 3 (Right: tall) */}
      <motion.line
        x1="18"
        y1="20"
        x2="18"
        y2="4"
        custom={2}
        variants={barVariants}
        animate={isHovered ? "hover" : "idle"}
      />
    </motion.svg>
  );
}

/**
 * Animated What-If Simulator Sliders Icon
 * Slider knobs glide along rails with mechanical elastic settle.
 */
export function AnimatedSlidersIcon({ isHovered, isActive, className = "w-4 h-4" }: AnimatedIconProps) {
  const topKnobVariants: Variants = {
    idle: { x: 0 },
    hover: {
      x: [0, 5, -2, 0],
      transition: { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] },
    },
  };

  const bottomKnobVariants: Variants = {
    idle: { x: 0 },
    hover: {
      x: [0, -5, 2, 0],
      transition: { duration: 0.55, delay: 0.08, ease: [0.34, 1.56, 0.64, 1] },
    },
  };

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Top Track */}
      <line x1="4" y1="8" x2="20" y2="8" />
      <motion.g
        variants={topKnobVariants}
        animate={isHovered ? "hover" : "idle"}
      >
        <line x1="8" y1="4" x2="8" y2="12" strokeWidth="2.5" />
      </motion.g>

      {/* Bottom Track */}
      <line x1="4" y1="16" x2="20" y2="16" />
      <motion.g
        variants={bottomKnobVariants}
        animate={isHovered ? "hover" : "idle"}
      >
        <line x1="16" y1="12" x2="16" y2="20" strokeWidth="2.5" />
      </motion.g>
    </motion.svg>
  );
}

/**
 * Animated Batch Processor Cloud Upload Icon
 * Cloud puffs buoyantly while the upload arrow leaps upward and settles.
 */
export function AnimatedCloudUploadIcon({ isHovered, isActive, className = "w-4 h-4" }: AnimatedIconProps) {
  const arrowVariants: Variants = {
    idle: { y: 0, opacity: 1 },
    hover: {
      y: [0, -4, 1, 0],
      transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
    },
  };

  const cloudVariants: Variants = {
    idle: { scale: 1 },
    hover: {
      scale: [1, 1.08, 0.98, 1],
      transition: { duration: 0.45, ease: "easeOut" },
    },
  };

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <motion.path
        d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"
        variants={cloudVariants}
        animate={isHovered ? "hover" : "idle"}
        style={{ originX: "12px", originY: "12px" }}
      />
      <motion.g
        variants={arrowVariants}
        animate={isHovered ? "hover" : "idle"}
      >
        <path d="M12 12v9" />
        <path d="m16 16-4-4-4 4" />
      </motion.g>
    </motion.svg>
  );
}

/**
 * Animated Playbooks Catalog Book Icon
 * Left and right pages open/fan outward slightly on hover and spring back.
 */
export function AnimatedBookOpenIcon({ isHovered, isActive, className = "w-4 h-4" }: AnimatedIconProps) {
  const bookVariants: Variants = {
    idle: { scale: 1, rotate: 0 },
    hover: {
      scale: [1, 1.12, 0.96, 1],
      rotate: [0, -3, 3, 0],
      transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] },
    },
  };

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      variants={bookVariants}
      animate={isHovered ? "hover" : "idle"}
      style={{ originX: "12px", originY: "18px" }}
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </motion.svg>
  );
}

/**
 * Animated Settings & Integrations Cog Icon
 * Rotates exactly 90 degrees with mechanical spring damping.
 */
export function AnimatedSettingsIcon({ isHovered, isActive, className = "w-4 h-4" }: AnimatedIconProps) {
  const cogVariants: Variants = {
    idle: { rotate: 0 },
    hover: {
      rotate: [0, 95, 90],
      transition: {
        duration: 0.6,
        ease: [0.34, 1.56, 0.64, 1],
      },
    },
  };

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      variants={cogVariants}
      animate={isHovered ? "hover" : "idle"}
      style={{ originX: "12px", originY: "12px" }}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </motion.svg>
  );
}

/**
 * Animated Sound Speaker Icon
 * Sound wave arcs pulse outward with acoustic micro-delay.
 */
export function AnimatedVolumeIcon({ isHovered, isMuted, className = "w-4 h-4" }: { isHovered: boolean; isMuted: boolean; className?: string }) {
  const wave1Variants: Variants = {
    idle: { opacity: 0.7, scale: 1 },
    hover: {
      opacity: [0.7, 1, 0.5, 1],
      scale: [1, 1.2, 0.95, 1],
      transition: { duration: 0.45, ease: "easeOut" },
    },
  };

  const wave2Variants: Variants = {
    idle: { opacity: 0.7, scale: 1 },
    hover: {
      opacity: [0.7, 1, 0.3, 1],
      scale: [1, 1.3, 0.9, 1],
      transition: { duration: 0.5, delay: 0.08, ease: "easeOut" },
    },
  };

  if (isMuted) {
    return (
      <motion.svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        animate={isHovered ? { rotate: [0, -10, 10, 0] } : { rotate: 0 }}
        transition={{ duration: 0.4 }}
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="22" y1="9" x2="16" y2="15" />
        <line x1="16" y1="9" x2="22" y2="15" />
      </motion.svg>
    );
  }

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <motion.path
        d="M15.54 8.46a5 5 0 0 1 0 7.07"
        variants={wave1Variants}
        animate={isHovered ? "hover" : "idle"}
        style={{ originX: "11px", originY: "12px" }}
      />
      <motion.path
        d="M19.07 4.93a10 10 0 0 1 0 14.14"
        variants={wave2Variants}
        animate={isHovered ? "hover" : "idle"}
        style={{ originX: "11px", originY: "12px" }}
      />
    </motion.svg>
  );
}

/**
 * Animated Copilot Bot Icon
 * Bot head tilts and antenna pulses on hover.
 */
export function AnimatedBotIcon({ isHovered, className = "w-4 h-4" }: { isHovered: boolean; className?: string }) {
  const botVariants: Variants = {
    idle: { rotate: 0, scale: 1 },
    hover: {
      rotate: [0, -12, 8, 0],
      scale: [1, 1.15, 0.95, 1],
      transition: { duration: 0.55, ease: [0.34, 1.56, 0.64, 1] },
    },
  };

  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      variants={botVariants}
      animate={isHovered ? "hover" : "idle"}
      style={{ originX: "12px", originY: "16px" }}
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </motion.svg>
  );
}
