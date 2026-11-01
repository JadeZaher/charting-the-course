import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { apiMutationOptions, type ShowToast } from './api-mutation-options';
import { holdsMembershipIn, isStewardIn, joinEcosystemMutation, joinThen, membershipStanding, type JoinOptions, type JoinResult } from './ecosystem-join';
import { keys } from './query-keys';

// Drives the options through TanStack's MutationObserver and a real QueryClient, as useApiMutation does.
// The server is faked at the request edge; the session refresh is counted.

/** Stand-in for ApiCodedError (lib/api-client.ts pulls import.meta.env, so it cannot load under node). */
function refusal(status: number, message: string, code?: string, body: Record<string, unknown> = {}) {
  return Object.assign(new Error(message), { status, code, body: { error: message, code, ...body } });
}

const uaf = { id: 'a-uaf', title: 'Universal Agreement Field', version: '1.0' };

function join(serve: () => Promise<JoinResult>, options: JoinOptions = { ecosystemName: 'Garden' }) {
  const queryClient = new QueryClient();
  const catalogue = keys.ecosystems.list({ page: '1', per_page: '20' });
  const queue = keys.nextSteps.mine();
  queryClient.setQueryData(catalogue, 'cached');
  queryClient.setQueryData(queue, 'cached');
  const toasts: Parameters<ShowToast>[0][] = [];
  let sessionRefreshes = 0;
  const mutation = joinEcosystemMutation(serve, async () => { sessionRefreshes += 1; }, options);
  const outcome = new MutationObserver(queryClient, apiMutationOptions(mutation, { queryClient, toast: (copy) => toasts.push(copy) }))
    .mutate()
    .then((result) => ({ result, error: null }), (error: unknown) => ({ result: null, error }));
  return outcome.then(({ result, error }) => ({
    result,
    error,
    toasts,
    sessionRefreshes: () => sessionRefreshes,
    catalogueInvalidated: queryClient.getQueryState(catalogue)?.isInvalidated,
    queueInvalidated: queryClient.getQueryState(queue)?.isInvalidated,
  }));
}

test('a join refreshes the session and the queue, and names what happened to the membership', async () => {
  const cases: Array<[moment: string, answer: JoinResult, title: string]> = [
    ['new and active', { status: 'joined', outcome: 'joined', membership_status: 'active', message: 'Welcome', ecosystem_name: 'Garden' }, 'Joined Garden'],
    ['came back', { status: 'joined', outcome: 're_entry', membership_status: 'active', message: 'Welcome back', ecosystem_name: 'Garden' }, 'Welcome back to Garden'],
    ['gate ahead', { status: 'consent_required', outcome: 'joined', membership_status: 'pending_consent', message: 'Consent first', ecosystem_name: 'Garden', required_agreements: [uaf] }, "One step left: consent to Garden's agreements"],
    ['came back to a gate', { status: 'consent_required', outcome: 're_entry', membership_status: 'pending_consent', message: 'Consent first', ecosystem_name: 'Garden', required_agreements: [uaf] }, "One step left: consent to Garden's agreements"],
  ];
  for (const [moment, answer, title] of cases) {
    const run = await join(async () => answer);
    assert.equal(run.sessionRefreshes(), 1, `${moment}: /auth/me changed`);
    assert.equal(run.toasts.length, 1, moment);
    assert.equal(run.toasts[0].title, title, moment);
    assert.equal(run.catalogueInvalidated, true, `${moment}: the catalogue's Join buttons refresh`);
    assert.equal(run.queueInvalidated, true, `${moment}: the newcomer's queue items change`);
  }
  const gated = await join(async () => cases[2][1]);
  assert.match(gated.toasts[0].description ?? '', /Universal Agreement Field/, 'the consent toast names what is left');
});

test('a 409 saying the caller is already in resolves, refreshes the stale session and claims no join', async () => {
  const member = await join(() => Promise.reject(refusal(409, 'Already a member of this ecosystem', 'ALREADY_MEMBER')));
  assert.equal(member.error, null);
  assert.equal(member.result?.status, 'already_member');
  assert.equal(member.sessionRefreshes(), 1);
  assert.deepEqual(member.toasts, [{ title: 'Already a member of Garden' }]);

  const pending = await join(() => Promise.reject(refusal(409, 'Consent first', 'CONSENT_REQUIRED', { required_agreements: [uaf] })));
  assert.equal(pending.error, null);
  assert.equal(pending.result?.status, 'consent_required');
  assert.equal(pending.sessionRefreshes(), 1);
  assert.equal(pending.toasts.length, 1);
  assert.doesNotMatch(pending.toasts[0].title, /Joined/);
  assert.match(pending.toasts[0].description ?? '', /Universal Agreement Field/);
});

test("every other refusal is a failure in the server's words, toasted once unless the page shows it inline", async () => {
  const refusals: Array<[moment: string, error: Error]> = [
    ['private or unknown', refusal(404, 'Ecosystem not found')],
    ['paused membership', refusal(409, 'Your membership here is paused', 'MEMBERSHIP_PAUSED')],
    ['a 409 the client cannot read', refusal(409, 'Something changed; try again')],
    ['left and may not return', refusal(403, 'You cannot rejoin yet', 'RE_ENTRY_CLOSED')],
  ];
  for (const [moment, error] of refusals) {
    const toasted = await join(() => Promise.reject(error));
    assert.equal(toasted.error, error, moment);
    assert.equal(toasted.sessionRefreshes(), 0, moment);
    assert.deepEqual(toasted.toasts, [{ variant: 'destructive', title: 'Could not join Garden', description: error.message }], moment);
    assert.equal(toasted.catalogueInvalidated, false, moment);

    const inline = await join(() => Promise.reject(error), { ecosystemName: 'Garden', silent: true });
    assert.equal(inline.error, error, `${moment}: the caller still gets the error to render`);
    assert.deepEqual(inline.toasts, [], `${moment}: silent leaves the one error to the page`);
  }
});

// Begin orientation / consent to an ethos: joinThen with the real (silent) join options as the join step.
function beginOrientation({ isMember, serveJoin }: { isMember: boolean; serveJoin: () => Promise<JoinResult> }) {
  const queryClient = new QueryClient();
  const toasts: Parameters<ShowToast>[0][] = [];
  const timeline: string[] = [];
  const joinOptions = joinEcosystemMutation(
    () => { timeline.push('join request'); return serveJoin(); },
    async () => { timeline.push('session refresh'); },
    { ecosystemName: 'Garden', silent: true },
  );
  const joinObserver = new MutationObserver(queryClient, apiMutationOptions(joinOptions, { queryClient, toast: (copy) => toasts.push(copy) }));
  const start = async () => { timeline.push('start'); return 'progress saved'; };
  return joinThen(start, { isMember, join: () => joinObserver.mutate() })
    .then((result) => ({ result, error: null }), (error: unknown) => ({ result: null, error }))
    .then((outcome) => ({ ...outcome, timeline, toasts }));
}

test('a non-member begins in one click: the join (and its session refresh) lands before the start', async () => {
  const served: Array<[string, () => Promise<JoinResult>]> = [
    ['joined', () => Promise.resolve({ status: 'joined', outcome: 'joined', message: 'Welcome', ecosystem_name: 'Garden' })],
    ['consent_required', () => Promise.resolve({ status: 'consent_required', outcome: 'joined', message: 'Consent first', ecosystem_name: 'Garden' })],
    // Joined in another tab: the stale session's 409 still starts.
    ['already_member', () => Promise.reject(refusal(409, 'Already a member of this ecosystem', 'ALREADY_MEMBER'))],
  ];
  for (const [status, serve] of served) {
    const run = await beginOrientation({ isMember: false, serveJoin: serve });
    assert.equal(run.error, null, status);
    assert.equal(run.result, 'progress saved', status);
    assert.deepEqual(run.timeline, ['join request', 'session refresh', 'start'], status);
    assert.equal(run.toasts.length, 1, `${status}: the join says what happened to the membership`);
  }
});

test('a member begins without joining; a refused join never starts and leaves its one error to the page', async () => {
  const member = await beginOrientation({ isMember: true, serveJoin: () => Promise.reject(new Error('never called')) });
  assert.deepEqual(member.timeline, ['start']);
  assert.deepEqual(member.toasts, []);

  const refused = await beginOrientation({ isMember: false, serveJoin: () => Promise.reject(refusal(404, 'Ecosystem not found')) });
  assert.ok(refused.error instanceof Error);
  assert.equal((refused.error as Error).message, 'Ecosystem not found');
  assert.deepEqual(refused.timeline, ['join request']);
  assert.deepEqual(refused.toasts, [], 'no toast: the page renders the error inline once');
});

test("a membership row's own status decides what the caller is offered", () => {
  const row = (membership_status?: string, role?: string, is_steward?: boolean) => [{ id: 'eco-garden', membership_status, role, is_steward }];
  const cases: Array<[moment: string, rows: ReturnType<typeof row> | [], standing: string, holds: boolean, steward: boolean]> = [
    ['no row', [], 'none', false, false],
    ['active member', row('active', 'user'), 'active', true, false],
    ['active steward', row('active', 'mod'), 'active', true, true],
    ['active owner', row('active', 'owner'), 'active', true, true],
    // FX-Onboard: the server's flag decides; a founder (role user, co_creator there) stewards their ecosystem.
    ['founder, server says steward', row('active', 'user', true), 'active', true, true],
    ['pending founder: steward only once active', row('pending_consent', 'user', true), 'pending', true, false],
    ['pending steward (role paused)', row('pending_consent', 'admin'), 'pending', true, false],
    ['left: join again', row('exited', 'owner'), 'left', false, false],
    ['suspended', row('suspended', 'user'), 'paused', true, false],
    ['older API, no status', row(undefined, 'user'), 'active', true, false],
  ];
  for (const [moment, rows, standing, holds, steward] of cases) {
    assert.equal(membershipStanding('eco-garden', rows), standing, moment);
    assert.equal(holdsMembershipIn('eco-garden', rows), holds, moment);
    assert.equal(isStewardIn('eco-garden', rows), steward, moment);
  }
});
