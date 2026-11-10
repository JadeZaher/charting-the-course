import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyNextSteps } from '@/hooks/use-next-steps';
import { apiErrorMessage } from '@/lib/api-error-message';
import { apiFetch, fetchAgreements, fetchDecisions, fetchDomains, fetchMembers, fetchProposals } from '@/lib/api-client';
import { domainLabel } from '@/lib/domain-label';
import { quizForJoin, type JoinGates } from '@/lib/join-gates';
import type { MatchingConsent } from '@/lib/matching';
import { keys } from '@/lib/query-keys';
import { queryStatePhase } from '@/lib/query-state';
import { spaceHomeCopy as copy } from '@/lib/space-home-copy';
import {
  directoryCandidates,
  HAPPENING_FILTERS,
  happening,
  nextCard,
  whosHere,
  type HappeningFilter,
  type SpaceAction,
  type SpaceViewer,
} from '@/lib/space-home';

const primaryClass = 'inline-flex min-h-11 items-center border-2 border-strong-border bg-foreground px-4 text-sm font-bold text-background hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70';
const secondaryClass = 'inline-flex min-h-11 items-center border-2 border-strong-border px-4 text-sm font-bold hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

function isInitialLoad(query: { data: unknown; error: unknown; fetchStatus: string }): boolean {
  return query.data === undefined && query.error == null && query.fetchStatus !== 'idle';
}

function isInitialError(query: { data: unknown; error: unknown }): boolean {
  return query.data === undefined && query.error != null;
}

function welcomeKey(userId: string, ecosystemId: string): string {
  return `neos:space-home-welcome:${userId}:${ecosystemId}`;
}

function readDismissed(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function SectionNotice({ loading, message, onRetry, retryLabel }: { loading?: boolean; message: string; onRetry?: () => void; retryLabel?: string }) {
  if (loading) {
    return (
      <div role="status" aria-live="polite" className="space-y-3 p-5 sm:p-6">
        <p>{message}</p>
        <Skeleton className="h-11 rounded-none" aria-hidden="true" />
      </div>
    );
  }
  return (
    <div className="space-y-4 p-5 sm:p-6">
      <p role="alert">{message}</p>
      {onRetry && (
        <Button type="button" variant="outline" className="min-h-11" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

function ActionControl({
  action,
  tone,
  busy,
  onQuiz,
  onJoin,
}: {
  action: SpaceAction;
  tone: 'primary' | 'secondary';
  busy: boolean;
  onQuiz: (quizId: string) => void;
  onJoin: () => void;
}) {
  const className = tone === 'primary' ? primaryClass : secondaryClass;
  if (action.kind === 'link') {
    return <Link href={action.href} className={className}>{action.label}</Link>;
  }
  return (
    <button type="button" className={className} disabled={busy} aria-busy={busy} onClick={() => (action.kind === 'quiz' ? onQuiz(action.quizId) : onJoin())}>
      {action.label}
    </button>
  );
}

export function EcosystemHome({
  ecosystemId,
  name,
  memberCount,
  viewer,
  stewards,
  orientationHref,
  opportunities,
  opportunitiesRequireSignIn,
  onJoin,
  joining,
  prepareJoin,
  joinError,
}: {
  ecosystemId: string;
  name: string;
  memberCount: number | null;
  viewer: SpaceViewer;
  stewards: readonly { display_name: string; role: string }[];
  orientationHref: string | null;
  opportunities?: { id: string; title: string; url: string }[] | null;
  opportunitiesRequireSignIn?: boolean;
  onJoin: () => void;
  joining: boolean;
  prepareJoin?: () => Promise<unknown>;
  joinError?: string | null;
}) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [quizError, setQuizError] = useState('');
  const [quizBusy, setQuizBusy] = useState(false);
  const storageKey = user?.id ? welcomeKey(user.id, ecosystemId) : '';
  const [dismissed, setDismissed] = useState(() => (storageKey ? readDismissed(storageKey) : false));
  const [filter, setFilter] = useState<HappeningFilter>('all');
  const [filterAnnouncement, setFilterAnnouncement] = useState('');

  const memberView = viewer === 'member';
  const queueView = viewer === 'member' || viewer === 'pending';
  const listParams = { ecosystem_id: ecosystemId, per_page: '20' };

  const stepsQuery = useMyNextSteps();
  const gatesQuery = useQuery({
    queryKey: keys.joinGates.target('ecosystem', ecosystemId),
    queryFn: () => apiFetch<{ join_gates: JoinGates }>(`/api/v1/ecosystems/${encodeURIComponent(ecosystemId)}/join-gates`).then((body) => body.join_gates),
    enabled: viewer === 'pending',
  });
  const membersQuery = useQuery({
    queryKey: keys.members.list(listParams),
    queryFn: () => fetchMembers(listParams),
    enabled: memberView,
  });
  const domainsQuery = useQuery({
    queryKey: keys.domains.list(listParams),
    queryFn: () => fetchDomains(listParams),
    enabled: memberView,
  });
  const consentQuery = useQuery({
    queryKey: [...keys.matching.ecosystem(user?.id, ecosystemId), 'consent'],
    queryFn: () => apiFetch<MatchingConsent>(`/api/v1/matching/ecosystems/${encodeURIComponent(ecosystemId)}/consent`),
    enabled: memberView && !!user?.id,
  });
  const participantsQuery = useQuery({
    queryKey: [...keys.matching.ecosystem(user?.id, ecosystemId), 'participants', '', 1],
    queryFn: () => apiFetch<{ items?: { user_id?: string; member_id?: string; display_name?: string }[]; state?: string }>(`/api/v1/matching/ecosystems/${encodeURIComponent(ecosystemId)}/participants?page=1`),
    enabled: memberView && consentQuery.data?.directory_visible === true,
  });
  const proposalsQuery = useQuery({
    queryKey: keys.proposals.list(listParams),
    queryFn: () => fetchProposals(listParams),
    enabled: memberView,
  });
  const decisionsQuery = useQuery({
    queryKey: keys.decisions.list(listParams),
    queryFn: () => fetchDecisions(listParams),
    enabled: memberView,
  });
  const agreementsQuery = useQuery({
    queryKey: keys.agreements.list(listParams),
    queryFn: () => fetchAgreements(listParams),
    enabled: memberView,
  });

  async function startQuiz(quizId: string) {
    setQuizError('');
    setQuizBusy(true);
    try {
      await prepareJoin?.();
      navigate(quizForJoin(quizId, `/ethos/${ecosystemId}`));
    } catch (error) {
      const code = (error as { code?: string; body?: { code?: string } }).code || (error as { body?: { code?: string } }).body?.code;
      if (code === 'JOIN_QUIZ_REQUIRED') navigate(quizForJoin(quizId, `/ethos/${ecosystemId}`));
      else setQuizError(apiErrorMessage(error));
    } finally {
      setQuizBusy(false);
    }
  }

  function dismissWelcome() {
    setDismissed(true);
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, '1');
    } catch {
      // The welcome stays dismissed for this view even when storage is unavailable.
    }
  }

  const stepsWaiting = queueView && queryStatePhase(stepsQuery) === 'loading';
  const stepsFailed = queueView && queryStatePhase(stepsQuery) === 'error';
  const gatesWaiting = viewer === 'pending' && queryStatePhase(gatesQuery) === 'loading';
  const peopleWaiting = memberView && [consentQuery, membersQuery, domainsQuery, participantsQuery].some(isInitialLoad);
  const peopleFailed = memberView && [membersQuery, domainsQuery].some(isInitialError);
  const activityWaiting = memberView && [proposalsQuery, decisionsQuery, agreementsQuery].some(isInitialLoad);
  const activityFailed = memberView && [proposalsQuery, decisionsQuery, agreementsQuery].some(isInitialError);

  const pendingReady = viewer !== 'pending' || gatesQuery.data !== undefined || gatesQuery.isError;
  const card = (!queueView || (pendingReady && (!!stepsQuery.data || stepsFailed)))
    ? nextCard({
        viewer,
        name,
        ecosystemId,
        items: stepsQuery.data?.items ?? [],
        now: new Date(),
        firstSession: memberView && !!user?.id && !dismissed,
        gates: gatesQuery.data,
        orientationHref,
        signInHref: `/login?redirect=${encodeURIComponent(`/ethos/${ecosystemId}`)}&ecosystem=${encodeURIComponent(ecosystemId)}`,
      })
    : null;

  const asked = new Set((stepsQuery.data?.items ?? []).filter((item) => item.kind === 'proposal' && item.ecosystem_id === ecosystemId).map((item) => item.id));
  const participantRows = participantsQuery.data?.state === 'consent_required' ? [] : participantsQuery.data?.items ?? [];
  const people = whosHere({
    viewer,
    ecosystemName: name,
    memberCount,
    stewards,
    circles: (domainsQuery.data?.items ?? []).filter((domain) => domain.ecosystem_id === ecosystemId).map((domain) => ({
      name: domainLabel(domain),
      purpose: domain.purpose,
      steward: domain.current_steward,
      code: domain.domain_id,
    })),
    members: directoryCandidates(membersQuery.data?.items ?? [], participantRows),
    optedInIds: participantsQuery.data ? new Set(participantRows.flatMap((person) => [person.member_id, person.user_id].filter((id): id is string => !!id))) : null,
  });
  const activity = happening({
    viewer,
    ecosystemId,
    filter,
    askedProposalIds: asked,
    proposals: (proposalsQuery.data?.items ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      status: item.status,
      proposer: item.proposer,
      created_at: item.created_at,
      ecosystem_id: item.ecosystem_id,
    })),
    decisions: (decisionsQuery.data?.items ?? []).map((item) => ({
      id: item.id,
      title: item.holding ?? '',
      at: item.date ?? item.created_at,
      ecosystem_id: item.ecosystem_id,
    })),
    agreements: (agreementsQuery.data?.items ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      version: item.version,
      at: item.created_at,
      ecosystem_id: item.ecosystem_id,
    })),
    opportunities,
    opportunitiesRequireSignIn,
  });

  return (
    <div className="space-y-8">
      <section id="what-to-do-next" aria-labelledby="what-to-do-next-title" className="border-2 border-strong-border bg-card">
        <div className="border-b-2 border-strong-border p-5 sm:p-6">
          <h2 id="what-to-do-next-title" className="text-3xl font-black tracking-[-0.035em]">{copy.next.heading}</h2>
        </div>
        {card?.welcome && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
            <p>{copy.welcome(name)}</p>
            <button type="button" className={secondaryClass} onClick={dismissWelcome}>{copy.dismissWelcome}</button>
          </div>
        )}
        {(stepsWaiting || gatesWaiting) && !card ? (
          <SectionNotice loading message={copy.next.loading} />
        ) : stepsFailed && viewer !== 'pending' ? (
          <SectionNotice message={copy.next.error} onRetry={() => void stepsQuery.refetch()} retryLabel={copy.next.retry} />
        ) : viewer === 'pending' && gatesQuery.isError && !gatesQuery.data && stepsFailed ? (
          <SectionNotice message={copy.next.error} onRetry={() => { void stepsQuery.refetch(); void gatesQuery.refetch(); }} retryLabel={copy.next.retry} />
        ) : card ? (
          <div className="space-y-4 p-5 sm:p-6">
            {stepsFailed && <p role="alert">{copy.next.error}</p>}
            {card.sentence && <p>{card.sentence}</p>}
            <div className="flex flex-wrap gap-3">
              {card.primary && <ActionControl action={card.primary} tone="primary" busy={joining || quizBusy} onQuiz={startQuiz} onJoin={onJoin} />}
              {card.secondary.map((action) => <ActionControl key={action.id} action={action} tone="secondary" busy={joining || quizBusy} onQuiz={startQuiz} onJoin={onJoin} />)}
              {card.overflow && <Link href={card.overflow.href} className={secondaryClass}>{card.overflow.label}</Link>}
              {stepsFailed && <Button type="button" variant="outline" className="min-h-11" onClick={() => void stepsQuery.refetch()}>{copy.next.retry}</Button>}
            </div>
            {quizError && <p role="alert" className="text-sm text-destructive">{quizError}</p>}
            {joinError && <p role="alert" className="text-sm text-destructive">{joinError}</p>}
          </div>
        ) : (
          <SectionNotice loading message={copy.next.loading} />
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="whos-here-title" className="order-2 border-2 border-strong-border bg-card lg:order-1">
          <div className="border-b-2 border-strong-border p-5 sm:p-6">
            <h2 id="whos-here-title" className="text-3xl font-black tracking-[-0.035em]">{copy.whosHere.heading}</h2>
          </div>
          {peopleWaiting ? <SectionNotice loading message={copy.whosHere.loading} /> : peopleFailed ? (
            <SectionNotice
              message={copy.whosHere.error(name)}
              retryLabel={copy.whosHere.retry}
              onRetry={() => { void membersQuery.refetch(); void domainsQuery.refetch(); void consentQuery.refetch(); void participantsQuery.refetch(); }}
            />
          ) : (
            <div className="space-y-6 p-5 sm:p-6">
              {people.countText && <p>{people.countText}</p>}
              {people.mode === 'directory' && (
                <>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">{copy.whosHere.stewards}</h3>
                    {people.emptyCircles && <p className="mt-3">{copy.whosHere.emptyCircles}</p>}
                    <ul className="mt-3 space-y-3">
                      {people.stewards.map((row) => <li key={row.key}>{row.text}</li>)}
                      {people.circles.map((row) => (
                        <li key={row.key}>
                          <p>{row.text}</p>
                          {row.detail && <p className="text-sm text-muted-foreground">{row.detail}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">{copy.whosHere.members}</h3>
                    {people.emptyDirectory ? <p className="mt-3">{copy.whosHere.emptyDirectory}</p> : (
                      <ul className="mt-3 space-y-3">
                        {people.members.map((row) => <li key={row.key}>{row.text}</li>)}
                      </ul>
                    )}
                    <Link href="/members" className={`${secondaryClass} mt-4`}>{copy.whosHere.directory}</Link>
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        <section aria-labelledby="whats-happening-title" className="order-1 border-2 border-strong-border bg-card lg:order-2">
          <div className="border-b-2 border-strong-border p-5 sm:p-6">
            <h2 id="whats-happening-title" className="text-3xl font-black tracking-[-0.035em]">{copy.happening.heading}</h2>
          </div>
          {activityWaiting ? <SectionNotice loading message={copy.happening.loading} /> : activityFailed ? (
            <SectionNotice
              message={copy.happening.error}
              retryLabel={copy.happening.retry}
              onRetry={() => { void proposalsQuery.refetch(); void decisionsQuery.refetch(); void agreementsQuery.refetch(); }}
            />
          ) : (
            <div className="space-y-4 p-5 sm:p-6">
              {activity.mode === 'feed' && (
                <div role="group" aria-label={copy.happening.heading} className="flex flex-wrap gap-2">
                  {HAPPENING_FILTERS.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={filter === item.id ? primaryClass : secondaryClass}
                      aria-pressed={filter === item.id}
                      onClick={() => { setFilter(item.id); setFilterAnnouncement(item.label); }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              <p className="sr-only" aria-live="polite">{filterAnnouncement}</p>
              {activity.mode === 'invite' && <p>{copy.happening.joining}</p>}
              {activity.items.length > 0 && (
                <ul className="space-y-4">
                  {activity.items.map((item) => (
                    <li key={item.key}>
                      <p>
                        {item.before}
                        {item.href ? <Link href={item.href} className="font-bold text-link underline underline-offset-4">{item.title}</Link> : <span className="font-bold">{item.title}</span>}
                        {item.after}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
              {activity.mode === 'feed' && activity.items.length === 0 && <p>{copy.happening.empty}</p>}
              {activity.mode === 'feed' && activity.items.length === 0 && activity.canStartProposal && (
                <Link href="/proposals/new" className={secondaryClass}>{copy.happening.startProposal}</Link>
              )}
              {activity.mode === 'feed' && activity.items.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  <Link href="/proposals" className={secondaryClass}>{copy.happening.viewProposals}</Link>
                  <Link href="/decisions" className={secondaryClass}>{copy.happening.viewDecisions}</Link>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
