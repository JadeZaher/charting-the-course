// Agreement lifecycle — single source of truth for status options + badge styling.
// Mirrors agreements.py::_VALID_TRANSITIONS: draft -> advice -> consent -> test/active
// -> active -> under_review -> sunset/active -> archived. Keep in sync with that map.

export const AGREEMENT_STATUSES = [
  'draft',
  'advice',
  'consent',
  'test',
  'active',
  'under_review',
  'sunset',
  'archived',
] as const;

export type AgreementStatus = (typeof AGREEMENT_STATUSES)[number];

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'info' | 'outline';

const AGREEMENT_STATUS_LABELS: Record<AgreementStatus, string> = {
  draft: 'Draft',
  advice: 'Advice',
  consent: 'Consent',
  test: 'Test',
  active: 'Active',
  under_review: 'Under Review',
  sunset: 'Sunset',
  archived: 'Archived',
};

/** Filter/select options for the Agreement status field, typed to AgreementStatus. */
export const AGREEMENT_STATUS_OPTIONS: { value: AgreementStatus; label: string }[] =
  AGREEMENT_STATUSES.map((value) => ({ value, label: AGREEMENT_STATUS_LABELS[value] }));

const AGREEMENT_STATUS_VARIANTS: Record<AgreementStatus, BadgeVariant> = {
  draft: 'secondary',
  advice: 'secondary',
  consent: 'secondary',
  test: 'secondary',
  active: 'default',
  under_review: 'secondary',
  sunset: 'outline',
  archived: 'outline',
};

/** Badge variant for an agreement status; unknown/future values fall back to 'secondary'. */
export function agreementStatusVariant(status: string): BadgeVariant {
  return AGREEMENT_STATUS_VARIANTS[status as AgreementStatus] ?? 'secondary';
}
