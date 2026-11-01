// Proposal vocabulary — single source of truth for type, phase, lifecycle-action and gate copy.
// Which moves exist is the server's (`allowed_next`); see pages/governance/AGENTS.md "Lifecycle actions".

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

/** The decision modes the engine applies (api/proposals.py DECISION_TYPES). */
export const DECISION_TYPE_OPTIONS = [
  { value: 'consent', label: 'Consent', hint: 'Passes when enough members take a position and nobody objects.' },
  { value: 'consensus', label: 'Consensus', hint: 'Like consent, but nobody may stand aside: every position must be consent.' },
] as const;

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

const POSITION_LABELS: Record<string, string> = {
  consent: 'Consent',
  stand_aside: 'Stand aside',
  object: 'Object',
  withdrawn: 'Withdrawn',
};

/** Human label for a consent position ('objection' is the assistant's spelling of 'object'). */
export function positionLabel(position: string | null | undefined): string {
  const key = (position ?? '').trim().toLowerCase();
  return POSITION_LABELS[key === 'objection' ? 'object' : key] ?? (position || '-');
}

/** A manual move the server offers the caller (ProposalDetail.allowed_next). */
export interface ProposalMove {
  to: string;
  ready: boolean;
  gate?: string | null;
  note_required?: boolean;
  steward_only?: boolean;
  /** Offered to show who decides, never as a button: the author cannot confirm their own ratification. */
  blocked?: 'needs_another_steward' | null;
}

/** Button label for a manual move. The trailing ellipsis marks a confirmation step. */
export const PROPOSAL_TRANSITION_LABELS: Record<string, string> = {
  advice: 'Open for advice',
  consent: 'Close advice and move to consent',
  test: 'Start the test period',
  ratified: 'Confirm ratification…',
  withdrawn: 'Withdraw proposal…',
  revise: 'Send back for revision…',
};

/** How each offered move is drawn: a direct button, one behind a dialog, or the withdraw dialog. */
export function groupProposalMoves(moves: readonly ProposalMove[] | null | undefined): {
  forward: ProposalMove[];
  ratify: ProposalMove | null;
  /** The gate is met but the caller wrote the proposal: say "Another steward needs to confirm this". */
  ratifyNeedsAnotherSteward: boolean;
  revise: ProposalMove | null;
  withdraw: ProposalMove | null;
} {
  const ready = (moves ?? []).filter((move) => move.ready);
  return {
    // Forward moves whose gate is met and that need no dialog (open advice, close advice, start test).
    forward: ready.filter((move) => !move.note_required && !move.steward_only && move.to !== 'withdrawn'),
    ratify: ready.find((move) => move.to === 'ratified' && !move.blocked) ?? null,
    ratifyNeedsAnotherSteward: ready.some((move) => move.to === 'ratified' && move.blocked === 'needs_another_steward'),
    revise: ready.find((move) => move.note_required) ?? null,
    withdraw: ready.find((move) => move.to === 'withdrawn') ?? null,
  };
}

const PROPOSAL_PHASE_ANNOUNCEMENTS: Record<string, string> = {
  advice: 'Members can now give advice.',
  consent: 'Members can now record whether they consent, stand aside or object.',
  test: 'The proposal is now being tried in practice.',
  ratified: 'A steward confirmed the outcome. It enters the agreement registry once a steward registers it.',
  withdrawn: 'It stays in the record but is no longer active.',
};

/** Toast copy naming the phase a proposal is now in (after any automatic advance). */
export function proposalPhaseAnnouncement(status: string, previousStatus?: string): { title: string; description: string } {
  if (status === 'advice' && (previousStatus === 'consent' || previousStatus === 'test')) {
    return {
      title: 'Sent back for revision',
      description: 'A new version is open for advice. Earlier positions stay in the record.',
    };
  }
  return {
    title: status === 'withdrawn' ? 'Proposal withdrawn' : `Status changed to ${proposalPhaseLabel(status)}`,
    description: PROPOSAL_PHASE_ANNOUNCEMENTS[status] ?? '',
  };
}

/** What the ACT gate engine reports after advice, consent, a test report or a status change (api/proposals.py). */
export interface ActOutcome {
  /** Automatic moves in order, e.g. ['consent->test']. */
  auto_transitions?: readonly string[] | null;
  /** Set when a move reached ratified and minted a decision record. */
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

/** The consent gate as the engine reports it (gates.consent). */
export interface ConsentGateView {
  required: boolean;
  quorum?: number | null;
  quorum_source?: string | null;
  mode?: string | null;
  positions?: number;
  consented?: number;
  outstanding?: number;
}

/** Plain words for how many members a consent round needs and where that number comes from. */
export function quorumExplanation(gate: ConsentGateView, governingTitle?: string | null): string {
  if (!gate.required) return 'No consent round is required.';
  const consensus = gate.mode === 'consensus' ? ' Consensus: every position must be consent.' : '';
  if (gate.quorum_source === 'all_members') {
    return "Needs every participating member's consent (no quorum declared).";
  }
  const count = gate.quorum ?? 1;
  const needs = gate.consented !== undefined
    ? `Needs ${count} member${count === 1 ? '' : 's'} to consent`
    : `Needs ${count} position${count === 1 ? '' : 's'}`;
  const source = gate.quorum_source === 'agreement'
    ? governingTitle ? `, set by the governing agreement “${governingTitle}”` : ', declared on this agreement'
    : gate.quorum_source === 'proposal'
      ? ', declared on this proposal'
      : ' (the default: no quorum declared)';
  return `${needs}${source}, and no open objection.${consensus}`;
}

/** The proposer's advice prompt: shown to whoever may close advice once its gate is met. */
export function adviceClosePrompt(input: {
  status: string;
  adviceGate: { met: boolean; deadline?: string | null; deadline_passed?: boolean } | null | undefined;
  canClose: boolean;
}): { tone: 'due' | 'ready'; title: string; body: string } | null {
  if (input.status !== 'advice' || !input.canClose || !input.adviceGate?.met) return null;
  if (input.adviceGate.deadline_passed) {
    return {
      tone: 'due',
      title: 'Advice deadline passed: move to consent?',
      body: 'Nothing moves by itself. Close advice when you have taken in what you need, or keep it open a little longer.',
    };
  }
  return {
    tone: 'ready',
    title: 'Enough advice to move on',
    body: 'The advice gate is met. You decide when advice closes; members then record their positions.',
  };
}

/** The ratified banner: never claims the proposal is in force until it is registered. */
export function ratifiedBanner(registered: { title: string; agreement_id: string } | null | undefined, amending?: string | null): {
  title: string;
  body: string;
} {
  if (registered) {
    return {
      title: 'Ratified and registered',
      body: `It is in the agreement registry as “${registered.title}” (${registered.agreement_id}).`,
    };
  }
  return {
    title: 'Ratified, not yet registered',
    body: amending
      ? `A steward confirmed the outcome. It changes “${amending}” once a steward registers it; until then the agreement keeps its current text.`
      : 'A steward confirmed the outcome. It is not in the agreement registry until a steward registers it.',
  };
}

/** Why the proposal's text cannot be edited now, or null in draft/advice (api/proposals.py EDITABLE_STAGES). */
export function proposalEditLock(status: string): string | null {
  if (status === 'draft' || status === 'advice') return null;
  if (status === 'consent' || status === 'test') {
    return `This proposal is in ${proposalPhaseLabel(status)}: members are deciding on this text, so it cannot be edited. To change it, send it back for revision from the proposal page.`;
  }
  return `This proposal is ${proposalPhaseLabel(status).toLowerCase()}: its text is the record of what was decided and cannot be edited.`;
}

function joinWords(words: string[]): string {
  return words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words[words.length - 1]}` : words[0];
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
