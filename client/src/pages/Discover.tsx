import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useEthosList } from '@/hooks/useEthos';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { AlignedParticipants } from '@/components/discovery/AlignedParticipants';
import { EthosCard } from '@/components/ethos/EthosCard';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchEcosystemQuizzes, fetchEcosystemSharesNeeds } from '@/lib/api-client';
import type { EthosSummary } from '@/types/orientation';

function EcosystemSharesNeedsSection({ ecosystem }: { ecosystem: EthosSummary }) {
  const query = useQuery({
    queryKey: ['ecosystem-shares-needs', ecosystem.id],
    queryFn: () => fetchEcosystemSharesNeeds(ecosystem.id),
    enabled: !!ecosystem.id,
  });
  const items = query.data?.items ?? [];
  const shares = items.filter((item) => item.type === 'share').length;
  const needs = items.filter((item) => item.type === 'need').length;

  if (query.isLoading) {
    return <Skeleton className="h-64 rounded-none border-2 border-border" />;
  }

  if (query.error) {
    return (
      <div className="border-2 border-destructive p-6" role="alert">
        <p className="font-bold text-destructive">Exchange signals could not be loaded for {ecosystem.name}.</p>
      </div>
    );
  }

  return (
    <section className="border-2 border-strong-border bg-card" aria-labelledby={`exchange-${ecosystem.id}`}>
      <div className="grid gap-px border-b-2 border-strong-border bg-border sm:grid-cols-[1fr_auto_auto]">
        <div className="bg-card p-5">
          <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Exchange index</p>
          <h3 id={`exchange-${ecosystem.id}`} className="mt-2 text-xl font-black tracking-tight">{ecosystem.name}</h3>
        </div>
        <div className="min-w-28 bg-card p-5">
          <p className="text-3xl font-black tabular-nums text-success">{shares}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Shares</p>
        </div>
        <div className="min-w-28 bg-card p-5">
          <p className="text-3xl font-black tabular-nums text-link">{needs}</p>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Needs</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="p-6 text-sm leading-6 text-muted-foreground">No shares or needs have been posted for this ecosystem.</p>
      ) : (
        <div className="grid gap-px bg-border md:grid-cols-2 xl:grid-cols-3">
          {items.slice(0, 6).map((item) => (
            <article key={item.id} className="min-h-44 bg-card p-5">
              <p className={`text-[0.65rem] font-black uppercase tracking-[0.16em] ${item.type === 'share' ? 'text-success' : 'text-link'}`}>
                {item.type === 'share' ? 'Offers' : 'Seeks'}
              </p>
              <h4 className="mt-3 font-black leading-snug">{item.title}</h4>
              {item.description && <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.description}</p>}
              {item.category && <Badge variant="outline" className="mt-4 rounded-none capitalize">{item.category}</Badge>}
            </article>
          ))}
        </div>
      )}

      <div className="border-t-2 border-strong-border p-4 text-right">
        <Link href="/discover" className="inline-flex min-h-11 items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Explore all exchanges <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function EcosystemQuizzesSection({ ecosystem }: { ecosystem: EthosSummary }) {
  const query = useQuery({
    queryKey: ['ecosystem-quizzes', ecosystem.id],
    queryFn: () => fetchEcosystemQuizzes(ecosystem.id),
    enabled: !!ecosystem.id,
  });
  const quizzes = query.data?.quizzes ?? [];

  if (query.isLoading) {
    return <Skeleton className="h-52 rounded-none border-2 border-border" />;
  }

  if (query.error) {
    return (
      <div className="border-2 border-destructive p-6" role="alert">
        <p className="font-bold text-destructive">Learning paths could not be loaded for {ecosystem.name}.</p>
      </div>
    );
  }

  return (
    <section className="border-2 border-strong-border bg-card" aria-labelledby={`learning-${ecosystem.id}`}>
      <div className="flex items-end justify-between gap-5 border-b-2 border-strong-border p-5 sm:p-6">
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Learning paths</p>
          <h3 id={`learning-${ecosystem.id}`} className="mt-2 text-xl font-black tracking-tight">{ecosystem.name}</h3>
        </div>
        <span className="text-4xl font-black tabular-nums">{quizzes.length}</span>
      </div>

      {quizzes.length === 0 ? (
        <p className="p-6 text-sm leading-6 text-muted-foreground">No quizzes are currently assigned to this ecosystem.</p>
      ) : (
        <ol className="divide-y divide-border">
          {quizzes.slice(0, 6).map((quiz, index) => (
            <li key={quiz.id}>
              <Link
                href={`/quiz/take/${quiz.id}`}
                className="group grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4 p-5 hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-xs font-black tabular-nums text-muted-foreground group-hover:text-background/75">{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <span className="block font-black group-hover:underline">{quiz.title}</span>
                  {quiz.description && <span className="mt-1 block line-clamp-1 text-xs text-muted-foreground group-hover:text-background/75">{quiz.description}</span>}
                </span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function Discover() {
  const { selectedIds, isAll } = useEcosystem();
  const permissions = usePermissions();
  const [adminSelectedEthosId, setAdminSelectedEthosId] = useState('');
  const ethosQuery = useEthosList(undefined, 100, 0);
  const allEthos = ethosQuery.data?.ethos ?? [];
  const accessibleEthos = allEthos.filter((ethos) => selectedIds.includes(ethos.id));
  const displayEthos = permissions.isAdmin
    ? (adminSelectedEthosId ? allEthos.filter((ethos) => ethos.id === adminSelectedEthosId) : allEthos)
    : accessibleEthos;

  if (permissions.isLoading || ethosQuery.isLoading) {
    return (
      <div className="space-y-8" aria-label="Loading solutions">
        <Skeleton className="h-28 rounded-none" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Skeleton className="aspect-[3/2] rounded-none border-2 border-border" />
          <Skeleton className="aspect-[3/2] rounded-none border-2 border-border" />
        </div>
      </div>
    );
  }

  if (permissions.error || ethosQuery.error) {
    return (
      <div className="border-2 border-destructive p-8" role="alert">
        <p className="font-black uppercase tracking-wide text-destructive">Solutions unavailable</p>
        <p className="mt-2 text-sm text-muted-foreground">The solutions index could not be loaded.</p>
      </div>
    );
  }

  if (!permissions.isAdmin && accessibleEthos.length === 0) {
    return (
      <div className="space-y-8">
        <header className="border-b-2 border-strong-border pb-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Personal index / 03</p>
          <h1 className="mt-4 text-5xl font-black tracking-[-0.05em] sm:text-7xl">My solutions.</h1>
        </header>
        <div className="border-2 border-dashed border-strong-border p-10 sm:p-16">
          <p className="text-2xl font-black tracking-tight">No solution match yet.</p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Explore the public network to find an ecosystem aligned with your work and values.</p>
          <Link href="/discover" className="mt-6 inline-flex min-h-11 items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Open Discover <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <header className="grid gap-8 border-b-2 border-strong-border pb-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Personal index / 03</p>
          <h1 className="mt-4 text-5xl font-black leading-[0.88] tracking-[-0.055em] sm:text-7xl">My solutions.</h1>
        </div>
        <div className="lg:col-span-4">
          <p className="text-base leading-7 text-muted-foreground">
            {isAll ? 'Your complete ecosystem portfolio' : 'Your selected ecosystem portfolio'} — orientation, exchange, learning, and aligned participants in one working index.
          </p>
          {permissions.isAdmin && allEthos.length > 1 && (
            <div className="mt-5">
              <label htmlFor="solution-filter" className="mb-2 block text-xs font-black uppercase tracking-[0.14em]">Admin view</label>
              <Select value={adminSelectedEthosId || 'all'} onValueChange={(value) => setAdminSelectedEthosId(value === 'all' ? '' : value)}>
                <SelectTrigger id="solution-filter" className="h-11 w-full rounded-none border-2">
                  <SelectValue placeholder="All solutions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All solutions</SelectItem>
                  {allEthos.map((ethos) => <SelectItem key={ethos.id} value={ethos.id}>{ethos.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </header>

      <section aria-labelledby="solution-portfolio-title" className="space-y-5">
        <div className="flex items-baseline justify-between gap-5 border-b border-border pb-3">
          <h2 id="solution-portfolio-title" className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">01 / Portfolio</h2>
          <p className="text-sm text-muted-foreground">{displayEthos.length} {displayEthos.length === 1 ? 'solution' : 'solutions'}</p>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {displayEthos.map((ethos) => <EthosCard key={ethos.id} ethos={ethos} featured={displayEthos.length === 1} />)}
        </div>
      </section>

      {displayEthos.length > 0 && (
        <section aria-labelledby="exchange-index-title" className="space-y-5">
          <div className="border-b border-border pb-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">02 / Exchange</p>
            <h2 id="exchange-index-title" className="mt-2 text-3xl font-black tracking-[-0.035em]">Shares and needs.</h2>
          </div>
          {displayEthos.map((ethos) => <EcosystemSharesNeedsSection key={ethos.id} ecosystem={ethos} />)}
        </section>
      )}

      {displayEthos.length > 0 && (
        <section aria-labelledby="learning-index-title" className="space-y-5">
          <div className="border-b border-border pb-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">03 / Learning</p>
            <h2 id="learning-index-title" className="mt-2 text-3xl font-black tracking-[-0.035em]">Orientation pathways.</h2>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {displayEthos.map((ethos) => <EcosystemQuizzesSection key={ethos.id} ecosystem={ethos} />)}
          </div>
        </section>
      )}

      {displayEthos.length > 0 && (
        <section aria-labelledby="participants-index-title" className="space-y-5">
          <div className="border-b border-border pb-3">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">04 / Alignment</p>
            <h2 id="participants-index-title" className="mt-2 text-3xl font-black tracking-[-0.035em]">Aligned participants.</h2>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            {displayEthos.map((ethos) => (
              <div key={ethos.id} className="border-2 border-strong-border bg-card p-5 sm:p-6">
                <p className="mb-5 text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">{ethos.name}</p>
                <AlignedParticipants ethosId={ethos.id} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
