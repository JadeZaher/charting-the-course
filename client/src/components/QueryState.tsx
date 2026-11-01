// Render-prop renderer for a query's loading, error, empty and ready states (see client/src/AGENTS.md "Shared data and feedback contracts").
import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { Button } from '@/components/ui/button';
import { apiErrorMessage } from '@/lib/api-error-message';
import { queryStatePhase } from '@/lib/query-state';

type QuerySource<TData> = Pick<UseQueryResult<TData>, 'data' | 'error' | 'fetchStatus' | 'refetch' | 'isFetching'>;

/** `isEmpty` and `empty` come as a pair: an empty result is never rendered as nothing. */
type EmptyHandling<TData> =
  | { isEmpty: (data: TData) => boolean; empty: ReactNode }
  | { isEmpty?: undefined; empty?: undefined };

export type QueryStateProps<TData> = EmptyHandling<TData> & {
  query: QuerySource<TData>;
  /** Rendered with the loaded data. */
  children: (data: TData) => ReactNode;
  /** Replaces the default spinner, e.g. a skeleton shaped like the content. */
  loading?: ReactNode;
  /** Shown while the query is disabled with nothing loaded, e.g. "Type three letters to search"; default nothing. */
  idle?: ReactNode;
  /** Heading of the error panel, e.g. "We couldn't load proposals". */
  errorTitle?: string;
};

/** Idle, loading, then error (with Retry), then empty, then `children(data)`; see lib/query-state.ts for the order. */
export function QueryState<TData>({ query, children, isEmpty, empty, loading, idle = null, errorTitle = "We couldn't load this" }: QueryStateProps<TData>) {
  switch (queryStatePhase(query, isEmpty)) {
    case 'idle':
      return <>{idle}</>;
    case 'loading':
      return (
        <div role="status" aria-live="polite">
          {loading ? <><span className="sr-only">Loading…</span>{loading}</> : <LoadingState />}
        </div>
      );
    case 'error':
      return (
        <div className="space-y-4 border-2 border-destructive p-6">
          <div role="alert">
            <p className="font-black uppercase tracking-wide text-destructive">{errorTitle}</p>
            <p className="mt-2 text-sm text-muted-foreground">{apiErrorMessage(query.error)}</p>
          </div>
          <Button variant="outline" onClick={() => void query.refetch()} disabled={query.isFetching}>
            {query.isFetching ? 'Retrying…' : 'Retry'}
          </Button>
        </div>
      );
    case 'empty':
      return <>{empty}</>;
    case 'ready':
      return <>{children(query.data as TData)}</>;
  }
}
