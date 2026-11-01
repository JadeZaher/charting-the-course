// Which of five async states a query renders as (see client/src/AGENTS.md "Shared data and feedback contracts").
import type { FetchStatus } from '@tanstack/react-query';

export type QueryPhase = 'idle' | 'loading' | 'error' | 'empty' | 'ready';

/** The parts of a TanStack query result the phase depends on. */
export interface QuerySnapshot<TData> {
  data: TData | undefined;
  error: unknown;
  /** 'idle' with no data means the query is disabled (or not yet asked for), not loading. */
  fetchStatus: FetchStatus;
}

/** Phase to render: data already on screen stays there, a failed load is never shown as empty, a disabled query never spins. */
export function queryStatePhase<TData>(query: QuerySnapshot<TData>, isEmpty?: (data: TData) => boolean): QueryPhase {
  const failed = query.error != null;
  if (query.data === undefined) {
    if (failed) return 'error';
    return query.fetchStatus === 'idle' ? 'idle' : 'loading';
  }
  if (isEmpty?.(query.data)) return failed ? 'error' : 'empty';
  return 'ready';
}
