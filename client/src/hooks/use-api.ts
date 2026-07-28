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

export function useDashboardSummary(selectedEcosystemIds: readonly string[]) {
  const ecosystemIds = [...new Set(selectedEcosystemIds)].sort();

  return useQuery({
    queryKey: ['dashboard', 'summary', ecosystemIds],
    queryFn: () => fetchDashboardSummary(ecosystemIds),
    enabled: ecosystemIds.length > 0,
    staleTime: 30_000,
  });
}
