import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { assessmentService } from "@/services/assessment";
import { AssessmentRequest } from "@/types/assessment";

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AssessmentRequest) => assessmentService.createAssessment(data),
    onSuccess: () => {
      // Invalidate the assessments listing query to refresh assessment history
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}

export function useAssessment(id: string) {
  return useQuery({
    queryKey: ["assessment", id],
    queryFn: () => assessmentService.getAssessment(id),
    enabled: !!id,
  });
}

export function useAssessments(limit: number = 20) {
  return useQuery({
    queryKey: ["assessments", limit],
    queryFn: () => assessmentService.listAssessments(limit),
  });
}

export function useDeleteAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => assessmentService.deleteAssessment(id),
    onSuccess: () => {
      // Invalidate list queries to refresh history UI
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
  });
}
