import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-client';

// Agreement hooks
export function useAgreements(params?: Record<string, string>) {
  return useQuery({ queryKey: ['agreements', params], queryFn: () => api.fetchAgreements(params) });
}
export function useAgreement(id: string) {
  return useQuery({ queryKey: ['agreements', id], queryFn: () => api.fetchAgreement(id), enabled: !!id });
}
export function useAgreementHistory(id: string) {
  return useQuery({ queryKey: ['agreements', id, 'history'], queryFn: () => api.fetchAgreementHistory(id), enabled: !!id });
}
export function useCreateAgreement() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createAgreement, onSuccess: () => qc.invalidateQueries({ queryKey: ['agreements'] }) });
}
export function useUpdateAgreement(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, any>) => api.updateAgreement(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['agreements'] }); qc.invalidateQueries({ queryKey: ['agreements', id] }); } });
}
export function useUpdateAgreementStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (status: string) => api.updateAgreementStatus(id, status), onSuccess: () => { qc.invalidateQueries({ queryKey: ['agreements'] }); qc.invalidateQueries({ queryKey: ['agreements', id] }); } });
}

// Proposal hooks
export function useProposals(params?: Record<string, string>) {
  return useQuery({ queryKey: ['proposals', params], queryFn: () => api.fetchProposals(params) });
}
export function useProposal(id: string) {
  return useQuery({ queryKey: ['proposals', id], queryFn: () => api.fetchProposal(id), enabled: !!id });
}
export function useCreateProposal() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createProposal, onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals'] }) });
}
export function useUpdateProposal(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, any>) => api.updateProposal(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['proposals'] }); qc.invalidateQueries({ queryKey: ['proposals', id] }); } });
}
export function useUpdateProposalStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (status: string) => api.updateProposalStatus(id, status), onSuccess: () => { qc.invalidateQueries({ queryKey: ['proposals'] }); qc.invalidateQueries({ queryKey: ['proposals', id] }); } });
}
export function useSubmitAdvice(proposalId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, any>) => api.submitAdvice(proposalId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals', proposalId] }) });
}
export function useSubmitConsent(proposalId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, any>) => api.submitConsent(proposalId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals', proposalId] }) });
}
