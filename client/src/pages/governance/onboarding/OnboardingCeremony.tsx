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
import type { OnboardingSectionConsent } from '@/types/api';

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

function hasConsented(value: OnboardingSectionConsent | undefined): boolean {
  return typeof value === 'boolean' ? value : value?.consented ?? false;
}

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
        <Button asChild variant="outline" className="mt-4">
          <Link href="/onboarding">Back to Onboarding</Link>
        </Button>
      </div>
    );
  }

  const completedSections = CEREMONY_STEPS.filter((step) => hasConsented(data.section_consents[step.key]));
  const completionPct = data.completion_percentage;

  const isSectionComplete = (key: string) => {
    return hasConsented(data.section_consents[key]);
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
      await consentMutation.mutateAsync({ section: sectionKey, consented: true, position: 'stand_aside' });
    } finally {
      setSubmittingSection(null);
    }
  };

  const handleObjection = async () => {
    if (!objectingSection || !objectionText.trim()) return;
    setSubmittingSection(objectingSection);
    try {
      await consentMutation.mutateAsync({
        section: objectingSection,
        consented: false,
        position: 'object',
        objection_text: objectionText.trim(),
      });
      setObjectingSection(null);
      setObjectionText('');
    } finally {
      setSubmittingSection(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <Button asChild variant="ghost" size="sm">
        <Link href="/onboarding">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Onboarding
        </Link>
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">UAF Consent Ceremony</h1>
        <p className="text-muted-foreground">
          Member {data.member_id}
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
            <div className="h-3 overflow-hidden border border-strong-border bg-muted">
              <div
                className="h-full bg-primary transition-[width] motion-reduce:transition-none"
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
                  <div className="mt-3 rounded-none border-2 border-strong-border bg-muted/50 p-4 text-sm leading-relaxed">
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
                <div className="mt-3 space-y-3 border border-warning bg-warning/10 p-5 text-warning">
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
      <Card className="border-warning bg-warning/10">
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
