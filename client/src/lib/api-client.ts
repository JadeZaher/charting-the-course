import type { HealthResponse, SkillsResponse, AuthChallengeResponse, AuthVerifyResponse, AuthMeResponse, OAuthProvider, EcosystemSummary, EcosystemDetail, DashboardSummary, AgreementListItem, AgreementDetail, AgreementHistory, ProposalListItem, ProposalDetail, AdviceLog, ConsentRecord, TestReport, PaginatedResponse, MemberListItem, MemberDetail, OnboardingState, DomainListItem, DomainDetail, DecisionListItem, DecisionDetail, ConflictListItem, ConflictDetail, RepairAgreement, ConversationSummary, ConversationDetail, MessageItem, CourseListItem, CourseDetail, QuizListItem, QuizDetail, QuizResultItem, UserBadgeItem, UserTagItem, EmergencyListResponse, EmergencyStateDetail, ExitListItem, ExitDetail, SafeguardsOverview, GovernanceAudit, DiscoverResponse, SharesNeeds, Collaboration, ComplianceSummary } from '@/types/api';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || res.statusText);
  }
  return res.json();
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

// Decisions API
export function fetchDecisions(params?: Record<string, string>): Promise<PaginatedResponse<DecisionListItem>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<PaginatedResponse<DecisionListItem>>(`/api/v1/decisions${qs}`);
}
export function fetchDecision(id: string): Promise<DecisionDetail> {
  return apiFetch<DecisionDetail>(`/api/v1/decisions/${id}`);
}

// Onboarding API
export function fetchOnboardings(): Promise<{ items: OnboardingState[]; total: number }> {
  return apiFetch<{ items: OnboardingState[]; total: number }>('/api/v1/onboarding');
}
export function fetchOnboardingCeremony(memberId: string): Promise<OnboardingState> {
  return apiFetch<OnboardingState>(`/api/v1/onboarding/${memberId}/ceremony`);
}
export function submitCeremonyConsent(memberId: string, data: { section: string; consented: boolean }): Promise<OnboardingState> {
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

// Ecosystems API (paginated list)
export function fetchEcosystemsList(params?: Record<string, string>): Promise<PaginatedResponse<EcosystemSummary>> {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return apiFetch<PaginatedResponse<EcosystemSummary>>(`/api/v1/ecosystems${qs}`);
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
export function submitQuizResult(quizId: string, data: Record<string, any>): Promise<QuizResultItem> {
  return apiFetch(`/api/v1/quizzes/${quizId}/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function fetchQuizResults(quizId: string): Promise<{ results: QuizResultItem[] }> {
  return apiFetch(`/api/v1/quizzes/${quizId}/results`);
}
export function fetchMemberQuizHistory(memberId: string): Promise<{ results: QuizResultItem[] }> {
  return apiFetch(`/api/v1/members/${memberId}/quiz-history`);
}
export function fetchMemberBadges(memberId: string): Promise<{ badges: UserBadgeItem[] }> {
  return apiFetch(`/api/v1/members/${memberId}/badges`);
}
export function fetchMemberTags(memberId: string): Promise<{ tags: UserTagItem[] }> {
  return apiFetch(`/api/v1/members/${memberId}/tags`);
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
export function createSharesNeeds(data: Record<string, any>): Promise<SharesNeeds> {
  return apiFetch<SharesNeeds>('/api/v1/discover/shares-needs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
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
  return apiFetch<PaginatedResponse<ComplianceSummary>>(`/api/v1/compliance${qs}`);
}
export function generateCompliance(): Promise<ComplianceSummary> {
  return apiFetch<ComplianceSummary>('/api/v1/compliance/generate', { method: 'POST' });
}

// Orientation API
export function fetchEthosJourneyMaps(ethos_id: string): Promise<any[]> {
  return apiFetch<any[]>(`/api/v1/orientation/ethos/${ethos_id}/journey-maps`);
}

export function fetchOrientationProgress(ethos_id: string): Promise<UserJourneyProgress> {
  return apiFetch<UserJourneyProgress>(`/api/v1/orientation/ethos/${ethos_id}/progress`);
}

export function saveOrientationProgress(ethos_id: string, data: any): Promise<UserJourneyProgress> {
  return apiFetch<UserJourneyProgress>(`/api/v1/orientation/ethos/${ethos_id}/progress`, { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  });
}

export function saveGenplanInput(data: any): Promise<any> {
  return apiFetch<any>('/api/v1/orientation/genplan-input', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify(data) 
  });
}

// AI Assist API
export function aiAssist(data: { field_label: string; field_context: string; current_text: string; action: 'generate' | 'improve' }): Promise<{ text: string }> {
  return apiFetch<{ text: string }>('/api/v1/ai/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
