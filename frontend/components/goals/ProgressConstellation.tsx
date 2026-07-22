"use client";

import React, { useMemo } from "react";
import { WellnessGoal } from "@/services/goals";
import { Sparkles } from "lucide-react";

interface ProgressConstellationProps {
  goals: WellnessGoal[];
  onSelectGoal?: (goal: WellnessGoal) => void;
}

export function ProgressConstellation({ goals, onSelectGoal }: ProgressConstellationProps) {
  // Generate constellation coordinates for nodes
  const constellationNodes = useMemo(() => {
    if (goals.length === 0) return [];
    
    const count = goals.length;
    const width = 600;
    const height = 220;
    const padding = 50;

    return goals.map((goal, index) => {
      // Position along a gentle sine wave
      const x = padding + (index / Math.max(1, count - 1)) * (width - padding * 2);
      const wave = Math.sin((index / Math.max(1, count)) * Math.PI * 2);
      const y = height / 2 + wave * 45;

      return {
        goal,
        x,
        y,
        isCompleted: goal.status === "completed",
        isActive: goal.status === "active",
      };
    });
  }, [goals]);

  if (goals.length === 0) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-4 overflow-hidden relative">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Constellation Progress Galaxy
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-semibold">
          {goals.filter((g) => g.status === "completed").length} / {goals.length} Stars Illuminated
        </span>
      </div>

      {/* Constellation SVG Viewport */}
      <div className="relative h-56 w-full flex items-center justify-center bg-slate-950/60 rounded-2xl border border-white/[0.04] overflow-hidden">
        {/* Ambient starry glow background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-accent/10 via-slate-950/80 to-slate-950 pointer-events-none" />

        <svg viewBox="0 0 600 220" className="w-full h-full relative z-10">
          <defs>
            <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Connecting Constellation Lines */}
          {constellationNodes.map((node, i) => {
            if (i === 0) return null;
            const prev = constellationNodes[i - 1];
            const isLineActive = node.isCompleted && prev.isCompleted;

            return (
              <line
                key={`line-${i}`}
                x1={prev.x}
                y1={prev.y}
                x2={node.x}
                y2={node.y}
                stroke={isLineActive ? "rgba(99, 102, 241, 0.8)" : "rgba(255, 255, 255, 0.12)"}
                strokeWidth={isLineActive ? "2" : "1"}
                strokeDasharray={isLineActive ? "none" : "4 4"}
                className="transition-all duration-700"
              />
            );
          })}

          {/* Star Nodes */}
          {constellationNodes.map((node, i) => (
            <g
              key={node.goal._id || i}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer group"
              onClick={() => onSelectGoal && onSelectGoal(node.goal)}
            >
              {/* Outer pulsing ring for active nodes */}
              {node.isActive && (
                <circle
                  r="16"
                  fill="none"
                  stroke="rgba(99, 102, 241, 0.5)"
                  strokeWidth="1.5"
                  className="animate-ping origin-center"
                />
              )}

              {/* Glowing background aura */}
              <circle
                r={node.isCompleted ? "14" : "10"}
                fill={node.isCompleted ? "rgba(16, 185, 129, 0.2)" : "rgba(99, 102, 241, 0.15)"}
                filter="url(#starGlow)"
              />

              {/* Star Core Circle */}
              <circle
                r={node.isCompleted ? "8" : "6"}
                fill={node.isCompleted ? "#10b981" : node.isActive ? "#6366f1" : "#475569"}
                className="transition-all duration-300 group-hover:scale-125"
              />

              {/* Star Icon Overlay */}
              <text
                x="0"
                y="18"
                textAnchor="middle"
                className="text-[9px] font-bold fill-slate-300 opacity-80 group-hover:opacity-100 group-hover:fill-accent transition-all"
              >
                {node.goal.title.length > 12 ? `${node.goal.title.slice(0, 10)}...` : node.goal.title}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
