// Urgency vocabulary — single source of truth, shared across Conflict.urgency and Proposal.urgency.

export const URGENCY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

/** Select/filter options for an urgency field, typed to UrgencyLevel. */
export const URGENCY_OPTIONS: { value: UrgencyLevel; label: string }[] =
  URGENCY_LEVELS.map((value) => ({ value, label: URGENCY_LABELS[value] }));

const URGENCY_VARIANTS: Record<UrgencyLevel, BadgeVariant> = {
  low: 'outline',
  medium: 'secondary',
  high: 'destructive',
  critical: 'destructive',
};

/** Badge variant for an urgency level; unknown/future values fall back to 'secondary'. */
export function urgencyVariant(urgency: string | null | undefined): BadgeVariant {
  return URGENCY_VARIANTS[urgency as UrgencyLevel] ?? 'secondary';
}
