import { Link, useRoute } from 'wouter';
import { ArrowLeft, CheckCircle2, ChevronDown, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { QueryState } from '@/components/QueryState';
import { useMember, useOnboardingCeremony } from '@/hooks/use-governance';
import { formatDate } from '@/lib/utils';
import type { OnboardingSectionConsent, OnboardingState } from '@/types/api';

const CEREMONY_STEPS = [
  {
    key: 'governance',
    title: 'Governance',
    description: 'How authority is distributed through domains, roles, and consent-based decision processes.',
    fullText: "By consenting to this section, you agree to participate in the ecosystem's governance structure. You understand that authority is distributed through domains with defined purposes and stewardship. You agree to respect domain boundaries and use the established governance process for proposing changes.",
  },
  {
    key: 'economics',
    title: 'Economics & Resources',
    description: 'How shared resources, contributions, access, and economic agreements are stewarded.',
    fullText: "By consenting to this section, you agree to the ecosystem's approach to transparent resource stewardship. You commit to honoring contribution and access agreements, disclosing relevant resource use, and participating in decisions that materially affect shared resources.",
  },
  {
    key: 'membership',
    title: 'Membership',
    description: 'The rights, responsibilities, participation expectations, and status transitions of membership.',
    fullText: 'By consenting to this section, you acknowledge the rights and responsibilities of membership. You commit to participating in good faith, honoring the agreements that apply to your roles, and using the defined processes when your participation or status changes.',
  },
  {
    key: 'conflict_resolution',
    title: 'Conflict Resolution',
    description: 'The restorative approach to conflict, including escalation paths, repair agreements, and safety.',
    fullText: "By consenting to this section, you agree to the ecosystem's restorative approach to conflict. You commit to engaging in good faith with facilitated resolution processes when involved, while understanding that safety concerns receive priority handling.",
  },
  {
    key: 'data_sovereignty',
    title: 'Data Sovereignty',
    description: 'How personal and shared data is controlled, protected, accessed, and carried between systems.',
    fullText: 'By consenting to this section, you acknowledge the data practices that support participation. You retain the rights defined by the ecosystem over your personal data and agree to protect shared or sensitive information according to its access agreements.',
  },
  {
    key: 'exit_rights',
    title: 'Exit Rights',
    description: 'Understanding the voluntary exit process, cooling-off periods, and how membership transitions are handled with dignity and care.',
    fullText: 'By consenting to this section, you understand and accept the exit process. You acknowledge that you may leave voluntarily at any time with a 30-day wind-down period. You agree to participate in commitment unwinding and role transfer during your exit. You understand that a portable record of your contributions and participation will be generated. You acknowledge the cooling-off period and the possibility of re-entry through proper processes.',
  },
];

type SectionPosition = 'consent' | 'stand_aside' | 'object' | 'pending';

/** Consent only: a recorded `consented` with no position or the `consent` position; a stand-aside or objection never counts (M3). */
function getSectionPosition(value: OnboardingSectionConsent | undefined): SectionPosition {
  if (typeof value === 'boolean') return value ? 'consent' : 'pending';
  if (!value) return 'pending';
  if (value.position === 'stand_aside') return 'stand_aside';
  if (value.position === 'object') return 'object';
  if (value.consented && (value.position == null || value.position === 'consent')) return 'consent';
  return 'pending';
}

function getObjectionText(value: OnboardingSectionConsent | undefined): string | null {
  return typeof value === 'object' && value ? value.objection_text : null;
}

const POSITION_BADGE: Record<SectionPosition, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  consent: { label: 'Consented', variant: 'default' },
  stand_aside: { label: 'Stood aside', variant: 'secondary' },
  object: { label: 'Objected', variant: 'destructive' },
  pending: { label: 'Not answered', variant: 'outline' },
};

/** Read-only history of the six-section UAF ceremony (owner decision 2026-11-01: the membership-agreement gate is the entry consent). */
export default function OnboardingCeremony() {
  const [, params] = useRoute('/onboarding/:memberId/ceremony');
  const memberId = params?.memberId ?? '';
  const ceremony = useOnboardingCeremony(memberId);
  // The ceremony record carries no name; the member record (same scope) does (L1).
  const memberName = useMember(memberId).data?.display_name ?? 'this member';

  return (
    <div className="space-y-6 max-w-3xl">
      <Button asChild variant="ghost" size="sm">
        <Link href="/onboarding">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Newcomers
        </Link>
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">UAF ceremony record: {memberName}</h1>
        <p role="note" className="border-2 border-strong-border bg-muted p-3 text-sm text-muted-foreground">
          This is the record of an earlier six-section onboarding ceremony. Membership now begins by consenting to the
          ecosystem's membership agreements, so nothing on this page needs action.
        </p>
      </div>

      <QueryState query={ceremony} errorTitle="We couldn't load this ceremony record">
        {(record) => <CeremonyRecord record={record} />}
      </QueryState>
    </div>
  );
}

function CeremonyRecord({ record }: { record: OnboardingState }) {
  const positions = CEREMONY_STEPS.map((step) => getSectionPosition(record.section_consents[step.key]));
  const consented = positions.filter((position) => position === 'consent').length;
  // One count drives both the bar and the sentence, so they never disagree.
  const completionPct = Math.round((consented / CEREMONY_STEPS.length) * 100);

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sections consented</span>
              <span className="font-medium">{consented} of {CEREMONY_STEPS.length}</span>
            </div>
            <div className="h-3 overflow-hidden border border-strong-border bg-muted" role="presentation">
              <div className="h-full bg-primary" style={{ width: `${completionPct}%` }} />
            </div>
            {record.consent_date && (
              <p className="text-xs text-muted-foreground">Completed {formatDate(record.consent_date)}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {CEREMONY_STEPS.map((step, index) => {
        const position = positions[index];
        const objection = getObjectionText(record.section_consents[step.key]);
        return (
          <Card key={step.key}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {position === 'consent' ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  )}
                  <CardTitle className="text-lg">
                    Section {index + 1}: {step.title}
                  </CardTitle>
                </div>
                <Badge variant={POSITION_BADGE[position].variant}>{POSITION_BADGE[position].label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              {position === 'object' && objection && (
                <p className="border-l-4 border-strong-border pl-3 text-sm">Objection recorded: {objection}</p>
              )}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1 px-0">
                    <ChevronDown className="h-3 w-3" aria-hidden="true" />
                    Read the section text
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-3 rounded-none border-2 border-strong-border bg-muted/50 p-4 text-sm leading-relaxed">
                    {step.fullText}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        );
      })}
    </>
  );
}
