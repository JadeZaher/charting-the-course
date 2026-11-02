import { apiFetch } from './api-client';
import type { NodeAdminAssignment, NodeAdminUser, NodeAdminReceipt, PublicNodeAdmin, PublicSupportAudit, SupportArchive, SupportCatalog, SupportCommand, SupportPage, SupportReceipt, SupportRecord } from '@/types/node-admin';

const ROOT = '/api/v1/node-admin';
function query(params: Record<string, string | number | undefined>) {
  const values = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== '') values.set(key, String(value));
  const text = values.toString();
  return text ? `?${text}` : '';
}
function post<T>(path: string, value: unknown) {
  return apiFetch<T>(`${ROOT}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) });
}
export const fetchSupportCatalog = () => apiFetch<SupportCatalog>(`${ROOT}/catalog`);
export const fetchSupportResources = (kind: string, params: Record<string, string | number | undefined>) =>
  apiFetch<SupportPage<SupportRecord>>(`${ROOT}/resources/${encodeURIComponent(kind)}${query(params)}`);
export const inspectSupportResource = (value: { resource_type: string; resource_id: string; reason: string }) => post<SupportReceipt>('/inspect', value);
export const runSupportCommand = (value: SupportCommand) => post<SupportReceipt>('/commands', value);
export const fetchNodeAdmins = () => apiFetch<{ items: NodeAdminAssignment[] }>(`${ROOT}/admins`);
export const fetchNodeAdminUsers = (q: string) => apiFetch<{ items: NodeAdminUser[] }>(`${ROOT}/users${query({ q })}`);
export const grantNodeAdmin = (value: { user_id: string; reason: string }) => post<NodeAdminReceipt>('/admins', value);
export const revokeNodeAdmin = (value: { user_id: string; reason: string }) => post<NodeAdminReceipt>(`/admins/${encodeURIComponent(value.user_id)}/revoke`, { reason: value.reason });
export const fetchSupportArchives = (resourceType: string) => apiFetch<{ items: SupportArchive[]; total: number }>(`${ROOT}/archives${query({ resource_type: resourceType })}`);
export const fetchPublicSupportAudit = (params: Record<string, string | number | undefined>) =>
  apiFetch<SupportPage<PublicSupportAudit>>(`${ROOT}/audit${query(params)}`);
export const fetchPublicSupportAuditEntry = (id: string) => apiFetch<PublicSupportAudit>(`${ROOT}/audit/${encodeURIComponent(id)}`);

export const fetchPublicNodeAdmins = () => apiFetch<{ items: PublicNodeAdmin[] }>(`${ROOT}/roster`);
