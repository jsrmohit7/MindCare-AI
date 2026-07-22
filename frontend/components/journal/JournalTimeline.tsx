"use client";

import React, { useState } from "react";
import { JournalEntry } from "@/services/journal";
import {
  Calendar,
  Search,
  Sparkles,
  Edit,
  Trash2,
  Filter,
  ChevronDown,
  ChevronUp,
  BookOpen
} from "lucide-react";

interface JournalTimelineProps {
  entries: JournalEntry[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedEntry: JournalEntry | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onEditEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  negative: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  neutral: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  mixed: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

function SentimentBadge({ sentiment }: { sentiment?: string }) {
  if (!sentiment) return null;
  const cls = SENTIMENT_COLORS[sentiment.toLowerCase()] ?? SENTIMENT_COLORS.neutral;
  return (
    <span className={`text-[9px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${cls} tracking-wider`}>
      {sentiment}
    </span>
  );
}

export function JournalTimeline({
  entries,
  loading,
  searchQuery,
  setSearchQuery,
  selectedEntry,
  onSelectEntry,
  onEditEntry,
  onDeleteEntry,
}: JournalTimelineProps) {
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // Filter entries by search query and optional tag filter
  const filteredEntries = entries.filter((entry) => {
    const matchesQuery =
      !searchQuery.trim() ||
      entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.tags && entry.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesTag = !selectedTagFilter || (entry.tags && entry.tags.includes(selectedTagFilter));
    return matchesQuery && matchesTag;
  });

  // Extract all unique tags
  const allTags = Array.from(new Set(entries.flatMap((e) => e.tags || [])));

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-5">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" />
          <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">
            Memory Timeline ({filteredEntries.length})
          </h2>
        </div>

        {/* Search Input */}
        <div className="relative shrink-0 w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search memories or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/60 border border-white/[0.08] rounded-2xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent/40 transition-all"
            aria-label="Search journal entries"
          />
        </div>
      </div>

      {/* Tag Filters (if any exist) */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <Filter className="h-3 w-3 text-slate-500 shrink-0" />
          <button
            onClick={() => setSelectedTagFilter(null)}
            className={`text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all shrink-0 ${
              !selectedTagFilter
                ? "bg-accent/20 border-accent/40 text-accent"
                : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTagFilter(selectedTagFilter === tag ? null : tag)}
              className={`text-[9px] font-bold px-2.5 py-1 rounded-full border transition-all shrink-0 ${
                selectedTagFilter === tag
                  ? "bg-accent/20 border-accent/40 text-accent"
                  : "bg-white/[0.02] border-white/[0.06] text-slate-400 hover:text-white"
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/[0.02] animate-pulse border border-white/[0.04]" />
          ))}
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="p-8 text-center rounded-2xl border border-white/[0.06] bg-white/[0.01] space-y-2">
          <BookOpen className="h-6 w-6 text-slate-600 mx-auto" />
          <p className="text-xs font-bold text-slate-400">No journal entries found</p>
          <p className="text-[10px] text-slate-500">
            {searchQuery ? "Try searching for a different keyword or tag." : "Write your first entry above!"}
          </p>
        </div>
      ) : (
        /* Timeline Feed */
        <div className="space-y-3.5 max-h-[680px] overflow-y-auto pr-1 no-scrollbar">
          {filteredEntries.map((entry, index) => {
            const isSelected = selectedEntry?._id === entry._id;
            return (
              <article
                key={entry._id}
                onClick={() => onSelectEntry(entry)}
                className={`
                  group p-4.5 rounded-2xl border transition-all duration-300 cursor-pointer text-left space-y-3 backdrop-blur-xl relative overflow-hidden
                  ${isSelected
                    ? "bg-accent/10 border-accent/40 shadow-lg shadow-accent/10 scale-[1.01]"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-white/20 hover:bg-white/[0.04] hover:-translate-y-0.5"
                  }
                `}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Date & Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                    <Calendar className="h-3.5 w-3.5 text-accent" />
                    <span>{entry.date}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {entry.ai_analysis?.sentiment && <SentimentBadge sentiment={entry.ai_analysis.sentiment} />}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEntry(entry);
                      }}
                      className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                      title="Edit entry"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEntry(entry._id);
                      }}
                      className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content Preview */}
                <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-sans">
                  {entry.content}
                </p>

                {/* Tags */}
                {entry.tags && entry.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {entry.tags.map((tag, i) => (
                      <span key={i} className="text-[9px] font-bold text-slate-400 bg-white/[0.03] px-2 py-0.5 rounded-full border border-white/[0.06]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* AI Insight */}
                {entry.ai_analysis && (
                  <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-accent uppercase tracking-wider">
                        <Sparkles className="h-3 w-3" /> Granite Reflection
                      </div>
                      {isSelected ? <ChevronUp className="h-3.5 w-3.5 text-accent" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
                    </div>

                    <p className="text-[11px] text-slate-300 italic leading-relaxed">
                      &ldquo;{entry.ai_analysis.summary}&rdquo;
                    </p>

                    {/* Expanded details when selected */}
                    {isSelected && (
                      <div className="pt-2.5 border-t border-white/[0.06] grid grid-cols-2 gap-2 text-[10px] font-medium animate-fadeIn">
                        <div>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Emotions Detected</p>
                          <p className="text-slate-300">{entry.ai_analysis.emotions?.join(", ") || "None"}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Key Topics</p>
                          <p className="text-slate-300">{entry.ai_analysis.topics?.join(", ") || "None"}</p>
                        </div>
                        {entry.ai_analysis.stress_indicators && entry.ai_analysis.stress_indicators.length > 0 && (
                          <div className="col-span-2">
                            <p className="text-[8px] font-bold text-rose-400 uppercase tracking-wider mb-0.5">Stress Indicators</p>
                            <p className="text-rose-300">{entry.ai_analysis.stress_indicators.join(", ")}</p>
                          </div>
                        )}
                        {entry.ai_analysis.positive_habits && entry.ai_analysis.positive_habits.length > 0 && (
                          <div className="col-span-2">
                            <p className="text-[8px] font-bold text-emerald-400 uppercase tracking-wider mb-0.5">Positive Habits</p>
                            <p className="text-emerald-300">{entry.ai_analysis.positive_habits.join(", ")}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

    </div>
  );
}
