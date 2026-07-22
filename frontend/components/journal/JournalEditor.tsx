"use client";

import React, { useState, useEffect, useRef } from "react";
import { Edit2, Plus, Save, Tag, X, AlertCircle, Loader2, Sparkles, Clock, FileText } from "lucide-react";
import Button from "@/components/Button";

interface JournalEditorProps {
  content: string;
  setContent: (val: string) => void;
  tags: string[];
  setTags: (tags: string[]) => void;
  isEditing: boolean;
  submitting: boolean;
  error?: string;
  onSave: (e: React.FormEvent) => void;
  onCancelEdit?: () => void;
  onIdlePause?: () => void;
  emotionPrompt?: string;
}

export function JournalEditor({
  content,
  setContent,
  tags,
  setTags,
  isEditing,
  submitting,
  error,
  onSave,
  onCancelEdit,
  onIdlePause,
  emotionPrompt,
}: JournalEditorProps) {
  const [tagInput, setTagInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Typing pause detection (2.5 seconds of idle typing triggers idle prompt callback)
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setIsTyping(true);

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    idleTimerRef.current = setTimeout(() => {
      setIsTyping(false);
      if (onIdlePause && e.target.value.trim().length > 10) {
        onIdlePause();
      }
    }, 2500);
  };

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

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, []);

  return (
    <div className="rounded-3xl border border-white/[0.08] bg-slate-950/40 p-6 backdrop-blur-3xl shadow-2xl space-y-5 relative transition-all duration-500">
      
      {/* Editor Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-accent/10 border border-accent/20 text-accent">
            {isEditing ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </div>
          <div>
            <h2 className="text-xs font-extrabold text-white uppercase tracking-wider">
              {isEditing ? "Edit Journal Entry" : "Personal Wellness Notebook"}
            </h2>
            <p className="text-[10px] text-slate-400">
              {isTyping ? "Typing active..." : "Reflect peacefully on your journey"}
            </p>
          </div>
        </div>

        {/* Auto-save & Status indicator */}
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-slate-400 flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${isTyping ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} />
            {isTyping ? "Drafting..." : "Saved locally"}
          </span>
        </div>
      </div>

      {/* Emotion-Tailored Reflection Prompt Bar */}
      {emotionPrompt && (
        <div className="p-3.5 rounded-2xl bg-accent/10 border border-accent/20 text-xs text-slate-200 flex items-start gap-2.5 animate-fadeIn">
          <Sparkles className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <div>
            <span className="text-[9px] font-bold text-accent uppercase tracking-wider block">Suggested Reflection</span>
            <p className="text-slate-300 font-medium italic">&quot;{emotionPrompt}&quot;</p>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5 text-rose-300 text-xs" role="alert">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={onSave} className="space-y-4">
        {/* Writing Surface with Paper Aesthetic */}
        <div className="space-y-2 relative">
          <label htmlFor="journal-editor-content" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Your Private Canvas
          </label>
          
          <div className="relative group">
            {/* Subtle glow reaction while typing */}
            <div className={`absolute inset-0 rounded-2xl bg-accent/5 blur-xl transition-opacity duration-500 ${isTyping ? "opacity-100" : "opacity-0"}`} />

            <textarea
              id="journal-editor-content"
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              placeholder="How was your day? Write freely about your thoughts, feelings, energy levels, accomplishments, or challenges..."
              rows={10}
              className="w-full relative z-10 bg-slate-900/60 border border-white/[0.08] rounded-2xl p-5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent/40 transition-all resize-none leading-relaxed tracking-wide font-sans shadow-inner"
            />
          </div>

          {/* Word Count & Reading Time */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium px-1">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-500" /> ~{readingTimeMinutes} min read
            </span>
            <span className="flex items-center gap-1 font-bold text-slate-300">
              <FileText className="h-3 w-3 text-accent" /> {wordCount} words
            </span>
          </div>
        </div>

        {/* Tag Manager */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Category Tags <span className="normal-case font-normal text-slate-500">(press Enter to add)</span>
          </label>
          <div className="flex flex-wrap gap-1.5 p-3 bg-slate-900/60 border border-white/[0.08] rounded-2xl min-h-[44px]">
            {tags.map((tag, index) => (
              <span key={index} className="inline-flex items-center gap-1 bg-accent/15 border border-accent/30 text-accent text-[10px] px-3 py-1 rounded-full font-bold">
                <Tag className="h-2.5 w-2.5" />
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(index)}
                  className="hover:text-rose-400 ml-1 focus:outline-none"
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
              placeholder={tags.length === 0 ? "e.g. gratitude, stress, work..." : "Add tag..."}
              className="bg-transparent text-xs text-slate-200 focus:outline-none flex-1 min-w-[100px] py-1 px-1 placeholder-slate-600 font-medium"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          {isEditing ? (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-xs text-slate-400 hover:text-white transition-colors focus:outline-none"
            >
              Cancel edit
            </button>
          ) : <span />}

          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={submitting || !content.trim()}
            className="ml-auto active:scale-95 border border-accent/40 shadow-lg shadow-accent/20"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Analyzing with watsonx...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>{isEditing ? "Update Journal Entry" : "Save Journal Entry"}</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
