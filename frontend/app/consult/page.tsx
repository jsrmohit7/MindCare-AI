"use client";

import React from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import NearbyProfessionals from "@/components/NearbyProfessionals";
import { useAssessments } from "@/hooks/useAssessments";
import { HeartPulse, Sparkles } from "lucide-react";
import Card from "@/components/Card";

export default function ConsultPage() {
  const { data: assessments, isLoading } = useAssessments(1);
  const severity = assessments?.[0]?.risk_profile?.overall_risk?.level || "Minimal";

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Page Header */}
        <div className="space-y-1.5 border-b border-white/[0.04] pb-6">
          <div className="inline-flex items-center space-x-2 rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-[9px] font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-wider mb-1">
            <HeartPulse className="h-3.5 w-3.5 animate-pulse" />
            <span>Care Network</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            👨‍⚕️ Clinical Locator
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Find trusted psychologists, psychiatrists, therapists, and wellness clinics near you. Use your location or search manually.
          </p>
        </div>

        {/* Info notice about future integrations */}
        <div className="rounded-2xl border border-white/[0.04] bg-slate-900/20 p-4 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 backdrop-blur-xl">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
            <span className="font-semibold">This directory supports physical locator features. Booking appointments and doctor messaging will be enabled soon.</span>
          </div>
        </div>

        {/* Nearby Professionals Locator widget container */}
        <Card className="p-6">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            </div>
          ) : (
            <NearbyProfessionals severity={severity} />
          )}
        </Card>

      </div>
    </ProtectedRoute>
  );
}
