// Exit.status vocabulary — single source of truth, shared by ExitList + ExitDetail.
// Backend creates exit records with status='declared'; see ExitDetail's TRANSITIONS map.

export const EXIT_STATUSES = [
  'declared',
  'cooling_off',
  'unwinding',
  'completed',
  'cancelled',
] as const;

export type ExitStatus = (typeof EXIT_STATUSES)[number];

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const EXIT_STATUS_LABELS: Record<ExitStatus, string> = {
  declared: 'Declared',
  cooling_off: 'Cooling Off',
  unwinding: 'Unwinding',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

/** Filter/select options for the Exit status field, typed to ExitStatus. */
export const EXIT_STATUS_OPTIONS: { value: ExitStatus; label: string }[] =
  EXIT_STATUSES.map((value) => ({ value, label: EXIT_STATUS_LABELS[value] }));

const EXIT_STATUS_VARIANTS: Record<ExitStatus, BadgeVariant> = {
  declared: 'destructive',
  cooling_off: 'secondary',
  unwinding: 'secondary',
  completed: 'default',
  cancelled: 'outline',
};

/** Badge variant for an exit status; unknown/future values fall back to 'secondary'. */
export function exitStatusVariant(status: string): BadgeVariant {
  return EXIT_STATUS_VARIANTS[status as ExitStatus] ?? 'secondary';
}
