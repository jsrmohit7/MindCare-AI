import { api } from "./api";
import { AssessmentRequest, AssessmentResponse, AssessmentListResponse } from "@/types/assessment";

export const assessmentService = {
  createAssessment: async (data: AssessmentRequest): Promise<AssessmentResponse> => {
    const response = await api.post<AssessmentResponse>("/assessments", data);
    return response.data;
  },

  getAssessment: async (id: string): Promise<AssessmentResponse> => {
    const response = await api.get<AssessmentResponse>(`/assessments/${id}`);
    return response.data;
  },

  listAssessments: async (limit: number = 20): Promise<AssessmentResponse[]> => {
    const response = await api.get<AssessmentListResponse>(`/assessments`, {
      params: { limit },
    });
    return response.data.assessments;
  },

  deleteAssessment: async (id: string): Promise<void> => {
    await api.delete(`/assessments/${id}`);
  },
};
