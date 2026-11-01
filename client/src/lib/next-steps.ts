// What is waiting for the member, in words: the bell's badge and name, due dates, kind names.
// See pages/governance/AGENTS.md "Next steps and the status banner"; the server decides every item and its order.
import type { NextStepKind } from '@/types/api';

/** The bell's badge: nothing at zero or while unknown, the count up to 9, then "9+". */
export function bellBadge(count: number | null | undefined): string | null {
  if (!count || count < 0) return null;
  return count > 9 ? '9+' : String(count);
}

/** The bell's accessible name; it says the full count even when the badge shows "9+". */
export function bellLabel(count: number | null | undefined): string {
  if (count == null) return 'What is waiting for you';
  if (count === 0) return 'Nothing is waiting for you';
  return `${count} ${count === 1 ? 'thing is' : 'things are'} waiting for you`;
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A due value as a Date: YYYY-MM-DD is that calendar day in local time, never the UTC midnight before it. */
export function parseDue(value: string): Date {
  const day = DATE_ONLY.exec(value);
  return day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(value);
}

export type DueStatus = { text: string; overdue: boolean };

/**
 * "Overdue since <date>" only when the server says `overdue`; otherwise "Due today", "Due tomorrow" or "Due <date>".
 * The client never computes overdue (pages/governance/AGENTS.md "Next steps and the status banner").
 */
export function dueStatus(
  due: string | null | undefined,
  overdue: boolean | null | undefined,
  now: Date,
  format: (date: Date, withTime: boolean) => string,
): DueStatus | null {
  if (!due) return null;
  const date = parseDue(due);
  if (Number.isNaN(date.getTime())) return null;
  const withTime = !DATE_ONLY.test(due);
  if (overdue === true) return { text: `Overdue since ${format(date, withTime)}`, overdue: true };
  if (withTime) return { text: `Due ${format(date, true)}`, overdue: false };
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((date.getTime() - today.getTime()) / 86_400_000); // rounding absorbs a DST hour
  if (days === 0) return { text: 'Due today', overdue: false };
  if (days === 1) return { text: 'Due tomorrow', overdue: false };
  return { text: `Due ${format(date, false)}`, overdue: false };
}

const KIND_LABELS: Record<NextStepKind, string> = {
  proposal: 'Proposal',
  agreement: 'Agreement',
  conflict: 'Conflict case',
  emergency: 'Emergency',
  exit: 'Exit',
  audit: 'Audit',
  // FX-Maint: every kind a registered queue source emits (services/next_steps.py `_item(` kinds).
  newcomer: 'Newcomer',
  share_need: 'Share or need',
  collaboration: 'Collaboration',
};

/** Plain name for an item's record kind; unknown kinds read as given. */
export function nextStepKindLabel(kind: string): string {
  return KIND_LABELS[kind as NextStepKind] ?? kind;
}

/** The app's own wording for a due date: a calendar day, or a day and time for a timestamp. */
export function formatDue(date: Date, withTime: boolean): string {
  return withTime
    ? date.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
