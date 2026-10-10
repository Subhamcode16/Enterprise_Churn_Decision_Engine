"use client";

import React from "react";
import { motion } from "framer-motion";

interface AnimatedIconProps {
  isHovered: boolean;
  isActive?: boolean;
  className?: string;
}

// Smooth luxurious ease-out curve
const smoothEase = [0.22, 1, 0.36, 1];

/**
 * Animated Executive Suite Bar Chart Icon
 * Smooth, deliberate wave surge across 3 bars (~850ms sequence).
 */
export function AnimatedBarChartIcon({ isHovered, className = "w-4 h-4" }: AnimatedIconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      animate={isHovered ? { scale: [1, 1.1, 1] } : { scale: 1 }}
      transition={{ duration: 0.8, ease: smoothEase }}
    >
      {/* Bar 1 (Left: shortest) */}
      <motion.line
        x1="6"
        y1="20"
        x2="6"
        initial={{ y2: 14 }}
        animate={isHovered ? { y2: [14, 6, 15, 14] } : { y2: 14 }}
        transition={{ duration: 0.75, ease: smoothEase }}
      />
      {/* Bar 2 (Middle: medium) */}
      <motion.line
        x1="12"
        y1="20"
        x2="12"
        initial={{ y2: 10 }}
        animate={isHovered ? { y2: [10, 3, 11, 10] } : { y2: 10 }}
        transition={{ duration: 0.75, delay: 0.15, ease: smoothEase }}
      />
      {/* Bar 3 (Right: tall) */}
      <motion.line
        x1="18"
        y1="20"
        x2="18"
        initial={{ y2: 4 }}
        animate={isHovered ? { y2: [4, 1, 5, 4] } : { y2: 4 }}
        transition={{ duration: 0.75, delay: 0.3, ease: smoothEase }}
      />
    </motion.svg>
  );
}

/**
 * Animated What-If Simulator Sliders Icon
 * Deliberate, clearly visible dual-layer line-drawing (~850ms sequence).
 */
export function AnimatedSlidersIcon({ isHovered, className = "w-4 h-4" }: AnimatedIconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      animate={isHovered ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.8, ease: smoothEase }}
    >
      {/* Subtle Base Layer */}
      <g opacity="0.3">
        <line x1="4" y1="8" x2="20" y2="8" />
        <line x1="8" y1="4" x2="8" y2="12" strokeWidth="2.5" />
        <line x1="4" y1="16" x2="20" y2="16" />
        <line x1="16" y1="12" x2="16" y2="20" strokeWidth="2.5" />
      </g>

      {/* Active Line-Drawing Layer */}
      {/* Top Track */}
      <motion.line
        x1="4"
        y1="8"
        x2="20"
        y2="8"
        initial={{ pathLength: 1 }}
        animate={isHovered ? { pathLength: [0, 1], opacity: [0.3, 1] } : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: smoothEase }}
      />
      {/* Top Slider Notch */}
      <motion.line
        x1="8"
        y1="4"
        x2="8"
        y2="12"
        strokeWidth="2.5"
        initial={{ pathLength: 1 }}
        animate={isHovered ? { pathLength: [0, 1], x: [0, 5, -1, 0] } : { pathLength: 1, x: 0 }}
        transition={{ duration: 0.65, delay: 0.2, ease: smoothEase }}
      />

      {/* Bottom Track */}
      <motion.line
        x1="4"
        y1="16"
        x2="20"
        y2="16"
        initial={{ pathLength: 1 }}
        animate={isHovered ? { pathLength: [0, 1], opacity: [0.3, 1] } : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15, ease: smoothEase }}
      />
      {/* Bottom Slider Notch */}
      <motion.line
        x1="16"
        y1="12"
        x2="16"
        y2="20"
        strokeWidth="2.5"
        initial={{ pathLength: 1 }}
        animate={isHovered ? { pathLength: [0, 1], x: [0, -5, 1, 0] } : { pathLength: 1, x: 0 }}
        transition={{ duration: 0.65, delay: 0.35, ease: smoothEase }}
      />
    </motion.svg>
  );
}

/**
 * Animated Batch Processor Cloud Upload Icon
 * Distinct sequential line drawing: Cloud perimeter -> Arrow stem -> Arrowhead chevron (~850ms).
 */
export function AnimatedCloudUploadIcon({ isHovered, className = "w-4 h-4" }: AnimatedIconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      animate={isHovered ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.8, ease: smoothEase }}
    >
      {/* Subtle Base Layer */}
      <g opacity="0.3">
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <polyline points="16 16 12 12 8 16" />
      </g>

      {/* Active Line-Drawing Layer */}
      {/* Cloud Perimeter */}
      <motion.path
        d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"
        initial={{ pathLength: 1 }}
        animate={isHovered ? { pathLength: [0, 1], opacity: [0.4, 1] } : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.75, ease: smoothEase }}
      />

      {/* Upload Arrow Shaft (Bottom to Top) */}
      <motion.line
        x1="12"
        y1="21"
        x2="12"
        y2="12"
        initial={{ pathLength: 1 }}
        animate={isHovered ? { pathLength: [0, 1], y: [2, 0] } : { pathLength: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.25, ease: smoothEase }}
      />

      {/* Upload Arrow Head (Chevron) */}
      <motion.polyline
        points="16 16 12 12 8 16"
        initial={{ pathLength: 1 }}
        animate={isHovered ? { pathLength: [0, 1], opacity: [0, 1] } : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.38, ease: smoothEase }}
      />
    </motion.svg>
  );
}

/**
 * Animated Playbooks Catalog Book Icon
 * Deliberate dual-page line drawing tracing from spine outwards (~800ms).
 */
export function AnimatedBookOpenIcon({ isHovered, className = "w-4 h-4" }: AnimatedIconProps) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      animate={isHovered ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.8, ease: smoothEase }}
    >
      {/* Subtle Base Layer */}
      <g opacity="0.3">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </g>

      {/* Active Line-Drawing Layer */}
      {/* Left Page Path */}
      <motion.path
        d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"
        initial={{ pathLength: 1 }}
        animate={isHovered ? { pathLength: [0, 1], opacity: [0.3, 1] } : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.75, ease: smoothEase }}
      />
      {/* Right Page Path */}
      <motion.path
        d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"
        initial={{ pathLength: 1 }}
        animate={isHovered ? { pathLength: [0, 1], opacity: [0.3, 1] } : { pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.75, delay: 0.18, ease: smoothEase }}
      />
    </motion.svg>
  );
}

/**
 * Animated Settings & Integrations Cog Icon
 * Relaxed 90-degree mechanical notch rotation (~850ms).
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
      animate={isHovered ? { rotate: [0, 95, 90], scale: [1, 1.12, 1] } : { rotate: 0, scale: 1 }}
      transition={{ duration: 0.85, ease: smoothEase }}
      style={{ transformOrigin: "center", transformBox: "fill-box" }}
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </motion.svg>
  );
}

/**
 * Animated Sound Speaker Icon
 * Calibrated 750ms sound wave arcs.
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
        animate={isHovered ? { rotate: [0, -12, 12, 0], scale: [1, 1.1, 1] } : { rotate: 0, scale: 1 }}
        transition={{ duration: 0.75, ease: smoothEase }}
        style={{ transformOrigin: "center", transformBox: "fill-box" }}
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
      animate={isHovered ? { scale: [1, 1.1, 1] } : { scale: 1 }}
      transition={{ duration: 0.75, ease: smoothEase }}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <motion.path
        d="M15.54 8.46a5 5 0 0 1 0 7.07"
        animate={isHovered ? { x: [0, 3, 0], opacity: [0.4, 1, 0.8] } : { x: 0, opacity: 0.7 }}
        transition={{ duration: 0.65, ease: smoothEase }}
      />
      <motion.path
        d="M19.07 4.93a10 10 0 0 1 0 14.14"
        animate={isHovered ? { x: [0, 5, 0], opacity: [0.2, 1, 0.8] } : { x: 0, opacity: 0.7 }}
        transition={{ duration: 0.75, delay: 0.15, ease: smoothEase }}
      />
    </motion.svg>
  );
}

/**
 * Animated Copilot Bot Icon
 * Calibrated 800ms bot head tilt and scale.
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
      animate={isHovered ? { rotate: [0, -14, 10, 0], scale: [1, 1.15, 1] } : { rotate: 0, scale: 1 }}
      transition={{ duration: 0.8, ease: smoothEase }}
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
