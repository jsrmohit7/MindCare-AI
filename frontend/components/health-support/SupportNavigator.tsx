"use client";

import React from "react";
import { Compass, UserCheck, ShieldAlert, Heart, BookOpen, Activity } from "lucide-react";

interface SupportNavigatorProps {
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}

export function SupportNavigator({
  activeCategory,
  onSelectCategory,
}: SupportNavigatorProps) {
  const categories = [
    { id: "all", label: "All Support", icon: Compass },
    { id: "clinical", label: "Professional Care", icon: UserCheck },
    { id: "crisis", label: "Crisis Helplines", icon: ShieldAlert },
    { id: "self-care", label: "Self-Care & Grounding", icon: Heart },
    { id: "wellness", label: "Wellness Activities", icon: Activity },
    { id: "guides", label: "Educational Guides", icon: BookOpen },
  ];

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-emerald-400" />
          <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Care Category Navigator
          </h3>
        </div>
        <span className="text-[10px] text-slate-400 font-semibold">
          Filter by support type
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`
                px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all duration-300 active:scale-95
                ${isActive
                  ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/10"
                  : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white hover:border-white/20"
                }
              `}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
