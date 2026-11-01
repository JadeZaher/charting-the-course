import { Check, CircleDashed, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import { quorumExplanation } from '@/lib/proposal-vocab';
import type { ActAdviceGateDetail, ActConsentGateDetail, ActGates } from '@/types/api';

function GateRow({ met, label, detail, note }: { met: boolean; label: string; detail: string; note?: string }) {
  return (
    <div className="flex items-start gap-3">
      {met ? (
        <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-label="Gate satisfied" />
      ) : (
        <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-label="Gate pending" />
      )}
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
        {note && <p className="text-xs text-muted-foreground">{note}</p>}
      </div>
    </div>
  );
}

/** Who moves the record on, per kind (the server's lifecycle table; services/AGENTS.md "ACT lifecycle"). */
const WHO_MOVES = {
  proposal: 'The proposer closes advice; consent moves to Test by itself once its gate is met; a steward confirms ratification.',
  agreement: 'Stewards conduct each ceremony; a stage moves on by itself once its gate is met.',
} as const;

/**
 * Live ACT gate checklist: the conditions declared at the record level (or inherited)
 * and whether each is currently satisfied, with the quorum explained in plain words.
 */
export function ActGatesPanel({ gates, status, kind = 'proposal', governingTitle }: {
  gates: ActGates;
  status: string;
  kind?: 'proposal' | 'agreement';
  /** Title of the governing agreement the gates are inherited from, if any. */
  governingTitle?: string | null;
}) {
  const policy = gates.policy;
  const advice: ActGates['advice'] & ActAdviceGateDetail = gates.advice;
  const consent: ActGates['consent'] & ActConsentGateDetail = gates.consent;

  const adviceDetail = policy.min_advice_rounds === 0
    ? 'No advice rounds required'
    : `${advice.rounds} of ${advice.required_rounds} declared advice round${advice.required_rounds === 1 ? '' : 's'} complete`;
  const adviceNote = advice.deadline
    ? `Advice deadline ${formatDate(advice.deadline)}${advice.deadline_passed ? ' (passed: the proposer decides when to close)' : ''}`
    : undefined;

  const consentDetail = !consent.required
    ? 'Consent not required'
    : consent.positions !== undefined
      ? `${consent.positions} position${consent.positions === 1 ? '' : 's'} recorded` +
        (consent.open_objections ? `, ${consent.open_objections} open objection${consent.open_objections === 1 ? '' : 's'}` : '')
      : `${consent.consented ?? 0} consented, ${consent.outstanding ?? 0} outstanding`;
  const consentNote = consent.required
    ? quorumExplanation(consent, gates.policy_source === 'agreement' ? governingTitle : null)
    : undefined;

  const cases = gates.test.declared_cases ?? [];
  const casesMet = gates.test.cases_met ?? [];
  const testDetail = gates.test.evidence !== undefined
    ? `${gates.test.evidence} of ${gates.test.required_evidence ?? 1} required evidence record${(gates.test.required_evidence ?? 1) === 1 ? '' : 's'}`
    : cases.length > 0
      ? `${casesMet.length} of ${cases.length} declared test cases evidenced`
      : `${gates.test.reports ?? 0} test report${(gates.test.reports ?? 0) === 1 ? '' : 's'} (one passed report is enough)`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListChecks className="h-5 w-5" aria-hidden="true" />
          ACT Gates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GateRow met={advice.met} label="Advice" detail={adviceDetail} note={adviceNote} />
        <GateRow met={consent.met} label="Consent" detail={consentDetail} note={consentNote} />
        <GateRow met={gates.test.met} label="Test" detail={testDetail} />

        {cases.length > 0 && (
          <ul className="space-y-1 border-t border-border pt-3">
            {cases.map((c) => {
              const met = casesMet.includes(c);
              return (
                <li key={c} className="flex items-start gap-2 text-xs">
                  {met ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-label="Evidenced" />
                  ) : (
                    <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-label="Not yet evidenced" />
                  )}
                  <span className={met ? 'text-muted-foreground line-through' : ''}>{c}</span>
                </li>
              );
            })}
          </ul>
        )}

        <p className="border-t border-border pt-3 text-xs text-muted-foreground">
          {gates.policy_source === 'agreement'
            ? `Gates inherited from the governing agreement${governingTitle ? ` “${governingTitle}”` : ''}. `
            : gates.policy_source === 'default'
              ? 'Default gates (none declared). '
              : 'Gates declared at this record. '}
          {status === 'ratified' || status === 'active'
            ? 'The process is complete and its decision record is kept.'
            : WHO_MOVES[kind]}
        </p>
      </CardContent>
    </Card>
  );
}
