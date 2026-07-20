import { api } from "./api";

export interface DailyCheckInPayload {
  mood: string;
  stress: number;
  anxiety: number;
  sleep: string;
  exercise: boolean;
  exercise_minutes: number;
  water: string;
  meals: string;
  meditation: boolean;
  meditation_minutes: number;
  notes?: string;
}

export interface DailyCheckInRecord {
  _id: string;
  user_id: string;
  date: string;
  mood: string;
  stress: number;
  anxiety: number;
  sleep: string;
  exercise: boolean;
  exercise_minutes: number;
  water: string;
  meals: string;
  meditation: boolean;
  meditation_minutes: number;
  notes?: string;
  wellness_score: number;
  ai_summary?: string;
  motivation?: string;
  daily_goal?: string;
  created_at: string;
  updated_at: string;
}

export const dailyWellnessService = {
  async submitCheckIn(payload: DailyCheckInPayload) {
    const res = await api.post<{ id: string; wellness_score: number; ai_summary?: string; motivation?: string; daily_goal?: string }>(
      "/daily-checkin",
      payload
    );
    return res.data;
  },

  async getTodayCheckIn() {
    const res = await api.get<{ checked_in: boolean; data: DailyCheckInRecord | null }>(
      "/daily-checkin/today"
    );
    return res.data;
  },

  async updateTodayCheckIn(payload: DailyCheckInPayload) {
    const res = await api.put<{ wellness_score: number; ai_summary?: string; motivation?: string; daily_goal?: string }>(
      "/daily-checkin/today",
      payload
    );
    return res.data;
  },

  async getHistory() {
    const res = await api.get<DailyCheckInRecord[]>("/daily-checkin/history");
    return res.data;
  },

  async getStreak() {
    const res = await api.get<{ current_streak: number; longest_streak: number; total_checkins: number }>(
      "/daily-checkin/streak"
    );
    return res.data;
  },

  async getAnalytics() {
    const res = await api.get<DailyCheckInRecord[]>("/daily-checkin/analytics");
    return res.data;
  },

  async downloadMonthlyReportPdf(): Promise<Blob> {
    const res = await api.get("/daily-checkin/pdf", {
      responseType: "blob"
    });
    return res.data;
  }
};
