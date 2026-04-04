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

// Member hooks
export function useMembers(params?: Record<string, string>) {
  return useQuery({ queryKey: ['members', params], queryFn: () => api.fetchMembers(params) });
}
export function useMember(id: string) {
  return useQuery({ queryKey: ['members', id], queryFn: () => api.fetchMember(id), enabled: !!id });
}
export function useCreateMember() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createMember, onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }) });
}
export function useUpdateMember(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, any>) => api.updateMember(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['members'] }); qc.invalidateQueries({ queryKey: ['members', id] }); } });
}
export function useMemberOnboarding(memberId: string) {
  return useQuery({ queryKey: ['members', memberId, 'onboarding'], queryFn: () => api.fetchMemberOnboarding(memberId), enabled: !!memberId });
}

// Domain hooks
export function useDomains(params?: Record<string, string>) {
  return useQuery({ queryKey: ['domains', params], queryFn: () => api.fetchDomains(params) });
}
export function useDomain(id: string) {
  return useQuery({ queryKey: ['domains', id], queryFn: () => api.fetchDomain(id), enabled: !!id });
}
export function useCreateDomain() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createDomain, onSuccess: () => qc.invalidateQueries({ queryKey: ['domains'] }) });
}

// Decision hooks
export function useDecisions(params?: Record<string, string>) {
  return useQuery({ queryKey: ['decisions', params], queryFn: () => api.fetchDecisions(params) });
}
export function useDecision(id: string) {
  return useQuery({ queryKey: ['decisions', id], queryFn: () => api.fetchDecision(id), enabled: !!id });
}

// Onboarding hooks
export function useOnboardings() {
  return useQuery({ queryKey: ['onboarding'], queryFn: api.fetchOnboardings });
}
export function useOnboardingCeremony(memberId: string) {
  return useQuery({ queryKey: ['onboarding', memberId, 'ceremony'], queryFn: () => api.fetchOnboardingCeremony(memberId), enabled: !!memberId });
}
export function useSubmitCeremonyConsent(memberId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: { section: string; consented: boolean }) => api.submitCeremonyConsent(memberId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding', memberId] }) });
}

// Conflict hooks
export function useConflicts(params?: Record<string, string>) {
  return useQuery({ queryKey: ['conflicts', params], queryFn: () => api.fetchConflicts(params) });
}
export function useConflict(id: string) {
  return useQuery({ queryKey: ['conflicts', id], queryFn: () => api.fetchConflict(id), enabled: !!id });
}
export function useCreateConflict() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createConflict, onSuccess: () => qc.invalidateQueries({ queryKey: ['conflicts'] }) });
}

// Ecosystem hooks
export function useEcosystems(params?: Record<string, string>) {
  return useQuery({ queryKey: ['ecosystems', params], queryFn: () => api.fetchEcosystemsList(params) });
}
export function useEcosystemDetail(id: string) {
  return useQuery({ queryKey: ['ecosystems', id], queryFn: () => api.fetchEcosystem(id), enabled: !!id });
}
export function useCreateEcosystem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createEcosystemRecord, onSuccess: () => qc.invalidateQueries({ queryKey: ['ecosystems'] }) });
}
export function useUpdateEcosystem(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, any>) => api.updateEcosystemRecord(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['ecosystems'] }); qc.invalidateQueries({ queryKey: ['ecosystems', id] }); } });
}
