import { api } from "./api";

export interface WellnessGoal {
  _id: string;
  user_id: string;
  title: string;
  type: "sleep" | "exercise" | "meditation" | "hydration" | "mood" | "custom";
  target_value: number;
  frequency: "daily" | "weekly";
  status: "active" | "completed" | "archived";
  progress: number;
  ai_suggested: boolean;
  reason?: string;
  created_at: string;
  updated_at: string;
}

export const goalsService = {
  async listGoals(status?: string): Promise<WellnessGoal[]> {
    const url = status ? `/goals?status_filter=${status}` : "/goals";
    const response = await api.get<WellnessGoal[]>(url);
    return response.data;
  },

  async createGoal(title: string, type: string, targetValue: number, frequency: string, aiSuggested = false): Promise<{ id: string; status: string }> {
    const response = await api.post<{ id: string; status: string }>("/goals", {
      title,
      type,
      target_value: targetValue,
      frequency,
      ai_suggested: aiSuggested
    });
    return response.data;
  },

  async completeGoal(id: string): Promise<{ status: string }> {
    const response = await api.put<{ status: string }>(`/goals/${id}/complete`);
    return response.data;
  },

  async deleteGoal(id: string): Promise<{ status: string }> {
    const response = await api.delete<{ status: string }>(`/goals/${id}`);
    return response.data;
  },

  async getSuggestedGoals(): Promise<WellnessGoal[]> {
    const response = await api.get<WellnessGoal[]>("/goals/suggested");
    return response.data;
  }
};
