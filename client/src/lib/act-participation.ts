// Mutation options for ACT participation (advice, consent, withdrawing a position, test report); hooks/use-governance.ts wraps them.
// See pages/governance/AGENTS.md "Data and feedback".
import type { ApiMutationOptions } from './api-mutation-options';
import { announceActOutcome, type ActOutcome } from './proposal-vocab';
import { affects } from './query-keys';

/** Confirmation for an entry that left the proposal in its phase. */
const CONFIRMATIONS = {
  advice: { title: 'Advice submitted', description: 'Your advice has been recorded.' },
  consent: { title: 'Position recorded', description: 'Your response to the consent round has been recorded.' },
  test: { title: 'Test report submitted', description: 'Your test report has been recorded.' },
  withdraw: { title: 'Position withdrawn', description: 'It stays in the record as withdrawn. You can record a new one.' },
} as const;

export type ActStep = keyof typeof CONFIRMATIONS;

/** Options that refresh every proposal surface (an advance changes list badges and the queue) and announce any advance. */
export function actParticipationMutation<TResult extends ActOutcome>(
  submit: (data: Record<string, any>) => Promise<TResult>,
  step: ActStep,
): ApiMutationOptions<TResult, Record<string, any>, unknown> {
  return {
    mutationFn: submit,
    invalidates: affects.proposals,
    success: (result) => announceActOutcome(result) ?? CONFIRMATIONS[step],
    // ProposalDetail renders each failure under its form.
    silent: true,
  };
}
