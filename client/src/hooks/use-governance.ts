import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-client';

// Agreement hooks
export function useAgreements(params?: Record<string, string> | false) {
  return useQuery({ queryKey: ['agreements', params], queryFn: () => api.fetchAgreements(params || undefined), enabled: params !== false, staleTime: 30_000 });
}
export function useAgreement(id: string) {
  return useQuery({ queryKey: ['agreements', id], queryFn: () => api.fetchAgreement(id), enabled: !!id, staleTime: 30_000, refetchOnWindowFocus: true });
}
export function useAgreementHistory(id: string) {
  return useQuery({ queryKey: ['agreements', id, 'history'], queryFn: () => api.fetchAgreementHistory(id), enabled: !!id, staleTime: 30_000 });
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
  return useMutation({ mutationFn: (status: string) => api.updateAgreementStatus(id, status), onSuccess: (data) => { qc.setQueryData(['agreements', id], data); qc.invalidateQueries({ queryKey: ['agreements'] }); } });
}
export function useRollbackAgreement(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (versionId: string) => api.rollbackAgreement(id, versionId), onSuccess: (data) => { qc.setQueryData(['agreements', id], data); qc.invalidateQueries({ queryKey: ['agreements'] }); qc.invalidateQueries({ queryKey: ['agreements', id, 'history'] }); } });
}

// Proposal hooks
export function useProposals(params?: Record<string, string>) {
  return useQuery({ queryKey: ['proposals', params], queryFn: () => api.fetchProposals(params), staleTime: 30_000 });
}
export function useProposal(id: string) {
  return useQuery({ queryKey: ['proposals', id], queryFn: () => api.fetchProposal(id), enabled: !!id, staleTime: 30_000, refetchOnWindowFocus: true });
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
  return useMutation({ mutationFn: (status: string) => api.updateProposalStatus(id, status), onSuccess: (data) => { qc.setQueryData(['proposals', id], data); qc.invalidateQueries({ queryKey: ['proposals'] }); } });
}
export function useSubmitAdvice(proposalId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, any>) => api.submitAdvice(proposalId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals', proposalId] }) });
}
export function useSubmitConsent(proposalId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, any>) => api.submitConsent(proposalId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals', proposalId] }) });
}
export function useSubmitTestReport(proposalId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, any>) => api.submitTestReport(proposalId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['proposals', proposalId] }) });
}

// Member hooks
export function useMembers(params?: Record<string, string>) {
  return useQuery({ queryKey: ['members', params], queryFn: () => api.fetchMembers(params), staleTime: 30_000 });
}
export function useMember(id: string) {
  return useQuery({ queryKey: ['members', id], queryFn: () => api.fetchMember(id), enabled: !!id, staleTime: 30_000 });
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
  return useQuery({ queryKey: ['members', memberId, 'onboarding'], queryFn: () => api.fetchMemberOnboarding(memberId), enabled: !!memberId, staleTime: 30_000 });
}

// Domain hooks
export function useDomains(params?: Record<string, string>) {
  return useQuery({ queryKey: ['domains', params], queryFn: () => api.fetchDomains(params), staleTime: 30_000 });
}
export function useDomain(id: string) {
  return useQuery({ queryKey: ['domains', id], queryFn: () => api.fetchDomain(id), enabled: !!id, staleTime: 30_000 });
}
export function useCreateDomain() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createDomain, onSuccess: () => qc.invalidateQueries({ queryKey: ['domains'] }) });
}
export function useUpdateDomain(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, any>) => api.updateDomain(id, data), onSuccess: (data) => { qc.setQueryData(['domains', id], data); qc.invalidateQueries({ queryKey: ['domains'] }); } });
}

// Decision hooks
export function useDecisions(params?: Record<string, string>) {
  return useQuery({ queryKey: ['decisions', params], queryFn: () => api.fetchDecisions(params), staleTime: 30_000 });
}
export function useDecision(id: string) {
  return useQuery({ queryKey: ['decisions', id], queryFn: () => api.fetchDecision(id), enabled: !!id, staleTime: 30_000 });
}

// Onboarding hooks
export function useOnboardings(params?: Record<string, string>) {
  return useQuery({ queryKey: ['onboarding', params], queryFn: () => api.fetchOnboardings(params), staleTime: 30_000 });
}
export function useOnboardingCeremony(memberId: string) {
  return useQuery({ queryKey: ['onboarding', memberId, 'ceremony'], queryFn: () => api.fetchOnboardingCeremony(memberId), enabled: !!memberId, staleTime: 30_000 });
}
export function useSubmitCeremonyConsent(memberId: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: { section: string; consented: boolean }) => api.submitCeremonyConsent(memberId, data), onSuccess: () => qc.invalidateQueries({ queryKey: ['onboarding', memberId] }) });
}

// Conflict hooks
export function useConflicts(params?: Record<string, string>) {
  return useQuery({ queryKey: ['conflicts', params], queryFn: () => api.fetchConflicts(params), staleTime: 30_000 });
}
export function useConflict(id: string) {
  return useQuery({ queryKey: ['conflicts', id], queryFn: () => api.fetchConflict(id), enabled: !!id, staleTime: 30_000 });
}
export function useCreateConflict() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createConflict, onSuccess: () => qc.invalidateQueries({ queryKey: ['conflicts'] }) });
}

// Ecosystem hooks
export function useEcosystems(params?: Record<string, string>) {
  return useQuery({ queryKey: ['ecosystems', params], queryFn: () => api.fetchEcosystemsList(params), staleTime: 30_000 });
}
export function useEcosystemDetail(id: string) {
  return useQuery({ queryKey: ['ecosystems', id], queryFn: () => api.fetchEcosystem(id), enabled: !!id, staleTime: 30_000 });
}
export function useCreateEcosystem() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createEcosystemRecord, onSuccess: () => qc.invalidateQueries({ queryKey: ['ecosystems'] }) });
}
export function useUpdateEcosystem(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, any>) => api.updateEcosystemRecord(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['ecosystems'] }); qc.invalidateQueries({ queryKey: ['ecosystems', id] }); } });
}
export function useRequestJoinEcosystem(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: () => api.requestJoinEcosystem(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['ecosystems'] }); qc.invalidateQueries({ queryKey: ['ecosystems', id] }); } });
}

// Emergency hooks
export function useEmergencyState() {
  return useQuery({ queryKey: ['emergency'], queryFn: () => api.fetchEmergencyState(), staleTime: 30_000 });
}
export function useEmergency(id: string) {
  return useQuery({ queryKey: ['emergency', id], queryFn: () => api.fetchEmergencyDetail(id), enabled: !!id, staleTime: 30_000 });
}
export function useDeclareEmergency() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.declareEmergency, onSuccess: () => qc.invalidateQueries({ queryKey: ['emergency'] }) });
}
export function useResolveEmergency() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => api.resolveEmergency(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['emergency'] }) });
}

// Exit hooks
export function useExits(params?: Record<string, string>) {
  return useQuery({ queryKey: ['exits', params], queryFn: () => api.fetchExits(params), staleTime: 30_000 });
}
export function useExit(id: string) {
  return useQuery({ queryKey: ['exits', id], queryFn: () => api.fetchExit(id), enabled: !!id, staleTime: 30_000 });
}
export function useCreateExit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createExit, onSuccess: () => qc.invalidateQueries({ queryKey: ['exits'] }) });
}
export function useUpdateExitStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: Record<string, any>) => api.updateExitStatus(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['exits'] }); qc.invalidateQueries({ queryKey: ['exits', id] }); } });
}

// Safeguards hooks
export function useSafeguards() {
  return useQuery({ queryKey: ['safeguards'], queryFn: () => api.fetchSafeguards(), staleTime: 30_000 });
}
export function useAudits(params?: Record<string, string>) {
  return useQuery({ queryKey: ['audits', params], queryFn: () => api.fetchAudits(params), staleTime: 30_000 });
}
export function useAudit(id: string) {
  return useQuery({ queryKey: ['audits', id], queryFn: () => api.fetchAudit(id), enabled: !!id, staleTime: 30_000 });
}
export function useRequestAudit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.requestAudit, onSuccess: () => { qc.invalidateQueries({ queryKey: ['audits'] }); qc.invalidateQueries({ queryKey: ['safeguards'] }); } });
}
