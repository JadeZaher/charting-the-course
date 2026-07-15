// Proposal.type vocabulary — single source of truth, shared by ProposalForm + ProposalList.

export const PROPOSAL_TYPES = ['policy', 'operational', 'structural', 'resource'] as const;

export type ProposalType = (typeof PROPOSAL_TYPES)[number];

const PROPOSAL_TYPE_LABELS: Record<ProposalType, string> = {
  policy: 'Policy',
  operational: 'Operational',
  structural: 'Structural',
  resource: 'Resource',
};

/** Select/filter options for the Proposal type field, typed to ProposalType. */
export const PROPOSAL_TYPE_OPTIONS: { value: ProposalType; label: string }[] =
  PROPOSAL_TYPES.map((value) => ({ value, label: PROPOSAL_TYPE_LABELS[value] }));
