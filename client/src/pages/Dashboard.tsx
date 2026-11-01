import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryState } from '@/components/QueryState';
import { useAuth } from '@/contexts/AuthContext';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useNavPermissions } from '@/hooks/use-nav-permissions';
import { useDashboardSummary } from '@/hooks/use-api';
import { useMyNextSteps } from '@/hooks/use-next-steps';
import { useSafeguards } from '@/hooks/use-care';
import { agreementStatusLabel } from '@/lib/agreement-status';
import { auditDueText } from '@/lib/health';
import { canManageQuizzes } from '@/lib/nav-access';
import { formatDate as formatDateOnly } from '@/lib/utils';
import { fetchEcosystemQuizzes, fetchEcosystemSharesNeeds } from '@/lib/api-client';
import { resolveInternalPath, resolveMediaUrl } from '@/lib/media';
import { dueStatus, formatDue, nextStepKindLabel } from '@/lib/next-steps';
import { proposalPhaseLabel } from '@/lib/proposal-vocab';
import { keys } from '@/lib/query-keys';
import type { ActivityItem, SummaryCard } from '@/types/api';

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

function formatDate(value?: string | null) {
  if (!value) return 'Date pending';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date pending' : dateFormatter.format(date);
}

function statusTone(status: string) {
  const normalized = status.toLowerCase();
  if (['active', 'approved', 'complete', 'completed', 'ratified'].includes(normalized)) return 'text-success';
  if (['rejected', 'blocked', 'expired', 'cancelled'].includes(normalized)) return 'text-destructive';
  if (['pending', 'advice', 'consent', 'review'].includes(normalized)) return 'text-warning';
  return 'text-muted-foreground';
}

/** A breakdown key (a record status) in the words its own pages use, never the raw value ("Under_review"). */
function breakdownLabel(cardHref: string, key: string): string {
  if (cardHref === '/agreements') return agreementStatusLabel(key);
  if (cardHref === '/proposals') return proposalPhaseLabel(key);
  const words = key.replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function MetricCard({ card, index }: { card: SummaryCard; index: number }) {
  const href = resolveInternalPath(card.href) ?? '/dashboard';
  return (
    <Link
      href={href}
      className="group flex min-h-48 flex-col border-2 border-strong-border bg-card p-5 hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-muted-foreground group-hover:text-background/75">
          M-{String(index + 1).padStart(2, '0')} / {card.label}
        </p>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
      </div>
      <p className="mt-5 text-5xl font-black leading-none tracking-[-0.055em] tabular-nums">{card.value}</p>
      {card.trend && (
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground group-hover:text-background/75">
          {card.trend}
        </p>
      )}
      {card.breakdown && Object.keys(card.breakdown).length > 0 && (
        <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-border pt-4 text-xs group-hover:border-background/40">
          {Object.entries(card.breakdown).map(([label, value]) => (
            <div key={label} className="flex gap-1.5">
              <dt className="text-muted-foreground group-hover:text-background/75">{breakdownLabel(card.href, label)}</dt>
              <dd className="font-black tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Link>
  );
}

function ActivityRow({ activity }: { activity: ActivityItem }) {
  const href = resolveInternalPath(activity.href) ?? '/dashboard';
  return (
    <li className="border-b border-border last:border-b-0">
      <Link
        href={href}
        className="group grid min-h-20 grid-cols-[1fr_auto] gap-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div>
          <p className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-muted-foreground">
            {activity.label || activity.type}
          </p>
          <p className="mt-1 font-bold leading-snug group-hover:underline">{activity.title}</p>
        </div>
        <div className="text-right">
          <p className={`text-[0.65rem] font-black uppercase tracking-[0.12em] ${statusTone(activity.status)}`}>
            {activity.status}
          </p>
          <time className="mt-1 block text-xs text-muted-foreground" dateTime={activity.timestamp}>
            {formatDate(activity.timestamp)}
          </time>
        </div>
      </Link>
    </li>
  );
}

export default function Dashboard() {
  const { member } = useAuth();
  const { selected, selectedIds, ecosystems, isAll, isMulti } = useEcosystem();
  // Manage learning opens /quiz/manage: the sidebar's and the route's rule (lib/nav-access.ts), not the profile (collab-10).
  const showManageLearning = canManageQuizzes(useNavPermissions());
  const ecosystemIds = Array.from(new Set(selectedIds)).sort();
  const summaryQuery = useDashboardSummary(ecosystemIds);
  // G-Next: the member's own queue in every ecosystem they are active in; the header bell reads the same list.
  const queueQuery = useMyNextSteps();
  const healthEcosystems = useSafeguards().data?.ecosystems ?? [];
  const scopedEcosystem = selectedIds.length === 1 ? selected : null;

  const sharesNeedsQuery = useQuery({
    queryKey: keys.sharesNeeds.forEcosystem(scopedEcosystem?.id),
    queryFn: () => fetchEcosystemSharesNeeds(scopedEcosystem!.id),
    enabled: !!scopedEcosystem?.id,
  });
  const quizzesQuery = useQuery({
    queryKey: keys.quizzes.forEcosystem(scopedEcosystem?.id),
    queryFn: () => fetchEcosystemQuizzes(scopedEcosystem!.id),
    enabled: !!scopedEcosystem?.id,
  });

  const displayName = member?.display_name || 'Member';
  const contextLabel = scopedEcosystem
    ? scopedEcosystem.name
    : isAll
      ? `All ${ecosystems.length} ecosystems`
      : isMulti
        ? `${selectedIds.length} ecosystems selected`
        : 'No ecosystem selected';
  const ecosystemImage = resolveMediaUrl(scopedEcosystem?.logo_url);

  // The count is only a number once the queue has loaded; a dash never claims zero.
  const pendingActionCount = queueQuery.data?.count ?? null;
  const showEcosystem = new Set((queueQuery.data?.items ?? []).map((item) => item.ecosystem_id)).size > 1;
  const now = new Date();

  const quickActions = [
    { label: 'Draft proposal', detail: 'Open a governance change', href: '/proposals/new' },
    { label: 'Review agreements', detail: 'Read the current operating record', href: '/agreements' },
    { label: 'Discover network', detail: 'Explore ecosystems and exchanges', href: '/discover' },
    ...(scopedEcosystem
      ? [{ label: 'Orientation', detail: `Start or continue ${scopedEcosystem.name} orientation`, href: `/ethos/${scopedEcosystem.id}` }]
      : []),
    { label: 'My solutions', detail: 'Browse solutions on the Discover page', href: '/discover' },
    { label: 'Member profile', detail: 'Update identity and capabilities', href: '/profile' },
    ...(showManageLearning
      ? [{ label: 'Manage learning', detail: 'Publish quizzes and pathways', href: '/quiz/manage' }]
      : []),
  ];

  return (
    <div className="space-y-12">
      <header className="grid gap-8 border-b-2 border-strong-border pb-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Control room / 01</p>
          <h1 className="mt-4 text-5xl font-black leading-[0.88] tracking-[-0.055em] sm:text-7xl">
            Good to see you, {displayName}.
          </h1>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="rounded-none border-2 px-3 py-1 uppercase tracking-[0.12em]">
              {contextLabel}
            </Badge>
            <p className="text-sm text-muted-foreground">Live governance, exchange, and orientation signals.</p>
          </div>
        </div>

        <aside className="border-2 border-strong-border bg-card lg:col-span-4" aria-label="Selected ecosystem context">
          {ecosystemImage && scopedEcosystem ? (
            <img
              src={ecosystemImage}
              alt={`A view representing ${scopedEcosystem.name}`}
              width={1200}
              height={800}
              loading="lazy"
              decoding="async"
              className="aspect-[3/2] w-full border-b-2 border-strong-border object-cover grayscale-[12%]"
            />
          ) : (
            <div className="flex aspect-[3/2] items-end justify-between border-b-2 border-strong-border bg-foreground p-5 text-background" role="img" aria-label="Multiple ecosystem network view">
              <span className="text-xs font-black uppercase tracking-[0.18em]">Network scope</span>
              <span className="text-5xl font-black tabular-nums" aria-hidden="true">{selectedIds.length}</span>
            </div>
          )}
          <div className="p-5">
            <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Current lens</p>
            <p className="mt-2 text-xl font-black tracking-tight">{contextLabel}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {scopedEcosystem?.description ?? 'Choose one ecosystem to reveal its local exchange and learning activity.'}
            </p>
          </div>
        </aside>
      </header>

      <section aria-labelledby="governance-pulse-title" className="space-y-5">
        <div className="flex items-end justify-between gap-5 border-b border-border pb-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">01 / Governance pulse</p>
            <h2 id="governance-pulse-title" className="mt-2 text-3xl font-black tracking-[-0.035em]">The operating record at a glance.</h2>
          </div>
          <p className="hidden text-sm text-muted-foreground sm:block">Select any metric to inspect its source records.</p>
        </div>

        <QueryState
          query={summaryQuery}
          loading={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-label="Loading dashboard metrics">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-48 rounded-none border-2 border-border" />
              ))}
            </div>
          }
          idle={<div className="border-2 border-dashed border-strong-border p-8 text-sm text-muted-foreground">Select an ecosystem to see its summary.</div>}
          errorTitle="Summary unavailable"
          isEmpty={(summary) => summary.cards.length === 0}
          empty={<div className="border-2 border-dashed border-strong-border p-8 text-sm text-muted-foreground">No summary records are available in this scope.</div>}
        >
          {(summary) => (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {summary.cards.map((card, index) => <MetricCard key={card.label} card={card} index={index} />)}
            </div>
          )}
        </QueryState>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <section aria-labelledby="attention-title" className="border-2 border-strong-border bg-card lg:col-span-7">
          <div className="flex items-start justify-between gap-5 border-b-2 border-strong-border p-5 sm:p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-warning">02 / Decision queue</p>
              <h2 id="attention-title" className="mt-2 text-3xl font-black tracking-[-0.035em]">Needs your attention.</h2>
            </div>
            <span className="text-4xl font-black tabular-nums" aria-label={pendingActionCount === null ? 'Pending actions unavailable' : `${pendingActionCount} pending actions`}>
              {pendingActionCount ?? '–'}
            </span>
          </div>

          <QueryState
            query={queueQuery}
            loading={
              <div className="space-y-1 p-5 sm:p-6" aria-label="Loading decision queue">
                {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 rounded-none" />)}
              </div>
            }
            errorTitle="The governance queue could not be loaded"
            isEmpty={(queue) => queue.items.length === 0}
            empty={
              <div className="p-8 sm:p-10">
                <p className="text-2xl font-black tracking-tight text-success">Queue clear.</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Nothing is waiting for you in any of your ecosystems.</p>
              </div>
            }
          >
            {(queue) => (
              <ol className="divide-y divide-border">
                {/* G-Onboard: newcomer steps (consent to join, orientation, a stuck newcomer) first; sort is stable, so server order holds within each group. */}
                {[...queue.items].sort((a, b) => Number(String(b.kind) === 'newcomer') - Number(String(a.kind) === 'newcomer')).map((item, index) => {
                  const due = dueStatus(item.due, item.overdue, now, formatDue);
                  return (
                    <li key={item.uid}>
                      <Link
                        href={resolveInternalPath(item.link) ?? '/dashboard'}
                        className="group grid gap-4 p-5 hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6"
                      >
                        <span className="text-xs font-black tabular-nums text-muted-foreground group-hover:text-background/75">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div>
                          <p className="font-black leading-snug">{item.what}</p>
                          <p className="mt-1 text-sm group-hover:text-background/90">{item.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground group-hover:text-background/75">
                            {item.why}
                            {showEcosystem && item.ecosystem ? ` · ${item.ecosystem}` : ''}
                          </p>
                          {due && (
                            <p className={`mt-1 text-xs ${due.overdue ? 'font-semibold text-destructive group-hover:text-background' : 'text-muted-foreground group-hover:text-background/75'}`}>
                              {due.text}
                            </p>
                          )}
                        </div>
                        <Badge variant={due?.overdue ? 'destructive' : 'secondary'} className="w-fit rounded-none uppercase tracking-wide">
                          {nextStepKindLabel(item.kind)}
                        </Badge>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            )}
          </QueryState>
          {healthEcosystems.length > 0 && (
            <ul aria-label="Governance health" className="divide-y divide-border border-t-2 border-strong-border">
              {healthEcosystems.map((health) => (
                <li key={health.ecosystem_id}>
                  <Link
                    href="/safeguards"
                    className="flex min-h-11 flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-6"
                  >
                    <span className="font-semibold">Governance health{healthEcosystems.length > 1 ? ` · ${health.ecosystem}` : ''}</span>
                    <span className={health.audit_overdue ? 'font-semibold text-destructive' : 'text-muted-foreground'}>
                      {auditDueText(health.audit_due, health.audit_overdue, formatDateOnly)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="activity-title" className="border-2 border-strong-border bg-card p-5 sm:p-6 lg:col-span-5">
          <div className="border-b-2 border-strong-border pb-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">03 / Recent record</p>
            <h2 id="activity-title" className="mt-2 text-3xl font-black tracking-[-0.035em]">Latest movement.</h2>
          </div>
          <QueryState
            query={summaryQuery}
            loading={
              <div className="space-y-2 pt-4" aria-label="Loading recent activity">
                {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-none" />)}
              </div>
            }
            errorTitle="Recent activity could not be loaded"
            isEmpty={(summary) => summary.activity.length === 0}
            empty={<p className="py-8 text-sm leading-6 text-muted-foreground">No recent governance activity has been recorded in this scope.</p>}
          >
            {(summary) => (
              <ol>{summary.activity.slice(0, 6).map((activity) => <ActivityRow key={`${activity.type}-${activity.id}`} activity={activity} />)}</ol>
            )}
          </QueryState>
        </section>

        <section aria-labelledby="ecosystem-activity-title" className="border-2 border-strong-border bg-card lg:col-span-8">
          <div className="border-b-2 border-strong-border p-5 sm:p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">04 / Local exchange</p>
            <h2 id="ecosystem-activity-title" className="mt-2 text-3xl font-black tracking-[-0.035em]">Ecosystem activity.</h2>
          </div>

          {!scopedEcosystem ? (
            <div className="p-8 sm:p-10">
              <p className="text-xl font-black tracking-tight">Narrow the lens to one ecosystem.</p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Shares, needs, solutions, and quizzes are local records. Select one ecosystem in the header to inspect them without mixing contexts.</p>
            </div>
          ) : (
            <QueryState
              query={sharesNeedsQuery}
              loading={
                <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading ecosystem activity">
                  {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-44 rounded-none" />)}
                </div>
              }
              errorTitle="Local ecosystem activity could not be loaded"
            >
              {(sharesNeedsData) => (
                <QueryState
                  query={quizzesQuery}
                  loading={
                    <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading ecosystem activity">
                  {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-44 rounded-none" />)}
                </div>
                  }
                  errorTitle="Local ecosystem activity could not be loaded"
                >
                  {(quizzesData) => {
                    // G-Exchange: count open posts only (not fulfilled, withdrawn or hidden).
                    const sharesNeeds = (sharesNeedsData.items ?? []).filter((item) => item.status === 'active' && !('hidden' in item && item.hidden));
                    const quizCount = quizzesData.quizzes?.length ?? 0;
                    return (
                      <div className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
                        {[
                          { label: 'Shares', value: sharesNeeds.filter((item) => item.type === 'share').length, detail: 'Open offers', href: '/discover?tab=shares-needs' },
                          { label: 'Needs', value: sharesNeeds.filter((item) => item.type === 'need').length, detail: 'Open requests', href: '/discover?tab=shares-needs' },
                          { label: 'Solutions', value: sharesNeeds.filter((item) => item.type === 'solution').length, detail: 'Published approaches', href: '/discover?tab=shares-needs' },
                          { label: 'Quizzes', value: quizCount, detail: 'Learning pathways', href: '/quizzes' },
                        ].map((item) => (
                          <Link key={item.label} href={item.href} className="group min-h-44 bg-card p-6 hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground group-hover:text-background/75">{item.label}</p>
                            <p className="mt-4 text-5xl font-black tabular-nums">{item.value}</p>
                            <p className="mt-3 text-sm text-muted-foreground group-hover:text-background/75">{item.detail}</p>
                          </Link>
                        ))}
                      </div>
                    );
                  }}
                </QueryState>
              )}
            </QueryState>
          )}
        </section>

        <section aria-labelledby="quick-actions-title" className="border-2 border-strong-border bg-card p-5 sm:p-6 lg:col-span-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">05 / Shortcuts</p>
          <h2 id="quick-actions-title" className="mt-2 text-3xl font-black tracking-[-0.035em]">Move next.</h2>
          <ol className="mt-5 border-t border-border">
            {quickActions.map((action, index) => (
              <li key={action.label} className="border-b border-border">
                <Link href={action.href} className="group grid grid-cols-[auto_1fr_auto] gap-3 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="text-xs font-black tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                  <span>
                    <span className="block text-sm font-black group-hover:underline">{action.label}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{action.detail}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
