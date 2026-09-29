"use client";

import { useEffect, useRef } from "react";

export default function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Warm Obsidian & Champagne Amber Orbs
    const orbs = [
      { x: width * 0.25, y: height * 0.2, r: 400, color: "rgba(245, 158, 11, 0.08)", vx: 0.25, vy: 0.15 },
      { x: width * 0.75, y: height * 0.3, r: 450, color: "rgba(217, 119, 6, 0.06)", vx: -0.2, vy: 0.2 },
      { x: width * 0.5, y: height * 0.8, r: 400, color: "rgba(180, 83, 9, 0.05)", vx: 0.15, vy: -0.25 },
      { x: width * 0.1, y: height * 0.85, r: 350, color: "rgba(120, 113, 108, 0.06)", vx: -0.15, vy: -0.15 },
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      orbs.forEach((orb) => {
        orb.x += orb.vx;
        orb.y += orb.vy;

        if (orb.x < -orb.r) orb.x = width + orb.r;
        if (orb.x > width + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = height + orb.r;
        if (orb.y > height + orb.r) orb.y = -orb.r;

        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r);
        grad.addColorStop(0, orb.color);
        grad.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dynamic Animated Canvas Mesh */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-90" />
      
      {/* Hairline Grid Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.025] bg-[linear-gradient(to_right,#d6d3d1_1px,transparent_1px),linear-gradient(to_bottom,#d6d3d1_1px,transparent_1px)] bg-[size:36px_36px]"
      />

      {/* Deep Obsidian Edge Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0E0D0C] via-transparent to-[#0E0D0C]/80" />
    </div>
  );
}
