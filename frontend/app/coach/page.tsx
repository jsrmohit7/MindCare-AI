"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAssessments } from "@/hooks/useAssessments";
import { dailyWellnessService, DailyCheckInRecord } from "@/services/dailyWellness";
import { coachService, Conversation, ChatMessage } from "@/services/coach";
import {
  Bot,
  Send,
  Plus,
  Search,
  Trash2,
  Edit2,
  Copy,
  Check,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Flame,
  Smile,
  Activity,
  Clock,
  X
} from "lucide-react";

import Link from "next/link";

// Simple custom Markdown rendering function
function parseMarkdown(text: string) {
  const paragraphs = text.split(/\n\n+/);
  return paragraphs.map((para, pIdx) => {
    const trimmed = para.trim();
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const items = trimmed
        .split(/\n/)
        .map((line) => line.replace(/^[-*]\s+/, "").trim())
        .filter(Boolean);
      return (
        <ul key={pIdx} className="list-disc pl-5 my-2 space-y-1 text-slate-300">
          {items.map((item, iIdx) => (
            <li key={iIdx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
    }
    return (
      <p key={pIdx} className="mb-2 leading-relaxed text-slate-300">
        {renderInline(para)}
      </p>
    );
  });
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="text-white font-extrabold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function CoachPage() {
  // Navigation & UI States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  
  // Active Chat States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  
  // Feedback states
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<Record<number, "like" | "dislike">>({});
  
  // Context & Wellness Info Panel States
  const { data: assessments, isLoading: loadingAssessments } = useAssessments(5);
  const [todayRecord, setTodayRecord] = useState<DailyCheckInRecord | null>(null);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0, total_checkins: 0 });
  const [loadingContext, setLoadingContext] = useState(true);
  
  // Breathing Exercise Modal State
  const [breathingOpen, setBreathingOpen] = useState(false);
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [breathingSeconds, setBreathingSeconds] = useState(4);
  const breathingTimer = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Set initial sidebar state on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setSidebarOpen(window.innerWidth >= 768);
    }
  }, []);

  // Load conversations & wellness data
  useEffect(() => {
    loadAllConversations();
    loadWellnessDashboardContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto scroll chat to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const loadAllConversations = async (selectFirst = true) => {
    try {
      setLoadingConvs(true);
      const list = await coachService.listConversations();
      setConversations(list);
      if (selectFirst && list.length > 0) {
        setSelectedConvId(list[0]._id);
        setMessages(list[0].messages);
      } else if (list.length === 0) {
        // Automatically create a conversation if none exist
        await handleStartNewChat();
      }
    } catch (e) {
      console.error("Failed to load conversations:", e);
    } finally {
      setLoadingConvs(false);
    }
  };

  const loadWellnessDashboardContext = async () => {
    try {
      setLoadingContext(true);
      const [todayRes, streakRes] = await Promise.all([
        dailyWellnessService.getTodayCheckIn(),
        dailyWellnessService.getStreak(),
      ]);
      setTodayRecord(todayRes.data);
      setStreak(streakRes);
    } catch (e) {
      console.error("Failed to load wellness context:", e);
    } finally {
      setLoadingContext(false);
    }
  };

  const handleSelectConversation = async (id: string) => {
    setSelectedConvId(id);
    const conv = conversations.find((c) => c._id === id);
    if (conv) {
      setMessages(conv.messages);
    } else {
      try {
        const fullConv = await coachService.getConversation(id);
        setMessages(fullConv.messages);
      } catch (e) {
        console.error("Failed to load conversation details:", e);
      }
    }
    // Auto-close sidebar on mobile
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleStartNewChat = async () => {
    try {
      setSending(true);
      const newConv = await coachService.createConversation();
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConvId(newConv._id);
      setMessages([]);
      setInputMessage("");
      // Auto-close sidebar on mobile
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } catch (e) {
      console.error("Failed to start new chat:", e);
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (customMessage?: string) => {
    const textToSend = customMessage || inputMessage;
    if (!textToSend.trim() || !selectedConvId || sending) return;

    // Append user message immediately
    const userMsg: ChatMessage = {
      role: "user",
      content: textToSend,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setSending(true);

    try {
      const res = await coachService.sendMessage(selectedConvId, textToSend);
      
      // Append bot response
      const botMsg: ChatMessage = {
        role: "assistant",
        content: res.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
      
      // Refresh conversation list to show updated snippet/time
      const updatedList = await coachService.listConversations();
      setConversations(updatedList);
      
      // Refresh wellness context in case the user check-in or assessment status updated
      loadWellnessDashboardContext();
    } catch (e) {
      console.error("Chat message failed:", e);
      const errMsg: ChatMessage = {
        role: "assistant",
        content: "I'm sorry, I encountered an issue while generating a response. Please check your network and try again.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  const handleRename = async (id: string) => {
    if (!renameTitle.trim()) return;
    try {
      const updated = await coachService.renameConversation(id, renameTitle.trim());
      setConversations((prev) =>
        prev.map((c) => (c._id === id ? { ...c, title: updated.title } : c))
      );
      setRenameId(null);
    } catch (e) {
      console.error("Failed to rename:", e);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this chat?")) return;
    try {
      await coachService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c._id !== id));
      if (selectedConvId === id) {
        setSelectedConvId(null);
        setMessages([]);
      }
    } catch (e) {
      console.error("Failed to delete chat:", e);
    }
  };

  const handleRegenerate = () => {
    // Find last user message in the list
    const userMsgs = messages.filter((m) => m.role === "user");
    if (userMsgs.length === 0) return;
    const lastUserMsg = userMsgs[userMsgs.length - 1].content;
    
    // Remove last assistant message if there is one
    if (messages[messages.length - 1].role === "assistant") {
      setMessages((prev) => prev.slice(0, -1));
    }
    handleSendMessage(lastUserMsg);
  };

  const handleCopyText = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(idx);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Breathing Exercise Loop
  const startBreathing = () => {
    setBreathingOpen(true);
    setBreathingPhase("inhale");
    setBreathingSeconds(4);
  };

  useEffect(() => {
    if (!breathingOpen) {
      if (breathingTimer.current) clearInterval(breathingTimer.current);
      return;
    }

    breathingTimer.current = setInterval(() => {
      setBreathingSeconds((prev) => {
        if (prev <= 1) {
          // Switch phase
          setBreathingPhase((phase) => {
            if (phase === "inhale") return "hold";
            if (phase === "hold") return "exhale";
            return "inhale";
          });
          // Set duration for next phase: inhale 4s, hold 4s, exhale 4s
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (breathingTimer.current) clearInterval(breathingTimer.current);
    };
  }, [breathingOpen, breathingPhase]);

  // Filter conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchMessages = c.messages.some((m) => m.content.toLowerCase().includes(q));
      return matchTitle || matchMessages;
    });
  }, [conversations, searchQuery]);

  // Suggested Actions below responses
  const suggestedActions = [
    { label: "🧘 Breathe", action: startBreathing },
    { label: "📝 Check-In", link: "/daily-checkin" },
    { label: "📈 Progress", link: "/dashboard" },
    { label: "👨‍⚕️ Support", link: "/consult" },
    { label: "🧠 Screening", link: "/assessment" }
  ];

  // Latest Assessment info
  const latestAssessment = assessments?.[0];

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto h-[calc(100dvh-7.5rem)] md:h-[calc(100vh-6rem)] flex rounded-none md:rounded-3xl border-y border-x-0 md:border border-white/[0.05] bg-slate-900/20 overflow-hidden shadow-2xl backdrop-blur-2xl relative">
        
        {/* ——— 1. Sidebar Panel (Left) ——— */}
        <div
          className={`
            ${sidebarOpen ? "w-80 border-r border-white/[0.05]" : "w-0 overflow-hidden border-r-0"}
            shrink-0 flex flex-col bg-slate-950/20 transition-all duration-300 ease-in-out relative z-20
            md:relative md:block
            ${sidebarOpen ? "absolute md:static inset-y-0 left-0 bg-slate-900 md:bg-transparent" : "hidden md:hidden"}
          `}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/[0.04] flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-200 flex items-center gap-2 uppercase tracking-wider">
              🤖 Conversations
            </h2>
            <button
              onClick={handleStartNewChat}
              className="p-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950 active:scale-95"
              title="Start New Chat"
              aria-label="Start new chat"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-white/[0.04]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/[0.04] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/30"
                aria-label="Search conversations"
              />
            </div>
          </div>

          {/* Chats list */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1 no-scrollbar">
            {loadingConvs ? (
              <div className="py-8 text-center text-xs text-slate-500 font-semibold">Loading chats...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-medium">No chats found.</div>
            ) : (
              filteredConversations.map((c) => {
                const active = selectedConvId === c._id;
                const renaming = renameId === c._id;
                return (
                  <div
                    key={c._id}
                    onClick={() => !renaming && handleSelectConversation(c._id)}
                    className={`
                      group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-200 border
                      ${active
                        ? "bg-indigo-600/10 border-indigo-500/10 text-white"
                        : "bg-transparent border-transparent text-slate-400 hover:bg-white/[0.02] hover:text-slate-200"
                      }
                    `}
                    role="button"
                    tabIndex={0}
                    aria-label={`Chat: ${c.title}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleSelectConversation(c._id);
                      }
                    }}
                  >
                    <div className="flex-1 min-w-0 pr-6">
                      {renaming ? (
                        <input
                          type="text"
                          value={renameTitle}
                          onChange={(e) => setRenameTitle(e.target.value)}
                          onBlur={() => handleRename(c._id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleRename(c._id);
                            if (e.key === "Escape") setRenameId(null);
                          }}
                          className="w-full bg-slate-950 border border-white/[0.08] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <p className="text-xs font-bold truncate">{c.title}</p>
                      )}
                      <p className="text-[10px] text-slate-500 truncate mt-1">
                        {c.messages.length > 0
                          ? c.messages[c.messages.length - 1].content
                          : "Empty conversation"}
                      </p>
                    </div>

                    {/* Rename/Delete actions */}
                    {!renaming && (
                      <div className="absolute right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameId(c._id);
                            setRenameTitle(c.title);
                          }}
                          className="p-1 rounded-lg hover:bg-white/[0.05] text-slate-500 hover:text-slate-200"
                          title="Rename"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(c._id, e)}
                          className="p-1 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ——— 2. Central Chat Area ——— */}
        <div className="flex-1 flex flex-col bg-transparent relative z-10">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-white/[0.05] flex items-center justify-between bg-slate-950/10">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-xl hover:bg-white/[0.04] text-slate-400 hover:text-slate-200"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <ChevronLeft className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
              </button>
              
              {/* Glowing Interactive Halo Avatar */}
              <div className="relative group cursor-pointer flex h-9.5 w-9.5 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-indigo-400 transition-all duration-300 hover:scale-105 hover:border-accent/40 shadow-[0_0_15px_rgba(var(--accent-rgb),0.05)]">
                {/* Breathing Halo Glow Effect */}
                <div className="absolute inset-[-2px] rounded-[18px] bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-[3px]" />
                <div className="absolute inset-0 rounded-2xl border border-accent/20 animate-pulse" />
                <Bot className="h-4.5 w-4.5 text-accent" />
              </div>

              <div>
                <h1 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  AI Wellness Companion
                </h1>
                <p className="text-[10px] text-slate-500 mt-0.5">Reflective support driven by Watsonx Granite AI</p>
              </div>
            </div>
          </div>

          {/* Messages stream */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 no-scrollbar">
            
            {/* Welcome System Message */}
            <div className="flex gap-4">
              <div className="h-8.5 w-8.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Bot className="h-4.5 w-4.5 text-indigo-400" />
              </div>
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4.5 max-w-[85%] text-xs space-y-2 leading-relaxed">
                <p className="font-bold text-white">Hello, I&apos;m your AI Wellness Companion.</p>
                <p className="text-slate-300">I am connected to your wellness trends, journal records, and clinical scores to offer contextual guidance.</p>
                <p className="text-slate-300">How are you holding up today?</p>
              </div>
            </div>

            {/* Chat history */}
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div key={idx} className={`flex gap-4 ${isUser ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`
                      h-8.5 w-8.5 rounded-xl flex items-center justify-center shrink-0 border
                      ${isUser
                        ? "bg-purple-600/10 border-purple-500/20 text-purple-400"
                        : "bg-indigo-600/10 border-indigo-500/20 text-indigo-400"
                      }
                    `}
                  >
                    {isUser ? <Smile className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  <div className="space-y-2 max-w-[80%]">
                    <div
                      className={`
                        border rounded-2xl p-4 text-xs leading-relaxed shadow-sm relative group/msg
                        ${isUser
                          ? "bg-purple-600/5 border-purple-500/10 text-purple-100"
                          : "bg-white/[0.02] border-white/[0.04] text-slate-200"
                        }
                      `}
                    >
                      {/* Message Body */}
                      <div className="space-y-2 prose prose-invert">
                        {parseMarkdown(m.content)}
                      </div>

                      {/* Toolbars for messages */}
                      <div className="absolute right-2 bottom-2 flex items-center gap-1 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyText(m.content, idx)}
                          className="p-1 rounded-lg bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-white"
                          title="Copy text"
                        >
                          {copiedId === idx ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                        
                        {!isUser && (
                          <>
                            <button
                              onClick={() => setMessageFeedback((prev) => ({ ...prev, [idx]: "like" }))}
                              className={`p-1 rounded-lg bg-slate-950/60 hover:bg-slate-900 ${
                                messageFeedback[idx] === "like" ? "text-indigo-400" : "text-slate-400 hover:text-white"
                              }`}
                              title="Helpful"
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setMessageFeedback((prev) => ({ ...prev, [idx]: "dislike" }))}
                              className={`p-1 rounded-lg bg-slate-950/60 hover:bg-slate-900 ${
                                messageFeedback[idx] === "dislike" ? "text-rose-400" : "text-slate-400 hover:text-white"
                              }`}
                              title="Not helpful"
                            >
                              <ThumbsDown className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Suggested actions */}
                    {!isUser && idx === messages.length - 1 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {suggestedActions.map((act) =>
                          act.link ? (
                            <Link
                              key={act.label}
                              href={act.link}
                              className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-white/[0.02] border border-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.04] hover:border-indigo-500/25 transition-all"
                            >
                              {act.label}
                            </Link>
                          ) : (
                            <button
                              key={act.label}
                              onClick={act.action}
                              className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-white/[0.02] border border-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.04] hover:border-indigo-500/25 transition-all"
                            >
                              {act.label}
                            </button>
                          )
                        )}
                        <button
                          onClick={handleRegenerate}
                          className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-white/[0.02] border border-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all flex items-center gap-1"
                          title="Regenerate response"
                        >
                          <RotateCw className="h-2.5 w-2.5" />
                          Regenerate
                        </button>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-[8px] text-slate-600 px-1 font-semibold">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Thinking indicator */}
            {sending && (
              <div className="flex gap-4">
                <div className="h-8.5 w-8.5 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 animate-pulse">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 max-w-[85%] text-xs flex items-center space-x-2">
                  <span className="text-slate-500 font-semibold">Coach is formulating response</span>
                  <div className="flex space-x-1">
                    <span className="h-1 w-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1 w-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1 w-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested prompts list */}
          {messages.length <= 1 && (
            <div className="px-5 py-3 border-t border-white/[0.04] bg-slate-950/10 space-y-2">
              <p className="text-[8px] text-slate-500 uppercase font-bold tracking-wider">Suggested Focus Prompts</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "I'm feeling stress and anxiety today",
                  "Suggest some relaxation habits",
                  "Break down my latest assessment results",
                  "Show me my wellness score trends",
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-xs px-3.5 py-1.5 rounded-full bg-slate-950/40 border border-white/[0.04] text-slate-400 hover:text-white hover:border-indigo-500/25 transition-all text-left font-medium"
                  >
                    • {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input text controls */}
          <div className="p-4 border-t border-white/[0.05] bg-slate-950/10">
            <div className="flex gap-3 items-end">
              <textarea
                ref={inputRef}
                rows={1}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message your wellness coach..."
                className="flex-1 bg-slate-950/60 border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-indigo-500/30 max-h-36 no-scrollbar"
                aria-label="Type a message"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || sending}
                className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0 active:scale-95"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ——— 3. Context & Insights Panel (Right Side) ——— */}
        <div className="hidden lg:flex w-76 border-l border-white/[0.05] flex-col bg-slate-950/20 p-4 space-y-4 overflow-y-auto no-scrollbar shrink-0">
          <h3 className="text-[10px] font-bold text-slate-200 border-b border-white/[0.04] pb-2.5 flex items-center gap-2 uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-indigo-400" />
            Active Context
          </h3>

          {loadingContext ? (
            <div className="py-8 text-center text-xs text-slate-500 font-semibold">Loading stats...</div>
          ) : (
            <div className="space-y-4 text-xs">
              
              {/* Wellness Score Gauge */}
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 flex flex-col items-center justify-center space-y-3 text-center shadow-inner relative overflow-hidden">
                <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 blur-2xl rounded-full" />
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Wellness score</span>
                <div className="relative flex h-18 w-18 items-center justify-center rounded-2xl border border-white/[0.04] bg-slate-950/60 shadow-inner">
                  <span className="text-lg font-black text-indigo-400">
                    {todayRecord ? todayRecord.wellness_score : "—"}
                  </span>
                </div>
                <span className="text-[9px] text-slate-500 font-semibold">Calculated today</span>
              </div>

              {/* Stats parameters */}
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 space-y-3">
                {[
                  { icon: <Smile className="h-4 w-4 text-indigo-400" />, label: "Mood", value: todayRecord ? todayRecord.mood : "Not logged" },
                  { icon: <Activity className="h-4 w-4 text-pink-400" />, label: "Stress", value: todayRecord ? `${todayRecord.stress}/10` : "Not logged" },
                  { icon: <Clock className="h-4 w-4 text-blue-400" />, label: "Sleep", value: todayRecord ? todayRecord.sleep : "Not logged" },
                  { icon: <Flame className="h-4 w-4 text-amber-500" />, label: "Streak", value: `${streak.current_streak} days` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-slate-500 font-semibold flex items-center gap-2">
                      {icon}
                      {label}
                    </span>
                    <span className="font-bold text-slate-300">{value}</span>
                  </div>
                ))}
              </div>

              {/* Latest Assessment score */}
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 space-y-3">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Clinical score</span>
                {loadingAssessments ? (
                  <div className="h-10 animate-pulse bg-white/[0.02] rounded-xl" />
                ) : latestAssessment ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Risk Profile</span>
                      <span className="font-bold text-indigo-400">{latestAssessment.risk_profile?.overall_risk?.level}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PHQ-9 / GAD-7</span>
                      <span className="font-bold text-slate-300">
                        {Math.round(latestAssessment.risk_profile?.overall_risk?.score ?? 0)}/100
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-500">No assessments compiled.</div>
                )}
              </div>

              {/* Today's Goal */}
              {todayRecord?.daily_goal && (
                <div className="bg-indigo-950/10 border border-indigo-500/10 rounded-2xl p-4 space-y-1.5">
                  <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">🎯 Focus Goal</span>
                  <p className="text-slate-300 leading-relaxed italic">&ldquo;{todayRecord.daily_goal}&rdquo;</p>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      {/* ——— 4. Breathing Exercise Modal ——— */}
      {breathingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-slate-900 p-6 text-center space-y-6 shadow-2xl relative overflow-hidden">
            
            {/* Close button */}
            <button
              onClick={() => setBreathingOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/[0.05] text-slate-400 hover:text-white"
              aria-label="Close breathing exercise"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Glowing background circles */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20" aria-hidden="true">
              <div
                className={`
                  rounded-full bg-indigo-500 blur-2xl transition-all duration-1000
                  ${breathingPhase === "inhale" ? "h-64 w-64 scale-110 bg-indigo-500" : ""}
                  ${breathingPhase === "hold" ? "h-56 w-56 scale-100 bg-indigo-600" : ""}
                  ${breathingPhase === "exhale" ? "h-40 w-40 scale-75 bg-blue-500" : ""}
                `}
              />
            </div>

            <div className="space-y-1 relative z-10">
              <h3 className="text-base font-extrabold text-white">4-4-4 Box Breathing</h3>
              <p className="text-xs text-slate-500">Sync your breath with the glowing portal</p>
            </div>

            {/* Expanding visual breathing circle */}
            <div className="flex justify-center py-6 relative z-10">
              <div
                className={`
                  h-32 w-32 rounded-full border-4 flex items-center justify-center bg-slate-950/80 shadow-2xl transition-all duration-[4000ms] ease-in-out
                  ${breathingPhase === "inhale" ? "scale-125 border-indigo-400 shadow-indigo-500/20" : ""}
                  ${breathingPhase === "hold" ? "scale-120 border-violet-400 shadow-violet-500/20" : ""}
                  ${breathingPhase === "exhale" ? "scale-90 border-blue-400 shadow-blue-500/20" : ""}
                `}
              >
                <div className="text-center">
                  <p className="text-[10px] font-bold text-white uppercase tracking-widest">
                    {breathingPhase === "inhale" && "Inhale"}
                    {breathingPhase === "hold" && "Hold"}
                    {breathingPhase === "exhale" && "Exhale"}
                  </p>
                  <p className="text-2xl font-black text-indigo-300 mt-1">{breathingSeconds}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 relative z-10">
              <button
                onClick={() => setBreathingOpen(false)}
                className="w-full rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-slate-200 py-3 transition-all border border-white/[0.05]"
              >
                End Exercise
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
