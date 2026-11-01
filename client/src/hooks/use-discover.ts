import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import * as api from '@/lib/api-client';
import { affects, keys } from '@/lib/query-keys';

// Shares & Needs hooks
export function useSharesNeeds(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.sharesNeeds.list(params), queryFn: () => api.fetchSharesNeeds(params) });
}
export function useSharesNeedsAdmin(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.sharesNeeds.moderation(params), queryFn: () => api.fetchSharesNeedsAdmin(params) });
}
// Create renders its failure inline in SharesNeedsForm and confirms with its own toast.
export function useCreateSharesNeeds() {
  return useApiMutation({ mutationFn: api.createSharesNeeds, invalidates: affects.sharesNeeds, silent: true });
}
export function useUpdateSharesNeeds() {
  return useApiMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => api.updateSharesNeeds(id, data),
    invalidates: affects.sharesNeeds,
    error: 'Update not saved',
  });
}
export function useUpdateSharesNeedsStatus() {
  return useApiMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => api.updateSharesNeedsStatus(id, status),
    invalidates: affects.sharesNeeds,
    error: 'Status not changed',
  });
}
export function useDeleteSharesNeeds() {
  return useApiMutation({ mutationFn: api.deleteSharesNeeds, invalidates: affects.sharesNeeds, error: 'Could not delete that listing' });
}

// Collaboration hooks
export function useCollaborations(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.collaborations.list(params), queryFn: () => api.fetchCollaborations(params) });
}
export function useCollaboration(id: string) {
  return useQuery({ queryKey: keys.collaborations.detail(id), queryFn: () => api.fetchCollaboration(id), enabled: !!id });
}
// Both collaboration writes render their failure inline in their pages.
export function useCreateCollaboration() {
  return useApiMutation({ mutationFn: api.createCollaboration, invalidates: affects.collaborations, silent: true });
}
export function useActivateCollaboration(id: string) {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: () => api.activateCollaboration(id),
    // Exact write lands before the prefix refetch.
    onSuccess: (data) => { queryClient.setQueryData(keys.collaborations.detail(id), data); },
    invalidates: affects.collaborations,
    silent: true,
  });
}

// Compliance hooks
export function useComplianceLatest(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.compliance.latest(params), queryFn: () => api.fetchComplianceLatest(params) });
}
export function useComplianceHistory(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.compliance.history(params), queryFn: () => api.fetchComplianceHistory(params) });
}
export function useGenerateCompliance() {
  return useApiMutation({ mutationFn: api.generateCompliance, invalidates: affects.compliance, error: 'Could not generate the report' });
}
