"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useEmotion } from "@/context/EmotionContext";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
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
  Flame,
  Smile,
  Activity,
  Clock,
  X,
  Wind,
  Brain,
  MessageSquare,
  ShieldCheck,
  BookOpen,
  ArrowRight
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
  const { detectedEmotion, explanation } = useEmotion();
  
  // Mounted cinematic entrance state
  const [mounted, setMounted] = useState(false);

  // Navigation & UI States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  
  // Active Chat States & Scene Transition
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isSwitchingChat, setIsSwitchingChat] = useState(false);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  
  // AI Thinking State Status Cycling Messages
  const [thinkingStatusIndex, setThinkingStatusIndex] = useState(0);
  const thinkingStatuses = useMemo(() => [
    "Understanding your message...",
    "Analyzing your wellness context...",
    "Consulting IBM watsonx Granite...",
    "Preparing personalized guidance..."
  ], []);

  // Feedback states
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [messageFeedback, setMessageFeedback] = useState<Record<number, "like" | "dislike">>({});
  
  // Context & Wellness Info Panel States
  const { data: assessments } = useAssessments(5);
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

  // Set initial mount state for entrance animation & responsiveness
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setSidebarOpen(window.innerWidth >= 768);
    }
  }, []);

  // Load conversations & wellness context
  useEffect(() => {
    loadAllConversations();
    loadWellnessDashboardContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cycle thinking status messages when sending
  useEffect(() => {
    if (!sending) {
      setThinkingStatusIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setThinkingStatusIndex((prev) => (prev + 1) % thinkingStatuses.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [sending, thinkingStatuses]);

  // Auto scroll chat to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // Auto-focus input on select or mount
  useEffect(() => {
    if (mounted && selectedConvId) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [mounted, selectedConvId]);

  const loadAllConversations = async (selectFirst = true) => {
    try {
      setLoadingConvs(true);
      const list = await coachService.listConversations();
      setConversations(list);
      if (selectFirst && list.length > 0) {
        setSelectedConvId(list[0]._id);
        setMessages(list[0].messages);
      } else if (list.length === 0) {
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

  // Smooth Chat Switching Scene Animation
  const handleSelectConversation = async (id: string) => {
    if (id === selectedConvId) return;
    setIsSwitchingChat(true);
    setTimeout(async () => {
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
      setIsSwitchingChat(false);
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    }, 200);
  };

  const handleStartNewChat = async () => {
    try {
      setSending(true);
      const newConv = await coachService.createConversation();
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConvId(newConv._id);
      setMessages([]);
      setInputMessage("");
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
      
      const botMsg: ChatMessage = {
        role: "assistant",
        content: res.response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
      
      const updatedList = await coachService.listConversations();
      setConversations(updatedList);
      loadWellnessDashboardContext();
    } catch (e) {
      console.error("Chat message failed:", e);
      const errMsg: ChatMessage = {
        role: "assistant",
        content: "I'm sorry, I encountered an issue while generating a response. Please check your network connection and try again.",
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
    const userMsgs = messages.filter((m) => m.role === "user");
    if (userMsgs.length === 0) return;
    const lastUserMsg = userMsgs[userMsgs.length - 1].content;
    
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
          setBreathingPhase((phase) => {
            if (phase === "inhale") return "hold";
            if (phase === "hold") return "exhale";
            return "inhale";
          });
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

  // Emotion-adaptive suggested actions
  const suggestedActions = useMemo(() => {
    const isAnxiousOrStressed = ["Anxious", "Stressed", "Sad"].includes(detectedEmotion);
    const baseActions = [
      { label: "🧘 Breathing Session", action: startBreathing, highlight: isAnxiousOrStressed },
      { label: "📝 Daily Check-In", link: "/daily-checkin", highlight: false },
      { label: "📈 Dashboard Trends", link: "/dashboard", highlight: false },
      { label: "👨‍⚕️ Clinical Support", link: "/consult", highlight: isAnxiousOrStressed },
      { label: "🧠 PHQ-9 / GAD-7", link: "/assessment", highlight: false }
    ];
    return isAnxiousOrStressed 
      ? baseActions.sort((a, b) => (b.highlight ? 1 : 0) - (a.highlight ? 1 : 0))
      : baseActions;
  }, [detectedEmotion]);

  const latestAssessment = assessments?.[0];

  return (
    <ProtectedRoute>
      <div
        className={`max-w-7xl mx-auto h-[calc(100dvh-7.5rem)] md:h-[calc(100vh-6rem)] flex rounded-none md:rounded-3xl border-y border-x-0 md:border border-white/[0.08] bg-slate-950/40 overflow-hidden shadow-2xl backdrop-blur-3xl relative transition-all duration-700 ${
          mounted ? "opacity-100 scale-100" : "opacity-0 scale-[0.98]"
        }`}
      >
        
        {/* ——— 1. Sidebar Panel (Left) ——— */}
        <div
          className={`
            ${sidebarOpen ? "w-80 border-r border-white/[0.06]" : "w-0 overflow-hidden border-r-0"}
            shrink-0 flex flex-col bg-slate-950/60 transition-all duration-300 ease-in-out relative z-20
            md:relative md:block
            ${sidebarOpen ? "absolute md:static inset-y-0 left-0 bg-slate-950 md:bg-transparent" : "hidden md:hidden"}
          `}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-accent" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Conversations
              </h2>
            </div>
            <button
              onClick={handleStartNewChat}
              className="p-2 rounded-xl bg-accent/20 hover:bg-accent/30 text-accent font-bold border border-accent/30 transition-all focus:outline-none focus:ring-2 focus:ring-accent active:scale-95 flex items-center gap-1.5 text-xs"
              title="Start New Chat"
              aria-label="Start new chat"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Chat</span>
            </button>
          </div>

          {/* Search bar */}
          <div className="p-3 border-b border-white/[0.04]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-accent/40 transition-all"
                aria-label="Search conversations"
              />
            </div>
          </div>

          {/* Chats list */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 no-scrollbar">
            {loadingConvs ? (
              <div className="py-8 text-center text-xs text-slate-500 font-semibold animate-pulse">Loading companion history...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500 font-medium">No previous chats found.</div>
            ) : (
              filteredConversations.map((c) => {
                const active = selectedConvId === c._id;
                const renaming = renameId === c._id;
                return (
                  <div
                    key={c._id}
                    onClick={() => !renaming && handleSelectConversation(c._id)}
                    className={`
                      group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all duration-300 border
                      ${active
                        ? "bg-accent/15 border-accent/30 text-white shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]"
                        : "bg-white/[0.01] border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                      }
                    `}
                    role="button"
                    tabIndex={0}
                    aria-label={`Chat: ${c.title}`}
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
                          className="w-full bg-slate-900 border border-accent/40 rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <p className="text-xs font-bold truncate tracking-tight">{c.title}</p>
                      )}
                      <p className="text-[10px] text-slate-500 truncate mt-1">
                        {c.messages.length > 0
                          ? c.messages[c.messages.length - 1].content
                          : "New conversation"}
                      </p>
                    </div>

                    {!renaming && (
                      <div className="absolute right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenameId(c._id);
                            setRenameTitle(c.title);
                          }}
                          className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
                          title="Rename"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(c._id, e)}
                          className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
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

        {/* ——— 2. Central Living Chat Companion Workspace ——— */}
        <div className="flex-1 flex flex-col bg-transparent relative z-10">
          
          {/* Header */}
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between bg-slate-950/40 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-xl hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 transition-colors"
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <ChevronLeft className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
              </button>
              
              {/* Shared Reusable AIPresenceOrb in Header */}
              <AIPresenceOrb
                size="sm"
                state={sending ? "thinking" : "idle"}
                emotion={detectedEmotion}
                showOuterRing={true}
                interactive={true}
              />

              <div>
                <h1 className="text-xs font-extrabold text-white tracking-wide uppercase flex items-center gap-2">
                  AI Companion 2.0
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-accent/20 text-accent border border-accent/30">
                    watsonx Granite
                  </span>
                </h1>
                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Emotionally aware ({detectedEmotion}) • Active Memory Sync
                </p>
              </div>
            </div>

            {/* Quick toolkit triggers */}
            <div className="flex items-center gap-2">
              <button
                onClick={startBreathing}
                className="p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Start Breathing Exercise"
              >
                <Wind className="h-3.5 w-3.5 text-accent" />
                <span className="hidden sm:inline">Breathe</span>
              </button>
            </div>
          </div>

          {/* Conversation Scene Container with Smooth Blur & Crossfade */}
          <div
            className={`flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar transition-all duration-300 ${
              isSwitchingChat ? "opacity-30 blur-sm scale-[0.99]" : "opacity-100 blur-0 scale-100"
            }`}
          >
            
            {/* Empty State / Premium Hero Scene (When chat is empty or new) */}
            {messages.length === 0 && (
              <div className="py-10 px-4 flex flex-col items-center justify-center text-center space-y-6 animate-fadeInUp">
                <div className="relative">
                  <AIPresenceOrb
                    size="lg"
                    state={sending ? "thinking" : "idle"}
                    emotion={detectedEmotion}
                    showOuterRing={true}
                    interactive={true}
                  />
                  <div className="absolute inset-0 bg-accent/10 rounded-full blur-3xl -z-10 animate-pulse" />
                </div>

                <div className="max-w-md space-y-2">
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    Welcome to your Living AI Companion
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    I am attuned to your emotional baseline (<span className="text-accent font-semibold">{detectedEmotion}</span>). How can I support your mental clarity and well-being today?
                  </p>
                </div>

                {/* Context Suggestion Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl text-left pt-2">
                  {[
                    { title: "Feeling Overwhelmed?", desc: "Let's explore what's weighing on your mind", prompt: "I'm feeling overwhelmed today. Can we break down what's causing this?" },
                    { title: "Analyze Assessment", desc: "Review your recent clinical scores & trends", prompt: "Can you analyze my recent PHQ-9 and GAD-7 scores?" },
                    { title: "Grounding Technique", desc: "Guide me through a calming exercise", prompt: "Guide me through a quick mental grounding technique." },
                    { title: "Reflective Chat", desc: "Reflect on today's daily check-in mood", prompt: "Let's discuss my mood log and find positive insights." }
                  ].map((card, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(card.prompt)}
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
            )}

            {/* Living Chat Bubbles Stream */}
            {messages.map((m, idx) => {
              const isUser = m.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex gap-3 sm:gap-4 ${isUser ? "flex-row-reverse" : ""} animate-fadeInUp`}
                  style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
                >
                  {/* Bubble Avatar */}
                  <div
                    className={`
                      h-9 w-9 rounded-2xl flex items-center justify-center shrink-0 border shadow-md
                      ${isUser
                        ? "bg-purple-600/20 border-purple-500/30 text-purple-300"
                        : "bg-accent/20 border-accent/30 text-accent"
                      }
                    `}
                  >
                    {isUser ? <Smile className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
                  </div>

                  <div className="space-y-2 max-w-[85%] sm:max-w-[78%]">
                    {/* Glassmorphism Message Bubble */}
                    <div
                      className={`
                        border rounded-3xl p-4.5 text-xs leading-relaxed shadow-lg relative group/msg backdrop-blur-xl transition-all duration-300
                        ${isUser
                          ? "bg-purple-900/10 border-purple-500/20 text-purple-100 rounded-tr-sm"
                          : "bg-white/[0.03] border-white/[0.08] text-slate-200 rounded-tl-sm hover:border-white/15"
                        }
                      `}
                    >
                      {/* Message Content */}
                      <div className="space-y-2 prose prose-invert">
                        {parseMarkdown(m.content)}
                      </div>

                      {/* Toolbars for messages */}
                      <div className="absolute right-3 bottom-2 flex items-center gap-1.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleCopyText(m.content, idx)}
                          className="p-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                          title="Copy text"
                        >
                          {copiedId === idx ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </button>
                        
                        {!isUser && (
                          <>
                            <button
                              onClick={() => setMessageFeedback((prev) => ({ ...prev, [idx]: "like" }))}
                              className={`p-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 transition-colors ${
                                messageFeedback[idx] === "like" ? "text-accent" : "text-slate-400 hover:text-white"
                              }`}
                              title="Helpful"
                            >
                              <ThumbsUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setMessageFeedback((prev) => ({ ...prev, [idx]: "dislike" }))}
                              className={`p-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 transition-colors ${
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

                    {/* Dynamic Suggested Actions on last AI message */}
                    {!isUser && idx === messages.length - 1 && (
                      <div className="flex flex-wrap gap-2 pt-1 animate-fadeInUp">
                        {suggestedActions.map((act) =>
                          act.link ? (
                            <Link
                              key={act.label}
                              href={act.link}
                              className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-slate-300 hover:text-white hover:bg-white/[0.08] hover:border-accent/40 transition-all shadow-sm"
                            >
                              {act.label}
                            </Link>
                          ) : (
                            <button
                              key={act.label}
                              onClick={act.action}
                              className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-accent/15 border border-accent/30 text-accent hover:bg-accent/25 transition-all shadow-sm"
                            >
                              {act.label}
                            </button>
                          )
                        )}
                        <button
                          onClick={handleRegenerate}
                          className="text-[10px] font-bold px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-white transition-all flex items-center gap-1"
                          title="Regenerate response"
                        >
                          <RotateCw className="h-3 w-3" />
                          Regenerate
                        </button>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="text-[9px] text-slate-500 px-1 font-medium">
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI Thinking Experience with Neural Orb & Cycling Status */}
            {sending && (
              <div className="flex gap-3 sm:gap-4 animate-fadeInUp">
                <div className="h-9 w-9 rounded-2xl bg-accent/20 border border-accent/40 flex items-center justify-center shrink-0">
                  <Bot className="h-4.5 w-4.5 text-accent animate-pulse" />
                </div>
                <div className="bg-white/[0.04] border border-accent/30 rounded-3xl p-4.5 max-w-[85%] sm:max-w-[78%] text-xs flex items-center space-x-3 shadow-lg backdrop-blur-xl">
                  <div className="flex items-center space-x-1.5">
                    <span className="h-2 w-2 bg-accent rounded-full animate-ping" />
                    <span className="text-white font-bold tracking-tight">
                      {thinkingStatuses[thinkingStatusIndex]}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input text controls */}
          <div className="p-4 border-t border-white/[0.06] bg-slate-950/40 backdrop-blur-md">
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
                placeholder={`Message AI Companion (Attuned to ${detectedEmotion})...`}
                className="flex-1 bg-white/[0.03] border border-white/[0.08] rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 resize-none focus:outline-none focus:border-accent/40 max-h-36 no-scrollbar transition-all"
                aria-label="Type a message"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || sending}
                className="p-3 rounded-2xl bg-accent hover:bg-accent/90 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-accent shrink-0 active:scale-95 shadow-lg shadow-accent/20"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ——— 3. Context & AI Memory Timeline Panel (Right Side) ——— */}
        <div className="hidden lg:flex w-80 border-l border-white/[0.06] flex-col bg-slate-950/60 p-4 space-y-4 overflow-y-auto no-scrollbar shrink-0">
          <div className="border-b border-white/[0.06] pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase tracking-wider">
              <Brain className="h-4 w-4 text-accent" />
              AI Memory & Baseline
            </h3>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Synced
            </span>
          </div>

          {loadingContext ? (
            <div className="py-8 text-center text-xs text-slate-500 font-semibold animate-pulse">Syncing active baseline...</div>
          ) : (
            <div className="space-y-4 text-xs">
              
              {/* Active Emotional Baseline Card */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-2 relative overflow-hidden shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current State</span>
                  <span className="text-xs font-extrabold text-accent">{detectedEmotion}</span>
                </div>
                {explanation && (
                  <p className="text-[11px] text-slate-300 leading-snug italic bg-white/[0.02] p-2.5 rounded-xl border border-white/[0.04]">
                    &quot;{explanation}&quot;
                  </p>
                )}
              </div>

              {/* Today's Check-in Record */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-3">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Check-In Insights</span>
                {[
                  { icon: <Smile className="h-3.5 w-3.5 text-accent" />, label: "Mood", value: todayRecord ? todayRecord.mood : "Not logged" },
                  { icon: <Activity className="h-3.5 w-3.5 text-rose-400" />, label: "Stress Level", value: todayRecord ? `${todayRecord.stress}/10` : "Not logged" },
                  { icon: <Clock className="h-3.5 w-3.5 text-blue-400" />, label: "Sleep Quality", value: todayRecord ? todayRecord.sleep : "Not logged" },
                  { icon: <Flame className="h-3.5 w-3.5 text-amber-500" />, label: "Check-In Streak", value: `${streak.current_streak} days` },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium flex items-center gap-2">
                      {icon}
                      {label}
                    </span>
                    <span className="font-bold text-white">{value}</span>
                  </div>
                ))}
              </div>

              {/* Latest Assessment Memory */}
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Clinical Memory</span>
                {latestAssessment ? (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-300 font-bold">Overall Clinical Assessment</span>
                      <span className="font-extrabold text-accent">
                        {Math.round(latestAssessment.risk_profile?.overall_risk?.score ?? 0)} pts
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Severity:{" "}
                      <span className="text-white font-semibold">
                        {latestAssessment.risk_profile?.overall_risk?.level || "Minimal"}
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500">No clinical assessment logged yet.</p>
                )}
              </div>

              {/* Quick Actions Toolkit */}
              <div className="pt-2 space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block px-1">Wellness Toolkit</span>
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/daily-checkin"
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] transition-colors text-center block space-y-1"
                  >
                    <BookOpen className="h-4 w-4 text-accent mx-auto" />
                    <span className="text-[10px] font-bold text-white block">Log Journal</span>
                  </Link>
                  <Link
                    href="/assessment"
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.06] transition-colors text-center block space-y-1"
                  >
                    <ShieldCheck className="h-4 w-4 text-emerald-400 mx-auto" />
                    <span className="text-[10px] font-bold text-white block">Take Screening</span>
                  </Link>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Breathing Exercise Modal */}
      {breathingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl animate-fadeIn">
          <div className="bg-slate-900 border border-accent/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full mx-4 shadow-2xl text-center space-y-6 relative">
            <button
              onClick={() => setBreathingOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">4-4-4 Box Breathing</h3>
              <p className="text-xs text-slate-400">Regulate your nervous system with mindful breathing</p>
            </div>

            <div className="relative h-40 w-40 mx-auto flex items-center justify-center">
              <div
                className={`absolute inset-0 rounded-full bg-accent/20 border-2 border-accent transition-all duration-1000 ${
                  breathingPhase === "inhale"
                    ? "scale-100 opacity-100"
                    : breathingPhase === "hold"
                    ? "scale-105 opacity-80 animate-pulse"
                    : "scale-75 opacity-50"
                }`}
              />
              <div className="relative z-10 text-center">
                <span className="text-2xl font-black text-white capitalize block">{breathingPhase}</span>
                <span className="text-xl font-bold text-accent">{breathingSeconds}s</span>
              </div>
            </div>

            <button
              onClick={() => setBreathingOpen(false)}
              className="w-full py-3 rounded-2xl bg-accent hover:bg-accent/90 text-white font-bold text-xs transition-all shadow-lg shadow-accent/20"
            >
              Complete Exercise
            </button>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
