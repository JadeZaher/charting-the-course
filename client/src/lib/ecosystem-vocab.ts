// Ecosystem.status + Ecosystem.visibility vocabularies — single source of truth for EcosystemForm + EcosystemList.

export const ECOSYSTEM_STATUSES = ['active', 'forming', 'inactive'] as const;
export type EcosystemStatus = (typeof ECOSYSTEM_STATUSES)[number];

const ECOSYSTEM_STATUS_LABELS: Record<EcosystemStatus, string> = {
  active: 'Active',
  forming: 'Forming',
  inactive: 'Inactive',
};

/** Select/filter options for the Ecosystem status field, typed to EcosystemStatus. */
export const ECOSYSTEM_STATUS_OPTIONS: { value: EcosystemStatus; label: string }[] =
  ECOSYSTEM_STATUSES.map((value) => ({ value, label: ECOSYSTEM_STATUS_LABELS[value] }));

export const ECOSYSTEM_VISIBILITIES = ['public', 'private', 'unlisted'] as const;
export type EcosystemVisibility = (typeof ECOSYSTEM_VISIBILITIES)[number];

const ECOSYSTEM_VISIBILITY_LABELS: Record<EcosystemVisibility, string> = {
  public: 'Public',
  private: 'Private',
  unlisted: 'Unlisted',
};

/** Select options for the Ecosystem visibility field, typed to EcosystemVisibility. */
export const ECOSYSTEM_VISIBILITY_OPTIONS: { value: EcosystemVisibility; label: string }[] =
  ECOSYSTEM_VISIBILITIES.map((value) => ({ value, label: ECOSYSTEM_VISIBILITY_LABELS[value] }));
