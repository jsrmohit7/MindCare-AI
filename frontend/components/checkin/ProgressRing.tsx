"use client";

import React from "react";

interface ProgressRingProps {
  currentStep: number;
  totalSteps: number;
  size?: number; // default 70
  strokeWidth?: number; // default 6
}

export function ProgressRing({
  currentStep,
  totalSteps,
  size = 64,
  strokeWidth = 5,
}: ProgressRingProps) {
  const percent = Math.min(100, Math.round((currentStep / totalSteps) * 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/[0.06]"
          fill="transparent"
        />
        {/* Animated Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-accent transition-all duration-700 ease-out"
          fill="transparent"
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-xs font-black text-white">{percent}%</span>
      </div>
    </div>
  );
}
