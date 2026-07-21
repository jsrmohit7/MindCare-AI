"use client";

import React, { useState, useEffect, useCallback } from "react";
import { journalService, JournalEntry } from "@/services/journal";
import { Sparkles, Calendar, Plus, Save, Trash2, Search, Tag, X, Edit, AlertCircle } from "lucide-react";

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
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              📖 Mood Journal
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Reflect on your day, log emotions, and receive instant AI analysis.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search journals or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-64 transition-all"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Form Editor */}
          <section className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              {isEditing ? <Edit className="h-5 w-5 text-indigo-400" /> : <Plus className="h-5 w-5 text-indigo-400" />}
              {isEditing ? "Edit Journal Entry" : "Write Today's Thoughts"}
            </h2>

            <form onSubmit={handleSave} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-2 text-red-400 text-xs">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Write Entry</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="How was your day? Write about your energy, stressors, accomplishments..."
                  rows={8}
                  className="w-full bg-slate-950/40 border border-white/5 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                />
              </div>

              {/* Tags Section */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tags (Press Enter to Add)</label>
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950/40 border border-white/5 rounded-xl">
                  {tags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs px-2 py-0.5 rounded-lg">
                      <Tag className="h-3 w-3" />
                      {tag}
                      <button type="button" onClick={() => handleRemoveTag(index)} className="hover:text-red-400 ml-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add tag..."
                    className="bg-transparent text-xs text-slate-200 focus:outline-none min-w-[80px] p-0.5"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedEntry(null);
                      setContent("");
                      setTags([]);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="ml-auto inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                >
                  <Save className="h-4 w-4" />
                  {submitting ? "Analyzing & Saving..." : "Save Entry"}
                </button>
              </div>
            </form>
          </section>

          {/* Right Column: Past Entries List */}
          <section className="lg:col-span-5 space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2 text-slate-300">
              <Calendar className="h-5 w-5 text-indigo-400" />
              Journal History
            </h2>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-sm">Loading historical journals...</div>
            ) : journals.length === 0 ? (
              <div className="bg-white/5 border border-white/5 rounded-2xl p-8 text-center text-slate-500 text-sm">
                No journal entries matching query. Write your first entry to see AI insights.
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {journals.map((entry) => (
                  <article
                    key={entry._id}
                    onClick={() => setSelectedEntry(entry)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer text-left space-y-3 ${
                      selectedEntry?._id === entry._id
                        ? "bg-indigo-500/10 border-indigo-500"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {entry.date}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEdit(entry);
                          }}
                          className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-slate-200"
                          title="Edit"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(entry._id);
                          }}
                          className="p-1 hover:bg-red-500/10 rounded text-slate-500 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-slate-300 text-xs line-clamp-3 leading-relaxed">
                      {entry.content}
                    </p>

                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map((tag, i) => (
                          <span key={i} className="bg-white/5 text-[10px] text-slate-400 px-2 py-0.5 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* AI Quick Insight Summary preview */}
                    {entry.ai_analysis && (
                      <div className="pt-2.5 border-t border-white/5 space-y-2 text-[11px]">
                        <div className="flex items-center justify-between text-[10px] text-purple-400 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            AI Insight summary
                          </span>
                          <span className="bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 rounded">
                            {entry.ai_analysis.sentiment}
                          </span>
                        </div>
                        <p className="text-slate-400 italic">
                          &ldquo;{entry.ai_analysis.summary}&rdquo;
                        </p>
                        
                        {/* Expanded details if selected */}
                        {selectedEntry?._id === entry._id && (
                          <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-slate-300">
                            <div>
                              <span className="text-[9px] text-slate-500 font-bold block uppercase">Emotions</span>
                              <span>{entry.ai_analysis.emotions?.join(", ") || "None"}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-slate-500 font-bold block uppercase">Topics</span>
                              <span>{entry.ai_analysis.topics?.join(", ") || "None"}</span>
                            </div>
                            {entry.ai_analysis.stress_indicators?.length > 0 && (
                              <div className="col-span-2">
                                <span className="text-[9px] text-slate-500 font-bold block uppercase text-red-400">Stress Indicators</span>
                                <span className="text-red-300">{entry.ai_analysis.stress_indicators.join(", ")}</span>
                              </div>
                            )}
                            {entry.ai_analysis.positive_habits?.length > 0 && (
                              <div className="col-span-2">
                                <span className="text-[9px] text-slate-500 font-bold block uppercase text-emerald-400">Positive Habits Logged</span>
                                <span className="text-emerald-300">{entry.ai_analysis.positive_habits.join(", ")}</span>
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
    </main>
  );
}
