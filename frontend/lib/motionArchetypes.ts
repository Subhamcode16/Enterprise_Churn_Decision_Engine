"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";

// Register useGSAP hook safely
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP);
}

/**
 * Motion Personality Archetype Tokens
 * Adheres strictly to the Motion Design & GSAP performance guidelines:
 * - Premium: 350-550ms, cubic-bezier(0.4, 0, 0.2, 1), 0% overshoot (luxury, architectural, smooth)
 * - Corporate: 200-350ms, cubic-bezier(0.2, 0, 0, 1), 0-3% overshoot (clean, authoritative, decisive)
 * - Energetic: 120-220ms, ease-out-expo, 15-20% overshoot (alert, urgent, high-reaction)
 * - Tactile / Playful: 150-250ms, ease-out-back, spring overshoot (snappy feedback for buttons/pills)
 */
export const MOTION_ARCHETYPES = {
  premium: {
    duration: 0.52,
    ease: "power3.out",
    overshoot: 0,
    stagger: 0.08,
    scaleHover: 1.015,
  },
  corporate: {
    duration: 0.32,
    ease: "power2.out",
    overshoot: 0.02,
    stagger: 0.05,
    scaleHover: 1.012,
  },
  energetic: {
    duration: 0.18,
    ease: "expo.out",
    overshoot: 0.18,
    stagger: 0.03,
    scaleHover: 1.025,
  },
  tactile: {
    duration: 0.22,
    ease: "back.out(1.6)",
    overshoot: 0.12,
    scalePress: 0.96,
    scaleHover: 1.02,
  },
} as const;

export type MotionArchetypeKey = "premium" | "corporate" | "energetic";

/**
 * Accessibility check for reduced motion
 */
export function isReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Creates high-performance 3D Card Tilt with GSAP quickTo
 * Ensures 60fps GPU acceleration without layout thrashing
 */
export function createCardTilt(cardElement: HTMLElement, archetype: keyof typeof MOTION_ARCHETYPES = "corporate") {
  if (isReducedMotion()) return () => {};

  const config = MOTION_ARCHETYPES[archetype];
  
  // Set initial 3D transforms
  gsap.set(cardElement, {
    transformPerspective: 1000,
    transformStyle: "preserve-3d",
    willChange: "transform, box-shadow",
  });

  const xTo = gsap.quickTo(cardElement, "rotationY", {
    duration: config.duration,
    ease: config.ease,
  });
  const yTo = gsap.quickTo(cardElement, "rotationX", {
    duration: config.duration,
    ease: config.ease,
  });
  const scaleTo = gsap.quickTo(cardElement, "scale", {
    duration: config.duration * 0.7,
    ease: config.ease,
  });

  const handleMouseMove = (e: MouseEvent) => {
    const rect = cardElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Subtle max rotation (3-5 deg)
    const maxRot = archetype === "energetic" ? 5 : 3.5;
    const rotX = ((y - centerY) / centerY) * -maxRot;
    const rotY = ((x - centerX) / centerX) * maxRot;

    xTo(rotY);
    yTo(rotX);
    scaleTo(config.scaleHover);
  };

  const handleMouseLeave = () => {
    xTo(0);
    yTo(0);
    scaleTo(1);
  };

  cardElement.addEventListener("mousemove", handleMouseMove);
  cardElement.addEventListener("mouseleave", handleMouseLeave);

  return () => {
    cardElement.removeEventListener("mousemove", handleMouseMove);
    cardElement.removeEventListener("mouseleave", handleMouseLeave);
  };
}

/**
 * Specular Sheen Sweep for Premium Cards
 */
export function triggerSpecularSheen(sheenElement: HTMLElement) {
  if (isReducedMotion() || !sheenElement) return;

  gsap.fromTo(
    sheenElement,
    { xPercent: -120, opacity: 0 },
    {
      xPercent: 220,
      opacity: 0.35,
      duration: 0.85,
      ease: "power2.inOut",
      overwrite: "auto",
    }
  );
}
