import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useJoinEcosystem } from '@/hooks/use-onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { apiErrorMessage } from '@/lib/api-error-message';
import { holdsMembershipIn, joinThen } from '@/lib/ecosystem-join';
import { keys } from '@/lib/query-keys';
import { Link } from 'wouter';
import { AlertTriangle, Loader2, ShieldCheck } from 'lucide-react';
import { fetchEthosAccess, consentEthosAccess } from '@/lib/api-client';

interface Props {
  ethosId: string;
  children: ReactNode;
}

/**
 * Gates protected member data (the directory) behind participation consent: a member
 * must record consent to share their participation before viewing it.
 * Consent is the presence of an EthosUserAccess row (see api/ethos_access.py).
 * Fails closed on a backend error — protected data stays hidden until access verifies.
 */
export function ConsentGate({ ethosId, children }: Props) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: keys.ecosystems.myAccess(ethosId),
    queryFn: () => fetchEthosAccess(ethosId),
    enabled: !!ethosId,
  });

  // Consent is stored on the member row in this ethos, so a non-member joins first (one click).
  const { ecosystems } = useAuth();
  // Silent: a failed join reaches the consent mutation below, which renders it inline once (M5).
  const join = useJoinEcosystem(ethosId, { silent: true });
  // A leaver (exited row) joins again first; any other row consents directly.
  const isMember = holdsMembershipIn(ethosId, ecosystems);

  // The failure renders inline below the explainer, so the mutation stays silent.
  const consent = useApiMutation({
    mutationFn: () => joinThen(() => consentEthosAccess(ethosId), { isMember, join: () => join.mutateAsync() }),
    invalidates: [keys.ecosystems.myAccess(ethosId)],
    silent: true,
  });

  if (data?.has_access) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Checking access…</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-2xl border-2 border-strong-border bg-card p-8 sm:p-10" role="alert">
        <AlertTriangle className="h-8 w-8" aria-hidden="true" />
        <h2 className="mt-5 text-3xl font-black tracking-[-0.035em]">Access check failed</h2>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          We couldn't verify your access. Your data stays private.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex min-h-11 items-center gap-2 border-2 border-strong-border bg-foreground px-5 text-xs font-black uppercase tracking-[0.12em] text-background hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Retry
          </button>
          <Link
            href="/discover"
            className="inline-flex min-h-11 items-center text-xs font-black uppercase tracking-[0.12em] text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl border-2 border-strong-border bg-card p-8 sm:p-10">
      <ShieldCheck className="h-8 w-8" aria-hidden="true" />
      <h1 className="mt-5 text-3xl font-black tracking-[-0.035em]">Participation consent</h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        This grants access to the community's participant area. It does not opt your profile into directory
        visibility, contact discovery or private matching. Those are separate choices inside the area.
      </p>
      {!isMember && (
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          You are not a member of this ecosystem yet, so consenting also joins it. If it asks members to consent to
          its agreements, your membership waits until you have.
        </p>
      )}
      {consent.isError && (
        <p className="mt-4 text-xs text-destructive" role="alert">
          {apiErrorMessage(consent.error)}
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        {/* granular scopes (directory/contact/matching) pending backend — H4 */}
        <button
          type="button"
          onClick={() => consent.mutate()}
          disabled={consent.isPending}
          className="inline-flex min-h-11 items-center gap-2 border-2 border-strong-border bg-foreground px-5 text-xs font-black uppercase tracking-[0.12em] text-background hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {consent.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {isMember ? 'I consent to participate' : 'Join and consent to participate'}
        </button>
        <Link
          href="/discover"
          className="inline-flex min-h-11 items-center text-xs font-black uppercase tracking-[0.12em] text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Not now
        </Link>
      </div>
    </div>
  );
}
