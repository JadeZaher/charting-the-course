import { useQuery } from '@tanstack/react-query';
import { fetchHealth, fetchSkills, fetchDashboardSummary } from '@/lib/api-client';
import { keys } from '@/lib/query-keys';

export function useHealth() {
  return useQuery({
    queryKey: keys.platform.health(),
    queryFn: fetchHealth,
    staleTime: 30_000,
  });
}

export function useSkills(layer?: number) {
  return useQuery({
    queryKey: keys.platform.skills(layer),
    queryFn: () => fetchSkills(layer),
  });
}

export function useDashboardSummary(selectedEcosystemIds: readonly string[]) {
  const ecosystemIds = Array.from(new Set(selectedEcosystemIds)).sort();

  return useQuery({
    queryKey: keys.dashboard.summary(ecosystemIds),
    queryFn: () => fetchDashboardSummary(ecosystemIds),
    enabled: ecosystemIds.length > 0,
    staleTime: 30_000,
  });
}
