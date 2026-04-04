import type { HealthResponse, SkillsResponse, AuthChallengeResponse, AuthVerifyResponse, AuthMeResponse, EcosystemSummary, EcosystemDetail, DashboardSummary, AgreementListItem, AgreementDetail, AgreementHistory, ProposalListItem, ProposalDetail, AdviceLog, ConsentRecord, TestReport, PaginatedResponse } from '@/types/api';

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
  return apiFetch<AdviceLog[]>(`/api/v1/proposals/${id}/advice`);
}
export function submitAdvice(id: string, data: Record<string, any>): Promise<AdviceLog> {
  return apiFetch<AdviceLog>(`/api/v1/proposals/${id}/advice`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function fetchProposalConsent(id: string): Promise<ConsentRecord[]> {
  return apiFetch<ConsentRecord[]>(`/api/v1/proposals/${id}/consent`);
}
export function submitConsent(id: string, data: Record<string, any>): Promise<ConsentRecord> {
  return apiFetch<ConsentRecord>(`/api/v1/proposals/${id}/consent`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
}
export function fetchProposalTest(id: string): Promise<TestReport[]> {
  return apiFetch<TestReport[]>(`/api/v1/proposals/${id}/test`);
}
