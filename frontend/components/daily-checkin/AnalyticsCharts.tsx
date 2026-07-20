"use client";

import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";
import { TrendingUp } from "lucide-react";
import { DailyCheckInRecord } from "@/services/dailyWellness";

interface AnalyticsChartsProps {
  data: DailyCheckInRecord[];
}

export default function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const [timeRange, setTimeRange] = useState<"7" | "30" | "all">("7");
  const [activeChart, setActiveChart] = useState<"wellness" | "mood" | "stress" | "sleep" | "exercise">("wellness");

  // Map mood and sleep text inputs into numeric coordinates for plotting
  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
    
    const mapped = sorted.map((item) => {
      // Mood mapping: Very Happy (5) -> Very Sad (1)
      let moodValue = 3;
      if (item.mood === "Very Happy") moodValue = 5;
      else if (item.mood === "Happy") moodValue = 4;
      else if (item.mood === "Neutral") moodValue = 3;
      else if (item.mood === "Sad") moodValue = 2;
      else if (item.mood === "Very Sad") moodValue = 1;

      // Sleep mapping: More than 8 (9) -> Less than 4 (3)
      let sleepHours = 7;
      if (item.sleep.includes("More than 8") || item.sleep.includes("8+")) sleepHours = 9;
      else if (item.sleep.includes("6–8") || item.sleep.includes("6-8")) sleepHours = 7;
      else if (item.sleep.includes("4–6") || item.sleep.includes("4-6")) sleepHours = 5;
      else if (item.sleep.includes("Less than 4") || item.sleep.includes("<4")) sleepHours = 3;

      // Water mapping: More than 3L (3.5) -> Less than 1L (0.5)
      let waterVolume = 1.5;
      if (item.water.includes("More than 3") || item.water.includes("3L+")) waterVolume = 3.5;
      else if (item.water.includes("2–3") || item.water.includes("2-3")) waterVolume = 2.5;
      else if (item.water.includes("1–2") || item.water.includes("1-2")) waterVolume = 1.5;
      else if (item.water.includes("Less than 1") || item.water.includes("<1L")) waterVolume = 0.5;

      // Format date for display (MM-DD)
      let dateLabel = item.date;
      try {
        const parts = item.date.split("-");
        if (parts.length === 3) {
          dateLabel = `${parts[1]}-${parts[2]}`;
        }
      } catch (e) {
        console.error(e);
      }

      return {
        ...item,
        dateLabel,
        moodValue,
        sleepHours,
        waterVolume
      };
    });

    if (timeRange === "7") return mapped.slice(-7);
    if (timeRange === "30") return mapped.slice(-30);
    return mapped;
  }, [data, timeRange]);

  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-8 text-center text-slate-500">
        <TrendingUp className="h-8 w-8 text-slate-600 mx-auto mb-2" />
        <p className="text-sm font-semibold">No progress data available</p>
        <p className="text-xs text-slate-600 mt-1">Complete your first daily check-in to begin tracking logs.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-6 space-y-6 shadow-xl backdrop-blur-xl">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-indigo-400" />
            <span>📈 Wellness Progress Trend</span>
          </h3>
          <p className="text-xs text-slate-400">Track and visualize your mental wellness variables over time.</p>
        </div>

        {/* Time filters */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-white/5">
          {[
            { id: "7", label: "7 Days" },
            { id: "30", label: "30 Days" },
            { id: "all", label: "All Time" }
          ].map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id as "7" | "30" | "all")}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-300 ${
                timeRange === range.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs selectors for chart types */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: "wellness", label: "Wellness Score" },
          { id: "mood", label: "Mood" },
          { id: "stress", label: "Stress / Anxiety" },
          { id: "sleep", label: "Sleep" },
          { id: "exercise", label: "Exercise & Water" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveChart(tab.id as "wellness" | "mood" | "stress" | "sleep" | "exercise")}
            className={`rounded-xl px-4 py-2 text-xs font-bold border transition-all duration-300 ${
              activeChart === tab.id
                ? "bg-white/10 border-white/20 text-white shadow-inner"
                : "bg-white/5 border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render Chart */}
      <div className="w-full h-[280px] sm:h-[320px] relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          {activeChart === "wellness" ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="dateLabel" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 100]} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white" }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="wellness_score"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ fill: "#6366f1", r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          ) : activeChart === "mood" ? (
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="dateLabel" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis
                stroke="#94a3b8"
                fontSize={10}
                domain={[1, 5]}
                tickLine={false}
                tickFormatter={(val) => {
                  if (val === 5) return "😀";
                  if (val === 4) return "🙂";
                  if (val === 3) return "😐";
                  if (val === 2) return "🙁";
                  if (val === 1) return "😭";
                  return "";
                }}
              />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white" }}
                formatter={(value) => {
                  if (value === 5) return "Very Happy";
                  if (value === 4) return "Happy";
                  if (value === 3) return "Neutral";
                  if (value === 2) return "Sad";
                  if (value === 1) return "Very Sad";
                  return value;
                }}
              />
              <Line
                type="monotone"
                dataKey="moodValue"
                stroke="#ec4899"
                strokeWidth={3}
                dot={{ fill: "#ec4899", r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          ) : activeChart === "stress" ? (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="dateLabel" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 10]} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white" }}
              />
              <Bar dataKey="stress" name="Stress Level" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="anxiety" name="Anxiety Level" fill="#fb7185" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : activeChart === "sleep" ? (
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="dateLabel" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} domain={[0, 10]} tickLine={false} unit="h" />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white" }}
                formatter={(value) => [`${value} hrs`, "Sleep Duration"]}
              />
              <defs>
                <linearGradient id="sleepColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="sleepHours" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#sleepColor)" />
            </AreaChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="dateLabel" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "white" }}
              />
              <Bar dataKey="exercise_minutes" name="Exercise (mins)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="waterVolume" name="Water (L)" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
