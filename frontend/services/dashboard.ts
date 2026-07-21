import { api } from "./api";

export interface DashboardState {
  wellness_score: number;
  category: string;
  trend: string;
  risk_level: string;
  focus: string;
  priority_habit: string;
  coach_suggestion: string;
  recommendation: string;
  insight: string;
  score_breakdown: {
    daily_checkin_avg: number;
    clinical_component: number;
    consistency: number;
    streak_boost: number;
  };
}

export const dashboardService = {
  async getDashboardState(): Promise<DashboardState> {
    const response = await api.get<DashboardState>("/dashboard/state");
    return response.data;
  }
};
