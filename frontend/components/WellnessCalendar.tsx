"use client";

import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DailyCheckInRecord } from "@/services/dailyWellness";

interface WellnessCalendarProps {
  history: DailyCheckInRecord[];
  onDayClick?: (record: DailyCheckInRecord) => void;
}

const MOOD_EMOJI: Record<string, string> = {
  "Very Happy": "😊",
  "Happy": "🙂",
  "Neutral": "😐",
  "Sad": "😞",
  "Very Sad": "😢",
};

const MOOD_BG: Record<string, string> = {
  "Very Happy": "bg-emerald-500/20 border-emerald-500/30 text-emerald-300",
  "Happy": "bg-green-500/20 border-green-500/30 text-green-300",
  "Neutral": "bg-slate-500/20 border-slate-500/30 text-slate-300",
  "Sad": "bg-amber-500/20 border-amber-500/30 text-amber-300",
  "Very Sad": "bg-rose-500/20 border-rose-500/30 text-rose-300",
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function WellnessCalendar({ history, onDayClick }: WellnessCalendarProps) {
  const today = new Date();
  const [viewDate, setViewDate] = React.useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const recordMap = useMemo(() => {
    const map = new Map<string, DailyCheckInRecord>();
    history.forEach((rec) => {
      map.set(rec.date, rec);
    });
    return map;
  }, [history]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const isFuture = (day: number) => {
    const d = new Date(year, month, day);
    d.setHours(0, 0, 0, 0);
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return d > t;
  };

  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const getDateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-4 sm:p-6 shadow-xl backdrop-blur-xl space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          📅 Wellness Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-bold text-white min-w-[120px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={`empty-${idx}`} />;
          }

          const dateStr = getDateStr(day);
          const record = recordMap.get(dateStr);
          const future = isFuture(day);
          const todayCell = isToday(day);
          const moodClass = record ? (MOOD_BG[record.mood] || "bg-indigo-500/20 border-indigo-500/30 text-indigo-300") : "";

          return (
            <button
              key={day}
              onClick={() => record && onDayClick?.(record)}
              disabled={!record || future}
              title={record ? `${record.date}: ${record.mood} – Score ${record.wellness_score}` : undefined}
              aria-label={record ? `${record.date}: ${record.mood}` : `${dateStr}: no check-in`}
              className={`
                relative flex flex-col items-center justify-center rounded-xl p-1.5 text-xs font-bold
                transition-all duration-200 border min-h-[44px]
                ${todayCell ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-slate-950" : ""}
                ${record && !future
                  ? `${moodClass} cursor-pointer hover:scale-105 hover:shadow-md`
                  : future
                    ? "border-white/5 bg-transparent text-slate-700 cursor-default"
                    : "border-white/5 bg-white/5 text-slate-500 cursor-default"
                }
              `}
            >
              <span className="text-[10px] leading-none">{day}</span>
              {record && (
                <span className="text-base leading-none mt-0.5" aria-hidden="true">
                  {MOOD_EMOJI[record.mood] || "📊"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
        {Object.entries(MOOD_EMOJI).map(([mood, emoji]) => (
          <span
            key={mood}
            className={`text-[10px] font-semibold px-2 py-1 rounded-full border ${MOOD_BG[mood] || ""}`}
          >
            {emoji} {mood}
          </span>
        ))}
      </div>
    </div>
  );
}
