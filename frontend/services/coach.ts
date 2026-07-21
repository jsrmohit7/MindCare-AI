import { api } from "./api";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface Conversation {
  _id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface ChatResponse {
  response: string;
  conversation_id: string;
}

export const coachService = {
  async createConversation(title?: string): Promise<Conversation> {
    const res = await api.post<Conversation>("/coach/conversations", { title });
    return res.data;
  },

  async listConversations(search?: string): Promise<Conversation[]> {
    const params = search ? { search } : {};
    const res = await api.get<Conversation[]>("/coach/conversations", { params });
    return res.data;
  },

  async getConversation(id: string): Promise<Conversation> {
    const res = await api.get<Conversation>(`/coach/conversations/${id}`);
    return res.data;
  },

  async renameConversation(id: string, title: string): Promise<Conversation> {
    const res = await api.put<Conversation>(`/coach/conversations/${id}/rename`, { title });
    return res.data;
  },

  async deleteConversation(id: string): Promise<void> {
    await api.delete(`/coach/conversations/${id}`);
  },

  async sendMessage(id: string, message: string): Promise<ChatResponse> {
    const res = await api.post<ChatResponse>(`/coach/conversations/${id}/chat`, { message });
    return res.data;
  }
};
