import { api } from "./api";

export interface JourneyEvent {
  _id: string;
  user_id: string;
  source_collection: string;
  event_type: "assessment" | "checkin" | "coach" | "journal" | "goal" | "achievement" | "review";
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface MonthlyReview {
  _id: string;
  month: string;
  monthly_wellness_score: number;
  stress_trend: string;
  sleep_trend: string;
  mood_trend: string;
  exercise_trend: string;
  achievements: string[];
  areas_to_improve: string[];
  goals_next_month: string[];
  ai_summary: string;
}

export interface CorrelationItem {
  strength: "weak" | "moderate" | "strong";
  direction: "positive" | "negative" | "stable" | "mixed";
  explanation: string;
}

export interface CorrelationsState {
  sleep_vs_stress: CorrelationItem;
  exercise_vs_mood: CorrelationItem;
  meditation_vs_anxiety: CorrelationItem;
  hydration_vs_wellness: CorrelationItem;
}

export const journeyService = {
  async getJourneyTimeline(range?: string): Promise<JourneyEvent[]> {
    const url = range ? `/journey?filter_range=${range}` : "/journey";
    const response = await api.get<JourneyEvent[]>(url);
    return response.data;
  },

  async getMonthlyReview(month?: string): Promise<MonthlyReview> {
    const url = month ? `/monthly-review?month=${month}` : "/monthly-review";
    const response = await api.get<MonthlyReview>(url);
    return response.data;
  },

  async getMonthlyReviewHistory(): Promise<MonthlyReview[]> {
    const response = await api.get<MonthlyReview[]>("/monthly-review/history");
    return response.data;
  },

  async getCorrelations(): Promise<CorrelationsState> {
    const response = await api.get<CorrelationsState>("/correlations");
    return response.data;
  }
};
