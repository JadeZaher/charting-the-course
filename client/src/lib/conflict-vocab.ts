// Conflict.scope vocabulary — single source of truth, shared by ConflictForm + ConflictTriageModal.
// Canonical separators use hyphens (cross-domain, cross-circle, cross-ecosystem).

export const CONFLICT_SCOPES = [
  'individual',
  'interpersonal',
  'role',
  'domain',
  'cross-domain',
  'circle',
  'cross-circle',
  'ecosystem',
  'cross-ecosystem',
  'structural',
] as const;

export type ConflictScope = (typeof CONFLICT_SCOPES)[number];

const CONFLICT_SCOPE_LABELS: Record<ConflictScope, string> = {
  individual: 'Individual',
  interpersonal: 'Interpersonal',
  role: 'Role',
  domain: 'Domain',
  'cross-domain': 'Cross-Domain',
  circle: 'Circle',
  'cross-circle': 'Cross-Circle',
  ecosystem: 'Ecosystem-wide',
  'cross-ecosystem': 'Cross-Ecosystem',
  structural: 'Structural',
};

/** Select/filter options for the Conflict scope field, typed to ConflictScope. */
export const CONFLICT_SCOPE_OPTIONS: { value: ConflictScope; label: string }[] =
  CONFLICT_SCOPES.map((value) => ({ value, label: CONFLICT_SCOPE_LABELS[value] }));
