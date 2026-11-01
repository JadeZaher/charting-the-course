// Proposal vocabulary — single source of truth for type, phase and lifecycle-action labels.

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

const PROPOSAL_PHASE_LABELS: Record<string, string> = {
  draft: 'Draft',
  advice: 'Advice',
  consent: 'Consent',
  test: 'Test',
  ratified: 'Ratified',
  withdrawn: 'Withdrawn',
};

/** Human label for a proposal status; unknown values pass through unchanged. */
export function proposalPhaseLabel(status: string): string {
  return PROPOSAL_PHASE_LABELS[status] ?? status;
}

/** Manual next statuses — mirrors proposals.py::_VALID_TRANSITIONS plus any->withdrawn. */
export const PROPOSAL_NEXT_STATUSES: Record<string, string[]> = {
  draft: ['advice', 'withdrawn'],
  advice: ['consent', 'withdrawn'],
  consent: ['test', 'withdrawn'],
  test: ['ratified', 'withdrawn'],
  ratified: [],
  withdrawn: [],
};

/** The ACT gate that must be met before a forward move into each status (draft->advice has none). */
export const PROPOSAL_GATE_FOR_STATUS: Record<string, 'advice' | 'consent' | 'test' | undefined> = {
  consent: 'advice',
  test: 'consent',
  ratified: 'test',
};

/** Button label for a manual move into the target status. The trailing ellipsis marks a confirmation step. */
export const PROPOSAL_TRANSITION_LABELS: Record<string, string> = {
  advice: 'Open for advice',
  consent: 'Move to consent',
  test: 'Start the test period',
  ratified: 'Ratify proposal',
  withdrawn: 'Withdraw proposal…',
};

const PROPOSAL_PHASE_ANNOUNCEMENTS: Record<string, string> = {
  advice: 'Members can now give advice.',
  consent: 'Members can now record whether they consent, stand aside or object.',
  test: 'The proposal is now being tried in practice.',
  ratified: 'The proposal is ratified and now active.',
  withdrawn: 'It stays in the record but is no longer active.',
};

/** Toast copy naming the phase a proposal is now in (after any automatic advance). */
export function proposalPhaseAnnouncement(status: string): { title: string; description: string } {
  return {
    title: status === 'withdrawn' ? 'Proposal withdrawn' : `Status changed to ${proposalPhaseLabel(status)}`,
    description: PROPOSAL_PHASE_ANNOUNCEMENTS[status] ?? '',
  };
}

/** What the ACT gate engine reports after advice, consent, a test report or a status change (api/proposals.py). */
export interface ActOutcome {
  /** Automatic moves in order, e.g. ['advice->consent', 'consent->test']. */
  auto_transitions?: readonly string[] | null;
  /** Set when the cascade reached ratified and minted a decision record. */
  decision_record_id?: string | null;
}

/** The ACT step whose gate was met when a proposal left each status. */
const COMPLETED_STEPS: Record<string, string> = {
  advice: 'the advice round',
  consent: 'the consent round',
  test: 'the test period',
};

/** Toast explaining an automatic ACT advance, or null when the proposal stayed in its phase. */
export function announceActOutcome(outcome: ActOutcome): { title: string; description: string } | null {
  const moves = (outcome.auto_transitions ?? [])
    .map((transition) => transition.split('->'))
    .filter((parts): parts is [string, string] => parts.length === 2 && parts.every(Boolean));
  if (moves.length === 0) return null;

  const finalStatus = moves[moves.length - 1][1];
  const steps = moves.map(([from]) => COMPLETED_STEPS[from]).filter(Boolean);
  const sentences = [
    steps.length ? `${capitalize(joinWords(steps))} ${steps.length > 1 ? 'are' : 'is'} complete.` : '',
    PROPOSAL_PHASE_ANNOUNCEMENTS[finalStatus] ?? '',
    finalStatus === 'ratified' && outcome.decision_record_id ? 'A decision record was created.' : '',
  ];
  return {
    title: finalStatus === 'ratified' ? 'Proposal ratified' : `Proposal moved to ${proposalPhaseLabel(finalStatus)}`,
    description: sentences.filter(Boolean).join(' '),
  };
}

function joinWords(words: string[]): string {
  return words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}` : words[0];
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
