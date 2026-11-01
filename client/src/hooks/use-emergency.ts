// Emergency reads and writes on the shared key factory and feedback contract.
// See pages/governance/AGENTS.md "Emergency and exit": failures render inline (silent), successes toast here.
import { useQuery } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import * as api from '@/lib/api-client';
import { affects, keys } from '@/lib/query-keys';
import type { EmergencyDeclaration, EmergencyReview } from '@/types/api';

/** GET /emergency: live emergency per selected ecosystem, history, limits, where the caller may declare. */
export function useEmergencyOverview() {
  return useQuery({ queryKey: keys.emergency.list(), queryFn: () => api.fetchEmergencyOverview(), staleTime: 30_000 });
}

export function useEmergencyRecord(id: string) {
  return useQuery({ queryKey: keys.emergency.detail(id), queryFn: () => api.fetchEmergencyRecord(id), enabled: !!id, staleTime: 30_000 });
}

/** Live emergencies across every ecosystem the member is active in; polled so the banner appears without a reload. */
export function useActiveEmergencies(enabled: boolean) {
  return useQuery({
    queryKey: keys.emergency.active(),
    queryFn: () => api.fetchActiveEmergencies(),
    enabled,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });
}

export function useEmergencyDeclaration() {
  return useApiMutation({
    mutationFn: (data: EmergencyDeclaration) => api.declareEmergencyForCosign(data),
    invalidates: affects.emergency,
    silent: true,
    success: { title: 'Emergency declared', description: 'It opens when a second active member co-signs.' },
  });
}

export function useEmergencyCosign(id: string) {
  return useApiMutation({
    mutationFn: () => api.cosignEmergency(id),
    invalidates: affects.emergency,
    silent: true,
    success: { title: 'Co-signed', description: 'Emergency authority has started. Its timer is running.' },
  });
}

export function useEmergencyWithdrawal(id: string) {
  return useApiMutation({
    mutationFn: () => api.withdrawEmergency(id),
    invalidates: affects.emergency,
    silent: true,
    success: { title: 'Declaration withdrawn', description: 'Nothing changed.' },
  });
}

export function useEndEmergencyAuthority(id: string) {
  return useApiMutation({
    mutationFn: () => api.endEmergencyAuthority(id),
    invalidates: affects.emergency,
    silent: true,
    success: { title: 'Emergency authority ended', description: 'Recovery has started: the post-emergency review is next.' },
  });
}

export function useEmergencyReview(id: string) {
  return useApiMutation({
    mutationFn: (data: EmergencyReview) => api.recordEmergencyReview(id, data),
    invalidates: affects.emergency,
    silent: true,
    success: (_record, review) => (review.outcome === 'complete' ? 'Review recorded as complete' : 'Review recorded as scheduled'),
  });
}

export function useCloseRecovery(id: string) {
  return useApiMutation({
    mutationFn: () => api.closeEmergencyRecovery(id),
    invalidates: affects.emergency,
    silent: true,
    success: { title: 'Recovery closed', description: 'Normal governance is fully restored.' },
  });
}
