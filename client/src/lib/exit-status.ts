// Exit status words, the moves' confirmation copy and the handoff notice; shared by ExitList and ExitDetail.
// The server decides who may make which move (`allowed_next`); see pages/governance/AGENTS.md "Emergency and exit".

export const EXIT_STATUSES = [
  'declared',
  'cooling_off', // legacy rows; read as "Filed"
  'unwinding',
  'completed',
  'cancelled',
] as const;

export type ExitStatus = (typeof EXIT_STATUSES)[number];

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const EXIT_STATUS_LABELS: Record<ExitStatus, string> = {
  declared: 'Filed',
  cooling_off: 'Filed',
  unwinding: 'Handoff in progress',
  completed: 'Departure confirmed',
  cancelled: 'Withdrawn',
};

const EXIT_STATUS_VARIANTS: Record<ExitStatus, BadgeVariant> = {
  declared: 'secondary',
  cooling_off: 'secondary',
  unwinding: 'secondary',
  completed: 'default',
  cancelled: 'outline',
};

/** Plain label for an exit status; unknown values read as their raw name. */
export function exitStatusLabel(status: string): string {
  return EXIT_STATUS_LABELS[status as ExitStatus] ?? status;
}

/** Filter options: every status a new record can be in (the legacy cooling-off reads as Filed). */
export const EXIT_STATUS_OPTIONS: { value: ExitStatus; label: string }[] = (['declared', 'unwinding', 'completed', 'cancelled'] as const)
  .map((value) => ({ value, label: EXIT_STATUS_LABELS[value] }));

/** Badge variant for an exit status; unknown/future values fall back to 'secondary'. */
export function exitStatusVariant(status: string): BadgeVariant {
  return EXIT_STATUS_VARIANTS[status as ExitStatus] ?? 'secondary';
}

export interface ExitMoveCopy {
  label: string;
  title: string;
  description: string;
  destructive: boolean;
}

/** Button and confirmation copy for each move the server may allow. */
export const EXIT_MOVE_COPY: Record<string, ExitMoveCopy> = {
  unwinding: {
    label: 'Start the handoff',
    title: 'Start the handoff?',
    description: 'You become the coordinator: help hand over this member\'s roles and commitments before the handoff date. Nothing can hold them past it.',
    destructive: false,
  },
  completed: {
    label: 'Confirm departure',
    title: 'Confirm this departure?',
    description: 'The member leaves this ecosystem: their membership becomes exited and they are no longer asked to consent to agreements here. Commitments nobody took over stay with the ecosystem, not with them.',
    destructive: true,
  },
  cancelled: {
    label: 'Withdraw my exit',
    title: 'Withdraw your exit?',
    description: 'You stay a member with your current roles. You can file a new exit at any time.',
    destructive: false,
  },
};

const DAY_MS = 86_400_000;

/** The handoff deadline sentence for an open exit; null once it is confirmed or withdrawn. */
export function handoffNotice(
  exit: { status: string; target_completion_date: string | null },
  today: Date,
  formatDate: (iso: string) => string,
): string | null {
  if (!['declared', 'cooling_off', 'unwinding'].includes(exit.status) || !exit.target_completion_date) return null;
  const end = Date.parse(`${exit.target_completion_date}T00:00:00Z`);
  const start = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const daysLeft = Math.round((end - start) / DAY_MS);
  const date = formatDate(exit.target_completion_date);
  if (daysLeft < 0) return `The handoff date (${date}) has passed. A steward confirms the departure; nothing more can be asked of the member.`;
  if (daysLeft === 0) return `The handoff ends today (${date}).`;
  return `The handoff ends ${date}, in ${daysLeft} day${daysLeft === 1 ? '' : 's'} (30 days at most).`;
}
