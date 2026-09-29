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

    // Ethereal Particle Orbs
    const orbs = [
      { x: width * 0.2, y: height * 0.25, r: 350, color: "rgba(99, 102, 241, 0.12)", vx: 0.4, vy: 0.2 },
      { x: width * 0.8, y: height * 0.35, r: 420, color: "rgba(236, 72, 153, 0.08)", vx: -0.3, vy: 0.3 },
      { x: width * 0.5, y: height * 0.75, r: 380, color: "rgba(56, 189, 248, 0.10)", vx: 0.2, vy: -0.4 },
      { x: width * 0.1, y: height * 0.85, r: 300, color: "rgba(168, 85, 247, 0.09)", vx: -0.2, vy: -0.2 },
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
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" />
      
      {/* Cyber-Lux Grid Mesh Texture */}
      <div 
        className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:32px_32px]"
      />

      {/* Top subtle vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#060911] via-transparent to-[#060911]/80" />
    </div>
  );
}
