// The dashboard queue is a view of GET /me/next-steps. Completed joining work is left out.
// Months-overdue rows stay, under "Older items", so a new member is not greeted with them.
import { parseDue } from './next-steps';

/** "Months" is not a number in the spec. 60 days past a server-overdue date is the cutoff. */
export const DASHBOARD_OLDER_DAYS = 60;

export const dashboardQueueCopy = {
  olderItems: 'Older items',
  auditOverdue: (date: string) => `The next audit was due on ${date}. A steward can update it.`,
} as const;

export interface DashboardQueueItem {
  uid: string;
  kind: string;
  key?: string | null;
  title?: string;
  action?: string;
  what?: string;
  link?: string;
  due?: string | null;
  overdue?: boolean;
  completed?: boolean;
}

const ORIENTATION = /orientation|journey/i;
const ENTRY_QUIZ = /quiz|questionnaire/i;
const CONSENT = /consent|agreement/i;

/** An entry quiz still in the queue after the membership is active. `take_entry_quiz` is completed even when the description mentions orientation. `start_orientation` stays. */
export function isCompletedDashboardItem(item: DashboardQueueItem, activeMember: boolean): boolean {
  if (item.completed === true) return true;
  if (!activeMember || item.kind !== 'newcomer') return false;
  if (item.action === 'start_orientation') return false;
  if (item.action === 'take_entry_quiz') return true;
  const blob = `${item.key ?? ''} ${item.action ?? ''} ${item.what ?? ''} ${item.title ?? ''} ${item.link ?? ''}`;
  if (ORIENTATION.test(blob)) return false;
  return ENTRY_QUIZ.test(blob) || CONSENT.test(blob);
}

export function isOlderDashboardItem(item: DashboardQueueItem, now: Date, days = DASHBOARD_OLDER_DAYS): boolean {
  if (item.overdue !== true || !item.due) return false;
  const date = parseDue(item.due);
  if (Number.isNaN(date.getTime())) return false;
  return now.getTime() - date.getTime() >= days * 86_400_000;
}

/** Current rows first (newcomer steps ahead of the rest, server order otherwise). Older rows are kept, not deleted. */
export function dashboardQueue<T extends DashboardQueueItem>(items: readonly T[], now: Date, activeMember: boolean): { current: T[]; older: T[] } {
  const open = items.filter((item) => !isCompletedDashboardItem(item, activeMember));
  const current: T[] = [];
  const older: T[] = [];
  for (const item of open) (isOlderDashboardItem(item, now) ? older : current).push(item);
  current.sort((a, b) => Number(b.kind === 'newcomer') - Number(a.kind === 'newcomer'));
  return { current, older };
}

/** Dashboard health line. Overdue names a steward. A date that is not overdue keeps the existing sentence. */
export function dashboardAuditLine(auditDue: string | null, overdue: boolean, format: (date: string) => string): string {
  if (!auditDue) return 'No audit date yet';
  const date = format(auditDue);
  return overdue ? dashboardQueueCopy.auditOverdue(date) : `Next audit due ${date}`;
}
