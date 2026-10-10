"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedIconProps {
  isHovered: boolean;
  isActive?: boolean;
  className?: string;
}

// Master Genjutsu Motion Easing Curves
const kineticEase = [0.34, 1.56, 0.64, 1];
const smoothSettle = [0.22, 1, 0.36, 1];

/**
 * 1. Executive Suite Bar Chart Icon
 * Prolonged 3-bar harmonic wave surge (zero container scaling).
 */
export function AnimatedBarChartIcon({ isHovered, className = "w-4 h-4" }: AnimatedIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Bar 1 (Left) */}
      <motion.line
        x1="6"
        y1="20"
        x2="6"
        initial={{ y2: 14 }}
        animate={isHovered ? { y2: [14, 5, 16, 13, 14] } : { y2: 14 }}
        transition={{ duration: 0.85, ease: kineticEase }}
      />
      {/* Bar 2 (Middle) */}
      <motion.line
        x1="12"
        y1="20"
        x2="12"
        initial={{ y2: 10 }}
        animate={isHovered ? { y2: [10, 3, 12, 9, 10] } : { y2: 10 }}
        transition={{ duration: 0.85, delay: 0.12, ease: kineticEase }}
      />
      {/* Bar 3 (Right) */}
      <motion.line
        x1="18"
        y1="20"
        x2="18"
        initial={{ y2: 4 }}
        animate={isHovered ? { y2: [4, 1, 6, 3, 4] } : { y2: 4 }}
        transition={{ duration: 0.85, delay: 0.24, ease: kineticEase }}
      />
    </svg>
  );
}

/**
 * 2. What-If Simulator Sliders Icon
 * Dynamic Equalizer: Knobs glide horizontally across rails in opposing phase (zero container scaling).
 */
export function AnimatedSlidersIcon({ isHovered, className = "w-4 h-4" }: AnimatedIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Top Track (Vertical waveform flex) */}
      <motion.line
        x1="4"
        y1="8"
        x2="20"
        y2="8"
        animate={isHovered ? { y1: [8, 6.5, 9.5, 8], y2: [8, 9.5, 6.5, 8] } : { y1: 8, y2: 8 }}
        transition={{ duration: 0.85, ease: smoothSettle }}
      />
      {/* Top Slider Notch (Glides right with spring recoil) */}
      <motion.g
        animate={isHovered ? { x: [0, 9, -3, 2, 0] } : { x: 0 }}
        transition={{ duration: 0.85, ease: kineticEase }}
      >
        <motion.line
          x1="8"
          y1="4"
          x2="8"
          y2="12"
          strokeWidth="2.5"
          animate={isHovered ? { scaleY: [1, 1.3, 0.9, 1] } : { scaleY: 1 }}
          style={{ transformOrigin: "8px 8px", transformBox: "fill-box" }}
          transition={{ duration: 0.85, ease: kineticEase }}
        />
      </motion.g>

      {/* Bottom Track (Counter-phase waveform flex) */}
      <motion.line
        x1="4"
        y1="16"
        x2="20"
        y2="16"
        animate={isHovered ? { y1: [16, 17.5, 14.5, 16], y2: [16, 14.5, 17.5, 16] } : { y1: 16, y2: 16 }}
        transition={{ duration: 0.85, delay: 0.08, ease: smoothSettle }}
      />
      {/* Bottom Slider Notch (Glides left in opposing counter-motion) */}
      <motion.g
        animate={isHovered ? { x: [0, -9, 3, -2, 0] } : { x: 0 }}
        transition={{ duration: 0.85, delay: 0.1, ease: kineticEase }}
      >
        <motion.line
          x1="16"
          y1="12"
          x2="16"
          y2="20"
          strokeWidth="2.5"
          animate={isHovered ? { scaleY: [1, 1.3, 0.9, 1] } : { scaleY: 1 }}
          style={{ transformOrigin: "16px 16px", transformBox: "fill-box" }}
          transition={{ duration: 0.85, delay: 0.1, ease: kineticEase }}
        />
      </motion.g>
    </svg>
  );
}

/**
 * 3. Batch Processor Cloud Upload Icon
 * Anticipation Squash & Arrow Rocket Launch (zero container scaling).
 */
export function AnimatedCloudUploadIcon({ isHovered, className = "w-4 h-4" }: AnimatedIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Cloud Body: Anticipation squash -> Buoyant expansion -> Soft settle */}
      <motion.path
        d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"
        animate={isHovered ? {
          scaleY: [1, 0.85, 1.18, 0.96, 1],
          scaleX: [1, 1.12, 0.92, 1.02, 1],
          y: [0, 1.5, -2, 0.5, 0]
        } : { scaleY: 1, scaleX: 1, y: 0 }}
        style={{ transformOrigin: "12px 14px", transformBox: "fill-box" }}
        transition={{ duration: 0.85, ease: kineticEase }}
      />

      {/* Upload Arrow: Anticipation dip -> Rocket launch 9px skyward -> Parachute return */}
      <motion.g
        animate={isHovered ? {
          y: [0, 2, -9, 1, 0],
          scaleY: [1, 0.8, 1.35, 0.95, 1]
        } : { y: 0, scaleY: 1 }}
        style={{ transformOrigin: "12px 16px", transformBox: "fill-box" }}
        transition={{ duration: 0.85, delay: 0.05, ease: kineticEase }}
      >
        <line x1="12" y1="12" x2="12" y2="21" />
        <polyline points="16 16 12 12 8 16" />
      </motion.g>
    </svg>
  );
}

/**
 * 4. Playbooks Catalog Book Icon
 * 3D Tactile Paper Flutter: Left & right pages flap open in 3D perspective wings (zero container scaling).
 */
export function AnimatedBookOpenIcon({ isHovered, className = "w-4 h-4" }: AnimatedIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ perspective: 600 }}
    >
      {/* Left Page Wing (3D Flap Flutter) */}
      <motion.path
        d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
        animate={isHovered ? {
          rotateY: [0, -50, 20, -8, 0],
          rotateZ: [0, -14, 5, -2, 0],
          scaleX: [1, 0.8, 1.1, 0.96, 1],
          y: [0, -2, 0.5, 0]
        } : { rotateY: 0, rotateZ: 0, scaleX: 1, y: 0 }}
        style={{ transformOrigin: "12px 20px", transformBox: "fill-box" }}
        transition={{ duration: 0.85, ease: kineticEase }}
      />

      {/* Right Page Wing (Counter 3D Flap Flutter) */}
      <motion.path
        d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
        animate={isHovered ? {
          rotateY: [0, 50, -20, 8, 0],
          rotateZ: [0, 14, -5, 2, 0],
          scaleX: [1, 0.8, 1.1, 0.96, 1],
          y: [0, -2, 0.5, 0]
        } : { rotateY: 0, rotateZ: 0, scaleX: 1, y: 0 }}
        style={{ transformOrigin: "12px 20px", transformBox: "fill-box" }}
        transition={{ duration: 0.85, delay: 0.08, ease: kineticEase }}
      />
    </svg>
  );
}

/**
 * 5. Integrations & Settings Cog Icon
 * Pure Mechanical Ratchet Notch Turn: -15° windup -> 90° tooth lock (zero container scaling).
 */
export function AnimatedSettingsIcon({ isHovered, className = "w-4 h-4" }: AnimatedIconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      animate={isHovered ? { rotate: [0, -15, 105, 88, 90] } : { rotate: 0 }}
      transition={{ duration: 0.85, ease: kineticEase }}
      style={{ transformOrigin: "center", transformBox: "fill-box" }}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </motion.svg>
  );
}

/**
 * 6. Tactile UI Audio Volume Icon
 * Radiating acoustic displacement waves (zero container scaling).
 */
export function AnimatedVolumeIcon({ isHovered, isMuted, className = "w-4 h-4" }: { isHovered: boolean; isMuted: boolean; className?: string }) {
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
        animate={isHovered ? { rotate: [0, -15, 15, -5, 0] } : { rotate: 0 }}
        transition={{ duration: 0.75, ease: kineticEase }}
        style={{ transformOrigin: "center", transformBox: "fill-box" }}
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="22" y1="9" x2="16" y2="15" />
        <line x1="16" y1="9" x2="22" y2="15" />
      </motion.svg>
    );
  }

  return (
    <svg
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
        animate={isHovered ? { x: [0, 4, -1, 0], opacity: [0.4, 1, 0.8, 1] } : { x: 0, opacity: 0.7 }}
        transition={{ duration: 0.7, ease: kineticEase }}
      />
      <motion.path
        d="M19.07 4.93a10 10 0 0 1 0 14.14"
        animate={isHovered ? { x: [0, 6, -1.5, 0], opacity: [0.2, 1, 0.8, 1] } : { x: 0, opacity: 0.7 }}
        transition={{ duration: 0.8, delay: 0.1, ease: kineticEase }}
      />
    </svg>
  );
}

/**
 * 7. Decision Copilot Bot Icon
 * Playful 3D nod and antenna wobble (zero container scaling).
 */
export function AnimatedBotIcon({ isHovered, className = "w-4 h-4" }: { isHovered: boolean; className?: string }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      animate={isHovered ? {
        rotate: [0, -18, 12, -4, 0],
        y: [0, -2, 0]
      } : { rotate: 0, y: 0 }}
      transition={{ duration: 0.85, ease: kineticEase }}
      style={{ transformOrigin: "center", transformBox: "fill-box" }}
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
