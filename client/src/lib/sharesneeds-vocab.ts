// SharesNeeds.category vocabulary — single source of truth for SharesNeedsForm + SharesNeedsList.

export const SHARESNEEDS_CATEGORIES = [
  'technology',
  'resources',
  'skills',
  'knowledge',
  'infrastructure',
  'funding',
  'space',
  'labor',
  'other',
] as const;

export type SharesNeedsCategory = (typeof SHARESNEEDS_CATEGORIES)[number];

const SHARESNEEDS_CATEGORY_LABELS: Record<SharesNeedsCategory, string> = {
  technology: 'Technology',
  resources: 'Resources',
  skills: 'Skills',
  knowledge: 'Knowledge',
  infrastructure: 'Infrastructure',
  funding: 'Funding',
  space: 'Space',
  labor: 'Labor',
  other: 'Other',
};

/** Select/filter options for the SharesNeeds category field, typed to SharesNeedsCategory. */
export const SHARESNEEDS_CATEGORY_OPTIONS: { value: SharesNeedsCategory; label: string }[] =
  SHARESNEEDS_CATEGORIES.map((value) => ({ value, label: SHARESNEEDS_CATEGORY_LABELS[value] }));
