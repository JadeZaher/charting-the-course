import { useState } from 'react';
import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useOnboardingCeremony, useSubmitCeremonyConsent } from '@/hooks/use-governance';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';

const CEREMONY_STEPS = [
  {
    key: 'purpose_values',
    title: 'Purpose & Values',
    description: 'Understanding the purpose, vision, and core values of the ecosystem. This section covers the foundational agreements that guide all ecosystem activity.',
  },
  {
    key: 'governance',
    title: 'Governance',
    description: 'How the ecosystem governs itself through sociocratic and consent-based processes. Covers domains, roles, and decision-making structures.',
  },
  {
    key: 'decision_making',
    title: 'Decision-Making',
    description: 'The consent-based decision-making process, including proposals, advice rounds, and how objections are integrated for stronger outcomes.',
  },
  {
    key: 'resources',
    title: 'Resources',
    description: 'How resources are stewarded within the ecosystem, including commons, access agreements, and contribution expectations.',
  },
  {
    key: 'conflict',
    title: 'Conflict',
    description: 'The restorative approach to conflict resolution, including escalation paths, repair agreements, and how safety is maintained.',
  },
  {
    key: 'exit',
    title: 'Exit',
    description: 'Understanding the voluntary exit process, cooling-off periods, and how membership transitions are handled with dignity and care.',
  },
];

export default function OnboardingCeremony() {
  const [, params] = useRoute('/onboarding/:memberId/ceremony');
  const memberId = params?.memberId ?? '';
  const { data, isLoading, error } = useOnboardingCeremony(memberId);
  const consentMutation = useSubmitCeremonyConsent(memberId);
  const [submittingSection, setSubmittingSection] = useState<string | null>(null);

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

              {!completed && (
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleConsent(step.key)}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'I Consent'}
                  </Button>
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
