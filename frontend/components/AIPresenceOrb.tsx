"use client";

import React, { useRef, useEffect } from "react";

export interface AIPresenceOrbProps {
  emotion?: string; // Optional: If provided, can be used to override accent color, otherwise inherits --accent
  size?: "sm" | "md" | "lg" | "xl"; // sm=16, md=28, lg=48, xl=64
  intensity?: number; // 0.0 to 1.0 multiplier for particle speed/count
  state?: "idle" | "thinking" | "speaking";
  showNeuralConnections?: boolean;
  showOuterRing?: boolean;
  interactive?: boolean;
}

export function AIPresenceOrb({
  emotion,
  size = "md",
  intensity = 1.0,
  state = "idle",
  showNeuralConnections = true,
  showOuterRing = true,
  interactive = false,
}: AIPresenceOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Map size prop to Tailwind classes
  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-28 w-28", // Dashboard default
    lg: "h-48 w-48",
    xl: "h-64 w-64",
  };

  const containerSizeClass = sizeClasses[size] || sizeClasses.md;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    
    // Set internal canvas resolution based on size
    let canvasRes = 120;
    if (size === "sm") canvasRes = 80;
    if (size === "lg") canvasRes = 240;
    if (size === "xl") canvasRes = 320;
    
    const width = (canvas.width = canvasRes);
    const height = (canvas.height = canvasRes);

    const getAccentColor = () => {
      // If emotion/theme dictates a specific color, we could map it here.
      // For now, respect the global --accent variable to match Dashboard behavior perfectly.
      if (typeof window !== "undefined") {
        const bodyStyles = window.getComputedStyle(document.body);
        const accent = bodyStyles.getPropertyValue("--accent").trim();
        return accent || "#6366f1";
      }
      return "#6366f1";
    };

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }

    const particles: Particle[] = [];
    const baseParticleCount = size === "sm" ? 10 : size === "md" ? 18 : 30;
    const particleCount = Math.floor(baseParticleCount * intensity);
    
    // In thinking state, particles move faster
    const speedMultiplier = state === "thinking" ? 2.5 : 1.0;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4 * speedMultiplier,
        vy: (Math.random() - 0.5) * 0.4 * speedMultiplier,
        radius: Math.random() * 1.5 + 1,
      });
    }

    let angle = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const accent = getAccentColor();

      // Outer glow
      const outerGlow = ctx.createRadialGradient(
        width / 2,
        height / 2,
        width * 0.05,
        width / 2,
        height / 2,
        width * 0.45
      );
      
      // If thinking, glow pulses more intensely
      const glowOpacity = state === "thinking" ? "50" : "35";
      outerGlow.addColorStop(0, `${accent}${glowOpacity}`);
      outerGlow.addColorStop(1, `${accent}00`);
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, width * 0.45, 0, Math.PI * 2);
      ctx.fill();

      // Neural Connections
      if (showNeuralConnections) {
        ctx.strokeStyle = `${accent}${state === "thinking" ? "30" : "15"}`;
        ctx.lineWidth = state === "thinking" ? 1.0 : 0.5;
        const connectionDist = width * 0.3;
        for (let i = 0; i < particleCount; i++) {
          for (let j = i + 1; j < particleCount; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < connectionDist) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.stroke();
            }
          }
        }
      }

      // Draw Particles
      ctx.fillStyle = `${accent}80`;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off walls
        const margin = 10;
        if (p.x < margin || p.x > width - margin) p.vx *= -1;
        if (p.y < margin || p.y > height - margin) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Core pulsing
      angle += state === "thinking" ? 0.1 : 0.04;
      const basePulse = width * 0.125;
      const pulseVariance = width * 0.02;
      const pulseRadius = basePulse + Math.sin(angle) * pulseVariance;
      
      const coreGlow = ctx.createRadialGradient(
        width / 2,
        height / 2,
        2,
        width / 2,
        height / 2,
        pulseRadius
      );
      coreGlow.addColorStop(0, "#ffffff");
      coreGlow.addColorStop(0.3, `${accent}dd`);
      coreGlow.addColorStop(1, `${accent}00`);

      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, pulseRadius, 0, Math.PI * 2);
      ctx.fill();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [size, intensity, state, showNeuralConnections, emotion]);

  return (
    <div
      className={`relative flex items-center justify-center bg-white/[0.01] border border-white/[0.03] rounded-full shadow-[0_0_20px_rgba(var(--accent-rgb),0.02)] shrink-0 ${containerSizeClass} ${
        interactive ? "cursor-pointer hover:scale-105 transition-transform duration-300" : ""
      }`}
    >
      {showOuterRing && (
        <>
          <div
            className={`absolute inset-2 rounded-full border border-dashed border-accent/15 animate-spin ${
              state === "thinking" ? "animate-pulse" : ""
            }`}
            style={{ animationDuration: state === "thinking" ? "15s" : "30s" }}
          />
          <div
            className="absolute inset-4 rounded-full border border-accent/10 animate-spin"
            style={{
              animationDuration: state === "thinking" ? "7s" : "15s",
              animationDirection: "reverse",
            }}
          />
        </>
      )}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
