"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, BrainCircuit } from "lucide-react";

interface Point3D {
  x: number;
  y: number;
  z: number;
  baseSize: number;
  color: string;
}

interface Connection {
  from: number;
  to: number;
  pulseProgress: number;
  pulseSpeed: number;
}

export default function HomePage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    // 1. Generate 3D Brain Point Cloud
    const points: Point3D[] = [];
    const numPoints = 550;
    const colors = [
      "rgba(99, 102, 241, 0.8)",  // indigo
      "rgba(139, 92, 246, 0.8)",  // purple
      "rgba(236, 72, 153, 0.8)",  // pink
      "rgba(59, 130, 246, 0.8)",  // blue
    ];

    for (let i = 0; i < numPoints; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      // Define brain lobe boundaries (ellipsoid ratios)
      const rx = 100;
      const ry = 80;
      const rz = 80;

      let x = rx * Math.sin(phi) * Math.cos(theta);
      let y = ry * Math.sin(phi) * Math.sin(theta);
      let z = rz * Math.cos(phi);

      // Create hemisphere fissure (separation down the middle)
      if (Math.abs(x) < 18) {
        x *= 0.35;
      }

      // Add high-frequency ripples (brain folds/gyri)
      const ripples = 1 + 0.08 * Math.sin(theta * 9) * Math.cos(phi * 9);
      x *= ripples;
      y *= ripples;
      z *= ripples;

      // Color nodes based on hemisphere and depth
      const color = colors[Math.floor(Math.random() * colors.length)];

      points.push({
        x,
        y: y - 10, // Center offset
        z,
        baseSize: Math.random() * 1.5 + 1.2,
        color,
      });
    }

    // 2. Generate connections (synaptic links)
    const connections: Connection[] = [];
    for (let i = 0; i < points.length; i++) {
      let linked = 0;
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dz = points[i].z - points[j].z;
        const dist = Math.hypot(dx, dy, dz);

        // Connect nearby points to form lobes
        if (dist < 30 && linked < 3 && Math.random() < 0.3) {
          connections.push({
            from: i,
            to: j,
            pulseProgress: Math.random(),
            pulseSpeed: Math.random() * 0.015 + 0.005,
          });
          linked++;
        }
      }
    }

    // 3. Generate drifting background stars
    const backgroundParticles: { x: number; y: number; size: number; speed: number; opacity: number }[] = [];
    const numBgParticles = 80;
    for (let i = 0; i < numBgParticles; i++) {
      backgroundParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.2 + 0.5,
        speed: Math.random() * 0.2 + 0.05,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    // Interactive rotation properties
    let rotationY = 0;
    let rotationX = 0;
    let targetRotationY = 0;
    let targetRotationX = 0;
    let scale = 1.0;
    let targetScale = 1.0;

    const handleMouseMove = (e: MouseEvent) => {
      // Rotate brain slightly in direction of cursor
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - width / 2;
      const mouseY = e.clientY - rect.top - height / 2;
      targetRotationY = (mouseX / width) * 0.8;
      targetRotationX = (mouseY / height) * 0.8;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize handler
    const handleResize = () => {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
      // Re-seed background particles positions
      backgroundParticles.forEach(p => {
        p.x = Math.random() * width;
        p.y = Math.random() * height;
      });
    };
    window.addEventListener("resize", handleResize);

    let frameCount = 0;
    let zoomLevel = 1.0;

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      frameCount++;

      // Check if user prefers reduced motion
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Handle transitions
      if (isTransitioning) {
        targetScale = 3.5;
        zoomLevel += (targetScale - zoomLevel) * 0.08;
      } else {
        // Continuous slow rotation if no mouse movement
        if (prefersReducedMotion) {
          targetRotationY = 0;
          targetRotationX = 0;
        } else {
          targetRotationY += 0.003;
        }
      }

      // Smooth interpolation for rotations and scales
      rotationY += (targetRotationY - rotationY) * 0.05;
      rotationX += (targetRotationX - rotationX) * 0.05;
      scale = isTransitioning ? zoomLevel : 1.0 + 0.04 * Math.sin(frameCount * 0.015); // Breathing breathing pulse

      const focalLength = 400;
      const cx = width / 2;
      const cy = height / 2;

      // Draw background particles
      ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
      backgroundParticles.forEach((p) => {
        if (!prefersReducedMotion) {
          p.y -= p.speed;
          if (p.y < 0) p.y = height;
        }
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      // Calculate projected 2D coordinates for all 3D points
      const projected = points.map((p) => {
        // 3D rotation around X axis
        let y1 = p.y * Math.cos(rotationX) - p.z * Math.sin(rotationX);
        const z1 = p.y * Math.sin(rotationX) + p.z * Math.cos(rotationX);

        // 3D rotation around Y axis
        let x2 = p.x * Math.cos(rotationY) + z1 * Math.sin(rotationY);
        let z2 = -p.x * Math.sin(rotationY) + z1 * Math.cos(rotationY);

        // Scale multipliers
        x2 *= scale;
        y1 *= scale;
        z2 *= scale;

        // Projection
        const dist = focalLength / (focalLength + z2);
        return {
          sx: cx + x2 * dist * 1.8,
          sy: cy + y1 * dist * 1.8,
          size: p.baseSize * dist * (isTransitioning ? 0.3 + (4 / scale) : 1),
          color: p.color,
          z: z2,
        };
      });

      // 4. Draw synaptic links
      connections.forEach((conn) => {
        const fromNode = projected[conn.from];
        const toNode = projected[conn.to];

        if (fromNode.sx > 0 && fromNode.sx < width && toNode.sx > 0 && toNode.sx < width) {
          const depthAlpha = Math.max(0.05, 1 - (fromNode.z + toNode.z) / 200);
          
          // Draw connection line
          ctx.strokeStyle = `rgba(99, 102, 241, ${0.12 * depthAlpha * (isTransitioning ? 1 / scale : 1)})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(fromNode.sx, fromNode.sy);
          ctx.lineTo(toNode.sx, toNode.sy);
          ctx.stroke();

          // Draw synapse pulse (glowing electrical discharge)
          if (!prefersReducedMotion) {
            conn.pulseProgress += conn.pulseSpeed;
            if (conn.pulseProgress > 1) {
              conn.pulseProgress = 0;
            }

            const px = fromNode.sx + (toNode.sx - fromNode.sx) * conn.pulseProgress;
            const py = fromNode.sy + (toNode.sy - fromNode.sy) * conn.pulseProgress;

            ctx.fillStyle = `rgba(168, 85, 247, ${0.8 * depthAlpha})`;
            ctx.beginPath();
            ctx.arc(px, py, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Sort nodes by depth (z-buffer) to render back to front
      const sortedNodes = [...projected].sort((a, b) => b.z - a.z);

      // 5. Draw neural nodes
      sortedNodes.forEach((node) => {
        ctx.fillStyle = node.color;
        
        // Add subtle neural glow for closer nodes
        if (node.z < -20 && !prefersReducedMotion && !isTransitioning) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = node.color;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(node.sx, node.sy, node.size, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Reset shadow blur
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [isTransitioning]);

  const handleStart = () => {
    setIsTransitioning(true);
    // Smooth transition delay before pushing to login route
    setTimeout(() => {
      router.push("/login");
    }, 750);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-screen overflow-hidden bg-[#030712] flex flex-col justify-between items-center py-12 transition-all duration-[750ms] ease-in-out ${
        isTransitioning ? "scale-95 opacity-0 pointer-events-none" : "scale-100 opacity-100"
      }`}
    >
      {/* 3D neural brain background canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
      />

      {/* Floating Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 h-96 w-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 h-96 w-96 bg-purple-500/10 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* Header / Brand */}
      <div className="relative z-10 flex flex-col items-center gap-2 animate-fadeIn">
        <div className="inline-flex items-center space-x-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 px-4 py-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>Intelligent Mental Wellness</span>
        </div>
      </div>

      {/* Center Welcome Card */}
      <div className="relative z-10 text-center max-w-xl px-4 space-y-6 flex flex-col items-center">
        {/* Glowing Circuit Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900/40 border border-white/[0.04] text-indigo-400 shadow-2xl backdrop-blur-xl mb-4 animate-pulse">
          <BrainCircuit className="h-8 w-8" />
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">
          MindCare <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">AI X</span>
        </h1>
        
        <p className="text-sm md:text-base text-slate-300 font-medium tracking-tight">
          AI-Powered Mental Wellness Platform
        </p>

        <p className="text-xs text-slate-500 max-w-sm italic">
          &ldquo;Understand your mind. Strengthen your well-being.&rdquo;
        </p>

        {/* Enter CTA */}
        <div className="pt-6 w-full max-w-xs space-y-3.5">
          <button
            onClick={handleStart}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs py-4 px-8 shadow-xl shadow-indigo-500/10 active:scale-[0.98] transition-all border border-indigo-500/20"
          >
            <span>Begin Your Wellness Journey</span>
          </button>
          
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1 animate-pulse">
            Powered by IBM watsonx Granite
          </p>
        </div>
      </div>

      {/* Footer Trust Disclaimer */}
      <div className="relative z-10 max-w-lg text-center px-6">
        <p className="text-[10px] text-slate-600 leading-relaxed font-semibold">
          Educational Stress-Coaching Platform · Standard WCAG AA Compliant
        </p>
      </div>
    </div>
  );
}
