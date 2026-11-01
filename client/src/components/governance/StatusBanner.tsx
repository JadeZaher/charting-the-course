import { Skeleton } from '@/components/ui/skeleton';
import { QueryState } from '@/components/QueryState';
import { useStatusExplanation } from '@/hooks/use-next-steps';
import { formatDue, parseDue } from '@/lib/next-steps';
import type { ExplainKind } from '@/types/api';

/** Where a record stands, in the server's words (GET /explain): state, next step, who decides, by when. */
export function StatusBanner({ kind, id }: { kind: ExplainKind; id: string }) {
  const query = useStatusExplanation(kind, id);
  const headingId = `status-banner-${kind}-${id}`;
  return (
    <QueryState
      query={query}
      loading={<Skeleton className="h-24 rounded-none border-2 border-border" />}
      errorTitle="We couldn't load where this stands"
    >
      {(status) => (
        <section aria-labelledby={headingId} className="border-2 border-strong-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id={headingId} className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">
              Where this stands
            </h2>
            <p className="text-sm font-black">{status.state}</p>
          </div>
          <p className="mt-2 text-sm leading-6">{status.next_step}</p>
          {(status.decided_by || status.due) && (
            <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              {status.decided_by && (
                <div>
                  <dt className="text-muted-foreground">Who decides</dt>
                  <dd className="font-medium">{status.decided_by}</dd>
                </div>
              )}
              {status.due && (
                <div>
                  <dt className="text-muted-foreground">{status.due_label ?? 'By when'}</dt>
                  <dd className={status.overdue ? 'font-semibold text-destructive' : 'font-medium'}>
                    {formatDue(parseDue(status.due), status.due.includes('T'))}
                    {status.overdue ? ' (passed)' : ''}
                  </dd>
                </div>
              )}
            </dl>
          )}
          {status.waiting_on_you.length > 0 && (
            <ul className="mt-3 space-y-1 border-l-4 border-warning pl-3 text-sm">
              {status.waiting_on_you.map((item) => (
                <li key={item.uid}><span className="font-semibold">Waiting for you:</span> {item.what}</li>
              ))}
            </ul>
          )}
        </section>
      )}
    </QueryState>
  );
}
