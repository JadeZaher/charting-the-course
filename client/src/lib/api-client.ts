import type { HealthResponse, SkillsResponse, AuthChallengeResponse, AuthVerifyResponse, AuthMeResponse, OAuthProvider, EcosystemSummary, EcosystemDetail, DashboardSummary, AgreementListItem, AgreementDetail, AgreementHistory, ProposalListItem, ProposalDetail, AdviceLog, ConsentRecord, TestReport, PaginatedResponse, MemberListItem, MemberDetail, OnboardingState, CeremonyConsentRequest, DomainListItem, DomainDetail, DecisionListItem, DecisionDetail, ConflictListItem, ConflictDetail, RepairAgreement, ConversationSummary, ConversationDetail, MessageItem, CourseListItem, CourseDetail, QuizListItem, QuizDetail, QuizDomainAssignResult, QuizDomainUnassignResult, QuizEcosystemAssignResult, QuizEcosystemUnassignResult, QuizResultItem, UserBadgeItem, UserTagItem, JourneyMapSummary, SaveGenplanInputResult, EmergencyListResponse, EmergencyStateDetail, ExitListItem, ExitDetail, SafeguardsOverview, GovernanceAudit, DiscoverResponse, SharesNeeds, Collaboration, ComplianceSummary, MemberProfileResponse, EthosAccessStatus, EthosAccessGrant, BadgeDefinition, Team, TeamMember, QuizAssignment, AppSettingResponse, CtcHandoffItem } from '@/types/api';
import type { UserJourneyProgress } from '@/types/orientation';

const BASE_URL = import.meta.env.VITE_API_URL || '';

/** Fetch error carrying the HTTP status so consumers can branch without string-matching .message. */
export class ApiFetchError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiFetchError';
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiFetchError(body.error || res.statusText, res.status);
  }
  // 204/empty bodies (e.g. DELETE endpoints) have nothing for res.json() to parse.
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return text ? (JSON.parse(text) as T) : (undefined as T);
}

export function fetchHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/api/v1/health');
}

export function fetchSkills(layer?: number): Promise<SkillsResponse> {
  const params = layer !== undefined ? `?layer=${layer}` : '';
  return apiFetch<SkillsResponse>(`/api/v1/skills${params}`);
}

// Auth API
export function fetchChallenge(did: string): Promise<AuthChallengeResponse> {
  return apiFetch<AuthChallengeResponse>('/api/v1/auth/challenge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ did }),
  });
}

export function fetchVerify(params: {
  did: string;
  challenge: string;
  signature: string;
  display_name?: string;
}): Promise<AuthVerifyResponse> {
  return apiFetch<AuthVerifyResponse>('/api/v1/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

export function fetchMe(): Promise<AuthMeResponse> {
  return apiFetch<AuthMeResponse>('/api/v1/auth/me');
}

export function fetchLogout(): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/api/v1/auth/logout', { method: 'POST' });
}

export function loginWithPassword(username: string, password: string): Promise<AuthVerifyResponse> {
  return apiFetch<AuthVerifyResponse>('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export function setCredentials(username: string, password: string): Promise<{ success: boolean; username: string }> {
  return apiFetch<{ success: boolean; username: string }>('/api/v1/auth/set-credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
}

export function registerWithPassword(username: string, password: string, display_name?: string): Promise<AuthVerifyResponse> {
  return apiFetch<AuthVerifyResponse>('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, display_name }),
  });
}

export function resetDid(): Promise<{ success: boolean; message: string }> {
  return apiFetch<{ success: boolean; message: string }>('/api/v1/auth/did/reset', { method: 'POST' });
}

export function linkDid(params: { did: string; challenge: string; signature: string }): Promise<{ success: boolean; did: string }> {
  return apiFetch<{ success: boolean; did: string }>('/api/v1/auth/did/link', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
}

export function fetchOAuthProviders(): Promise<{ providers: OAuthProvider[] }> {
  return apiFetch<{ providers: OAuthProvider[] }>('/api/v1/auth/oauth/providers');
}

export function getOAuthUrl(provider: string): Promise<{ url: string }> {
  return apiFetch<{ url: string }>(`/api/v1/auth/oauth/${provider}`);
}

// Ecosystem API
export function fetchEcosystems(): Promise<{ ecosystems: EcosystemSummary[]; total: number }> {
  return apiFetch<{ ecosystems: EcosystemSummary[]; total: number }>('/api/v1/ecosystems');
}

export function fetchEcosystem(id: string): Promise<EcosystemDetail> {
  return apiFetch<EcosystemDetail>(`/api/v1/ecosystems/${id}`);
}

// Dashboard API
export function fetchDashboardSummary(): Promise<DashboardSummary> {
  return apiFetch<DashboardSummary>('/api/v1/dashboard/summary');
}

// Agreements API
export function fetchAgreements(params?: Record<string, string>): Promise<PaginatedResponse<AgreementListItem>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<PaginatedResponse<AgreementListItem>>(`/api/v1/agreements${qs}`);
}
export function fetchAgreement(id: string): Promise<AgreementDetail> {
  return apiFetch<AgreementDetail>(`/api/v1/agreements/${id}`);
}
export function createAgreement(data: Record<string, any>): Promise<AgreementDetail> {
  return apiFetch<AgreementDetail>('/api/v1/agreements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function updateAgreement(id: string, data: Record<string, any>): Promise<AgreementDetail> {
  return apiFetch<AgreementDetail>(`/api/v1/agreements/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function updateAgreementStatus(id: string, status: string): Promise<AgreementDetail> {
  return apiFetch<AgreementDetail>(`/api/v1/agreements/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
}
export function fetchAgreementHistory(id: string): Promise<AgreementHistory> {
  return apiFetch<AgreementHistory>(`/api/v1/agreements/${id}/history`);
}
export function rollbackAgreement(id: string, versionId: string): Promise<AgreementDetail> {
  return apiFetch<AgreementDetail>(`/api/v1/agreements/${id}/rollback/${versionId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
}

// Proposals API
export function fetchProposals(params?: Record<string, string>): Promise<PaginatedResponse<ProposalListItem>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<PaginatedResponse<ProposalListItem>>(`/api/v1/proposals${qs}`);
}
export function fetchProposal(id: string): Promise<ProposalDetail> {
  return apiFetch<ProposalDetail>(`/api/v1/proposals/${id}`);
}
export function createProposal(data: Record<string, any>): Promise<ProposalDetail> {
  return apiFetch<ProposalDetail>('/api/v1/proposals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function updateProposal(id: string, data: Record<string, any>): Promise<ProposalDetail> {
  return apiFetch<ProposalDetail>(`/api/v1/proposals/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function updateProposalStatus(id: string, status: string): Promise<ProposalDetail> {
  return apiFetch<ProposalDetail>(`/api/v1/proposals/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
}
export function fetchProposalAdvice(id: string): Promise<AdviceLog[]> {
  return apiFetch<{ advice_logs: AdviceLog[] }>(`/api/v1/proposals/${id}/advice`).then(r => r.advice_logs);
}
export function submitAdvice(id: string, data: Record<string, any>): Promise<AdviceLog> {
  return apiFetch<AdviceLog>(`/api/v1/proposals/${id}/advice`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function fetchProposalConsent(id: string): Promise<ConsentRecord[]> {
  return apiFetch<{ consent_records: ConsentRecord[] }>(`/api/v1/proposals/${id}/consent`).then(r => r.consent_records);
}
export function submitConsent(id: string, data: Record<string, any>): Promise<ConsentRecord> {
  return apiFetch<ConsentRecord>(`/api/v1/proposals/${id}/consent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function fetchProposalTest(id: string): Promise<TestReport[]> {
  return apiFetch<{ test_reports: TestReport[] }>(`/api/v1/proposals/${id}/test`).then(r => r.test_reports);
}
export function submitTestReport(id: string, data: Record<string, any>): Promise<TestReport> {
  return apiFetch<TestReport>(`/api/v1/proposals/${id}/test`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

// Members API
export function fetchMembers(params?: Record<string, string>): Promise<PaginatedResponse<MemberListItem>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<PaginatedResponse<MemberListItem>>(`/api/v1/members${qs}`);
}
export function fetchMember(id: string): Promise<MemberDetail> {
  return apiFetch<MemberDetail>(`/api/v1/members/${id}`);
}
export function createMember(data: Record<string, any>): Promise<MemberDetail> {
  return apiFetch<MemberDetail>('/api/v1/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function updateMember(id: string, data: Record<string, any>): Promise<MemberDetail> {
  return apiFetch<MemberDetail>(`/api/v1/members/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function fetchMemberOnboarding(memberId: string): Promise<OnboardingState> {
  return apiFetch<OnboardingState>(`/api/v1/members/${memberId}/onboarding`);
}
export function fetchMemberProfile(memberId: string): Promise<MemberProfileResponse> {
  return apiFetch<MemberProfileResponse>(`/api/v1/members/${memberId}/profile`);
}

// Domains API
export function fetchDomains(params?: Record<string, string>): Promise<PaginatedResponse<DomainListItem>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<PaginatedResponse<DomainListItem>>(`/api/v1/domains${qs}`);
}
export function fetchDomain(id: string): Promise<DomainDetail> {
  return apiFetch<DomainDetail>(`/api/v1/domains/${id}`);
}
export function createDomain(data: Record<string, any>): Promise<DomainDetail> {
  return apiFetch<DomainDetail>('/api/v1/domains', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function updateDomain(id: string, data: Record<string, any>): Promise<DomainDetail> {
  return apiFetch<DomainDetail>(`/api/v1/domains/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function fetchDomainQuizzes(domainId: string): Promise<{ items: QuizListItem[]; total: number }> {
  return apiFetch<{ items: QuizListItem[]; total: number }>(`/api/v1/domains/${domainId}/quizzes`);
}
export function assignQuizToDomain(domainId: string, quizId: string, isEntryQuiz: boolean): Promise<QuizDomainAssignResult> {
  return apiFetch(`/api/v1/domains/${domainId}/quizzes/assign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quiz_id: quizId, is_entry_quiz: isEntryQuiz }) });
}
export function unassignQuizFromDomain(domainId: string, quizId: string): Promise<QuizDomainUnassignResult> {
  return apiFetch(`/api/v1/domains/${domainId}/quizzes/unassign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quiz_id: quizId }) });
}

// Decisions API
export function fetchDecisions(params?: Record<string, string>): Promise<PaginatedResponse<DecisionListItem>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<PaginatedResponse<DecisionListItem>>(`/api/v1/decisions${qs}`);
}
export function fetchDecision(id: string): Promise<DecisionDetail> {
  return apiFetch<DecisionDetail>(`/api/v1/decisions/${id}`);
}

// Onboarding API
export function fetchOnboardings(params?: Record<string, string>): Promise<{ items: OnboardingState[]; total: number }> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<{ items: OnboardingState[]; total: number }>(`/api/v1/onboarding${qs}`);
}
export function fetchOnboardingCeremony(memberId: string): Promise<OnboardingState> {
  return apiFetch<OnboardingState>(`/api/v1/onboarding/${memberId}/ceremony`);
}
export function submitCeremonyConsent(memberId: string, data: CeremonyConsentRequest): Promise<OnboardingState> {
  return apiFetch<OnboardingState>(`/api/v1/onboarding/${memberId}/ceremony`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

// Conflicts API
export function fetchConflicts(params?: Record<string, string>): Promise<PaginatedResponse<ConflictListItem>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<PaginatedResponse<ConflictListItem>>(`/api/v1/conflicts${qs}`);
}
export function fetchConflict(id: string): Promise<ConflictDetail> {
  return apiFetch<ConflictDetail>(`/api/v1/conflicts/${id}`);
}
export function createConflict(data: Record<string, any>): Promise<ConflictDetail> {
  return apiFetch<ConflictDetail>('/api/v1/conflicts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function updateConflict(id: string, data: Record<string, any>): Promise<ConflictDetail> {
  return apiFetch<ConflictDetail>(`/api/v1/conflicts/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function createRepairAgreement(conflictId: string, data: Record<string, any>): Promise<RepairAgreement> {
  return apiFetch<RepairAgreement>(`/api/v1/conflicts/${conflictId}/repair`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function updateRepairAgreement(conflictId: string, repairId: string, data: Record<string, any>): Promise<RepairAgreement> {
  return apiFetch<RepairAgreement>(`/api/v1/conflicts/${conflictId}/repair/${repairId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

// Ecosystems API (paginated list)
export function fetchEcosystemsList(params?: Record<string, string>): Promise<{ ecosystems: EcosystemSummary[]; total: number; page: number; per_page: number }> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<{ ecosystems: EcosystemSummary[]; total: number; page: number; per_page: number }>(`/api/v1/ecosystems${qs}`);
}
export function createEcosystemRecord(data: Record<string, any>): Promise<EcosystemDetail> {
  return apiFetch<EcosystemDetail>('/api/v1/ecosystems', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function updateEcosystemRecord(id: string, data: Record<string, any>): Promise<EcosystemDetail> {
  return apiFetch<EcosystemDetail>(`/api/v1/ecosystems/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function requestJoinEcosystem(id: string): Promise<{ status: string; message: string }> {
  return apiFetch<{ status: string; message: string }>(`/api/v1/ecosystems/${id}/join`, { method: 'POST' });
}
export function fetchEcosystemQuizzes(ecosystemId: string): Promise<{ quizzes: QuizListItem[] }> {
  return apiFetch<{ quizzes: QuizListItem[] }>(`/api/v1/ecosystems/${ecosystemId}/quizzes`);
}
export function assignQuizToEcosystem(ecosystemId: string, quizId: string, isEntryQuiz: boolean): Promise<QuizEcosystemAssignResult> {
  return apiFetch(`/api/v1/ecosystems/${ecosystemId}/quizzes/assign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quiz_id: quizId, is_entry_quiz: isEntryQuiz }) });
}
export function unassignQuizFromEcosystem(ecosystemId: string, quizId: string): Promise<QuizEcosystemUnassignResult> {
  return apiFetch(`/api/v1/ecosystems/${ecosystemId}/quizzes/unassign`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quiz_id: quizId }) });
}

// Messaging API
export function fetchConversations(): Promise<{ conversations: ConversationSummary[] }> {
  return apiFetch<{ conversations: ConversationSummary[] }>('/api/v1/messaging/conversations');
}
export function fetchConversation(id: string): Promise<ConversationDetail> {
  return apiFetch<ConversationDetail>(`/api/v1/messaging/conversations/${id}`);
}
export function createConversation(data: { type: string; title?: string; participant_ids: string[] }): Promise<ConversationDetail> {
  return apiFetch<ConversationDetail>('/api/v1/messaging/conversations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function sendConversationMessage(conversationId: string, content: string): Promise<MessageItem> {
  return apiFetch<MessageItem>(`/api/v1/messaging/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
}
export function fetchConversationMessages(id: string, page?: number): Promise<{ messages: MessageItem[]; total: number }> {
  const qs = page ? `?page=${page}` : '';
  return apiFetch<{ messages: MessageItem[]; total: number }>(`/api/v1/messaging/conversations/${id}/messages${qs}`);
}
export function searchMessages(q: string): Promise<{ messages: MessageItem[] }> {
  return apiFetch<{ messages: MessageItem[] }>(`/api/v1/messaging/search?q=${encodeURIComponent(q)}`);
}
export function fetchMembersList(): Promise<{ members: MemberListItem[] }> {
  return apiFetch<{ members: MemberListItem[] }>('/api/v1/messaging/members');
}

// Courses API
export function fetchCourses(params?: Record<string, string>): Promise<PaginatedResponse<CourseListItem>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch(`/api/v1/courses${qs}`);
}
export function fetchCourse(id: string): Promise<CourseDetail> { return apiFetch(`/api/v1/courses/${id}`); }
export function createCourse(data: Record<string, any>): Promise<CourseDetail> {
  return apiFetch('/api/v1/courses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function fetchQuizzes(params?: Record<string, string>): Promise<PaginatedResponse<QuizListItem>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch(`/api/v1/quizzes${qs}`);
}
export function fetchQuiz(id: string): Promise<QuizDetail> { return apiFetch(`/api/v1/quizzes/${id}`); }
export function createQuiz(data: Record<string, any>): Promise<QuizDetail> {
  return apiFetch('/api/v1/quizzes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function updateQuiz(id: string, data: Record<string, any>): Promise<QuizDetail> {
  return apiFetch(`/api/v1/quizzes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function deleteQuiz(id: string): Promise<{ ok: boolean; message: string }> {
  return apiFetch(`/api/v1/quizzes/${id}`, { method: 'DELETE' });
}
export function submitQuizResult(quizId: string, data: Record<string, any>): Promise<QuizResultItem> {
  return apiFetch(`/api/v1/quizzes/${quizId}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function fetchQuizResults(quizId: string, params?: Record<string, string>): Promise<{ items: QuizResultItem[]; total: number; page: number; per_page: number }> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch(`/api/v1/quizzes/${quizId}/results${qs}`);
}
export function fetchQuizResultsAdmin(quizId: string, params?: Record<string, string>): Promise<{ items: (QuizResultItem & { member_name: string })[]; quiz_title: string; total: number; page: number; per_page: number }> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch(`/api/v1/quizzes/${quizId}/results/all${qs}`);
}
export function fetchMemberQuizHistory(memberId: string): Promise<{ results: QuizResultItem[] }> {
  return apiFetch(`/api/v1/members/${memberId}/quiz-history`);
}
export async function fetchMemberBadges(memberId: string): Promise<{ badges: UserBadgeItem[] }> {
  const response = await apiFetch<{ items: UserBadgeItem[] }>(`/api/v1/members/${memberId}/badges`);
  return { badges: response.items };
}
export async function fetchMemberTags(memberId: string): Promise<{ tags: UserTagItem[] }> {
  const response = await apiFetch<{ items: UserTagItem[] }>(`/api/v1/members/${memberId}/tags`);
  return { tags: response.items };
}

// Chat Sessions API
export interface ChatSessionItem {
  id: string;
  title: string | null;
  skill: string | null;
  message_count: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface ChatSessionDetail {
  id: string;
  title: string | null;
  skill: string | null;
  privacy: string;
  share_token: string | null;
  messages: { role: string; content: string }[];
  created_at: string | null;
  updated_at: string | null;
}

export function fetchChatSessions(params?: { q?: string; limit?: number; offset?: number }): Promise<{ sessions: ChatSessionItem[] }> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  const query = qs.toString();
  return apiFetch<{ sessions: ChatSessionItem[] }>(`/api/v1/chat/sessions${query ? '?' + query : ''}`);
}

export function fetchChatSession(id: string): Promise<ChatSessionDetail> {
  return apiFetch<ChatSessionDetail>(`/api/v1/chat/sessions/${id}`);
}

export function deleteChatSession(id: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/api/v1/chat/sessions/${id}`, { method: 'DELETE' });
}

export function updateChatSessionPrivacy(id: string, privacy: 'private' | 'ecosystem' | 'public'): Promise<{ privacy: string; share_token: string | null }> {
  return apiFetch<{ privacy: string; share_token: string | null }>(`/api/v1/chat/sessions/${id}/privacy`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ privacy }),
  });
}

// Discover API
export function fetchDiscover(params?: Record<string, string>): Promise<DiscoverResponse> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<DiscoverResponse>(`/api/v1/discover${qs}`);
}

// Emergency API
export function fetchEmergencyState(): Promise<EmergencyListResponse> {
  return apiFetch<EmergencyListResponse>('/api/v1/emergency');
}
export function fetchEmergencyDetail(id: string): Promise<EmergencyStateDetail> {
  return apiFetch<EmergencyStateDetail>(`/api/v1/emergency/${id}`);
}
export function declareEmergency(data: Record<string, any>): Promise<EmergencyStateDetail> {
  return apiFetch<EmergencyStateDetail>('/api/v1/emergency/declare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function resolveEmergency(id: string): Promise<EmergencyStateDetail> {
  return apiFetch<EmergencyStateDetail>(`/api/v1/emergency/${id}/resolve`, { method: 'POST' });
}
export function completeEmergencyRecovery(id: string): Promise<EmergencyStateDetail> {
  return apiFetch<EmergencyStateDetail>(`/api/v1/emergency/${id}/complete-recovery`, { method: 'POST' });
}

// Exit API
export function fetchExits(params?: Record<string, string>): Promise<PaginatedResponse<ExitListItem>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<PaginatedResponse<ExitListItem>>(`/api/v1/exit${qs}`);
}
export function fetchExit(id: string): Promise<ExitDetail> {
  return apiFetch<ExitDetail>(`/api/v1/exit/${id}`);
}
export function createExit(data: Record<string, any>): Promise<ExitDetail> {
  return apiFetch<ExitDetail>('/api/v1/exit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function updateExitStatus(id: string, data: Record<string, any>): Promise<ExitDetail> {
  return apiFetch<ExitDetail>(`/api/v1/exit/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function requestExitDataExport(id: string): Promise<ExitDetail> {
  return apiFetch<ExitDetail>(`/api/v1/exit/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ new_status: 'export_requested' }) });
}

// Safeguards API
export function fetchSafeguards(): Promise<SafeguardsOverview> {
  return apiFetch<SafeguardsOverview>('/api/v1/safeguards');
}
export function fetchAudits(params?: Record<string, string>): Promise<PaginatedResponse<GovernanceAudit>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<PaginatedResponse<GovernanceAudit>>(`/api/v1/safeguards/audits${qs}`);
}
export function fetchAudit(id: string): Promise<GovernanceAudit> {
  return apiFetch<GovernanceAudit>(`/api/v1/safeguards/audits/${id}`);
}
export function requestAudit(data: Record<string, any>): Promise<GovernanceAudit> {
  return apiFetch<GovernanceAudit>('/api/v1/safeguards/audits', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

// Shares & Needs API
export function fetchSharesNeeds(params?: Record<string, string>): Promise<PaginatedResponse<SharesNeeds>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<PaginatedResponse<SharesNeeds>>(`/api/v1/discover/shares-needs${qs}`);
}
export function fetchSharesNeedsAdmin(params?: Record<string, string>): Promise<PaginatedResponse<SharesNeeds> & { stats: { total: number; shares: number; needs: number; active: number; fulfilled: number; withdrawn: number } }> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch(`/api/v1/discover/shares-needs/admin${qs}`);
}
export function createSharesNeeds(data: Record<string, any>): Promise<SharesNeeds> {
  return apiFetch<SharesNeeds>('/api/v1/discover/shares-needs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function updateSharesNeeds(id: string, data: Record<string, any>): Promise<SharesNeeds> {
  return apiFetch<SharesNeeds>(`/api/v1/discover/shares-needs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function updateSharesNeedsStatus(id: string, status: string): Promise<SharesNeeds> {
  return apiFetch<SharesNeeds>(`/api/v1/discover/shares-needs/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
}
export function deleteSharesNeeds(id: string): Promise<{ ok: boolean; message: string }> {
  return apiFetch<{ ok: boolean; message: string }>(`/api/v1/discover/shares-needs/${id}`, { method: 'DELETE' });
}

// Collaborations API
export function fetchCollaborations(params?: Record<string, string>): Promise<PaginatedResponse<Collaboration>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<PaginatedResponse<Collaboration>>(`/api/v1/discover/collaborations${qs}`);
}
export function fetchCollaboration(id: string): Promise<Collaboration> {
  return apiFetch<Collaboration>(`/api/v1/discover/collaborations/${id}`);
}
export function createCollaboration(data: Record<string, any>): Promise<Collaboration> {
  return apiFetch<Collaboration>('/api/v1/discover/collaborations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

// Compliance API
export function fetchComplianceLatest(): Promise<ComplianceSummary> {
  return apiFetch<ComplianceSummary>('/api/v1/compliance/latest');
}
export function fetchComplianceHistory(params?: Record<string, string>): Promise<PaginatedResponse<ComplianceSummary>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<PaginatedResponse<ComplianceSummary>>(`/api/v1/compliance/history${qs}`);
}
export function generateCompliance(): Promise<ComplianceSummary> {
  return apiFetch<ComplianceSummary>('/api/v1/compliance/generate', { method: 'POST' });
}

// Orientation API
export function fetchEthosJourneyMaps(ethos_id: string, includeInactive = false): Promise<JourneyMapSummary[]> {
  const qs = includeInactive ? '?include_inactive=true' : '';
  return apiFetch<JourneyMapSummary[]>(`/api/v1/orientation/ethos/${ethos_id}/journey-maps${qs}`);
}

export function fetchOrientationProgress(ethos_id: string): Promise<UserJourneyProgress> {
  return apiFetch<UserJourneyProgress>(`/api/v1/orientation/ethos/${ethos_id}/progress`);
}

export function saveOrientationProgress(ethos_id: string, data: any): Promise<Pick<UserJourneyProgress, 'id' | 'user_id' | 'ethos_id' | 'journey_map_id' | 'current_step' | 'status'>> {
  return apiFetch<Pick<UserJourneyProgress, 'id' | 'user_id' | 'ethos_id' | 'journey_map_id' | 'current_step' | 'status'>>(`/api/v1/orientation/ethos/${ethos_id}/progress`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export function saveGenplanInput(data: any): Promise<SaveGenplanInputResult> {
  return apiFetch<SaveGenplanInputResult>('/api/v1/orientation/genplan-input', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}
export function createJourneyMap(ecosystemId: string, data: Record<string, any>): Promise<JourneyMapSummary> {
  return apiFetch(`/api/v1/orientation/ethos/${ecosystemId}/journey-maps`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function updateJourneyMap(journeyMapId: string, data: Record<string, any>): Promise<JourneyMapSummary> {
  return apiFetch(`/api/v1/orientation/journey-maps/${journeyMapId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function deleteJourneyMap(journeyMapId: string): Promise<{ ok: boolean; message: string }> {
  return apiFetch(`/api/v1/orientation/journey-maps/${journeyMapId}`, { method: 'DELETE' });
}

// Ecosystem-scoped shares/needs
export function fetchEcosystemSharesNeeds(ecosystemId: string, params?: Record<string, string>): Promise<{ items: SharesNeeds[] }> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch(`/api/v1/ecosystems/${ecosystemId}/shares-needs${qs}`);
}

// Domain-scoped shares/needs
export function fetchDomainSharesNeeds(domainId: string, params?: Record<string, string>): Promise<{ items: SharesNeeds[] }> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch(`/api/v1/domains/${domainId}/shares-needs${qs}`);
}

// Notifications API
export function subscribeNotifications(data: { endpoint: string; keys: { p256dh: string; auth: string }; notification_types?: Record<string, boolean> }): Promise<{ status: string }> {
  return apiFetch<{ status: string }>('/api/v1/notifications/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function unsubscribeNotifications(endpoint: string): Promise<void> {
  return apiFetch<void>('/api/v1/notifications/subscribe', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint }) });
}
export function fetchNotificationPreferences(): Promise<{ notification_types: Record<string, boolean> }> {
  return apiFetch<{ notification_types: Record<string, boolean> }>('/api/v1/notifications/preferences');
}
export function updateNotificationPreferences(types: Record<string, boolean>): Promise<{ status: string; notification_types: Record<string, boolean> }> {
  return apiFetch<{ status: string; notification_types: Record<string, boolean> }>('/api/v1/notifications/preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notification_types: types }) });
}

// Member status transition
export function transitionMemberStatus(memberId: string, data: { status: string; trigger?: string; notes?: string }): Promise<MemberDetail> {
  return apiFetch<MemberDetail>(`/api/v1/members/${memberId}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

// Course update
export function updateCourse(id: string, data: Record<string, any>): Promise<CourseListItem> {
  return apiFetch<CourseListItem>(`/api/v1/courses/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

// Ecosystem quiz results
export function fetchEcosystemQuizResults(ecosystemId: string): Promise<{ results: (QuizResultItem & { member_name: string; quiz_title: string })[] }> {
  return apiFetch<{ results: (QuizResultItem & { member_name: string; quiz_title: string })[] }>(`/api/v1/ecosystems/${ecosystemId}/quiz-results`);
}

// Domain quiz results
export function fetchDomainQuizResults(domainId: string): Promise<{ items: (QuizResultItem & { member_name: string; quiz_title: string })[]; total: number }> {
  return apiFetch<{ items: (QuizResultItem & { member_name: string; quiz_title: string })[]; total: number }>(`/api/v1/domains/${domainId}/quiz-results`);
}

// AI Assist API
export function aiAssist(data: { field_label: string; field_context: string; current_text: string; action: 'generate' | 'improve'; user_prompt?: string }): Promise<{ text: string }> {
  return apiFetch<{ text: string }>('/api/v1/ai/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

// ---------------------------------------------------------------------------
// Ethos access & participation consent
// ---------------------------------------------------------------------------

const jsonBody = (data: unknown): RequestInit => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});

export function fetchEthosAccess(ecosystemId: string): Promise<EthosAccessStatus> {
  return apiFetch<EthosAccessStatus>(`/api/v1/ethos/${ecosystemId}/access/me`);
}

export function consentEthosAccess(ecosystemId: string): Promise<EthosAccessStatus> {
  return apiFetch<EthosAccessStatus>(`/api/v1/ethos/${ecosystemId}/access/consent`, { method: 'POST' });
}

export function listEthosAccess(ecosystemId: string): Promise<{ items: EthosAccessGrant[]; total: number }> {
  return apiFetch<{ items: EthosAccessGrant[]; total: number }>(`/api/v1/ethos/${ecosystemId}/access`);
}

export function grantEthosAccess(ecosystemId: string, data: { member_id: string; role_in_ethos?: string; access_level?: string }): Promise<EthosAccessGrant> {
  return apiFetch<EthosAccessGrant>(`/api/v1/ethos/${ecosystemId}/access`, jsonBody(data));
}

export function revokeEthosAccess(ecosystemId: string, memberId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/v1/ethos/${ecosystemId}/access/${memberId}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Badge definitions (admin catalog)
// ---------------------------------------------------------------------------

export function fetchBadgeDefinitions(): Promise<{ items: BadgeDefinition[]; total: number }> {
  return apiFetch<{ items: BadgeDefinition[]; total: number }>('/api/v1/badges');
}

export function createBadgeDefinition(data: { badge_key: string; badge_name: string; badge_description?: string | null; badge_category?: string | null; badge_icon?: string | null; strength?: number | null; ecosystem_id?: string | null }): Promise<BadgeDefinition> {
  return apiFetch<BadgeDefinition>('/api/v1/badges', jsonBody(data));
}

export function updateBadgeDefinition(id: string, data: Record<string, unknown>): Promise<BadgeDefinition> {
  return apiFetch<BadgeDefinition>(`/api/v1/badges/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

export function deleteBadgeDefinition(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/v1/badges/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Teams
// ---------------------------------------------------------------------------

export function fetchTeams(): Promise<{ items: Team[]; total: number }> {
  return apiFetch<{ items: Team[]; total: number }>('/api/v1/teams');
}

export function createTeam(data: { name: string; description?: string | null; ecosystem_id?: string }): Promise<Team> {
  return apiFetch<Team>('/api/v1/teams', jsonBody(data));
}

export function updateTeam(id: string, data: Record<string, unknown>): Promise<Team> {
  return apiFetch<Team>(`/api/v1/teams/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}

export function deleteTeam(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/v1/teams/${id}`, { method: 'DELETE' });
}

export function fetchTeamMembers(teamId: string): Promise<{ items: TeamMember[]; total: number }> {
  return apiFetch<{ items: TeamMember[]; total: number }>(`/api/v1/teams/${teamId}/members`);
}

export function addTeamMember(teamId: string, data: { member_id: string; role?: string }): Promise<TeamMember> {
  return apiFetch<TeamMember>(`/api/v1/teams/${teamId}/members`, jsonBody(data));
}

export function removeTeamMember(teamId: string, memberId: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/v1/teams/${teamId}/members/${memberId}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// Quiz assignments (member-targeted)
// ---------------------------------------------------------------------------

export function fetchQuizAssignments(memberId?: string): Promise<{ items: QuizAssignment[]; total: number }> {
  const qs = memberId ? `?member_id=${memberId}` : '';
  return apiFetch<{ items: QuizAssignment[]; total: number }>(`/api/v1/quiz-assignments${qs}`);
}

export function createQuizAssignment(data: { quiz_id: string; member_id: string; due_date?: string | null }): Promise<QuizAssignment> {
  return apiFetch<QuizAssignment>('/api/v1/quiz-assignments', jsonBody(data));
}

export function deleteQuizAssignment(id: string): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/api/v1/quiz-assignments/${id}`, { method: 'DELETE' });
}

// ---------------------------------------------------------------------------
// App settings (key/value)
// ---------------------------------------------------------------------------

export function fetchSetting(key: string): Promise<AppSettingResponse> {
  return apiFetch<AppSettingResponse>(`/api/v1/settings?key=${encodeURIComponent(key)}`);
}

export function saveSetting(key: string, value: Record<string, unknown>): Promise<AppSettingResponse> {
  return apiFetch<AppSettingResponse>('/api/v1/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, value }) });
}

// ---------------------------------------------------------------------------
// CTC → NEOS Den handoff readiness
// ---------------------------------------------------------------------------

export function fetchCtcHandoff(): Promise<{ items: CtcHandoffItem[]; total: number }> {
  return apiFetch<{ items: CtcHandoffItem[]; total: number }>('/api/v1/admin/ctc-handoff');
}

export function setNeosDenReady(memberId: string, ready: boolean): Promise<CtcHandoffItem> {
  return apiFetch<CtcHandoffItem>(`/api/v1/admin/ctc-handoff/${memberId}`, jsonBody({ ready_for_neos_den: ready }));
}

// ---------------------------------------------------------------------------
// Member invite
// ---------------------------------------------------------------------------

export function resendMemberInvite(memberId: string): Promise<{ success: boolean; message?: string; resent_at?: string }> {
  return apiFetch<{ success: boolean; message?: string; resent_at?: string }>(`/api/v1/members/${memberId}/resend-invite`, { method: 'POST' });
}
