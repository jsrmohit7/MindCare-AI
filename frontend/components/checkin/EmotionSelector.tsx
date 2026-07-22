"use client";

import React from "react";
import { SmilePlus, Smile, Meh, Frown, Target, ShieldAlert } from "lucide-react";

export interface EmotionOption {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  color: string;
  bgGlow: string;
  accentBorder: string;
}

const EMOTIONS: EmotionOption[] = [
  {
    id: "Happy",
    name: "Happy",
    desc: "Joyful, energized, and fulfilled",
    icon: SmilePlus,
    color: "text-amber-400",
    bgGlow: "from-amber-500/20 to-yellow-500/10",
    accentBorder: "border-amber-500/30 hover:border-amber-400",
  },
  {
    id: "Calm",
    name: "Calm",
    desc: "Peaceful, relaxed, and balanced",
    icon: Smile,
    color: "text-emerald-400",
    bgGlow: "from-emerald-500/20 to-teal-500/10",
    accentBorder: "border-emerald-500/30 hover:border-emerald-400",
  },
  {
    id: "Focused",
    name: "Focused",
    desc: "Clear-minded, driven, and productive",
    icon: Target,
    color: "text-indigo-400",
    bgGlow: "from-indigo-500/20 to-purple-500/10",
    accentBorder: "border-indigo-500/30 hover:border-indigo-400",
  },
  {
    id: "Stressed",
    name: "Stressed",
    desc: "Under pressure or feeling overwhelmed",
    icon: Meh,
    color: "text-amber-500",
    bgGlow: "from-amber-600/20 to-orange-500/10",
    accentBorder: "border-amber-600/30 hover:border-amber-500",
  },
  {
    id: "Anxious",
    name: "Anxious",
    desc: "Unsettled, nervous, or apprehensive",
    icon: ShieldAlert,
    color: "text-pink-400",
    bgGlow: "from-pink-500/20 to-rose-500/10",
    accentBorder: "border-pink-500/30 hover:border-pink-400",
  },
  {
    id: "Low Mood",
    name: "Low Mood",
    desc: "Feeling down, tired, or drained",
    icon: Frown,
    color: "text-rose-400",
    bgGlow: "from-rose-500/20 to-red-500/10",
    accentBorder: "border-rose-500/30 hover:border-rose-400",
  },
];

interface EmotionSelectorProps {
  selectedEmotion: string;
  onSelectEmotion: (emotionName: string) => void;
}

export function EmotionSelector({ selectedEmotion, onSelectEmotion }: EmotionSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-extrabold text-white uppercase tracking-wider block">
          Select Your Emotional Baseline
        </label>
        <span className="text-[10px] text-slate-400 font-semibold">
          Theme previews live
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {EMOTIONS.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedEmotion.toLowerCase() === item.name.toLowerCase() ||
            (item.name === "Happy" && (selectedEmotion === "Very Happy" || selectedEmotion === "Happy")) ||
            (item.name === "Low Mood" && (selectedEmotion === "Sad" || selectedEmotion === "Very Sad" || selectedEmotion === "Low Mood")) ||
            (item.name === "Calm" && (selectedEmotion === "Neutral" || selectedEmotion === "Calm"));

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectEmotion(item.name)}
              className={`
                group relative p-4 rounded-2xl border text-left transition-all duration-300 backdrop-blur-xl flex flex-col justify-between h-32 cursor-pointer outline-none
                ${isSelected
                  ? `bg-gradient-to-br ${item.bgGlow} border-accent shadow-lg shadow-accent/20 scale-[1.03]`
                  : `bg-slate-900/40 ${item.accentBorder} hover:-translate-y-1 hover:bg-white/[0.04]`
                }
              `}
            >
              {/* Top Row: Icon & Selection indicator */}
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl bg-white/[0.04] border border-white/[0.08] ${item.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
                {isSelected && (
                  <span className="h-2.5 w-2.5 rounded-full bg-accent animate-ping" />
                )}
              </div>

              {/* Text info */}
              <div className="space-y-0.5 pt-2">
                <h4 className="text-xs font-bold text-white group-hover:text-accent transition-colors flex items-center justify-between">
                  {item.name}
                </h4>
                <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                  {item.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
