"use client";

import React from "react";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
import { BookOpen, ArrowRight } from "lucide-react";

interface JournalEmptyStateProps {
  emotion: string;
  onSelectPrompt: (prompt: string) => void;
}

export function JournalEmptyState({ emotion, onSelectPrompt }: JournalEmptyStateProps) {
  const starters = [
    { title: "Daily Reflection", desc: "Reflect on how your day went and what you learned", prompt: "Today went... What stood out to me most was..." },
    { title: "Gratitude Log", desc: "List 3 things you are grateful for right now", prompt: "Three things I am truly grateful for today:" },
    { title: "Emotional Check-In", desc: "Explore what feelings are present in your mind", prompt: "Right now, I am feeling... because..." },
    { title: "Goal Progress", desc: "Write down your key wins and next steps", prompt: "A key win I achieved today was... Next, I want to..." },
  ];

  return (
    <div className="py-12 px-6 rounded-3xl border border-white/[0.08] bg-slate-950/40 backdrop-blur-3xl shadow-2xl flex flex-col items-center justify-center text-center space-y-6 animate-fadeInUp">
      <div className="relative">
        <AIPresenceOrb
          size="lg"
          emotion={emotion}
          showOuterRing={true}
          interactive={true}
        />
        <div className="absolute inset-0 bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse" />
      </div>

      <div className="max-w-md space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/30 text-accent text-[10px] font-bold uppercase tracking-wider">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Your Digital Wellness Diary</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Begin Your Reflection Journey
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          Your journal is attuned to your current state (<span className="text-accent font-semibold">{emotion}</span>). Select a prompt below or start writing freely.
        </p>
      </div>

      {/* Writing Starters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl text-left pt-2">
        {starters.map((card, i) => (
          <button
            key={i}
            onClick={() => onSelectPrompt(card.prompt)}
            className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-accent/40 hover:bg-white/[0.05] transition-all group cursor-pointer text-left space-y-1 shadow-sm"
          >
            <p className="text-xs font-bold text-white group-hover:text-accent transition-colors flex items-center justify-between">
              {card.title}
              <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </p>
            <p className="text-[11px] text-slate-400 leading-snug">{card.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
