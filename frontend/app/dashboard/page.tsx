"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AIPresenceOrb } from "@/components/AIPresenceOrb";
import { useAuth } from "@/context/AuthContext";
import { useAssessments } from "@/hooks/useAssessments";
import {
  ClipboardList,
  History,
  Heart,
  ShieldAlert,
  Sparkles,
  Flame,
  TrendingUp,
  TrendingDown,
  Activity,
  Smile,
  Droplet,
  Clock,
  BookOpen,
  ChevronRight,
  Stethoscope,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minus,
  Trophy,
  Target,
  BarChart3,
  Check,
} from "lucide-react";

import Link from "next/link";
import { dailyWellnessService, DailyCheckInRecord } from "@/services/dailyWellness";
import { SkeletonLine } from "@/components/SkeletonCard";
import { computeAchievements } from "@/components/AchievementBadge";
import { dashboardService, DashboardState, ReasoningState } from "@/services/dashboard";
import { journalService, JournalEntry } from "@/services/journal";
import { goalsService, WellnessGoal } from "@/services/goals";
import { journeyService, MonthlyReview, CorrelationsState } from "@/services/journey";
import { useEmotion } from "@/context/EmotionContext";
import { Bot } from "lucide-react";

// Lazy load heavy components
const AnalyticsCharts = dynamic(
  () => import("@/components/daily-checkin/AnalyticsCharts"),
  {
    ssr: false,
    loading: () => <div className="h-[320px] w-full rounded-2xl bg-white/[0.02] animate-pulse" aria-hidden="true" />,
  }
);

const WellnessCalendar = dynamic(
  () => import("@/components/WellnessCalendar"),
  {
    ssr: false,
    loading: () => <div className="h-[320px] w-full rounded-2xl bg-white/[0.02] animate-pulse" aria-hidden="true" />,
  }
);

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getTodayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function TrendArrow({ trend }: { trend: "better" | "same" | "worse" }) {
  if (trend === "better")
    return (
      <span className="inline-flex items-center text-emerald-400 font-bold text-[10px] gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <ArrowUp className="h-3 w-3" /> Better
      </span>
    );
  if (trend === "worse")
    return (
      <span className="inline-flex items-center text-rose-400 font-bold text-[10px] gap-0.5 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
        <ArrowDown className="h-3 w-3" /> Needs Attention
      </span>
    );
  return (
    <span className="inline-flex items-center text-slate-400 font-bold text-[10px] gap-0.5 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.05]">
      <Minus className="h-3 w-3" /> Stable
    </span>
  );
}

function getTrend(current?: number, previous?: number): "better" | "same" | "worse" {
  if (current === undefined || previous === undefined) return "same";
  if (current > previous + 3) return "better";
  if (current < previous - 3) return "worse";
  return "same";
}

const MOOD_SCALE = ["Very Happy", "Happy", "Neutral", "Sad", "Very Sad"];
function getMoodTrend(currentMood: string, previousMood: string): "better" | "same" | "worse" {
  const currentIdx = MOOD_SCALE.indexOf(currentMood);
  const previousIdx = MOOD_SCALE.indexOf(previousMood);
  if (currentIdx < 0 || previousIdx < 0) return "same";
  if (currentIdx < previousIdx) return "better";
  if (currentIdx > previousIdx) return "worse";
  return "same";
}

function DayReportModal({
  record,
  onClose,
}: {
  record: DailyCheckInRecord;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Wellness report for ${record.date}`}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-white/[0.06] bg-slate-900 p-6 space-y-5 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-4">
          <div>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Daily Report</p>
            <h3 className="text-base font-extrabold text-white mt-0.5">{record.date}</h3>
          </div>
          <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/20">
            Score {record.wellness_score}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {[
            { label: "Mood Today", value: record.mood },
            { label: "Stress Level", value: `${record.stress}/10` },
            { label: "Sleep Quality", value: record.sleep },
            { label: "Anxiety", value: `${record.anxiety}/10` },
            { label: "Hydration", value: record.water },
            { label: "Exercise", value: record.exercise ? `${record.exercise_minutes} mins` : "No" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/[0.02] border border-white/[0.04] p-3 rounded-2xl">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
              <p className="font-semibold text-slate-200 mt-1">{value}</p>
            </div>
          ))}
        </div>
        {record.ai_summary && (
          <div className="rounded-2xl bg-indigo-950/20 border border-indigo-500/10 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5" /> Watsonx AI Insight
            </div>
            <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{record.ai_summary}&rdquo;</p>
          </div>
        )}
        <button
          onClick={onClose}
          className="w-full rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-bold text-slate-300 py-3 transition-all border border-white/[0.05]"
        >
          Close Report
        </button>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5 bg-white/[0.02] rounded-2xl p-4 border border-white/[0.04] shadow-sm hover:border-white/[0.08] transition-all">
      <span className="shrink-0 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
        <p className="text-xs font-bold text-slate-200 mt-1 truncate">{value}</p>
      </div>
    </div>
  );
}

function SectionHeader({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4 mt-2">
      <h2 className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</h2>
      {action}
    </div>
  );
}


function getGreetingForEmotion(emotion: string): string {
  switch (emotion) {
    case "Happy":
      return "You're making great progress today. Keep it up!";
    case "Calm":
      return "Welcome back. Let's continue building healthy habits.";
    case "Focused":
      return "You're in a productive mindset today.";
    case "Stressed":
      return "Take a deep breath. Let's focus on one step at a time.";
    case "Anxious":
      return "Take a gentle pause. Let's focus on relaxation and grounding.";
    case "Low Mood":
      return "Small steps matter. We're here to support your journey.";
    default:
      return "Welcome back to your personalized wellness workspace.";
  }
}

function CountUp({ end, duration = 1000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [end, duration]);

  return <>{count}</>;
}

function TypewriterInsight({ text }: { text: string }) {
  const [displayedText, setDisplayedText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnalyzing(false);
      let currentLength = 0;
      const interval = setInterval(() => {
        currentLength += 3;
        if (currentLength >= text.length) {
          setDisplayedText(text);
          clearInterval(interval);
        } else {
          setDisplayedText(text.slice(0, currentLength));
        }
      }, 15);
      return () => clearInterval(interval);
    }, 1200);

    return () => clearTimeout(timer);
  }, [text]);

  if (isAnalyzing) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-slate-400 py-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
        </span>
        <span className="font-semibold animate-pulse">Analyzing today&apos;s wellness patterns...</span>
      </div>
    );
  }

  return (
    <p className="text-[11px] text-slate-300 leading-relaxed font-semibold transition-all duration-500">
      {displayedText}
    </p>
  );
}

// AIPresenceOrb imported from @/components/AIPresenceOrb

interface TimelineItemProps {
  label: string;
  completed: boolean;
  time: string;
}

function TimelineItem({ label, completed, time }: TimelineItemProps) {
  return (
    <div className="flex flex-col items-center relative z-10 group cursor-default">
      <div 
        className={`
          h-8 w-8 rounded-full border flex items-center justify-center transition-all duration-500
          ${completed 
            ? "bg-accent/10 border-accent text-accent shadow-[0_0_12px_rgba(var(--accent-rgb),0.2)]" 
            : "bg-white/[0.01] border-white/[0.08] text-slate-500 group-hover:border-white/20"
          }
        `}
      >
        {completed ? (
          <Check className="h-4 w-4 stroke-[3]" />
        ) : (
          <div className="h-2 w-2 rounded-full bg-slate-500 group-hover:bg-slate-300 transition-colors animate-pulse" />
        )}
      </div>
      <p className="text-[10px] font-bold text-white mt-2 group-hover:text-accent transition-colors">{label}</p>
      <p className="text-[8px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">{time}</p>
    </div>
  );
}

function WellnessTimeline({ 
  todayCheckedIn, 
  hasJournal, 
  hasAssessment, 
  hasGoals 
}: { 
  todayCheckedIn: boolean; 
  hasJournal: boolean; 
  hasAssessment: boolean; 
  hasGoals: boolean; 
}) {
  return (
    <div className="glass-card p-6 rounded-3xl relative overflow-hidden animate-fadeInUp stagger-4 opacity-0">
      <SectionHeader label="Wellness Journey Timeline" />
      <div className="relative flex items-center justify-between mt-6 max-w-4xl mx-auto px-4">
        <div className="absolute top-[15px] left-8 right-8 h-[2px] bg-white/[0.04] z-0" />
        <div 
          className="absolute top-[15px] left-8 h-[2px] bg-accent transition-all duration-1000 z-0" 
          style={{ 
            width: todayCheckedIn && hasJournal && hasAssessment && hasGoals 
              ? "calc(100% - 64px)" 
              : todayCheckedIn && hasJournal && hasAssessment 
              ? "75%" 
              : todayCheckedIn && hasJournal 
              ? "50%" 
              : todayCheckedIn 
              ? "25%" 
              : "0%" 
          }}
        />

        <TimelineItem label="Morning Rise" completed={true} time="08:00 AM" />
        <TimelineItem label="Daily Check-In" completed={todayCheckedIn} time="09:30 AM" />
        <TimelineItem label="Journal Log" completed={hasJournal} time="12:00 PM" />
        <TimelineItem label="Clinical Screen" completed={hasAssessment} time="03:00 PM" />
        <TimelineItem label="Goal Milestones" completed={hasGoals} time="06:00 PM" />
        <TimelineItem label="Rest & Reflect" completed={todayCheckedIn && hasJournal} time="09:00 PM" />
      </div>
    </div>
  );
}

function BoxBreathingWidget() {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Rest">("Inhale");
  const [secondsLeft, setSecondsLeft] = useState(4);

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setPhase((currentPhase) => {
            switch (currentPhase) {
              case "Inhale": return "Hold";
              case "Hold": return "Exhale";
              case "Exhale": return "Rest";
              case "Rest":
              default:
                return "Inhale";
            }
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <div className="glass-card p-5 rounded-3xl flex flex-col justify-between h-[200px] relative overflow-hidden group">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Grounding Box Breathing</p>
        </div>

        {isActive ? (
          <div className="flex items-center gap-4 py-2">
            <div 
              className={`
                h-12 w-12 rounded-full border border-accent/30 flex items-center justify-center transition-all duration-[4000ms] ease-in-out
                ${phase === "Inhale" ? "scale-125 bg-accent/20" : ""}
                ${phase === "Hold" ? "scale-125 bg-accent/10 border-accent/40" : ""}
                ${phase === "Exhale" ? "scale-95 bg-transparent" : ""}
                ${phase === "Rest" ? "scale-95 bg-transparent" : ""}
              `}
            >
              <span className="text-[9px] font-black text-white">{secondsLeft}s</span>
            </div>
            <div>
              <p className="text-xs font-bold text-white capitalize leading-none">{phase} Phase</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                {phase === "Inhale" && "Breathe in slowly through your nose."}
                {phase === "Hold" && "Retain your breath, keeping your core relaxed."}
                {phase === "Exhale" && "Exhale gently through your mouth."}
                {phase === "Rest" && "Pause and prepare for the next cycle."}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-400 leading-normal pt-1.5">
            Calm your nervous system instantly. Practice a guided 4-second box breathing cycle directly from this workspace.
          </p>
        )}
      </div>

      <button
        onClick={() => {
          setIsActive(!isActive);
          if (!isActive) {
            setPhase("Inhale");
            setSecondsLeft(4);
          }
        }}
        className="w-full text-center text-xs font-bold py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] text-slate-200 hover:bg-white/[0.06] transition-all"
      >
        {isActive ? "Stop Guide" : "Start Grounding Cycle"}
      </button>
    </div>
  );
}

function AICoachPreview({ lastAdvice }: { lastAdvice: string }) {
  return (
    <div className="glass-card p-5 rounded-3xl flex flex-col justify-between h-[200px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
          <div className="flex items-center gap-2">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">AI Companion Status</p>
          </div>
          <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            Online
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">Last Reflection Suggestion</p>
          <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 pt-1">
            {lastAdvice || "Focus on deep box breathing cycles, and try log-writing in your journal today."}
          </p>
        </div>
      </div>

      <Link href="/coach">
        <button className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all border border-indigo-500/20 shadow-md shadow-indigo-500/10">
          <span>Continue Conversation</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </Link>
    </div>
  );
}


function getRecommendationCards(emotion: string) {
  switch (emotion) {
    case "Low Mood":
      return [
        {
          category: "Journaling",
          title: "Write a Gratitude Entry",
          description: "List three small positive things in your life to lift your emotional vitality.",
          actionText: "Write Entry",
          href: "/journal",
          icon: <BookOpen className="h-4 w-4" />,
        },
        {
          category: "Coaching",
          title: "Check in with AI Coach",
          description: "Talk to your AI Coach about how you are feeling. It can offer gentle coaching guidance.",
          actionText: "Talk to Coach",
          href: "/coach",
          icon: <Bot className="h-4 w-4" />,
        },
        {
          category: "Care Network",
          title: "Find Support Near You",
          description: "Search trusted mental health professionals, therapists, and psychologists.",
          actionText: "Search Locator",
          href: "/consult",
          icon: <Stethoscope className="h-4 w-4" />,
        },
      ];
    case "Stressed":
      return [
        {
          category: "Breathe",
          title: "Try Boxed Breathing",
          description: "Practice a simple 4-second box breathing cycle to calm your nervous system.",
          actionText: "Start Breathing",
          href: "/daily-checkin",
          icon: <Heart className="h-4 w-4" />,
        },
        {
          category: "Mindfulness",
          title: "Self-Reflection Pause",
          description: "Spend 5 minutes in silent mindfulness to ground your thoughts.",
          actionText: "Reflect Now",
          href: "/journal",
          icon: <BookOpen className="h-4 w-4" />,
        },
        {
          category: "Coaching",
          title: "Decompress with AI Coach",
          description: "Ask the coach for stress management techniques tailored to your situation.",
          actionText: "Chat with Coach",
          href: "/coach",
          icon: <Bot className="h-4 w-4" />,
        },
      ];
    case "Anxious":
      return [
        {
          category: "Grounding",
          title: "5-4-3-2-1 Technique",
          description: "Identify 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you taste.",
          actionText: "Try Grounding",
          href: "/journal",
          icon: <Sparkles className="h-4 w-4" />,
        },
        {
          category: "Coaching",
          title: "Speak with AI Coach",
          description: "Discuss your anxious thoughts in a private space for supportive guidance.",
          actionText: "Talk to Coach",
          href: "/coach",
          icon: <Bot className="h-4 w-4" />,
        },
        {
          category: "Breathe",
          title: "Slow Paced Breathing",
          description: "Inhale for 4 seconds, hold for 2, exhale for 6, hold for 2.",
          actionText: "Breathe Slowly",
          href: "/daily-checkin",
          icon: <Heart className="h-4 w-4" />,
        },
      ];
    case "Happy":
      return [
        {
          category: "Streak",
          title: "Celebrate Your Streak",
          description: "Fantastic progress! Keep your wellness check-in consistency alive.",
          actionText: "Check Streak",
          href: "/daily-history",
          icon: <Heart className="h-4 w-4" />,
        },
        {
          category: "Goals",
          title: "Set a New Wellness Goal",
          description: "Build on your positive momentum by adding a healthy new goal.",
          actionText: "Add Goal",
          href: "/goals",
          icon: <Target className="h-4 w-4" />,
        },
        {
          category: "Reflect",
          title: "Capture the Joy",
          description: "Write down what went well today in your journal so you can read it later.",
          actionText: "Write Journal",
          href: "/journal",
          icon: <BookOpen className="h-4 w-4" />,
        },
      ];
    case "Focused":
      return [
        {
          category: "Goals",
          title: "Review Today's Goals",
          description: "Align your energy with your goals and tick off tasks.",
          actionText: "Review Goals",
          href: "/goals",
          icon: <Target className="h-4 w-4" />,
        },
        {
          category: "Reflect",
          title: "Log Your Deep Focus",
          description: "Write down your productivity achievements in your journal.",
          actionText: "Log Focus",
          href: "/journal",
          icon: <BookOpen className="h-4 w-4" />,
        },
        {
          category: "Habits",
          title: "Log Daily Habits",
          description: "Confirm hydration, meals, and exercise to maintain your momentum.",
          actionText: "Check In",
          href: "/daily-checkin",
          icon: <Heart className="h-4 w-4" />,
        },
      ];
    case "Calm":
    default:
      return [
        {
          category: "Move",
          title: "Light Stretching Session",
          description: "Do a simple 10-minute stretch to maintain high flexibility.",
          actionText: "Log Activity",
          href: "/daily-checkin",
          icon: <Heart className="h-4 w-4" />,
        },
        {
          category: "Reflect",
          title: "Mindful Journaling",
          description: "Reflect on this state of calm to anchor it in your memory.",
          actionText: "Write Entry",
          href: "/journal",
          icon: <BookOpen className="h-4 w-4" />,
        },
        {
          category: "Hydration",
          title: "Refill Your Water",
          description: "Ensure you meet your daily hydration target of at least 2 liters.",
          actionText: "Log Hydration",
          href: "/daily-checkin",
          icon: <Clock className="h-4 w-4" />,
        },
      ];
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--mouse-x", `${x}px`);
    card.style.setProperty("--mouse-y", `${y}px`);
  };
  const {
    detectedEmotion,
    explanation,
    advice,
    showSupportRecommendation,
  } = useEmotion();
  const { data: assessments, isLoading: loadingAssessments } = useAssessments(5);

  const [todayCheckedIn, setTodayCheckedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState<DailyCheckInRecord | null>(null);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0, total_checkins: 0 });
  const [analyticsData, setAnalyticsData] = useState<DailyCheckInRecord[]>([]);
  const [historyData, setHistoryData] = useState<DailyCheckInRecord[]>([]);
  const [dashboardState, setDashboardState] = useState<DashboardState | null>(null);
  const [reasoning, setReasoning] = useState<ReasoningState | null>(null);
  const [showReasoning, setShowReasoning] = useState(false);

  // Phase 3 States
  const [latestJournal, setLatestJournal] = useState<JournalEntry | null>(null);
  const [activeGoals, setActiveGoals] = useState<WellnessGoal[]>([]);
  const [monthlyReview, setMonthlyReview] = useState<MonthlyReview | null>(null);
  const [correlations, setCorrelations] = useState<CorrelationsState | null>(null);

  const [loadingWellness, setLoadingWellness] = useState(true);
  const [calendarRecord, setCalendarRecord] = useState<DailyCheckInRecord | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [gaugeScore, setGaugeScore] = useState(0);

  useEffect(() => {
    setIsMounted(true);
    loadWellnessDashboard();
  }, []);

  const loadWellnessDashboard = async () => {
    try {
      const [
        todayRes,
        streakRes,
        analyticsRes,
        historyRes,
        stateRes,
        reasoningRes,
        journalsRes,
        goalsRes,
        reviewRes,
        correlationsRes,
      ] = await Promise.all([
        dailyWellnessService.getTodayCheckIn(),
        dailyWellnessService.getStreak(),
        dailyWellnessService.getAnalytics(),
        dailyWellnessService.getHistory(),
        dashboardService.getDashboardState(),
        dashboardService.getReasoningState(),
        journalService.listJournals(),
        goalsService.listGoals("active"),
        journeyService.getMonthlyReview(),
        journeyService.getCorrelations(),
      ]);
      setTodayCheckedIn(todayRes.checked_in);
      setTodayRecord(todayRes.data);
      setStreak(streakRes);
      setAnalyticsData(analyticsRes);
      setHistoryData(historyRes);
      setDashboardState(stateRes);
      setReasoning(reasoningRes);

      if (journalsRes && journalsRes.length > 0) {
        setLatestJournal(journalsRes[0]);
      }
      setActiveGoals(goalsRes || []);
      setMonthlyReview(reviewRes || null);
      setCorrelations(correlationsRes || null);
    } catch (e) {
      console.error("Failed to load wellness dashboard metrics:", e);
    } finally {
      setLoadingWellness(false);
    }
  };

  const progressMetrics = useMemo(() => {
    if (analyticsData.length < 2) return null;
    const sorted = [...analyticsData].sort((a, b) => a.date.localeCompare(b.date));
    const current = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];
    const diff = current.wellness_score - previous.wellness_score;
    let trend: "improving" | "stable" | "needs_attention" = "stable";
    if (diff > 3) trend = "improving";
    else if (diff < -3) trend = "needs_attention";
    return {
      currentScore: current.wellness_score,
      previousScore: previous.wellness_score,
      diff: Math.abs(diff),
      isPositive: diff >= 0,
      trend,
      currentMood: current.mood,
      previousMood: previous.mood,
      currentStress: current.stress,
      previousStress: previous.stress,
      currentSleep: current.sleep,
      previousSleep: previous.sleep,
    };
  }, [analyticsData]);

  const latestAssessment = useMemo(() => {
    if (!assessments || assessments.length === 0) return null;
    return assessments[0];
  }, [assessments]);

  const achievements = useMemo(
    () =>
      computeAchievements({
        totalCheckins: streak.total_checkins,
        currentStreak: streak.current_streak,
        longestStreak: streak.longest_streak,
        hasAssessment: !!latestAssessment,
        analyticsData: analyticsData.map((r) => ({
          mood: r.mood,
          sleep: r.sleep,
          water: r.water,
          exercise: r.exercise,
        })),
      }),
    [streak, latestAssessment, analyticsData]
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const wellnessScore = dashboardState?.wellness_score ?? todayRecord?.wellness_score;

  useEffect(() => {
    if (!loadingWellness && wellnessScore) {
      const timer = setTimeout(() => {
        setGaugeScore(wellnessScore);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loadingWellness, wellnessScore]);

  // Modular Widget Snippets
  const consistencyStatsWidget = (
    <div 
      onMouseMove={handleMouseMove}
      className="glass-card interactive-card p-6 space-y-5 flex flex-col justify-between h-full"
    >
      <div>
        <SectionHeader label="Consistency stats" />
        <div className="grid grid-cols-3 gap-3 text-center pt-2">
          {[
            { label: "Current", value: streak.current_streak, unit: "days", color: "text-amber-400 bg-amber-500/5 border-amber-500/10" },
            { label: "Longest", value: streak.longest_streak, unit: "days", color: "text-indigo-400 bg-indigo-500/5 border-indigo-500/10" },
            { label: "Total Logs", value: streak.total_checkins, unit: "check-ins", color: "text-emerald-400 bg-emerald-500/5 border-emerald-500/10" },
          ].map(({ label, value, unit, color }) => (
            <div key={label} className={`border rounded-2xl py-3.5 px-2 ${color} flex flex-col justify-center`}>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
              <p className="text-xl font-black leading-none mt-2">{loadingWellness ? "—" : <CountUp end={value} />}</p>
              <p className="text-[8px] text-slate-500 mt-1 font-semibold">{unit}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-4 pt-2 border-t border-white/[0.04]">
        {[
          { label: "🥉 7 Days", threshold: 7 },
          { label: "🥈 30 Days", threshold: 30 },
          { label: "🥇 100 Days", threshold: 100 },
        ].map(({ label, threshold }) => (
          <span
            key={threshold}
            className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${
              streak.total_checkins >= threshold
                ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-sm"
                : "bg-white/[0.02] text-slate-600 border-white/[0.04]"
            }`}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );

  const achievementsWidget = (
    <div 
      onMouseMove={handleMouseMove}
      className="glass-card interactive-card p-6 space-y-4 h-full"
    >
      <SectionHeader
        label="Wellness Achievements"
        action={
          <span className="text-[10px] font-bold text-slate-500 bg-white/[0.04] border border-white/[0.05] px-2.5 py-0.5 rounded-full">
            {unlockedCount} / {achievements.length} Unlocked
          </span>
        }
      />
      {loadingWellness ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonLine key={i} className="h-24 rounded-2xl" />)}
        </div>
      ) : achievements.every((a) => !a.unlocked) && streak.total_checkins === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
          <Trophy className="h-8 w-8 text-slate-600" aria-hidden="true" />
          <p className="text-xs text-slate-500">Unlocking achievements begins with your first daily check-in logs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" role="list" aria-label="Achievements">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`p-3 rounded-2xl border flex flex-col justify-between text-center transition-all ${
                achievement.unlocked
                  ? "bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-indigo-500/10 text-slate-200"
                  : "bg-white/[0.01] border-white/[0.03] text-slate-500 opacity-60"
              }`}
            >
              <div className="text-xl mb-1.5">{achievement.unlocked ? achievement.emoji : "🔒"}</div>
              <p className="text-[9px] font-bold tracking-tight line-clamp-1">{achievement.title}</p>
              <p className="text-[7.5px] leading-tight text-slate-500 mt-1 line-clamp-2">{achievement.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const goalsWidget = (
    <div 
      onMouseMove={handleMouseMove}
      className="glass-card interactive-card p-5 flex flex-col justify-between gap-5 h-full"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-rose-400" aria-hidden="true" />
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Active Goals</p>
        </div>
        {activeGoals.length > 0 ? (
          <div className="space-y-2">
            {activeGoals.slice(0, 3).map((goal) => (
              <div key={goal._id} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] px-2.5 py-2 rounded-xl text-[10px]">
                <span className="truncate text-slate-300 pr-1">{goal.title}</span>
                <span className="text-[9px] text-rose-400 capitalize shrink-0 font-bold">{goal.frequency}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-600 text-center py-4">No active goals currently.</p>
        )}
      </div>
      <Link href="/goals" className="flex items-center justify-between text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
        <span>Manage Goals</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );

  const journalWidget = (
    <div 
      onMouseMove={handleMouseMove}
      className="glass-card interactive-card p-5 flex flex-col justify-between gap-5 h-full"
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-violet-400" aria-hidden="true" />
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Reflect journal</p>
        </div>
        {latestJournal ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold">
              <span>{latestJournal.date}</span>
              <span className="bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded uppercase">
                {latestJournal.ai_analysis?.sentiment}
              </span>
            </div>
            <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
              &ldquo;{latestJournal.ai_analysis?.summary}&rdquo;
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-600 text-center py-4">No entries created yet.</p>
        )}
      </div>
      <Link href="/journal" className="flex items-center justify-between text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
        <span>Open Journal</span>
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );

  const progressTelemetryWidget = (
    <div 
      onMouseMove={handleMouseMove}
      className="glass-card interactive-card p-6 space-y-4 h-full"
    >
      <SectionHeader
        label="Progress telemetry"
        action={
          <Link href="/daily-history" className="text-xs font-bold text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
            <span>Full History</span>
            <ChevronRight className="h-3 w-3" />
          </Link>
        }
      />
      {loadingWellness ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <SkeletonLine key={i} className="h-12 rounded-2xl" />)}
        </div>
      ) : !progressMetrics ? (
        <div className="text-center py-8 text-xs text-slate-500 leading-relaxed">
          Add more daily check-ins to compute comparison graphs.
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-end justify-between border-b border-white/[0.04] pb-4">
            <div>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Current Score</p>
              <p className="text-3xl font-black text-white mt-1"><CountUp end={progressMetrics.currentScore} />%</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Previous Score</p>
              <p className="text-xl font-bold text-slate-500 mt-1"><CountUp end={progressMetrics.previousScore} />%</p>
            </div>
          </div>
          <div className="space-y-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Mood Level</span>
              <TrendArrow trend={getMoodTrend(progressMetrics.currentMood, progressMetrics.previousMood)} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Stress Levels</span>
              <TrendArrow trend={getTrend(progressMetrics.previousStress, progressMetrics.currentStress)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const therapistSupportWidget = (
    <div 
      onMouseMove={handleMouseMove}
      className="glass-card interactive-card p-6 relative overflow-hidden h-full flex flex-col justify-between"
    >
      <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/5 blur-3xl rounded-full" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shrink-0">
            <Stethoscope className="h-5 w-5 text-white" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-bold text-white">Need professional support?</p>
            <p className="text-xs text-slate-400">Search directory grids of local certified psychiatrists and therapists near your location.</p>
          </div>
        </div>
        <Link
          href="/consult"
          className="shrink-0 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-xs font-bold text-white transition-all shadow-md shadow-indigo-500/10 inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 button-micro"
        >
          <span>Consult Directory</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );

  const wellnessGaugeWidget = (
    <div 
      onMouseMove={handleMouseMove}
      className="glass-card interactive-card rounded-3xl p-6 flex flex-col justify-between gap-6 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 blur-3xl rounded-full" />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Wellness Index</p>
          <p className="text-4xl font-black text-white mt-1.5 leading-none">
            {loadingWellness ? "—" : <CountUp end={wellnessScore ?? 0} />}
            <span className="text-base text-slate-500 font-bold ml-1">/100</span>
          </p>
        </div>
        <div className="relative flex h-16 w-16 items-center justify-center">
          <svg viewBox="0 0 48 48" className="h-16 w-16 -rotate-90" aria-hidden="true">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3.5" />
            <circle
              cx="24" cy="24" r="20" fill="none"
              stroke="#6366f1" strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - gaugeScore / 100)}`}
              className="transition-all duration-1000"
            />
          </svg>
          <Activity className="absolute h-5 w-5 text-indigo-400 animate-pulse" aria-hidden="true" />
        </div>
      </div>
      {!loadingWellness && (
        <div className="flex items-center gap-2">
          {progressMetrics?.trend === "improving" ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2.5 py-0.5">
              <TrendingUp className="h-3 w-3" /> Improving +{progressMetrics.diff}%
            </span>
          ) : progressMetrics?.trend === "needs_attention" ? (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-full px-2.5 py-0.5">
              <TrendingDown className="h-3 w-3" /> Down -{progressMetrics.diff}%
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 bg-white/[0.04] border border-white/[0.05] rounded-full px-2.5 py-0.5">
              <Minus className="h-3 w-3" /> Stable
            </span>
          )}
          {todayCheckedIn && <span className="text-[10px] text-slate-500">vs yesterday</span>}
        </div>
      )}
    </div>
  );

  const vitalsParametersWidget = (
    <div 
      onMouseMove={handleMouseMove}
      className="glass-card interactive-card rounded-3xl p-6 lg:col-span-2 space-y-4"
    >
      <div className="flex items-center justify-between border-b border-white/[0.04] pb-2">
        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Logged parameters</p>
        {todayCheckedIn && (
          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
            Logged for Today
          </span>
        )}
      </div>
      {loadingWellness ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <SkeletonLine key={i} className="h-16 rounded-2xl" />)}
        </div>
      ) : !todayRecord ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3">
          <p className="text-xs text-slate-400 max-w-sm">
            You haven&apos;t logged today&apos;s check-in metrics yet. Take 30 seconds to capture your vitals.
          </p>
          <Link
            href="/daily-checkin"
            className="rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] px-4 py-2 text-xs font-bold text-slate-200 transition-all active:scale-95"
          >
            Start Daily Log
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={<Smile className="h-4.5 w-4.5 text-indigo-400" />} label="Mood" value={todayRecord.mood ?? "—"} />
            <StatCard icon={<Activity className="h-4.5 w-4.5 text-rose-400" />} label="Stress Level" value={`${todayRecord.stress ?? "—"}/10`} />
            <StatCard icon={<Clock className="h-4.5 w-4.5 text-blue-400" />} label="Sleep window" value={todayRecord.sleep ?? "—"} />
            <StatCard icon={<Droplet className="h-4.5 w-4.5 text-cyan-400" />} label="Hydration" value={todayRecord.water ?? "—"} />
          </div>

          {todayRecord.ai_summary && (
            <div className="rounded-2xl bg-indigo-500/[0.03] border border-indigo-500/10 p-4 space-y-1">
              <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Today&apos;s AI Insights
              </p>
              <p className="text-xs text-slate-300 leading-relaxed italic">&ldquo;{todayRecord.ai_summary}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const todaySummaryWidget = (
    <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4.5 space-y-3.5 w-full md:w-[240px] shrink-0">
      <div className="text-[9px] font-bold text-slate-450 uppercase tracking-widest leading-none pb-1.5 border-b border-white/[0.02]">
        Today&apos;s Summary
      </div>
      <div className="space-y-2.5 text-[11px]">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Mood Trend</span>
          <span className="font-bold text-slate-200 capitalize">{progressMetrics?.trend || "Stable"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Goal Progress</span>
          <span className="font-bold text-accent">{activeGoals.length > 0 ? `${activeGoals.filter(g => g.status === 'completed').length}/${activeGoals.length}` : "0/0"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Journal Log</span>
          <span className={`font-bold ${latestJournal ? "text-emerald-400" : "text-amber-400"}`}>
            {latestJournal ? "Logged ✓" : "Pending"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium">Assessment</span>
          <span className={`font-bold ${latestAssessment ? "text-emerald-400" : "text-indigo-400"}`}>
            {latestAssessment ? "Complete" : "Required"}
          </span>
        </div>
      </div>
    </div>
  );

  const latestAssessmentWidget = (
    <div 
      onMouseMove={handleMouseMove}
      className="glass-card interactive-card rounded-3xl p-6 space-y-4 flex flex-col justify-between h-full"
    >
      <div>
        <SectionHeader
          label="Latest Clinical Assessment"
          action={
            <Link href="/assessment" className="text-xs font-bold text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors">
              <span>New Screening</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          }
        />
        {loadingAssessments ? (
          <SkeletonLine className="h-24 rounded-2xl animate-pulse" />
        ) : !latestAssessment ? (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.04] p-4 text-center space-y-4">
            <p className="text-xs text-slate-500">No diagnostic screening logs found.</p>
            <Link href="/assessment" className="inline-flex">
              <button className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-500 transition-all border border-indigo-500/20 active:scale-95">
                Take Screening Now
              </button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {[
              { label: "Completion Date", value: latestAssessment.metadata?.generated_at?.split("T")[0] || "Recent" },
              { label: "Overall Risk Level", value: latestAssessment.risk_profile?.overall_risk?.level || "Minimal" },
              { label: "Aggregated Clinical Score", value: `${Math.round(latestAssessment.risk_profile?.overall_risk?.score ?? 0)} / 100` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-white/[0.04] text-xs">
                <span className="text-slate-400 font-medium">{label}</span>
                <span className="font-bold text-slate-200">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Link
        href={latestAssessment ? `/results/${latestAssessment.id}` : "/assessment"}
        className="flex items-center justify-center gap-2 text-xs font-bold text-slate-300 bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] rounded-2xl py-3 transition-all active:scale-95 mt-4"
      >
        <span>{latestAssessment ? "View Complete Assessment Report" : "Start Screening"}</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );

  // Dynamic Widget Layout Selector based on active emotion theme
  const getWidgetLayout = () => {
    switch (detectedEmotion) {
      case "Happy":
        return {
          priorityWidget1: consistencyStatsWidget,
          priorityWidget2: achievementsWidget,
          secondaryWidget1: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {goalsWidget}
              {journalWidget}
            </div>
          ),
          secondaryWidget2: latestAssessmentWidget,
        };
      case "Focused":
        return {
          priorityWidget1: goalsWidget,
          priorityWidget2: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {progressTelemetryWidget}
              {latestAssessmentWidget}
            </div>
          ),
          secondaryWidget1: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {achievementsWidget}
              {consistencyStatsWidget}
            </div>
          ),
          secondaryWidget2: journalWidget,
        };
      case "Stressed":
      case "Anxious":
        return {
          priorityWidget1: <BoxBreathingWidget />,
          priorityWidget2: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              <AICoachPreview lastAdvice={advice} />
              {journalWidget}
            </div>
          ),
          secondaryWidget1: therapistSupportWidget,
          secondaryWidget2: latestAssessmentWidget,
        };
      case "Low Mood":
        return {
          priorityWidget1: <AICoachPreview lastAdvice={advice} />,
          priorityWidget2: therapistSupportWidget,
          secondaryWidget1: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {journalWidget}
              {goalsWidget}
            </div>
          ),
          secondaryWidget2: latestAssessmentWidget,
        };
      case "Calm":
      default:
        return {
          priorityWidget1: journalWidget,
          priorityWidget2: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {progressTelemetryWidget}
              {latestAssessmentWidget}
            </div>
          ),
          secondaryWidget1: (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
              {goalsWidget}
              {consistencyStatsWidget}
            </div>
          ),
secondaryWidget2: achievementsWidget,
        };
    }
  };

  const layout = getWidgetLayout();

  return (
    <ProtectedRoute>
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-all duration-[1000ms] ease-out ${isMounted ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-[0.98] blur-[8px]"}`}>

        {/* ─── 1. Living Dashboard Hero ─── */}
        <div className="glass-panel interactive-card p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border-l-4 border-l-accent animate-fadeInUp stagger-1 opacity-0 rounded-3xl">
          {/* Soft Ambient Background Glow */}
          <div className="absolute top-0 right-0 h-48 w-48 bg-accent/10 blur-3xl rounded-full animate-breathe" />

          {/* Left Side: Greeting & Status */}
          <div className="space-y-4 flex-1">
            <div>
              <p className="text-[9px] font-bold text-accent uppercase tracking-widest leading-none">{getTodayDate()}</p>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-1">
                {getGreeting()}, {user?.full_name?.split(" ")[0] || "there"} 👋
              </h1>
              <div className="flex items-center gap-2 mt-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full w-fit">
                <Flame className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                <span className="text-[10px] font-bold text-amber-400">{streak.current_streak} Day Streak</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="rounded-full bg-accent/10 px-3.5 py-1 text-[11px] font-bold text-accent border border-accent/20 flex items-center gap-1.5 animate-pulse">
                {detectedEmotion === "Happy" && "😊"}
                {detectedEmotion === "Calm" && "😌"}
                {detectedEmotion === "Focused" && "🎯"}
                {detectedEmotion === "Stressed" && "😟"}
                {detectedEmotion === "Anxious" && "😰"}
                {detectedEmotion === "Low Mood" && "😔"}
                <span className="capitalize">{detectedEmotion} Mood active</span>
              </span>

              <span className="text-[11px] text-slate-400 font-semibold italic">
                &ldquo;{getGreetingForEmotion(detectedEmotion)}&rdquo;
              </span>
            </div>

            {/* Typewritten AI Insight Banner */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4.5 space-y-2 mt-4 max-w-lg">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-accent uppercase tracking-widest pb-1 border-b border-white/[0.02]">
                <Sparkles className="h-3 w-3 animate-pulse" />
                <span>watsonx Granite Cognitive Insight</span>
              </div>
              <TypewriterInsight text={explanation || "Your cognitive metrics reflect a calm and balanced state of mind."} />
              <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                <span className="font-bold text-accent">Advice:</span> {advice || "Engage in mindfulness checks and stick to your hydration goal."}
              </p>
            </div>
          </div>

          {/* Center Column: Animated AI Presence Orb */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <AIPresenceOrb />
            <p className="text-[9px] font-black tracking-widest uppercase text-slate-500 mt-2">IBM watsonx Granite</p>
          </div>

          {/* Right Column: Today's Summary */}
          {todaySummaryWidget}
        </div>

        {/* ─── 2. Horizontal Wellness Timeline ─── */}
        <WellnessTimeline 
          todayCheckedIn={todayCheckedIn}
          hasJournal={!!latestJournal}
          hasAssessment={!!latestAssessment}
          hasGoals={activeGoals.length > 0}
        />

        {/* ─── Clinical Care locator Warning ─── */}
        {showSupportRecommendation && (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 backdrop-blur-xl animate-fadeIn">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="h-4 w-4" />
                <span>Supportive Care Resource</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                Professional support may be helpful. You can explore our Health Support section to find qualified mental health professionals.
              </p>
            </div>
            <Link href="/consult" className="shrink-0">
              <button className="rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 px-5 transition-all border border-rose-500/20 active:scale-95">
                Explore Health Support
              </button>
            </Link>
          </div>
        )}

        {/* ─── 3. Vitals Deck & Wellness Score Gauge ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeInUp stagger-3 opacity-0">
          {wellnessGaugeWidget}
          {vitalsParametersWidget}
        </div>

        {/* ─── 4. Dynamic Adaptive Priority Widget Row ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeInUp stagger-4 opacity-0">
          {layout.priorityWidget1}
          <div className="lg:col-span-2">
            {layout.priorityWidget2}
          </div>
        </div>

        {/* ─── 5. Dynamic Adaptive Secondary Widget Row ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeInUp stagger-4 opacity-0">
          <div className="lg:col-span-2">
            {layout.secondaryWidget1}
          </div>
          {layout.secondaryWidget2}
        </div>

        {/* ─── 6. Wellness Highlights (Reviews & Correlations) ─── */}
        {!loadingWellness && (monthlyReview || correlations) && (
          <div className="space-y-4 animate-fadeInUp stagger-5 opacity-0">
            <SectionHeader label="Wellness Highlights" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {monthlyReview && (
                <div 
                  onMouseMove={handleMouseMove}
                  className="glass-card interactive-card rounded-3xl p-6 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-400" aria-hidden="true" />
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Monthly Review</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[9px] text-slate-500 font-bold">
                        <span>Score: {monthlyReview.monthly_wellness_score}</span>
                        <span>{monthlyReview.month}</span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        &ldquo;{monthlyReview.ai_summary}&rdquo;
                      </p>
                    </div>
                  </div>
                  <Link href="/journey" className="flex items-center justify-between text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                    <span>View Timeline</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {correlations && (
                <div 
                  onMouseMove={handleMouseMove}
                  className="glass-card interactive-card rounded-3xl p-6 flex flex-col justify-between gap-5"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Correlations</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-[9px] font-bold">
                        <span className="text-slate-500 uppercase">Habit link</span>
                        <span className="text-indigo-400 capitalize">{correlations.sleep_vs_stress?.strength}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-normal line-clamp-3">
                        {correlations.sleep_vs_stress?.explanation}
                      </p>
                    </div>
                  </div>
                  <Link href="/journey" className="flex items-center justify-between text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
                    <span>Compare Vitals</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── 7. Contextual Wellness Recommendations ─── */}
        <div className="space-y-4 animate-fadeInUp stagger-5 opacity-0">
          <SectionHeader label={`Wellness recommendations for feeling ${detectedEmotion}`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {getRecommendationCards(detectedEmotion).map((card, idx) => (
              <div 
                key={idx} 
                onMouseMove={handleMouseMove}
                className="glass-card interactive-card rounded-3xl p-5 flex flex-col justify-between gap-5 hover:border-white/[0.08] transition-all group duration-300"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-white/[0.02] border border-white/[0.04] text-indigo-400 group-hover:rotate-6 transition-transform duration-300">
                      {card.icon}
                    </span>
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{card.category}</p>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-white group-hover:text-accent transition-colors duration-300">{card.title}</h3>
                    <p className="text-[11px] leading-relaxed text-slate-400">{card.description}</p>
                  </div>
                </div>
                <Link href={card.href} className="flex items-center justify-between text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors group-hover:text-accent duration-300">
                  <span>{card.actionText}</span>
                  <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* ─── 7-Day Wellness Trends Chart ─── */}
        {!loadingWellness && analyticsData.length > 0 && (
          <div className="space-y-4 animate-fadeInUp stagger-5 opacity-0">
            <SectionHeader label="7-Day Wellness Trends" />
            <div className="glass-card rounded-3xl p-5 border border-white/[0.04] shadow-md">
              <AnalyticsCharts data={analyticsData} />
            </div>
          </div>
        )}

        {/* ─── AI Explainability Panel (Reasoning) ─── */}
        {reasoning && (
          <div className="glass-card rounded-3xl overflow-hidden border border-white/[0.04] shadow-lg animate-fadeInUp stagger-5 opacity-0">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="w-full flex items-center justify-between px-6 py-4.5 text-left hover:bg-white/[0.01] transition-all focus:outline-none"
              aria-expanded={showReasoning}
            >
              <div className="flex items-center gap-3.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <Sparkles className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Why am I seeing this score?</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Granite AI reasoning layer · {reasoning.confidence}% confidence</p>
                </div>
              </div>
              <span className={`text-[9px] font-bold px-2.5 py-1 rounded-xl border transition-all ${showReasoning ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" : "bg-white/[0.04] text-slate-500 border-white/[0.05]"}`}>
                {showReasoning ? "Collapse Details" : "View Breakdown"}
              </span>
            </button>

            {showReasoning && (
              <div className="border-t border-white/[0.04] px-6 pb-6 pt-5 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Calculated Prediction</p>
                    <p className="text-xs font-bold text-slate-200 bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">{reasoning.prediction}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Supporting Evidence</p>
                    <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl">{reasoning.evidence}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Inference Logic</p>
                  <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] border border-white/[0.04] p-4 rounded-xl">{reasoning.reasoning}</p>
                </div>

                {reasoning.contributing_factors && reasoning.contributing_factors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Contributing factors weight</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {reasoning.contributing_factors.map((f, i) => (
                        <div key={i} className="flex items-center justify-between bg-white/[0.02] border border-white/[0.04] px-3.5 py-2.5 rounded-xl">
                          <span className="text-xs text-slate-300">{f.factor}</span>
                          <span className="text-[9px] font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">{f.importance}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-[9px] text-slate-500 pt-2 border-t border-white/[0.04] italic">
                  <span>Data Sources: {reasoning.data_sources?.join(", ") || "Telemetry"}</span>
                  <span>Limitations: {reasoning.limitations || "Educational Coaching Only"}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── 8. Wellness Calendar (History data points) ─── */}
        {!loadingWellness && historyData.length > 0 && (
          <div className="space-y-4">
            <SectionHeader label="Wellness Check-In Calendar" />
            <div>
              <WellnessCalendar
                history={historyData}
                onDayClick={(record) => setCalendarRecord(record)}
              />
            </div>
          </div>
        )}

        {/* ─── 9. Quick Actions Grid ─── */}
        <div className="space-y-4 animate-fadeInUp stagger-5 opacity-0">
          <SectionHeader label="Quick Actions" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { href: "/assessment", icon: <ClipboardList className="h-5 w-5 text-indigo-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />, label: "Calibrate Assessment" },
              { href: "/daily-checkin", icon: <Heart className="h-5 w-5 text-rose-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />, label: "New Daily Check-In" },
              { href: "/history", icon: <History className="h-5 w-5 text-blue-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />, label: "Assessment History" },
              { href: "/consult", icon: <Stethoscope className="h-5 w-5 text-emerald-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300" />, label: "Find Care Professional" },
            ].map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                onMouseMove={handleMouseMove}
                className="flex flex-col items-center justify-center gap-3 p-5 rounded-2xl border border-white/[0.04] bg-white/[0.01] text-center transition-all duration-300 interactive-card group hover:scale-[1.02] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {icon}
                <span className="text-xs font-bold text-slate-300 group-hover:text-accent transition-colors duration-300">{label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* ─── 10. Professional Therapist Support CTA ─── */}
        <div 
          onMouseMove={handleMouseMove}
          className="glass-card interactive-card rounded-3xl p-6 relative overflow-hidden animate-fadeInUp stagger-5 opacity-0"
        >
          <div className="absolute top-0 right-0 h-40 w-40 bg-emerald-500/5 blur-3xl rounded-full" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md shrink-0">
                <Stethoscope className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Need professional psychological support?</p>
                <p className="text-xs text-slate-400">Search directory grids of local certified psychiatrists and therapists near your location.</p>
              </div>
            </div>
            <Link
              href="/consult"
              className="shrink-0 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-xs font-bold text-white transition-all shadow-md shadow-indigo-500/10 inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:scale-95 button-micro"
            >
              <span>Consult Directory</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* ─── 11. Disclaimer Banner ─── */}
        <div
          className="flex items-start gap-3 rounded-2xl border border-white/[0.04] bg-slate-950/40 p-4 text-[10px] text-slate-500 leading-relaxed"
          role="note"
        >
          <ShieldAlert className="h-4 w-4 shrink-0 text-slate-500 mt-0.5" aria-hidden="true" />
          <p>
            <strong className="text-slate-400">Clinical Disclaimer:</strong> MindCare AI assessments are designed for educational self-coaching and lifestyle tracking only. They are not substitutes for formal psychiatric diagnosis, clinical evaluation, or emergency health consultation. If you are experiencing a mental health emergency, please immediately call your local emergency services (911 or equivalent).
          </p>
        </div>

      </div>

      {/* Calendar Day Details Modal */}
      {calendarRecord && (
        <DayReportModal record={calendarRecord} onClose={() => setCalendarRecord(null)} />
      )}
    </ProtectedRoute>
  );
}
