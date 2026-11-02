// Mutation options for POST /ecosystems/:id/join (hooks/use-onboarding.ts useJoinEcosystem wraps them), the join-first
// sequence for orientation and ethos consent, and what a membership row lets the caller do. See client/src/AGENTS.md "Onboarding (G-Onboard)".
import type { ApiMutationOptions, ToastCopy } from './api-mutation-options';
import { onboardingAffects } from './query-keys';
import type { JoinGates } from './join-gates';

/** An agreement the caller must still consent to. */
export interface JoinAgreement {
  id: string;
  title: string;
  version?: string | null;
}

/** The join route's answer; 'already_member' is the client's reading of a 409 ALREADY_MEMBER. */
export interface JoinResult {
  /** 'joined', 'consent_required' or 'already_member' (a string: the older useRequestJoinEcosystem passes the untyped route answer). */
  status: string;
  outcome?: 'joined' | 'gate_cleared' | 're_entry';
  membership_status?: string;
  message: string;
  ecosystem_name?: string;
  required_agreements?: readonly JoinAgreement[];
  join_gates?: JoinGates;
}

export interface JoinOptions {
  /** Names the ecosystem in the error title, before the server has answered. */
  ecosystemName?: string;
  /** The caller renders the failure inline (the joinThen pages): no error toast, so one error per failure. */
  silent?: boolean;
}

/** Join options: refresh the session (/auth/me changed), toast what happened to the membership, and read "already in" 409s as results. */
export function joinEcosystemMutation(
  request: () => Promise<JoinResult>,
  refreshSession: () => Promise<void>,
  { ecosystemName, silent = false }: JoinOptions = {},
): ApiMutationOptions<JoinResult, void, unknown> {
  return {
    mutationFn: () =>
      request().catch((error: unknown) => {
        const alreadyIn = alreadyInResult(error);
        if (alreadyIn) return alreadyIn;
        throw error;
      }),
    onSuccess: () => refreshSession(),
    invalidates: onboardingAffects.joinEcosystem,
    success: (result) => joinToast(result, ecosystemName),
    error: `Could not join ${ecosystemName || 'this ecosystem'}`,
    silent,
  };
}

/** A 409 that means the caller already holds the membership (the follow-up write may proceed), else null. Matched by shape: importing ApiCodedError would pull import.meta.env into node tests. */
function alreadyInResult(error: unknown): JoinResult | null {
  const refusal = error as { status?: unknown; code?: unknown; message?: unknown; body?: { required_agreements?: JoinAgreement[]; join_gates?: JoinGates } } | null;
  if (refusal?.status !== 409) return null;
  const message = typeof refusal.message === 'string' ? refusal.message : '';
  if (refusal.code === 'ALREADY_MEMBER') return { status: 'already_member', membership_status: 'active', message };
  if (refusal.code === 'JOIN_QUIZ_REQUIRED' || refusal.code === 'JOIN_QUIZ_UNAVAILABLE') return { status: refusal.code === 'JOIN_QUIZ_REQUIRED' ? 'quiz_required' : 'quiz_unavailable', membership_status: 'pending_consent', message, join_gates: refusal.body?.join_gates };
  if (refusal.code === 'CONSENT_REQUIRED') {
    return { status: 'consent_required', membership_status: 'pending_consent', message, required_agreements: refusal.body?.required_agreements ?? [], join_gates: refusal.body?.join_gates };
  }
  return null; // MEMBERSHIP_PAUSED, or a 409 the client cannot read: a failure.
}

/** Only an active membership is called a join; a consent-gated one names the step left. */
export function joinToast(result: JoinResult, fallbackName?: string): ToastCopy {
  const name = result.ecosystem_name || fallbackName || 'this ecosystem';
  if (result.status === 'quiz_required') return { title: `Entry quiz required for ${name}`, description: 'Your membership is pending. Pass the configured quiz, then complete any agreement consent.' };
  if (result.status === 'quiz_unavailable') return { title: `Entry quiz needs steward attention`, description: `A required quiz for ${name} is not available. Your membership has not been activated.` };
  if (result.status === 'consent_required') {
    const titles = (result.required_agreements ?? []).map((agreement) => agreement.title);
    return {
      title: `One step left: consent to ${name}'s agreements`,
      description: titles.length ? `Read and consent to: ${titles.join(', ')}.` : 'Your membership waits until you consent.',
    };
  }
  if (result.status === 'already_member') return { title: `Already a member of ${name}` };
  if (result.outcome === 're_entry') return { title: `Welcome back to ${name}` };
  return { title: `Joined ${name}` };
}

/** One /auth/me `ecosystems[]` entry: the caller's own row there. */
export interface MembershipRow {
  id: string;
  membership_status?: string;
  role?: string;
  /** The server's steward rule there (FX-Onboard); absent on an older server. */
  is_steward?: boolean;
}

/** The caller's standing in an ecosystem: no row, active, pending consent, left (may join again), or another status join cannot change. */
export type MembershipStanding = 'none' | 'active' | 'pending' | 'left' | 'paused';

/** Standing from the row's own status; an API that sends no status (older server) made every row a member. */
export function membershipStanding(ecosystemId: string, memberships: readonly MembershipRow[]): MembershipStanding {
  const row = memberships.find((ecosystem) => ecosystem.id === ecosystemId);
  if (!row) return 'none';
  switch (row.membership_status) {
    case undefined:
    case 'active':
      return 'active';
    case 'pending_consent':
      return 'pending';
    case 'exited':
      return 'left';
    default:
      return 'paused';
  }
}

/** True when the caller holds a membership there that join would not change: any row except one they left. */
export function holdsMembershipIn(ecosystemId: string, memberships: readonly MembershipRow[]): boolean {
  const standing = membershipStanding(ecosystemId, memberships);
  return standing !== 'none' && standing !== 'left';
}

/** True when the caller is an active steward of that ecosystem: the server's `is_steward` (mod+ or a founder's
 * co_creator/builder row there), else, from an older server, an active mod, admin or owner. */
export function isStewardIn(ecosystemId: string, memberships: readonly MembershipRow[]): boolean {
  const row = memberships.find((ecosystem) => ecosystem.id === ecosystemId);
  if (membershipStanding(ecosystemId, memberships) !== 'active') return false;
  if (typeof row?.is_steward === 'boolean') return row.is_steward;
  return ['mod', 'admin', 'owner'].includes(row?.role ?? '');
}

/** One click for a non-member: join, then act (a failed join never acts); a member just acts. See client/src/AGENTS.md "Orientation journeys". */
export async function joinThen<TResult>(
  act: () => Promise<TResult>,
  { isMember, join }: { isMember: boolean; join: () => Promise<unknown> },
): Promise<TResult> {
  if (!isMember) await join();
  return act();
}
