import { z } from 'zod';
import { resolveInternalPath } from './internal-path';

export const channelLabels = { in_app: 'In-app', email: 'Email', push: 'Browser push', sms: 'SMS' } as const;
export type EngagementChannel = keyof typeof channelLabels;
export const scopeLabels = { ecosystem: 'Community', domain: 'Circle / domain', team: 'Team', proposal: 'Proposal', agreement: 'Agreement', collaboration: 'Collaboration', share: 'Offer or request', conversation: 'Conversation' } as const;
export type EngagementScope = keyof typeof scopeLabels;
export function isEngagementScope(value: unknown): value is EngagementScope {
  return typeof value === 'string' && Object.hasOwn(scopeLabels, value);
}
export const familyLabels = { governance: 'Governance decisions', opportunities: 'Offers and requests', collaboration: 'Collaborations', messages: 'Messages', community: 'Community participation' } as const;
export type EngagementFamily = keyof typeof familyLabels;
export type Frequency = 'immediate' | 'daily' | 'weekly';
export const frequencyLabels: Record<Frequency, string> = { immediate: 'As it happens', daily: 'Daily digest', weekly: 'Weekly digest' };

export function engagementPath(value: unknown, fallback = '/updates'): string {
  return resolveInternalPath(typeof value === 'string' ? value : undefined) ?? fallback;
}

export function communityEntryPath(id: string, authenticated: boolean): string {
  const target = `/ethos/${encodeURIComponent(id)}`;
  return authenticated ? target : `/login?redirect=${encodeURIComponent(target)}&ecosystem=${encodeURIComponent(id)}`;
}

export function validTimezone(value: string): boolean {
  try { new Intl.DateTimeFormat('en', { timeZone: value }); return !!value; } catch { return false; }
}

export const pacingSchema = z.object({
  timezone: z.string().trim().min(1, 'Choose your time zone.').refine(validTimezone, 'Enter a valid time zone, such as America/Denver.'),
  quiet_start: z.string().regex(/^$|^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Use a valid time.'),
  quiet_end: z.string().regex(/^$|^(?:[01]\d|2[0-3]):[0-5]\d$/, 'Use a valid time.'),
  paused_until: z.string().refine(value => !value || Number.isFinite(Date.parse(value)), 'Choose a valid pause date.'),
  direct_messages: z.boolean(),
}).superRefine((value, ctx) => {
  if (Boolean(value.quiet_start) !== Boolean(value.quiet_end)) ctx.addIssue({ code: 'custom', path: ['quiet_end'], message: 'Set both quiet-hour times, or clear both.' });
  if (value.quiet_start && value.quiet_start === value.quiet_end) ctx.addIssue({ code: 'custom', path: ['quiet_end'], message: 'Start and end must be different.' });
});

export function capabilityLabel(state: string): string {
  return ({ ready: 'Ready', pending_setup: 'Setup pending', configured_disabled: 'Not activated', needs_verification: 'Verification needed', suppressed: 'Delivery stopped' } as Record<string, string>)[state] ?? 'Unavailable';
}

export function canEnrollChannel(state?: string): boolean {
  return state === 'ready' || state === 'needs_verification';
}

export function displayEventTime(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(date) : 'Date unavailable';
}

export function toLocalDatetime(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
