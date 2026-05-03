import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-client';

// Shares & Needs hooks
export function useSharesNeeds(params?: Record<string, string>) {
  return useQuery({ queryKey: ['shares-needs', params], queryFn: () => api.fetchSharesNeeds(params) });
}
export function useCreateSharesNeeds() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createSharesNeeds, onSuccess: () => qc.invalidateQueries({ queryKey: ['shares-needs'] }) });
}

// Collaboration hooks
export function useCollaborations(params?: Record<string, string>) {
  return useQuery({ queryKey: ['collaborations', params], queryFn: () => api.fetchCollaborations(params) });
}
export function useCollaboration(id: string) {
  return useQuery({ queryKey: ['collaborations', id], queryFn: () => api.fetchCollaboration(id), enabled: !!id });
}
export function useCreateCollaboration() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createCollaboration, onSuccess: () => qc.invalidateQueries({ queryKey: ['collaborations'] }) });
}

// Compliance hooks
export function useComplianceLatest() {
  return useQuery({ queryKey: ['compliance', 'latest'], queryFn: () => api.fetchComplianceLatest() });
}
export function useComplianceHistory(params?: Record<string, string>) {
  return useQuery({ queryKey: ['compliance', 'history', params], queryFn: () => api.fetchComplianceHistory(params) });
}
export function useGenerateCompliance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.generateCompliance, onSuccess: () => { qc.invalidateQueries({ queryKey: ['compliance'] }); } });
}
