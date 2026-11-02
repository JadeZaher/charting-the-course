import type { SupportCommand, SupportField, SupportResourceSpec } from '@/types/node-admin';
import { isPublicSupportReason } from './support-reasons';

export function readNodeAdmin(auth: object): boolean {
  return (auth as Record<string, unknown>).isNodeAdmin === true;
}
export function fieldOptions(field: SupportField): Array<{ value: string; label: string }> {
  return (field.options ?? []).map(option => typeof option === 'string' ? { value: option, label: option } : option);
}
export function supportFieldValue(field: SupportField, raw: string): unknown {
  if (raw === '') return null;
  if (field.type === 'boolean') {
    if (raw !== 'true' && raw !== 'false') throw new Error(`${field.label}: choose Yes or No.`);
    return raw === 'true';
  }
  if (['integer', 'number', 'float', 'numeric'].includes(field.type)) {
    const value = Number(raw);
    if (!Number.isFinite(value) || (field.type === 'integer' && !Number.isInteger(value))) throw new Error(`${field.label}: enter a valid ${field.type}.`);
    return value;
  }
  if (['json', 'object', 'array'].includes(field.type)) {
    try { return JSON.parse(raw); } catch { throw new Error(`${field.label}: enter valid JSON.`); }
  }
  return raw;
}
export function prepareSupportCommand(spec: SupportResourceSpec, input: {
  action: string; organizationId: string; resourceId?: string; version?: string;
  fields: Record<string, string>; reason: string; reasonCategories?: readonly string[];
}): SupportCommand {
  if (!spec.actions.includes(input.action)) throw new Error('Choose an available support action.');
  if (!isPublicSupportReason(input.reason, input.reasonCategories)) throw new Error('Choose a public support reason category.');
  if (input.action === 'create' && spec.organization_scoped && !input.organizationId) throw new Error('Choose the organization this record is for.');
  if (input.action !== 'create' && !input.resourceId) throw new Error('Inspect a record before changing it.');
  const values: Record<string, unknown> = {};
  if (['create', 'update', 'override_state', 'restore_evidence'].includes(input.action)) {
    for (const field of spec.fields.filter(field => field.editable)) {
      if (field.name === 'ecosystem_id' && input.organizationId) continue;
      if (input.action === 'restore_evidence' && field.name !== 'archive_id') continue;
      if (!(field.name in input.fields)) {
        if (input.action === 'create' && field.required) throw new Error(`${field.label} is required.`);
        continue;
      }
      const raw = input.fields[field.name];
      if (field.required && !raw.trim()) throw new Error(`${field.label} is required.`);
      if (field.options?.length && raw !== '' && !fieldOptions(field).some(option => option.value === raw)) throw new Error(`${field.label}: choose an available value.`);
      values[field.name] = supportFieldValue(field, raw);
    }
  }
  if (input.action === 'restore_evidence' && !values.archive_id) throw new Error('Enter the archive identifier from the support receipt.');
  if (['update', 'override_state'].includes(input.action) && Object.keys(values).length === 0) throw new Error('Change at least one field before reviewing.');
  return {
    resource_type: spec.key, resource_id: input.action === 'create' ? undefined : input.resourceId,
    action: input.action, organization_id: input.organizationId || undefined,
    values, reason: input.reason.trim(), expected_version: input.action === 'create' ? undefined : input.version,
  };
}
export function supportAuditPath(id: string): string { return `/node/audit/${encodeURIComponent(id)}`; }
const CANONICAL_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export interface SupportRecordLink { resource: string; record: string; organizationId?: string }
export function parseSupportRecordLink(href: string, resourceKeys: readonly string[]): SupportRecordLink | null {
  if (!href.startsWith('/admin?') || /[\\\u0000-\u001f#]/.test(href)) return null;
  const url = new URL(href, 'https://support.invalid');
  if (url.pathname !== '/admin' || url.origin !== 'https://support.invalid') return null;
  const entries = Array.from(url.searchParams.entries());
  if (entries.length < 2 || entries.length > 3 || new Set(entries.map(([key]) => key)).size !== entries.length || entries.some(([key]) => !['resource', 'record', 'organization_id'].includes(key))) return null;
  const resource = url.searchParams.get('resource') ?? '';
  const record = url.searchParams.get('record') ?? '';
  const organizationId = url.searchParams.get('organization_id') ?? undefined;
  if (!resourceKeys.includes(resource) || !/^[a-z][a-z0-9_]*$/.test(resource) || !CANONICAL_UUID.test(record) || (organizationId !== undefined && !CANONICAL_UUID.test(organizationId))) return null;
  return { resource, record, ...(organizationId ? { organizationId } : {}) };
}
export function supportDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return 'Not set';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return typeof value === 'object' ? (JSON.stringify(value) ?? 'Not set') : String(value);
}
