"use client";

import React from "react";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
import { Brain, Sparkles, HeartHandshake, Lightbulb } from "lucide-react";

interface JournalCompanionProps {
  emotion: string;
  advice?: string;
  motivation?: string;
  isIdle?: boolean;
  submitting?: boolean;
  onApplyPrompt?: (prompt: string) => void;
}

export function JournalCompanion({
  emotion,
  advice,
  motivation,
  isIdle = false,
  submitting = false,
  onApplyPrompt,
}: JournalCompanionProps) {
  // Emotion-tailored writing starters
  const emotionStarters: Record<string, string[]> = {
    Happy: [
      "What contributed most to your joy today?",
      "How can you share this positive energy with others?",
    ],
    Calm: [
      "What brought you peace in this moment?",
      "How did you ground yourself today?",
    ],
    Focused: [
      "What key milestones did you achieve today?",
      "What is your top priority for tomorrow?",
    ],
    Stressed: [
      "What factors feel heavy right now?",
      "What is one small burden you can release?",
    ],
    Anxious: [
      "What are 3 things around you that ground you?",
      "What thoughts can you reframe with compassion?",
    ],
    "Low Mood": [
      "What is one gentle act of self-care you did?",
      "What is a warm memory you can look back on?",
    ],
  };

  const starters = emotionStarters[emotion] || emotionStarters["Calm"];

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            AI Journal Companion
          </h3>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          Attuned
        </span>
      </div>

      {/* Shared AIPresenceOrb */}
      <div className="flex flex-col items-center justify-center p-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl relative overflow-hidden text-center space-y-3">
        <AIPresenceOrb
          size="sm"
          state={submitting ? "thinking" : "idle"}
          emotion={emotion}
          showOuterRing={true}
          interactive={true}
        />
        <div>
          <p className="text-xs font-bold text-white">Granite Reflection Engine</p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {submitting ? "Analyzing entry sentiment..." : `Attuned to ${emotion}`}
          </p>
        </div>
      </div>

      {/* Idle Pause Gentle Prompt */}
      {isIdle && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-1.5 animate-fadeIn">
          <div className="flex items-center gap-1.5 font-bold">
            <Lightbulb className="h-4 w-4 text-amber-400" />
            <span>Gentle Reflection Pause</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            You paused writing. Take a deep breath: What feelings emerge as you reflect on this?
          </p>
        </div>
      )}

      {/* Advice / Motivation */}
      {(advice || motivation) && (
        <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-accent uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Granite Guidance</span>
          </div>
          {advice && <p className="text-xs text-slate-300 italic leading-relaxed">&quot;{advice}&quot;</p>}
          {motivation && <p className="text-[10px] text-slate-400 font-medium">{motivation}</p>}
        </div>
      )}

      {/* Emotion-Tailored Writing Starters */}
      <div className="space-y-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Reflection Starters
        </span>
        <div className="space-y-1.5">
          {starters.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => onApplyPrompt && onApplyPrompt(prompt)}
              className="w-full p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-accent/30 hover:bg-white/[0.05] text-left text-[11px] text-slate-300 hover:text-white transition-all group flex items-start gap-2"
            >
              <HeartHandshake className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
