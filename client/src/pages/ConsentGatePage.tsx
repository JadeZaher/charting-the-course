import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { FileCheck2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

/** The agreement-consent gate: what a pending member must consent to before taking part (see client/src/AGENTS.md). */
export default function ConsentGatePage() {
  const { pendingConsents, refreshSession } = useAuth();
  const [isChecking, setIsChecking] = useState(false);

  const checkAgain = async () => {
    setIsChecking(true);
    try {
      await refreshSession();
    } finally {
      setIsChecking(false);
    }
  };

  // Consent is recorded on each agreement's page; re-read the gate whenever the member returns here.
  useEffect(() => {
    void checkAgain();
  }, []);

  if (pendingConsents.length === 0) {
    return (
      <section className="mx-auto max-w-2xl border-2 border-strong-border bg-card p-8 sm:p-10" aria-live="polite">
        <FileCheck2 className="h-8 w-8" aria-hidden="true" />
        <h1 className="mt-5 text-3xl font-black tracking-[-0.035em]">You're an active member</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          No ecosystem agreements are waiting for your consent.
        </p>
        <Button asChild className="mt-8">
          <Link href="/dashboard">Go to your dashboard</Link>
        </Button>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {pendingConsents.map((gate) => (
        <section key={gate.ecosystem_id} className="border-2 border-strong-border bg-card p-8 sm:p-10" aria-labelledby={`gate-${gate.ecosystem_id}`}>
          <FileCheck2 className="h-8 w-8" aria-hidden="true" />
          <h1 id={`gate-${gate.ecosystem_id}`} className="mt-5 text-3xl font-black tracking-[-0.035em]">
            One step before you take part in {gate.ecosystem_name}
          </h1>
          <p className="mt-3 text-sm leading-7 text-muted-foreground">
            Your account is set up. {gate.ecosystem_name} asks every member to read and consent to its membership
            agreements. Your membership stays pending until you have consented to each one below.
          </p>
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
          ) : (
            <p className="mt-6 border border-border p-4 text-sm">
              No agreements are listed for your consent right now. Ask a steward of {gate.ecosystem_name} to confirm your membership.
            </p>
          )}
        </section>
      ))}
      <Button variant="outline" onClick={checkAgain} disabled={isChecking}>
        <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
        {isChecking ? 'Checking…' : "I've consented, check again"}
      </Button>
    </div>
  );
}
