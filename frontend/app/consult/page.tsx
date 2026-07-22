"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useEmotion } from "@/context/EmotionContext";
import { useAssessments } from "@/hooks/useAssessments";

import { HealthSupportHero } from "@/components/health-support/HealthSupportHero";
import { EmergencyBanner } from "@/components/health-support/EmergencyBanner";
import { SupportNavigator } from "@/components/health-support/SupportNavigator";
import { CareRecommendations } from "@/components/health-support/CareRecommendations";
import { HealthCompanion } from "@/components/health-support/HealthCompanion";
import { ResourceTimeline } from "@/components/health-support/ResourceTimeline";
import { SupportResource } from "@/components/health-support/SupportCard";
import NearbyProfessionals from "@/components/NearbyProfessionals";

import { MapPin, ArrowLeft, HeartPulse } from "lucide-react";
import Link from "next/link";

export default function ConsultPage() {
  const { detectedEmotion, explanation, motivation } = useEmotion();
  const { data: assessments = [] } = useAssessments(1);

  const severity = assessments?.[0]?.risk_profile?.overall_risk?.level || "Minimal";

  // Cinematic Entrance State
  const [mounted, setMounted] = useState(false);
  const [entranceStep, setEntranceStep] = useState(0);

  // Active Category Filter ("all" | "clinical" | "crisis" | "self-care" | "wellness" | "guides")
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [showLocator, setShowLocator] = useState<boolean>(false);

  // Staggered Entrance Animation Pipeline
  useEffect(() => {
    setMounted(true);
    const timers = [
      setTimeout(() => setEntranceStep(1), 150),
      setTimeout(() => setEntranceStep(2), 350),
      setTimeout(() => setEntranceStep(3), 600),
      setTimeout(() => setEntranceStep(4), 850),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  // Handle Resource Action (e.g. open locator or navigate)
  const handleSelectResource = (resource: SupportResource) => {
    if (resource.id === "clinical-locator") {
      setShowLocator(true);
      window.scrollTo({ top: 600, behavior: "smooth" });
    }
  };

  return (
    <ProtectedRoute>
      <div
        className={`max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8 transition-all duration-700 ${
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
        }`}
      >
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <HeartPulse className="h-3.5 w-3.5 animate-pulse" />
            <span>Intelligent Care Navigator</span>
          </div>
        </div>

        {/* Step 1: Emergency Banner */}
        <div className={`transition-all duration-500 ${entranceStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <EmergencyBanner />
        </div>

        {/* Step 2: Living Hero */}
        <div className={`transition-all duration-500 ${entranceStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <HealthSupportHero
            emotion={detectedEmotion}
            scorePreview={86}
            motivationSnippet={motivation || explanation}
            availabilityStatus="24/7 Support Active"
          />
        </div>

        {/* Step 3: Support Navigator & Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Column */}
          <div className={`lg:col-span-8 space-y-6 transition-all duration-500 ${entranceStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <SupportNavigator
              activeCategory={activeCategory}
              onSelectCategory={(cat) => {
                setActiveCategory(cat);
                if (cat === "clinical") setShowLocator(true);
              }}
            />

            <CareRecommendations
              emotion={detectedEmotion}
              activeCategory={activeCategory}
              onSelectResource={handleSelectResource}
              onResetCategory={() => setActiveCategory("all")}
            />

            {/* Clinical Locator Section (when toggled or selected) */}
            {(showLocator || activeCategory === "clinical") && (
              <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                      Nearby Mental Health Professionals & Clinics
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowLocator(false)}
                    className="text-[10px] text-slate-400 hover:text-white font-bold"
                  >
                    Hide Directory
                  </button>
                </div>

                <NearbyProfessionals severity={severity} />
              </div>
            )}

            <ResourceTimeline />
          </div>

          {/* AI Companion Column */}
          <div className={`lg:col-span-4 space-y-6 transition-all duration-500 ${entranceStep >= 4 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <HealthCompanion
              emotion={detectedEmotion}
              activeCategory={activeCategory}
            />
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
