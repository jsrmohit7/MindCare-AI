"use client";

import React, { useMemo } from "react";
import { SupportCard, SupportResource } from "./SupportCard";
import { Sparkles, HeartPulse } from "lucide-react";

interface CareRecommendationsProps {
  emotion: string;
  activeCategory: string;
  onSelectResource: (resource: SupportResource) => void;
}

const DEFAULT_RESOURCES: SupportResource[] = [
  {
    id: "988-lifeline",
    title: "988 Suicide & Crisis Lifeline",
    category: "crisis",
    description: "24/7 free and confidential support for people in distress or crisis. Call or text anytime.",
    availability: "24/7 Available",
    contact: "988",
    actionText: "Call 988",
    actionType: "phone",
    recommendedFor: ["Stressed", "Anxious", "Low Mood"],
  },
  {
    id: "crisis-text-line",
    title: "Crisis Text Line",
    category: "crisis",
    description: "Text HOME to 741741 to connect with a crisis counselor 24/7 for free emotional support.",
    availability: "24/7 Text",
    contact: "741741",
    actionText: "Text 741741",
    actionType: "phone",
    recommendedFor: ["Stressed", "Anxious"],
  },
  {
    id: "box-breathing",
    title: "Guided Box Breathing & Grounding",
    category: "self-care",
    description: "A 4-4-4-4 physiological breathing technique designed to reduce acute stress and regulate heart rate.",
    availability: "Instant Access",
    actionText: "Start Breathing",
    actionType: "internal",
    recommendedFor: ["Stressed", "Anxious", "Calm"],
  },
  {
    id: "clinical-locator",
    title: "Find Nearby Mental Health Professionals",
    category: "clinical",
    description: "Locate verified psychiatrists, psychologists, and licensed clinical therapists near your area.",
    availability: "Search Directory",
    actionText: "Open Locator",
    actionType: "internal",
    recommendedFor: ["Stressed", "Anxious", "Low Mood", "Calm"],
  },
  {
    id: "daily-journal-habit",
    title: "Reflective Gratitude Journaling",
    category: "wellness",
    description: "Capture daily emotional reflections and let watsonx AI provide personalized cognitive insights.",
    availability: "Instant Access",
    actionText: "Open Journal",
    actionType: "internal",
    recommendedFor: ["Happy", "Calm", "Focused"],
  },
  {
    id: "sleep-hygiene-guide",
    title: "Evidence-Based Sleep Hygiene Guide",
    category: "guides",
    description: "Practical habits and circadian rhythm guidelines to improve sleep duration and nightly rest quality.",
    availability: "3 min read",
    actionText: "Read Guide",
    actionType: "internal",
    recommendedFor: ["Calm", "Focused", "Stressed"],
  },
];

import { HealthSupportEmptyState } from "./HealthSupportEmptyState";

interface CareRecommendationsProps {
  emotion: string;
  activeCategory: string;
  onSelectResource: (resource: SupportResource) => void;
  onResetCategory?: () => void;
}

export function CareRecommendations({
  emotion,
  activeCategory,
  onSelectResource,
  onResetCategory,
}: CareRecommendationsProps) {
  
  // Emotion-adaptive filtering & sorting
  const filteredResources = useMemo(() => {
    let list = DEFAULT_RESOURCES;

    if (activeCategory !== "all") {
      list = list.filter((r) => r.category === activeCategory);
    }

    // Sort resources so that those recommended for current emotion appear first
    return [...list].sort((a, b) => {
      const recA = a.recommendedFor?.includes(emotion) ? 1 : 0;
      const recB = b.recommendedFor?.includes(emotion) ? 1 : 0;
      return recB - recA;
    });
  }, [activeCategory, emotion]);

  if (filteredResources.length === 0) {
    return (
      <HealthSupportEmptyState
        emotion={emotion}
        onResetFilter={() => onResetCategory && onResetCategory()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Care & Support Options ({filteredResources.length})
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
          <Sparkles className="h-3 w-3 text-accent" /> Prioritized for {emotion}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResources.map((resource) => (
          <SupportCard
            key={resource.id}
            resource={resource}
            onAction={onSelectResource}
          />
        ))}
      </div>
    </div>
  );
}
