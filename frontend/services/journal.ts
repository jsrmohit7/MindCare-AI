import { api } from "./api";

export interface JournalAnalysis {
  sentiment: string;
  emotions: string[];
  topics: string[];
  stress_indicators: string[];
  positive_habits: string[];
  summary: string;
}

export interface JournalEntry {
  _id: string;
  user_id: string;
  date: string;
  content: string;
  tags: string[];
  ai_analysis?: JournalAnalysis;
  created_at: string;
  updated_at: string;
}

export const journalService = {
  async listJournals(query?: string): Promise<JournalEntry[]> {
    const url = query ? `/journal?query=${encodeURIComponent(query)}` : "/journal";
    const response = await api.get<JournalEntry[]>(url);
    return response.data;
  },

  async createJournal(content: string, tags: string[] = [], dateStr?: string): Promise<{ id: string; status: string }> {
    const response = await api.post<{ id: string; status: string }>("/journal", {
      content,
      tags,
      date: dateStr
    });
    return response.data;
  },

  async updateJournal(id: string, content: string, tags: string[] = []): Promise<{ status: string }> {
    const response = await api.put<{ status: string }>(`/journal/${id}`, {
      content,
      tags
    });
    return response.data;
  },

  async deleteJournal(id: string): Promise<{ status: string }> {
    const response = await api.delete<{ status: string }>(`/journal/${id}`);
    return response.data;
  }
};
