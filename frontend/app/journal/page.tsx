"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useEmotion } from "@/context/EmotionContext";
import { journalService, JournalEntry } from "@/services/journal";
import { dailyWellnessService } from "@/services/dailyWellness";

import { JournalHero } from "@/components/journal/JournalHero";
import { JournalEditor } from "@/components/journal/JournalEditor";
import { JournalCompanion } from "@/components/journal/JournalCompanion";
import { JournalTimeline } from "@/components/journal/JournalTimeline";
import { JournalEmptyState } from "@/components/journal/JournalEmptyState";

export default function JournalPage() {
  const { detectedEmotion, explanation, advice, motivation } = useEmotion();
  
  // Mounted & Staggered Entrance State
  const [mounted, setMounted] = useState(false);
  const [entranceStep, setEntranceStep] = useState(0);

  // Journal State
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  // Wellness Streak State
  const [streakDays, setStreakDays] = useState(0);

  // Idle Typing Pause State
  const [isIdlePause, setIsIdlePause] = useState(false);

  // Staggered Entrance Animation Pipeline
  useEffect(() => {
    setMounted(true);
    const timers = [
      setTimeout(() => setEntranceStep(1), 150),
      setTimeout(() => setEntranceStep(2), 350),
      setTimeout(() => setEntranceStep(3), 600),
      setTimeout(() => setEntranceStep(4), 850),
    ];
    return () => timers.forEach((t) => clearTimeout(t));
  }, []);

  // Fetch Journals & Streak
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

  const loadStreak = useCallback(async () => {
    try {
      const streakRes = await dailyWellnessService.getStreak();
      setStreakDays(streakRes.current_streak || 0);
    } catch (err) {
      console.error("Failed to load streak:", err);
    }
  }, []);

  useEffect(() => {
    loadJournals();
    loadStreak();
  }, [loadJournals, loadStreak]);

  // Compute total today's word count
  const todayWordCount = useMemo(() => {
    return content.trim() ? content.trim().split(/\s+/).length : 0;
  }, [content]);

  // Handle Save (Create / Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please write some thoughts before saving.");
      return;
    }
    setError("");
    setSubmitting(true);
    setIsIdlePause(false);

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
      await loadStreak();
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

  // Idle typing callback from editor
  const handleIdlePause = () => {
    setIsIdlePause(true);
  };

  const handleApplyPrompt = (promptText: string) => {
    if (content) {
      setContent((prev) => `${prev}\n\n${promptText}`);
    } else {
      setContent(promptText);
    }
  };

  return (
    <ProtectedRoute>
      <div
        className={`max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-8 transition-all duration-700 ${
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
        }`}
      >
        {/* Step 1: Journal Hero */}
        <div className={`transition-all duration-500 ${entranceStep >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <JournalHero
            emotion={detectedEmotion}
            explanation={explanation}
            totalEntries={journals.length}
            streakDays={streakDays}
            todayWordCount={todayWordCount}
            writingGoal={200}
          />
        </div>

        {/* Step 2 & 3: Editor + Companion & Timeline Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Writing Area (Left/Center Column) */}
          <div className={`lg:col-span-8 space-y-6 transition-all duration-500 ${entranceStep >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            
            {/* Show Empty State Prompts if no content and starting fresh */}
            {journals.length === 0 && !content && !isEditing ? (
              <JournalEmptyState
                emotion={detectedEmotion}
                onSelectPrompt={handleApplyPrompt}
              />
            ) : null}

            <JournalEditor
              content={content}
              setContent={setContent}
              tags={tags}
              setTags={setTags}
              isEditing={isEditing}
              submitting={submitting}
              error={error}
              onSave={handleSave}
              onCancelEdit={cancelEdit}
              onIdlePause={handleIdlePause}
              emotionPrompt={explanation ? `Reflecting on "${explanation}"` : undefined}
            />

            {/* Timeline Feed */}
            <JournalTimeline
              entries={journals}
              loading={loading}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              selectedEntry={selectedEntry}
              onSelectEntry={(entry) => setSelectedEntry(selectedEntry?._id === entry._id ? null : entry)}
              onEditEntry={startEdit}
              onDeleteEntry={handleDelete}
            />
          </div>

          {/* Right Column: AI Journal Companion */}
          <div className={`lg:col-span-4 space-y-6 transition-all duration-500 ${entranceStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <JournalCompanion
              emotion={detectedEmotion}
              advice={advice}
              motivation={motivation}
              isIdle={isIdlePause}
              submitting={submitting}
              onApplyPrompt={handleApplyPrompt}
            />
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
