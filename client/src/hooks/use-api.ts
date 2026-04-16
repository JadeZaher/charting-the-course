import { useQuery } from '@tanstack/react-query';
import { fetchHealth, fetchSkills, fetchDashboardSummary } from '@/lib/api-client';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    staleTime: 30_000,
  });
}

export function useSkills(layer?: number) {
  return useQuery({
    queryKey: ['skills', layer],
    queryFn: () => fetchSkills(layer),
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: fetchDashboardSummary,
    staleTime: 30_000,
  });
}
