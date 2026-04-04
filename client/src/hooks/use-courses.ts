import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-client';

export function useCourses(params?: Record<string, string>) {
  return useQuery({ queryKey: ['courses', params], queryFn: () => api.fetchCourses(params) });
}
export function useCourse(id: string) {
  return useQuery({ queryKey: ['courses', id], queryFn: () => api.fetchCourse(id), enabled: !!id });
}
export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createCourse, onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }) });
}
export function useQuizzes(params?: Record<string, string>) {
  return useQuery({ queryKey: ['quizzes', params], queryFn: () => api.fetchQuizzes(params) });
}
export function useQuiz(id: string) {
  return useQuery({ queryKey: ['quizzes', id], queryFn: () => api.fetchQuiz(id), enabled: !!id });
}
export function useCreateQuiz() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createQuiz, onSuccess: () => qc.invalidateQueries({ queryKey: ['quizzes'] }) });
}
export function useSubmitQuizResult(quizId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => api.submitQuizResult(quizId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quizzes', quizId] }); qc.invalidateQueries({ queryKey: ['quiz-results'] }); },
  });
}
export function useQuizResults(quizId: string) {
  return useQuery({ queryKey: ['quiz-results', quizId], queryFn: () => api.fetchQuizResults(quizId), enabled: !!quizId });
}
export function useMemberQuizHistory(memberId: string) {
  return useQuery({ queryKey: ['members', memberId, 'quiz-history'], queryFn: () => api.fetchMemberQuizHistory(memberId), enabled: !!memberId });
}
export function useMemberBadges(memberId: string) {
  return useQuery({ queryKey: ['members', memberId, 'badges'], queryFn: () => api.fetchMemberBadges(memberId), enabled: !!memberId });
}
export function useMemberTags(memberId: string) {
  return useQuery({ queryKey: ['members', memberId, 'tags'], queryFn: () => api.fetchMemberTags(memberId), enabled: !!memberId });
}
