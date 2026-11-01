// Governance queries and mutations on the shared key factory and feedback contract.
// See client/src/AGENTS.md "Shared data and feedback contracts"; silent/toast choices: pages/governance/AGENTS.md "Data and feedback".
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/lib/api-client';
import { affects, keys } from '@/lib/query-keys';
import { proposalPhaseAnnouncement } from '@/lib/proposal-vocab';
import { agreementStatusLabel } from '@/lib/agreement-status';
import { actParticipationMutation } from '@/lib/act-participation';
import type { MemberDecisionState } from '@/types/api';

// A list hook given `false` is disabled and keyed on the bare root, which no request fills,
// so another page's cached list never shows as its data.

// Agreement hooks
export function useAgreements(params?: Record<string, string> | false) {
  return useQuery({ queryKey: params === false ? keys.agreements.all : keys.agreements.list(params), queryFn: () => api.fetchAgreements(params || undefined), enabled: params !== false, staleTime: 30_000 });
}
export function useAgreement(id: string) {
  return useQuery({ queryKey: keys.agreements.detail(id), queryFn: () => api.fetchAgreement(id), enabled: !!id, staleTime: 30_000, refetchOnWindowFocus: true });
}
export function useAgreementHistory(id: string) {
  return useQuery({ queryKey: keys.agreements.history(id), queryFn: () => api.fetchAgreementHistory(id), enabled: !!id, staleTime: 30_000 });
}
// AgreementForm renders create/update failures inline and confirms with its own toast.
export function useCreateAgreement() {
  return useApiMutation({ mutationFn: api.createAgreement, invalidates: affects.agreements, silent: true });
}
export function useUpdateAgreement(id: string) {
  return useApiMutation({ mutationFn: (data: Record<string, any>) => api.updateAgreement(id, data), invalidates: affects.agreements, silent: true });
}
// AgreementDetail renders status, consent, withdrawal and evidence failures inline.
export function useUpdateAgreementStatus(id: string) {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (data: { status: string; evidence?: string }) => api.updateAgreementStatus(id, data),
    onSuccess: (data) => { queryClient.setQueryData(keys.agreements.detail(id), data); },
    invalidates: affects.agreements,
    // Names the status it landed in: a gate can carry it past the one chosen.
    success: (data) => `Status changed to ${agreementStatusLabel(data.status)}`,
    silent: true,
  });
}
/** Consent can activate a pending membership, so the session (consent gate, picker) is refreshed too. */
export function useAttestAgreementConsent(id: string) {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuth();
  return useApiMutation({
    mutationFn: (attestation: string) => api.attestAgreementConsent(id, attestation),
    onSuccess: async (data) => {
      queryClient.setQueryData(keys.agreements.detail(id), data);
      await refreshSession();
    },
    invalidates: affects.agreements,
    success: { title: 'Consent recorded', description: 'Your consent to this agreement is in the record.' },
    silent: true,
  });
}
/** Withdrawal can return a membership to pending consent, so the session is refreshed too. */
export function useWithdrawAgreementConsent(id: string) {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuth();
  return useApiMutation({
    mutationFn: (reason: string) => api.withdrawAgreementConsent(id, reason),
    onSuccess: async (data) => {
      queryClient.setQueryData(keys.agreements.detail(id), data);
      await refreshSession();
    },
    invalidates: affects.agreements,
    success: { title: 'Consent withdrawn', description: 'Your withdrawal and its reason are in the record.' },
    silent: true,
  });
}
export function useRecordAgreementCeremony(id: string) {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (data: { stage: string; note: string }) => api.recordAgreementCeremony(id, data),
    onSuccess: (data) => { queryClient.setQueryData(keys.agreements.detail(id), data); },
    invalidates: affects.agreements,
    success: (data) => (data.auto_transitions?.length ? `Status changed to ${agreementStatusLabel(data.status)}` : 'Evidence recorded'),
    silent: true,
  });
}
/** AgreementHistory shows no inline error, so failures toast. */
export function useRollbackAgreement(id: string) {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (versionId: string) => api.rollbackAgreement(id, versionId),
    onSuccess: (data) => { queryClient.setQueryData(keys.agreements.detail(id), data); },
    // affects.agreements reaches the history under the agreement's detail key.
    invalidates: affects.agreements,
    success: { title: 'Agreement rolled back', description: 'The previous state was saved as a snapshot first.' },
    error: 'Rollback failed',
  });
}

// Proposal hooks
export function useProposals(params?: Record<string, string> | false) {
  return useQuery({ queryKey: params === false ? keys.proposals.all : keys.proposals.list(params), queryFn: () => api.fetchProposals(params || undefined), enabled: params !== false, staleTime: 30_000 });
}
export function useProposal(id: string) {
  return useQuery({ queryKey: keys.proposals.detail(id), queryFn: () => api.fetchProposal(id), enabled: !!id, staleTime: 30_000, refetchOnWindowFocus: true });
}
// ProposalForm renders create/update failures inline and confirms with its own toast.
export function useCreateProposal() {
  return useApiMutation({ mutationFn: api.createProposal, invalidates: affects.proposals, silent: true });
}
export function useUpdateProposal(id: string) {
  return useApiMutation({ mutationFn: (data: Record<string, any>) => api.updateProposal(id, data), invalidates: affects.proposals, silent: true });
}
/**
 * Toasts the phase the proposal landed in (gates can auto-advance past the target) and any failure.
 * `from` names the status it left, so a send-back reads as a revision; `note` is required for one.
 */
export function useUpdateProposalStatus(id: string) {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (move: { status: string; note?: string; from?: string }) =>
      api.moveProposal(id, { status: move.status, note: move.note }),
    onSuccess: (data) => { queryClient.setQueryData(keys.proposals.detail(id), data); },
    invalidates: affects.proposals,
    success: (updated, move) => proposalPhaseAnnouncement(updated.status, move.from),
    error: 'Status not changed',
  });
}
// ACT participation (lib/act-participation.ts): announce an automatic advance or confirm the entry; failures render inline.
// Each resolves with auto_transitions so ProposalDetail can move focus after an advance unmounts its form.
export function useSubmitAdvice(proposalId: string) {
  return useApiMutation(actParticipationMutation((data) => api.submitAdvice(proposalId, data), 'advice'));
}
export function useSubmitConsent(proposalId: string) {
  return useApiMutation(actParticipationMutation((data) => api.submitConsent(proposalId, data), 'consent'));
}
/** Withdraws the caller's own position (how an objection's author lifts it); failures render inline. */
export function useWithdrawConsentPosition(proposalId: string) {
  return useApiMutation(actParticipationMutation(() => api.withdrawConsentPosition(proposalId), 'withdraw'));
}
/** A steward registers a ratified proposal; both the proposal and the agreement registry change. Failures render in the dialog. */
export function useRegisterProposalAgreement(proposalId: string) {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: () => api.registerProposalAgreement(proposalId),
    onSuccess: (data) => { queryClient.setQueryData(keys.proposals.detail(proposalId), data); },
    invalidates: [...affects.proposals, ...affects.agreements],
    success: (data) => ({
      title: 'Registered as an agreement',
      description: data.registered_agreement
        ? `“${data.registered_agreement.title}” is now in the agreement registry (v${data.registered_agreement.version ?? '1.0'}).`
        : 'It is now in the agreement registry.',
    }),
    silent: true,
  });
}
export function useSubmitTestReport(proposalId: string) {
  return useApiMutation(actParticipationMutation((data) => api.submitTestReport(proposalId, data), 'test'));
}

// Member hooks
export function useMembers(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.members.list(params), queryFn: () => api.fetchMembers(params), staleTime: 30_000 });
}
export function useMember(id: string) {
  return useQuery({ queryKey: keys.members.detail(id), queryFn: () => api.fetchMember(id), enabled: !!id, staleTime: 30_000 });
}
/** A member's governance profile: roles, domains, contributions (GET /members/:id/profile). */
export function useMemberProfile(id: string) {
  return useQuery({ queryKey: keys.members.profile(id), queryFn: () => api.fetchMemberProfile(id), enabled: !!id });
}
// MemberForm renders create/update failures inline and confirms with its own toast.
export function useCreateMember() {
  return useApiMutation({ mutationFn: api.createMember, invalidates: affects.members, silent: true });
}
export function useUpdateMember(id: string) {
  return useApiMutation({ mutationFn: (data: Record<string, any>) => api.updateMember(id, data), invalidates: affects.members, silent: true });
}
/** Role grants follow the owner decision on the server; MemberDetail renders the refusal inline. */
export function useAssignMemberRole(memberId: string) {
  return useApiMutation({
    mutationFn: (role: string) => api.assignMemberRole(memberId, role),
    invalidates: affects.members,
    success: { title: 'Role changed', description: 'The change is recorded in the role history.' },
    silent: true,
  });
}
/** Profile grants (co_creator/builder carry administration rights); MemberRoleCard renders the refusal inline. */
export function useGrantMemberProfile(memberId: string) {
  return useApiMutation({
    mutationFn: (profile: string) => api.grantMemberProfile(memberId, profile),
    invalidates: affects.members,
    success: { title: 'Profile changed', description: 'The change is recorded in the role history.' },
    silent: true,
  });
}
export function useMemberOnboarding(memberId: string) {
  return useQuery({ queryKey: keys.members.onboarding(memberId), queryFn: () => api.fetchMemberOnboarding(memberId), enabled: !!memberId, staleTime: 30_000 });
}

// Domain hooks
export function useDomains(params?: Record<string, string> | false) {
  return useQuery({ queryKey: params === false ? keys.domains.all : keys.domains.list(params), queryFn: () => api.fetchDomains(params || undefined), enabled: params !== false, staleTime: 30_000 });
}
export function useDomain(id: string) {
  return useQuery({ queryKey: keys.domains.detail(id), queryFn: () => api.fetchDomain(id), enabled: !!id, staleTime: 30_000 });
}
// DomainForm renders create/update failures inline and confirms with its own toast.
export function useCreateDomain() {
  return useApiMutation({ mutationFn: api.createDomain, invalidates: affects.domains, silent: true });
}
export function useUpdateDomain(id: string) {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (data: Record<string, any>) => api.updateDomain(id, data),
    onSuccess: (data) => { queryClient.setQueryData(keys.domains.detail(id), data); },
    invalidates: affects.domains,
    silent: true,
  });
}
/** Resolves after the domain refetch, so caller_is_participant is current when mutateAsync returns. DomainDetail renders failures inline. */
export function useJoinDomainParticipation(domainId: string) {
  return useApiMutation({
    mutationFn: () => api.joinDomainParticipation(domainId),
    invalidates: affects.domains,
    success: { title: 'Joined the domain', description: 'You are now a participant in this domain.' },
    silent: true,
  });
}
// Decision hooks
export function useDecisions(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.decisions.list(params), queryFn: () => api.fetchDecisions(params), staleTime: 30_000 });
}
export function useDecision(id: string) {
  return useQuery({ queryKey: keys.decisions.detail(id), queryFn: () => api.fetchDecision(id), enabled: !!id, staleTime: 30_000 });
}

// My decisions hooks (member-owned decision substrate)
export function useMyDecisions(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.myDecisions.list(params), queryFn: () => api.fetchMyDecisions(params), staleTime: 30_000 });
}
/** RecordDecisionDialog renders the server's refusal (409/403/400) inline. */
export function useCreateMyDecision() {
  return useApiMutation({ mutationFn: api.createMyDecision, invalidates: affects.myDecisions, silent: true });
}
export function useUpdateMyDecision() {
  return useApiMutation({
    mutationFn: ({ id, data }: { id: string; data: { decision?: string; state?: MemberDecisionState; notes?: string | null } }) => api.updateMyDecision(id, data),
    invalidates: affects.myDecisions,
    error: 'Could not update the decision',
  });
}
export function useDeleteMyDecision() {
  return useApiMutation({ mutationFn: (id: string) => api.deleteMyDecision(id), invalidates: affects.myDecisions, error: 'Could not delete the decision' });
}

// Onboarding hooks (the ceremony is read-only history; join and steward moves live in hooks/use-onboarding.ts)
export function useOnboardingCeremony(memberId: string) {
  return useQuery({ queryKey: keys.onboarding.ceremony(memberId), queryFn: () => api.fetchOnboardingCeremony(memberId), enabled: !!memberId, staleTime: 30_000 });
}

// Conflict hooks: every form and modal renders its failure inline.
export function useConflicts(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.conflicts.list(params), queryFn: () => api.fetchConflicts(params), staleTime: 30_000 });
}
export function useConflict(id: string) {
  return useQuery({ queryKey: keys.conflicts.detail(id), queryFn: () => api.fetchConflict(id), enabled: !!id, staleTime: 30_000 });
}
export function useCreateConflict() {
  return useApiMutation({ mutationFn: api.createConflict, invalidates: affects.conflicts, silent: true });
}
export function useUpdateConflict() {
  return useApiMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) => api.updateConflict(id, data),
    invalidates: affects.conflicts,
    silent: true,
  });
}
export function useCreateRepairAgreement(conflictId: string) {
  return useApiMutation({
    mutationFn: (data: Record<string, any>) => api.createRepairAgreement(conflictId, data),
    invalidates: affects.conflicts,
    success: { title: 'Repair agreement created', description: 'The repair agreement has been saved.' },
    silent: true,
  });
}
export function useUpdateRepairAgreement(conflictId: string) {
  return useApiMutation({
    mutationFn: ({ repairId, data }: { repairId: string; data: Record<string, any> }) => api.updateRepairAgreement(conflictId, repairId, data),
    invalidates: affects.conflicts,
    silent: true,
  });
}

// Ecosystem hooks
export function useEcosystems(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.ecosystems.list(params), queryFn: () => api.fetchEcosystemsList(params), staleTime: 30_000 });
}
export function useEcosystemDetail(id: string) {
  return useQuery({ queryKey: keys.ecosystems.detail(id), queryFn: () => api.fetchEcosystem(id), enabled: !!id, staleTime: 30_000 });
}
// EcosystemForm renders create/update failures inline and confirms with its own toast.
export function useCreateEcosystem() {
  return useApiMutation({ mutationFn: api.createEcosystemRecord, invalidates: affects.ecosystems, silent: true });
}
export function useUpdateEcosystem(id: string) {
  return useApiMutation({ mutationFn: (data: Record<string, any>) => api.updateEcosystemRecord(id, data), invalidates: affects.ecosystems, silent: true });
}

// Emergency and exit hooks live in hooks/use-emergency.ts and hooks/use-exit.ts (G-Safety).

// Safeguards hooks
export function useSafeguards() {
  return useQuery({ queryKey: keys.safeguards.overview(), queryFn: () => api.fetchSafeguards(), staleTime: 30_000 });
}
export function useAudits(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.audits.list(params), queryFn: () => api.fetchAudits(params), staleTime: 30_000 });
}
export function useAudit(id: string) {
  return useQuery({ queryKey: keys.audits.detail(id), queryFn: () => api.fetchAudit(id), enabled: !!id, staleTime: 30_000 });
}
/** Both audit request forms render failures inline. */
export function useRequestAudit() {
  return useApiMutation({ mutationFn: api.requestAudit, invalidates: affects.audits, silent: true });
}

// Notification hooks
export function useNotificationPreferences() {
  return useQuery({ queryKey: keys.notifications.preferences(), queryFn: () => api.fetchNotificationPreferences(), staleTime: 60_000 });
}
/** NotificationPreferences renders the failure and the saved state inline. */
export function useUpdateNotificationPreferences() {
  return useApiMutation({ mutationFn: (types: Record<string, boolean>) => api.updateNotificationPreferences(types), invalidates: affects.notifications, silent: true });
}

// Agent tokens (MCP access); AgentAccess confirms success with its own toasts.
export function useAgentTokens() {
  return useQuery({ queryKey: keys.agentTokens.list(), queryFn: () => api.fetchAgentTokens(), staleTime: 30_000 });
}
export function useMintAgentToken() {
  return useApiMutation({
    mutationFn: (data: { label?: string; expires_in_days?: number }) => api.mintAgentToken(data),
    invalidates: affects.agentTokens,
    error: 'Could not mint token',
  });
}
export function useRevokeAgentToken() {
  return useApiMutation({ mutationFn: (id: string) => api.revokeAgentToken(id), invalidates: affects.agentTokens, error: 'Could not revoke token' });
}
