import { useState } from 'react';
import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useOnboardingCeremony, useSubmitCeremonyConsent } from '@/hooks/use-governance';
import { ArrowLeft, CheckCircle2, ChevronDown, Circle } from 'lucide-react';

const CEREMONY_STEPS = [
  {
    key: 'purpose_values',
    title: 'Purpose & Values',
    description: 'Understanding the purpose, vision, and core values of the ecosystem. This section covers the foundational agreements that guide all ecosystem activity.',
    fullText: "By consenting to this section, you acknowledge and agree to uphold the ecosystem's stated purpose and values. You understand that all governance activity within this ecosystem is guided by these foundational principles. You commit to acting in alignment with the shared values and to raising concerns through proper governance channels when you believe actions conflict with these principles.",
  },
  {
    key: 'governance',
    title: 'Governance',
    description: 'How the ecosystem governs itself through sociocratic and consent-based processes. Covers domains, roles, and decision-making structures.',
    fullText: "By consenting to this section, you agree to participate in the ecosystem's governance structure. You understand that authority is distributed through domains, each with defined purpose, scope, and stewardship. You agree to respect domain boundaries and to use the established governance processes for proposing changes. You recognize that all structural changes require consent through the ACT (Advice-Consent-Test) process.",
  },
  {
    key: 'decision_making',
    title: 'Decision-Making',
    description: 'The consent-based decision-making process, including proposals, advice rounds, and how objections are integrated for stronger outcomes.',
    fullText: 'By consenting to this section, you agree to the consent-based decision-making process. You understand that proposals go through Advice, Consent, and Test phases. You commit to providing thoughtful advice when consulted, to raising objections only when you believe a proposal would cause harm the ecosystem cannot afford, and to participating in good faith in integration rounds when objections arise. You understand that "stand aside" is a valid position when you have no objection but choose not to participate.',
  },
  {
    key: 'resources',
    title: 'Resources',
    description: 'How resources are stewarded within the ecosystem, including commons, access agreements, and contribution expectations.',
    fullText: "By consenting to this section, you agree to the ecosystem's approach to resource stewardship. You understand that resources are held in common and managed through transparent allocation processes. You commit to contributing according to your agreements and to participating in resource decisions that affect you. You agree to transparency in resource usage and to the ecosystem's right to audit resource allocation.",
  },
  {
    key: 'conflict',
    title: 'Conflict',
    description: 'The restorative approach to conflict resolution, including escalation paths, repair agreements, and how safety is maintained.',
    fullText: "By consenting to this section, you agree to the ecosystem's restorative approach to conflict. You understand that conflicts are addressed through structured processes including harm circles, mediation, and repair agreements. You commit to engaging in good faith with conflict resolution processes when involved. You understand that safety concerns receive priority handling and that facilitators are neutral parties.",
  },
  {
    key: 'exit',
    title: 'Exit',
    description: 'Understanding the voluntary exit process, cooling-off periods, and how membership transitions are handled with dignity and care.',
    fullText: 'By consenting to this section, you understand and accept the exit process. You acknowledge that you may leave voluntarily at any time with a 30-day wind-down period. You agree to participate in commitment unwinding and role transfer during your exit. You understand that a portable record of your contributions and participation will be generated. You acknowledge the cooling-off period and the possibility of re-entry through proper processes.',
  },
];

export default function OnboardingCeremony() {
  const [, params] = useRoute('/onboarding/:memberId/ceremony');
  const memberId = params?.memberId ?? '';
  const { data, isLoading, error } = useOnboardingCeremony(memberId);
  const consentMutation = useSubmitCeremonyConsent(memberId);
  const [submittingSection, setSubmittingSection] = useState<string | null>(null);
  const [objectingSection, setObjectingSection] = useState<string | null>(null);
  const [objectionText, setObjectionText] = useState('');

  if (isLoading) return <LoadingState message="Loading ceremony..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load onboarding ceremony</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Link href="/onboarding">
          <Button variant="outline" className="mt-4">Back to Onboarding</Button>
        </Link>
      </div>
    );
  }

  const sections = data.sections ?? [];
  const completedSections = sections.filter((s: any) => s.consented || s.completed);
  const completionPct = sections.length > 0
    ? Math.round((completedSections.length / sections.length) * 100)
    : 0;

  const isSectionComplete = (key: string) => {
    const section = sections.find((s: any) => s.key === key || s.name === key);
    return section?.consented || section?.completed || false;
  };

  const handleConsent = async (sectionKey: string) => {
    setSubmittingSection(sectionKey);
    try {
      await consentMutation.mutateAsync({ section: sectionKey, consented: true });
    } finally {
      setSubmittingSection(null);
    }
  };

  const handleStandAside = async (sectionKey: string) => {
    setSubmittingSection(sectionKey);
    try {
      await consentMutation.mutateAsync({ section: sectionKey, consented: true } as any);
    } finally {
      setSubmittingSection(null);
    }
  };

  const handleObjection = async () => {
    if (!objectingSection || !objectionText.trim()) return;
    setSubmittingSection(objectingSection);
    try {
      await consentMutation.mutateAsync({ section: objectingSection, consented: false } as any);
      setObjectingSection(null);
      setObjectionText('');
    } finally {
      setSubmittingSection(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/onboarding">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Onboarding
        </Button>
      </Link>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">UAF Consent Ceremony</h1>
        <p className="text-muted-foreground">
          {data.member_name || `Member ${memberId}`}
        </p>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ceremony Progress</span>
              <span className="font-medium">{completionPct}%</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {completedSections.length} of {CEREMONY_STEPS.length} sections completed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      {CEREMONY_STEPS.map((step, index) => {
        const completed = isSectionComplete(step.key);
        const isSubmitting = submittingSection === step.key;

        return (
          <Card key={step.key} className={completed ? 'border-primary/30 bg-primary/5' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <CardTitle className="text-lg">
                    Step {index + 1}: {step.title}
                  </CardTitle>
                </div>
                <Badge variant={completed ? 'default' : 'outline'}>
                  {completed ? 'Consented' : 'Pending'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground gap-1 px-0">
                    <ChevronDown className="h-3 w-3" />
                    Read full agreement text
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-3 p-4 rounded-md bg-muted/50 text-sm leading-relaxed">
                    {step.fullText}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {!completed && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => handleConsent(step.key)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'I Consent'}
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleStandAside(step.key)}
                      disabled={isSubmitting}
                    >
                      Stand Aside
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setObjectingSection(step.key)}
                      disabled={isSubmitting}
                    >
                      I Object
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <strong>Consent</strong> means you support this section. <strong>Stand Aside</strong> means you have no objection but choose not to actively participate. <strong>Object</strong> means you have a paramount concern that must be addressed.
                  </p>
                </div>
              )}

              {objectingSection === step.key && (
                <div className="mt-3 p-4 rounded-md border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 space-y-3">
                  <p className="text-sm font-medium">What is your objection?</p>
                  <p className="text-xs text-muted-foreground">
                    An objection should describe a paramount concern — something that would cause harm
                    the ecosystem cannot afford. Objections help strengthen agreements.
                  </p>
                  <Textarea
                    value={objectionText}
                    onChange={(e) => setObjectionText(e.target.value)}
                    placeholder="Describe your objection..."
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleObjection} disabled={!objectionText.trim() || isSubmitting}>
                      Submit Objection
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setObjectingSection(null); setObjectionText(''); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Cooling-off period info */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Cooling-Off Period</h3>
            <p className="text-sm text-muted-foreground">
              After completing all consent steps, there is a cooling-off period during which you may
              withdraw consent on any section. This ensures that consent is fully informed and voluntary.
              Your facilitator will confirm the final onboarding once the cooling-off period has passed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
