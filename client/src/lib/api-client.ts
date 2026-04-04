import type { HealthResponse, SkillsResponse, AuthChallengeResponse, AuthVerifyResponse, AuthMeResponse, EcosystemSummary, EcosystemDetail, DashboardSummary } from '@/types/api';

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
