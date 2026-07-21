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

export interface ActionPlanItem {
  title: string;
  description: string;
  expected_impact: string;
  confidence: number;
  estimated_effort: string;
}

export interface ContributingFactor {
  factor: string;
  importance: number;
}

export interface ReasoningState {
  prediction: string;
  confidence: number;
  evidence: string;
  reasoning: string;
  recommendations: string[];
  action_plan: ActionPlanItem[];
  contributing_factors: ContributingFactor[];
  data_sources: string[];
  limitations: string;
}

export const dashboardService = {
  async getDashboardState(): Promise<DashboardState> {
    const response = await api.get<DashboardState>("/dashboard/state");
    return response.data;
  },

  async getReasoningState(): Promise<ReasoningState> {
    const response = await api.get<ReasoningState>("/reasoning");
    return response.data;
  }
};
