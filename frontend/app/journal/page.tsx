"use client";

import React, { useState, useEffect, useCallback } from "react";
import { journalService, JournalEntry } from "@/services/journal";
import {
  Sparkles,
  Calendar,
  Plus,
  Save,
  Trash2,
  Search,
  Tag,
  X,
  Edit,
  AlertCircle,
  BookOpen,
  Loader2,
} from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Card from "@/components/Card";
import Button from "@/components/Button";

// ─── Sentiment badge colors ──────────────────────────────────────────────────
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
    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${cls} tracking-wider`}>
      {sentiment}
    </span>
  );
}

export default function JournalPage() {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadJournals = useCallback(async () => {
    try {
      const data = await journalService.listJournals(searchQuery);
      setJournals(data);
    } catch (err) {
      console.error("Failed to load journals:", err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    loadJournals();
  }, [loadJournals]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please write some thoughts before saving.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      if (isEditing && selectedEntry) {
        await journalService.updateJournal(selectedEntry._id, content, tags);
      } else {
        await journalService.createJournal(content, tags);
      }
      setContent("");
      setTags([]);
      setIsEditing(false);
      setSelectedEntry(null);
      await loadJournals();
    } catch (err) {
      const errorResponse = err as { response?: { data?: { detail?: string } } };
      setError(errorResponse?.response?.data?.detail || "Failed to save journal entry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this journal entry?")) return;
    try {
      await journalService.deleteJournal(id);
      if (selectedEntry?._id === id) {
        setSelectedEntry(null);
        setIsEditing(false);
      }
      await loadJournals();
    } catch (err) {
      console.error("Failed to delete journal entry:", err);
    }
  };

  const startEdit = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setContent(entry.content);
    setTags(entry.tags || []);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setSelectedEntry(null);
    setContent("");
    setTags([]);
    setError("");
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <ProtectedRoute>
      <div className="max-w-6xl mx-auto py-6 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.04] pb-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <BookOpen className="h-6 w-6 text-indigo-400" aria-hidden="true" />
              Mood Journal
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">Log emotions, reflect on your day, and receive AI-powered insights.</p>
          </div>
          <div className="relative shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search entries or tags…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/[0.02] border border-white/[0.08] rounded-2xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/30 w-full sm:w-56 transition-all"
              aria-label="Search journal entries"
            />
          </div>
        </div>

        {/* Two-column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Editor Panel (Left) */}
          <section className="lg:col-span-7 space-y-5" aria-label="Journal editor">
            <Card className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-white/[0.04]">
                {isEditing
                  ? <Edit className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                  : <Plus className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                }
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  {isEditing ? "Edit Entry" : "Write Today's Thoughts"}
                </h2>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3 text-rose-300 text-xs" role="alert">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                {/* Textarea */}
                <div className="space-y-2">
                  <label htmlFor="journal-content" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Your Thoughts
                  </label>
                  <textarea
                    id="journal-content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="How was your day? Write about your energy, stressors, accomplishments, how you're feeling..."
                    rows={9}
                    className="w-full bg-[#030712]/40 border border-white/[0.08] rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/30 transition-all resize-none leading-relaxed"
                  />
                  <p className="text-[9px] text-slate-500 text-right font-bold">{wordCount} words</p>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Tags <span className="normal-case font-medium text-slate-600">(press Enter to add)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2.5 bg-[#030712]/40 border border-white/[0.08] rounded-2xl min-h-[42px]">
                    {tags.map((tag, index) => (
                      <span key={index} className="inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                        <Tag className="h-2.5 w-2.5" aria-hidden="true" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(index)}
                          className="hover:text-rose-400 ml-0.5 focus:outline-none"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder={tags.length === 0 ? "stress, work, sleep..." : "Add tag..."}
                      className="bg-transparent text-xs text-slate-300 focus:outline-none flex-1 min-w-[80px] py-0.5 px-1 placeholder-slate-600"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="text-xs text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                    >
                      Cancel edit
                    </button>
                  ) : <span />}

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={submitting || !content.trim()}
                    className="ml-auto active:scale-[0.98] border border-indigo-500/30"
                  >
                    {submitting ? (
                      <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyzing & Saving…</>
                    ) : (
                      <><Save className="h-3.5 w-3.5" /> {isEditing ? "Update Entry" : "Save Entry"}</>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </section>

          {/* Journal History (Right) */}
          <section className="lg:col-span-5 space-y-4" aria-label="Journal history">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" aria-hidden="true" />
              <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Recent Entries</h2>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-28 rounded-3xl bg-slate-900/40 animate-pulse border border-white/[0.04]" />
                ))}
              </div>
            ) : journals.length === 0 ? (
              <div className="rounded-3xl border border-white/[0.04] bg-slate-900/20 p-8 text-center space-y-3 backdrop-blur-xl">
                <BookOpen className="h-8 w-8 text-slate-600 mx-auto" aria-hidden="true" />
                <p className="text-xs text-slate-400 font-bold">No entries yet</p>
                <p className="text-xs text-slate-500 leading-relaxed">Write your first entry to receive AI insights about your mood patterns.</p>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[640px] overflow-y-auto pr-1 no-scrollbar">
                {journals.map((entry) => (
                  <article
                    key={entry._id}
                    onClick={() => setSelectedEntry(entry === selectedEntry ? null : entry)}
                    className={`
                      p-4 rounded-3xl border transition-all cursor-pointer text-left space-y-2.5
                      focus:outline-none
                      ${selectedEntry?._id === entry._id
                        ? "bg-indigo-500/[0.06] border-indigo-500/20"
                        : "bg-slate-900/40 border-white/[0.05] hover:border-white/10 hover:bg-slate-900/60"
                      }
                    `}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedEntry(entry === selectedEntry ? null : entry)}
                  >
                    {/* Date + Actions */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> {entry.date}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {entry.ai_analysis?.sentiment && <SentimentBadge sentiment={entry.ai_analysis.sentiment} />}
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(entry); }}
                          className="p-1.5 hover:bg-white/[0.04] rounded-xl text-slate-500 hover:text-slate-200 transition-colors focus:outline-none"
                          aria-label="Edit entry"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(entry._id); }}
                          className="p-1.5 hover:bg-rose-500/10 rounded-xl text-slate-500 hover:text-rose-400 transition-colors focus:outline-none"
                          aria-label="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{entry.content}</p>

                    {/* Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag, i) => (
                          <span key={i} className="text-[9px] text-slate-500 bg-white/[0.02] px-2 py-0.5 rounded-full border border-white/[0.04] font-bold">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* AI Insight */}
                    {entry.ai_analysis && (
                      <div className="pt-2.5 border-t border-white/[0.04] space-y-1.5">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                          <Sparkles className="h-3 w-3" aria-hidden="true" /> AI Insight
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed italic">
                          &ldquo;{entry.ai_analysis.summary}&rdquo;
                        </p>

                        {/* Expanded details when selected */}
                        {selectedEntry?._id === entry._id && (
                          <div className="pt-2.5 border-t border-white/[0.04] grid grid-cols-2 gap-2 text-[10px] font-semibold animate-fadeIn">
                            <div>
                              <p className="text-[8px] font-bold text-slate-600 uppercase mb-0.5 tracking-wider">Emotions</p>
                              <p className="text-slate-400">{entry.ai_analysis.emotions?.join(", ") || "None"}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-bold text-slate-600 uppercase mb-0.5 tracking-wider">Topics</p>
                              <p className="text-slate-400">{entry.ai_analysis.topics?.join(", ") || "None"}</p>
                            </div>
                            {entry.ai_analysis.stress_indicators?.length > 0 && (
                              <div className="col-span-2">
                                <p className="text-[8px] font-bold text-rose-500 uppercase mb-0.5 tracking-wider">Stress Indicators</p>
                                <p className="text-rose-300">{entry.ai_analysis.stress_indicators.join(", ")}</p>
                              </div>
                            )}
                            {entry.ai_analysis.positive_habits?.length > 0 && (
                              <div className="col-span-2">
                                <p className="text-[8px] font-bold text-emerald-500 uppercase mb-0.5 tracking-wider">Positive Habits</p>
                                <p className="text-emerald-300">{entry.ai_analysis.positive_habits.join(", ")}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
