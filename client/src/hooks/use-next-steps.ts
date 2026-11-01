// The caller's queue (the bell, the dashboard) and a record's status banner, on the shared key factory.
// See pages/governance/AGENTS.md "Next steps and the status banner"; every mutation's `affects` entry refreshes them.
import { useQuery, type QueryKey } from '@tanstack/react-query';
import * as api from '@/lib/api-client';
import { keys, type RecordId } from '@/lib/query-keys';
import type { ExplainKind } from '@/types/api';

// Each banner key sits under its record's detail key, so the page's own invalidation reaches it.
const EXPLAIN_KEYS: Record<ExplainKind, (id: RecordId) => QueryKey> = {
  proposal: keys.proposals.explain,
  agreement: keys.agreements.explain,
  conflict: keys.conflicts.explain,
  emergency: keys.emergency.explain,
  exit: keys.exits.explain,
};

export const NEXT_STEPS_POLL_MS = 5 * 60_000;

/** Everything waiting for the signed-in member. Only the header bell passes `poll` (one poller; the key is shared). */
export function useMyNextSteps(options: { poll?: boolean } = {}) {
  return useQuery({
    queryKey: keys.nextSteps.mine(),
    queryFn: () => api.fetchMyNextSteps(),
    staleTime: 30_000,
    refetchInterval: options.poll ? NEXT_STEPS_POLL_MS : false,
  });
}

/** State, next step, who decides and by when for one record. */
export function useStatusExplanation(kind: ExplainKind, id: string) {
  return useQuery({
    queryKey: EXPLAIN_KEYS[kind](id),
    queryFn: () => api.fetchStatusExplanation(kind, id),
    enabled: !!id,
    staleTime: 30_000,
  });
}
