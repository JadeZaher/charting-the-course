import type { ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Loader2, ShieldCheck } from 'lucide-react';
import { fetchEthosAccess, consentEthosAccess } from '@/lib/api-client';

interface Props {
  ethosId: string;
  children: ReactNode;
}

/**
 * Gates an ethos (ecosystem) dossier behind participation consent: a member must
 * record consent to share their participation before viewing the member directory.
 * Consent is the presence of an EthosUserAccess row (see api/ethos_access.py).
 * Fails open on a backend error — a hiccup should not hard-block already-authed viewing.
 */
export function ConsentGate({ ethosId, children }: Props) {
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['ethos-access', ethosId],
    queryFn: () => fetchEthosAccess(ethosId),
    enabled: !!ethosId,
  });

  const consent = useMutation({
    mutationFn: () => consentEthosAccess(ethosId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ethos-access', ethosId] }),
  });

  if (isError || data?.has_access) {
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

  return (
    <div className="mx-auto max-w-2xl border-2 border-strong-border bg-card p-8 sm:p-10">
      <ShieldCheck className="h-8 w-8" aria-hidden="true" />
      <h1 className="mt-5 text-3xl font-black tracking-[-0.035em]">Participation consent</h1>
      <p className="mt-3 text-sm leading-7 text-muted-foreground">
        This Ethos community shares member profiles and contact points with its participants. To view the
        directory and take part, record your consent to participate and to share your visibility with other members.
      </p>
      {consent.isError && (
        <p className="mt-4 text-xs text-destructive" role="alert">
          Could not record consent right now. Please try again.
        </p>
      )}
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => consent.mutate()}
          disabled={consent.isPending}
          className="inline-flex min-h-11 items-center gap-2 border-2 border-strong-border bg-foreground px-5 text-xs font-black uppercase tracking-[0.12em] text-background hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {consent.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          I consent to participate
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
