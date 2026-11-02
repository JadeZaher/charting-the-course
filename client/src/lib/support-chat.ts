export interface SupportChatScope { enabled: true; organization_id: string; reason: string }

export function readSupportChatScope(value: unknown): SupportChatScope | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (input.enabled !== true || typeof input.organization_id !== 'string' || !input.organization_id.trim() || typeof input.reason !== 'string') return null;
  const reason = input.reason;
  if (!isPublicSupportReason(reason)) return null;
  return { enabled: true, organization_id: input.organization_id.trim(), reason };
}
export function mayRestoreSupportScope(value: unknown, isNodeAdmin: boolean): boolean {
  return value === null || value === undefined || (isNodeAdmin && readSupportChatScope(value) !== null);
}
import { isPublicSupportReason } from './support-reasons';
