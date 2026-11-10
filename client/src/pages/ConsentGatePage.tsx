import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { FileCheck2, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useJoinEcosystem } from '@/hooks/use-onboarding';
import { apiErrorMessage } from '@/lib/api-error-message';
import { activeEcosystemIds, consentGateHeading } from '@/lib/consent-gate';
import type { PendingConsentGate } from '@/types/api';
import { JoinRequirements } from '@/components/JoinRequirements';

/** The agreement-consent gate: what a pending member must consent to before taking part (see client/src/AGENTS.md). */
export default function ConsentGatePage() {
  const { pendingConsents, ecosystems, member, refreshSession } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const checkAgain = async () => {
    setIsChecking(true);
    setStatusMessage('Checking status.');
    try {
      await refreshSession();
      setStatusMessage('Status refreshed.');
    } catch {
      setStatusMessage('Status could not be refreshed.');
    } finally {
      setIsChecking(false);
    }
  };

  // Consent is recorded on each agreement's page; re-read the gate whenever the member returns here.
  useEffect(() => {
    void checkAgain();
  }, []);

  if (pendingConsents.length === 0) {
    // Never claim an active membership the server did not report (a leaver has none).
    const isActiveSomewhere = activeEcosystemIds({ pendingConsents, memberships: ecosystems, member }).length > 0;
    return (
      <section className="mx-auto max-w-2xl border-2 border-strong-border bg-card p-8 sm:p-10" aria-live="polite">
        <p className="sr-only" role={statusMessage === 'Status could not be refreshed.' ? 'alert' : 'status'}>{statusMessage}</p>
        <FileCheck2 className="h-8 w-8" aria-hidden="true" />
        {isActiveSomewhere ? (
          <>
            <h1 className="mt-5 text-3xl font-black tracking-[-0.035em]">You're an active member</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">No ecosystem agreements are waiting for your consent.</p>
            <Button asChild className="mt-8">
              <Link href="/dashboard">Go to your dashboard</Link>
            </Button>
          </>
        ) : (
          <>
            <h1 className="mt-5 text-3xl font-black tracking-[-0.035em]">Nothing is waiting for your consent</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              You are not taking part in an ecosystem right now. Find one to learn about and join.
            </p>
            <Button asChild className="mt-8">
              <Link href="/ecosystems">Find an ecosystem</Link>
            </Button>
          </>
        )}
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <p className="sr-only" role={statusMessage === 'Status could not be refreshed.' ? 'alert' : 'status'}>{statusMessage}</p>
      {pendingConsents.map((gate, index) => {
        const Heading = consentGateHeading(index);
        return (
        <section key={gate.ecosystem_id} className="border-2 border-strong-border bg-card p-8 sm:p-10" aria-labelledby={`gate-${gate.ecosystem_id}`}>
          <FileCheck2 className="h-8 w-8" aria-hidden="true" />
          <Heading id={`gate-${gate.ecosystem_id}`} className="mt-5 text-3xl font-black tracking-[-0.035em]">
            Before you take part in {gate.ecosystem_name}
          </Heading>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Your account is set up. Complete this ecosystem's configured entry quizzes and personally consent
            to its membership agreements. The server activates your membership only when all requirements are met.
          </p>
          {gate.join_gates && <JoinRequirements type="ecosystem" id={gate.ecosystem_id} gates={gate.join_gates} returnTo="/welcome/consent" />}
          {gate.required_agreements.length ? (
            <ol className="mt-6 space-y-3">
              {gate.required_agreements.map((agreement) => (
                <li key={agreement.id} className="flex flex-wrap items-center justify-between gap-3 border border-border p-4">
                  <span className="font-medium">
                    {agreement.title}
                    {agreement.version && <span className="ml-2 text-xs text-muted-foreground">v{agreement.version}</span>}
                  </span>
                  <Button asChild size="sm">
                    <Link href={`/agreements/${agreement.id}`}>Read and consent</Link>
                  </Button>
                </li>
              ))}
            </ol>
          ) : gate.join_gates && !gate.join_gates.eligible ? null : (
            <CheckMembership gate={gate} />
          )}
          <p className="mt-6 text-sm">
            <Link href={`/ethos/${gate.ecosystem_id}`} className="font-bold text-link underline underline-offset-4 hover:no-underline">
              Learn about {gate.ecosystem_name} first
            </Link>
          </p>
        </section>
        );
      })}
      <Button variant="outline" onClick={checkAgain} disabled={isChecking}>
        <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
        {isChecking ? 'Checking…' : "I've completed the requirements, check again"}
      </Button>
    </div>
  );
}

/** A pending membership with nothing left to consent to: joining again lets the server finish it (outcome `gate_cleared`). */
function CheckMembership({ gate }: { gate: PendingConsentGate }) {
  // The failure renders below the button, so the join stays silent (one error per failure).
  const join = useJoinEcosystem(gate.ecosystem_id, { ecosystemName: gate.ecosystem_name, silent: true });
  return (
    <div className="mt-6 space-y-3 border border-border p-4">
      <p className="text-sm">
        No agreements are waiting for your consent in {gate.ecosystem_name}. Check your membership to finish joining.
      </p>
      <Button size="sm" onClick={() => join.mutate()} disabled={join.isPending}>
        {join.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
        {join.isPending ? 'Checking…' : 'Check my membership'}
      </Button>
      {join.isError && (
        <p className="text-sm text-destructive" role="alert">
          {apiErrorMessage(join.error)} If this keeps happening, ask a steward of {gate.ecosystem_name} for help.
        </p>
      )}
    </div>
  );
}
