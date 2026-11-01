// Mutation options for POST /ecosystems/:id/join (hooks/use-governance.ts useRequestJoinEcosystem wraps them),
// and the join-first sequence for orientation and ethos consent. See pages/governance/AGENTS.md "Data and feedback".
import type { ApiMutationOptions } from './api-mutation-options';
import { affects } from './query-keys';

/** The join route's answer: 'joined' (active now), 'consent_required' (held at the consent gate), or 'already_member'. */
export interface JoinResult {
  status: string;
  message: string;
}

/** Join options: refresh the session (/auth/me changed), toast the outcome, and treat the route's 409 as "already a member". */
export function joinEcosystemMutation(
  request: () => Promise<JoinResult>,
  refreshSession: () => Promise<void>,
): ApiMutationOptions<JoinResult, void, unknown> {
  return {
    mutationFn: () =>
      request().catch((error: unknown) => {
        // The route's only 409: the session is stale and the membership exists. A result, not a failure.
        // Matched by shape, like lib/api-error-message.ts: importing ApiFetchError would pull import.meta.env into node tests.
        if ((error as { status?: unknown } | null)?.status === 409) {
          return { status: 'already_member', message: error instanceof Error ? error.message : '' };
        }
        throw error;
      }),
    onSuccess: () => refreshSession(),
    invalidates: affects.ecosystems,
    success: joinToast,
    error: 'Orientation request failed',
  };
}

/** True when the user holds a membership (any status) in the ecosystem: /auth/me `ecosystems` lists exactly those rows. */
export function holdsMembershipIn(ecosystemId: string, memberships: readonly { id: string }[]): boolean {
  return memberships.some((ecosystem) => ecosystem.id === ecosystemId);
}

/** One click for a non-member: join, then act (a failed join never acts); a member just acts. See client/src/AGENTS.md "Orientation journeys". */
export async function joinThen<TResult>(
  act: () => Promise<TResult>,
  { isMember, join }: { isMember: boolean; join: () => Promise<unknown> },
): Promise<TResult> {
  if (!isMember) await join();
  return act();
}

/** Only 'joined' claims membership; a consent-gated join is not one yet. */
function joinToast(result: JoinResult): { title: string; description?: string } {
  if (result.status === 'joined') return { title: 'Joined', description: result.message };
  if (result.status === 'already_member') return { title: 'Already a member' };
  return {
    title: 'Orientation requested',
    description: `${result.message || 'Your request to join has been submitted.'} This does not make you a member yet.`,
  };
}
