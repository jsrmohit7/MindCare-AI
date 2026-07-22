"use client";

import React from "react";
import { ExternalLink, Phone, Clock } from "lucide-react";

export interface SupportResource {
  id: string;
  title: string;
  category: "clinical" | "crisis" | "self-care" | "wellness" | "guides";
  description: string;
  availability: string;
  contact?: string;
  actionText: string;
  actionUrl?: string;
  actionType?: "phone" | "link" | "internal";
  recommendedFor?: string[];
}

interface SupportCardProps {
  resource: SupportResource;
  onAction?: (resource: SupportResource) => void;
}

export function SupportCard({ resource, onAction }: SupportCardProps) {
  const getCategoryBadge = () => {
    switch (resource.category) {
      case "crisis":
        return "bg-rose-500/15 border-rose-500/30 text-rose-300";
      case "clinical":
        return "bg-blue-500/15 border-blue-500/30 text-blue-300";
      case "self-care":
        return "bg-purple-500/15 border-purple-500/30 text-purple-300";
      case "wellness":
        return "bg-emerald-500/15 border-emerald-500/30 text-emerald-300";
      default:
        return "bg-slate-500/15 border-slate-500/30 text-slate-300";
    }
  };

  return (
    <div className="relative rounded-3xl border border-white/[0.06] bg-slate-900/40 p-5 flex flex-col justify-between gap-4 backdrop-blur-xl hover:border-emerald-500/40 hover:-translate-y-1 hover:bg-slate-900/60 transition-all duration-300 shadow-md group">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border tracking-wider ${getCategoryBadge()}`}>
            {resource.category}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
            <Clock className="h-3 w-3 text-slate-500" /> {resource.availability}
          </span>
        </div>

        <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
          {resource.title}
        </h4>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {resource.description}
        </p>
      </div>

      <div className="pt-3 border-t border-white/[0.04] flex items-center justify-between">
        {resource.actionType === "phone" ? (
          <a
            href={`tel:${resource.contact}`}
            className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-600 border border-emerald-500/30 text-emerald-400 hover:text-white font-bold text-xs transition-all active:scale-95 shadow-sm"
          >
            <Phone className="h-3.5 w-3.5" />
            <span>{resource.actionText}</span>
          </a>
        ) : (
          <button
            onClick={() => onAction && onAction(resource)}
            className="w-full flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-white font-bold text-xs transition-all active:scale-95"
          >
            <span>{resource.actionText}</span>
            <ExternalLink className="h-3.5 w-3.5 text-accent" />
          </button>
        )}
      </div>
    </div>
  );
}
