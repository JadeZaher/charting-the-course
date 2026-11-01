// Which control each server move on an agreement renders as; see client/src/AGENTS.md "FX-Maint".
import type { StatusMove } from '@/types/api';

/** The status moves an agreement in force takes through AgreementReviewDialog (start, keep, sunset, archive). */
export const REVIEW_MOVES: readonly string[] = ['under_review', 'active', 'sunset', 'archived'];

export type AgreementMoveControl = 'review' | 'consent';

/** A move's own control: the review dialog, the consent form (POST /consent, never /status), or nothing for a move the page does not know. */
export function agreementMoveControl(move: Pick<StatusMove, 'move' | 'kind'>): AgreementMoveControl | null {
  if (move.kind === 'consent' || move.move === 'attest') return 'consent';
  return REVIEW_MOVES.includes(move.move) ? 'review' : null;
}

/** True for an agreement members must consent to before they take part in its ecosystem (scope "ecosystem"). */
export function isMembershipAgreement(agreement: { prerequisite_scopes?: readonly string[] | null }): boolean {
  return (agreement.prerequisite_scopes ?? []).includes('ecosystem');
}
