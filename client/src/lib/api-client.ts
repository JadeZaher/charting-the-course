import type { HealthResponse, SkillsResponse } from '@/types/api';

const BASE_URL = import.meta.env.VITE_API_URL || '';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
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
