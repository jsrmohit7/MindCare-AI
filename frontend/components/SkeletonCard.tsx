"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
}

export function SkeletonLine({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`living-glass-skeleton rounded-lg bg-white/5 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`rounded-2xl border border-white/5 bg-slate-900/40 p-6 space-y-4 living-glass-skeleton ${className}`}
      aria-hidden="true"
      role="status"
      aria-label="Loading..."
    >
      <div className="flex items-center space-x-3">
        <div className="h-10 w-10 rounded-xl bg-white/5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-white/5" />
          <div className="h-3 w-1/2 rounded bg-white/5" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-white/5" />
        <div className="h-3 w-5/6 rounded bg-white/5" />
        <div className="h-3 w-4/6 rounded bg-white/5" />
      </div>
      <div className="h-9 w-full rounded-xl bg-white/5" />
    </div>
  );
}

export function SkeletonAssessmentCard() {
  return (
    <div
      className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 living-glass-skeleton"
      role="status"
      aria-label="Loading assessment..."
    >
      <div className="flex items-center gap-6">
        <div className="hidden sm:block h-12 w-12 rounded-2xl bg-white/5" />
        <div className="space-y-3 flex-1">
          <div className="flex gap-3">
            <div className="h-4 w-40 rounded bg-white/5" />
            <div className="h-4 w-20 rounded-full bg-white/5" />
          </div>
          <div className="flex gap-4">
            <div className="h-3 w-32 rounded bg-white/5" />
            <div className="h-3 w-24 rounded bg-white/5" />
          </div>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <div className="h-9 w-20 rounded-xl bg-white/5" />
        <div className="h-9 w-20 rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

export function SkeletonWellnessCard() {
  return (
    <div
      className="rounded-2xl border border-white/5 bg-slate-900/40 p-6 space-y-4 living-glass-skeleton"
      role="status"
      aria-label="Loading wellness record..."
    >
      <div className="flex justify-between items-center pb-2 border-b border-white/5">
        <div className="h-3 w-24 rounded bg-white/5" />
        <div className="h-5 w-16 rounded-full bg-white/5" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-white/5" />
        ))}
      </div>
      <div className="h-9 w-full rounded-xl bg-white/5" />
    </div>
  );
}

export default SkeletonCard;
