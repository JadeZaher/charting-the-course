import { Check, CircleDashed, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ActGates } from '@/types/api';

function GateRow({ met, label, detail }: { met: boolean; label: string; detail: string }) {
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
      </div>
    </div>
  );
}

/**
 * Live ACT gate checklist: the conditions declared at the record level and
 * whether each is currently satisfied. Status advances automatically when
 * the declared conditions are met.
 */
export function ActGatesPanel({ gates, status }: { gates: ActGates; status: string }) {
  const policy = gates.policy;

  const adviceDetail = policy.min_advice_rounds === 0
    ? 'No advice rounds required'
    : `${gates.advice.rounds} of ${gates.advice.required_rounds} declared advice round${gates.advice.required_rounds === 1 ? '' : 's'} complete`;

  const consentDetail = !gates.consent.required
    ? 'Consent not required'
    : gates.consent.positions !== undefined
      ? `${gates.consent.positions} position${gates.consent.positions === 1 ? '' : 's'} recorded` +
        (gates.consent.quorum ? ` (quorum ${gates.consent.quorum})` : '') +
        (gates.consent.open_objections ? `, ${gates.consent.open_objections} open objection${gates.consent.open_objections === 1 ? '' : 's'}` : '')
      : `${gates.consent.consented ?? 0} consented, ${gates.consent.outstanding ?? 0} outstanding`;

  const cases = gates.test.declared_cases ?? [];
  const casesMet = gates.test.cases_met ?? [];
  const testDetail = gates.test.evidence !== undefined
    ? `${gates.test.evidence} of ${gates.test.required_evidence ?? 1} required evidence record${(gates.test.required_evidence ?? 1) === 1 ? '' : 's'}`
    : cases.length > 0
      ? `${casesMet.length} of ${cases.length} declared test cases evidenced`
      : `${gates.test.reports ?? 0} test report${(gates.test.reports ?? 0) === 1 ? '' : 's'} (no declared cases)`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ListChecks className="h-5 w-5" />
          ACT Gates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <GateRow met={gates.advice.met} label="Advice" detail={adviceDetail} />
        <GateRow met={gates.consent.met} label="Consent" detail={consentDetail} />
        <GateRow met={gates.test.met} label="Test" detail={testDetail} />

        {cases.length > 0 && (
          <ul className="space-y-1 border-t border-border pt-3">
            {cases.map((c) => {
              const met = casesMet.includes(c);
              return (
                <li key={c} className="flex items-start gap-2 text-xs">
                  {met ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                  ) : (
                    <CircleDashed className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                  )}
                  <span className={met ? 'text-muted-foreground line-through' : ''}>{c}</span>
                </li>
              );
            })}
          </ul>
        )}

        <p className="border-t border-border pt-3 text-xs text-muted-foreground">
          Declared at the record level. Status moves automatically when the conditions are met
          {status === 'ratified' || status === 'active' ? ' — the process is complete and its decision artifact is recorded.' : '.'}
        </p>
      </CardContent>
    </Card>
  );
}
