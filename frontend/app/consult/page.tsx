"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import NearbyProfessionals from "@/components/NearbyProfessionals";
import { useAssessments } from "@/hooks/useAssessments";
import { HeartPulse, Sparkles } from "lucide-react";

export default function ConsultPage() {
  const { data: assessments, isLoading } = useAssessments(1);
  const severity = assessments?.[0]?.risk_profile?.overall_risk?.level || "Minimal";

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto space-y-8 py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/50 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="absolute bottom-0 left-12 h-36 w-36 rounded-full bg-pink-500/5 blur-3xl" />
          
          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              <HeartPulse className="h-3.5 w-3.5 animate-pulse" />
              <span>Professional Care Networks</span>
            </div>
            <h1 className="bg-gradient-to-r from-white via-indigo-100 to-indigo-300 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent sm:text-4xl">
              👨‍⚕️ Consult a Mental Health Professional
            </h1>
            <p className="max-w-3xl text-slate-400 text-sm sm:text-base leading-relaxed">
              Find trusted psychologists, psychiatrists, therapists, and clinics near you. Use your current location or search manually.
            </p>
          </div>
        </div>

        {/* Info notice about future integrations */}
        <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
            <span>This directory supports physical navigation and direct contact. Telehealth, booking scheduling, and favorited doctors will be enabled soon.</span>
          </div>
        </div>

        {/* Nearby Professionals Locator widget container */}
        <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 shadow-xl backdrop-blur-xl">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : (
            <NearbyProfessionals severity={severity} />
          )}
        </div>

      </div>
    </ProtectedRoute>
  );
}
