"use client";

import React, { useEffect, useRef, useState } from "react";
import { useEmotion } from "@/context/EmotionContext";

interface Particle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
  targetAlpha: number;
  life: number;
  maxLife: number;
}

export function AmbientBackground() {
  const { theme } = useEmotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [motionDisabled, setMotionDisabled] = useState(false);

  // Sync motion settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setMotionDisabled(mediaQuery.matches);

      const listener = (e: MediaQueryListEvent) => setMotionDisabled(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    }
  }, []);

  useEffect(() => {
    if (motionDisabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle color maps
    const colorMap: Record<string, string> = {
      happy: "16, 185, 129",      // Emerald
      calm: "99, 102, 241",       // Indigo
      focused: "37, 99, 235",     // Deep Blue
      stressed: "20, 184, 166",    // Soft Teal
      anxious: "34, 197, 94",     // Pastel Green
      low_mood: "139, 92, 246",   // Lavender
    };

    const activeColor = colorMap[theme] || "99, 102, 241";

    // Setup density configuration based on theme
    const densityMap: Record<string, number> = {
      happy: 40,
      calm: 25,
      focused: 10, // Minimalist concentration environment
      stressed: 18,
      anxious: 22,
      low_mood: 16,
    };

    const maxParticles = densityMap[theme] || 25;
    const particles: Particle[] = [];

    const createParticle = (isInit = false): Particle => {
      const life = Math.random() * 0.4 + 0.6;
      return {
        x: Math.random() * width,
        y: isInit ? Math.random() * height : height + 10,
        size: Math.random() * 1.5 + 0.8,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -(Math.random() * 0.3 + 0.1),
        alpha: 0,
        targetAlpha: Math.random() * 0.35 + 0.1,
        life: 0,
        maxLife: life * 1200, // lifespan scale
      };
    };

    // Initialize particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(createParticle(true));
    }

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Render loop
    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life += 1;

        // Soft fade-in and fade-out near boundaries
        if (p.life < 120) {
          p.alpha += (p.targetAlpha - p.alpha) * 0.04;
        } else if (p.y < 50 || p.life > p.maxLife - 120) {
          p.alpha += (0 - p.alpha) * 0.04;
        }

        // Render point
        ctx.fillStyle = `rgba(${activeColor}, ${Math.max(0, p.alpha)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect nearby particles (subtle neural webs)
        for (let j = idx + 1; j < particles.length; j++) {
          const other = particles[j];
          const dist = Math.hypot(p.x - other.x, p.y - other.y);
          if (dist < 90) {
            const lineAlpha = (1 - dist / 90) * 0.03 * Math.min(p.alpha, other.alpha);
            ctx.strokeStyle = `rgba(${activeColor}, ${Math.max(0, lineAlpha)})`;
            ctx.lineWidth = 0.45;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }

        // Reset dead or out-of-bounds particles
        if (p.y < -10 || p.life >= p.maxLife || p.x < 0 || p.x > width) {
          particles[idx] = createParticle(false);
        }
      });

      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
    };
  }, [theme, motionDisabled]);

  // Specific orb colors matching dynamic theme definitions
  const orbColors: Record<string, { o1: string; o2: string; o3: string }> = {
    happy: { o1: "bg-emerald-500/10", o2: "bg-cyan-500/8", o3: "bg-teal-500/6" },
    calm: { o1: "bg-indigo-500/8", o2: "bg-blue-500/8", o3: "bg-sky-500/6" },
    focused: { o1: "bg-blue-600/5", o2: "bg-slate-800/8", o3: "bg-indigo-900/4" },
    stressed: { o1: "bg-teal-500/8", o2: "bg-amber-600/5", o3: "bg-emerald-600/4" },
    anxious: { o1: "bg-emerald-500/8", o2: "bg-green-400/6", o3: "bg-teal-400/5" },
    low_mood: { o1: "bg-purple-500/8", o2: "bg-violet-600/6", o3: "bg-indigo-500/6" },
  };

  const activeOrbs = orbColors[theme] || orbColors.calm;

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[-10] overflow-hidden bg-slate-950/20">
      {/* 3 Slow floating/drifting ambient orbs */}
      {!motionDisabled && (
        <>
          <div className={`absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[110px] ${activeOrbs.o1} animate-float-1 animate-breathe`} />
          <div className={`absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[110px] ${activeOrbs.o2} animate-float-2 animate-breathe`} style={{ animationDelay: "-3s" }} />
          <div className={`absolute top-[40%] left-[60%] w-[35vw] h-[35vw] rounded-full blur-[115px] ${activeOrbs.o3} animate-float-3 animate-breathe`} style={{ animationDelay: "-6s" }} />
        </>
      )}

      {/* 2D Neural particles canvas */}
      {!motionDisabled && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
    </div>
  );
}
