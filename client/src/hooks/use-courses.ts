import { useQuery } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import * as api from '@/lib/api-client';
import { affects, keys } from '@/lib/query-keys';

export function useCourses(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.courses.list(params), queryFn: () => api.fetchCourses(params) });
}
export function useCourse(id: string) {
  return useQuery({ queryKey: keys.courses.detail(id), queryFn: () => api.fetchCourse(id), enabled: !!id });
}
export function useCreateCourse() {
  return useApiMutation({ mutationFn: api.createCourse, invalidates: affects.courses, error: 'Course not created' });
}
export function useQuizzes(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.quizzes.list(params), queryFn: () => api.fetchQuizzes(params) });
}
export function useQuiz(id: string) {
  return useQuery({ queryKey: [...keys.quizzes.detail(id), 'candidate'], queryFn: () => api.fetchQuiz(id, true), enabled: !!id });
}
export function useCreateQuiz() {
  return useApiMutation({ mutationFn: api.createQuiz, invalidates: affects.quizzes, error: 'Quiz not created' });
}
// TakeQuiz owns the graded success toast; a result also moves badges, XP and profiles.
export function useSubmitQuizResult(quizId: string) {
  return useApiMutation({
    mutationFn: (data: Record<string, any>) => api.submitQuizResult(quizId, data),
    invalidates: affects.quizResults,
    error: 'Quiz not submitted',
  });
}
export function useQuizResults(quizId: string) {
  return useQuery({ queryKey: keys.quizzes.results(quizId), queryFn: () => api.fetchQuizResults(quizId), enabled: !!quizId });
}
export function useMemberQuizHistory(memberId: string) {
  return useQuery({ queryKey: keys.members.quizHistory(memberId), queryFn: () => api.fetchMemberQuizHistory(memberId), enabled: !!memberId });
}
export function useMemberBadges(memberId: string) {
  return useQuery({ queryKey: keys.members.badges(memberId), queryFn: () => api.fetchMemberBadges(memberId), enabled: !!memberId });
}
export function useMemberTags(memberId: string) {
  return useQuery({ queryKey: keys.members.tags(memberId), queryFn: () => api.fetchMemberTags(memberId), enabled: !!memberId });
}
