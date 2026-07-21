import { api } from "./api";

export interface PrivacySummary {
  journals: number;
  goals: number;
  coach_conversations: number;
  assessments: number;
  daily_checkins: number;
}

export interface AdminMetrics {
  total_users: number;
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  average_wellness_score: number;
  prediction_requests: number;
  coach_conversations: number;
  background_job_error_rate: number;
  cache_hit_rate_percent: number;
  average_api_latency_ms: number;
}

export interface SystemHealth {
  services: {
    frontend: string;
    backend: string;
    database_mongodb: string;
    ai_watsonx_granite: string;
    background_workers: string;
    cache_store: string;
  };
  latencies: {
    api_latency_ms: number;
    database_latency_ms: number;
    ai_inference_latency_ms: number;
  };
  system: {
    uptime_hours: number;
    memory_usage_percent: number;
    cpu_utilization_percent: number;
  };
}

export const privacyAdminService = {
  async getPrivacySummary(): Promise<PrivacySummary> {
    const response = await api.get<PrivacySummary>("/privacy/summary");
    return response.data;
  },

  async purgeCategory(category: string): Promise<{ status: string }> {
    const response = await api.delete<{ status: string }>(`/privacy/purge/${category}`);
    return response.data;
  },

  async deleteAccount(): Promise<{ status: string }> {
    const response = await api.delete<{ status: string }>("/privacy/account");
    return response.data;
  },

  async exportData(): Promise<Record<string, unknown>> {
    const response = await api.get<Record<string, unknown>>("/privacy/export");
    return response.data;
  },

  async getAdminMetrics(): Promise<AdminMetrics> {
    const response = await api.get<AdminMetrics>("/admin/metrics");
    return response.data;
  },

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await api.get<SystemHealth>("/admin/health");
    return response.data;
  }
};
