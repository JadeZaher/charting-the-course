import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { apiMutationOptions, type ShowToast } from './api-mutation-options';
import { joinEcosystemMutation, joinThen, type JoinResult } from './ecosystem-join';
import { keys } from './query-keys';

// Drives the options through TanStack's MutationObserver and a real QueryClient, as useApiMutation does.
// The server is faked at the request edge; the session refresh is counted.

/** Stand-in for ApiFetchError (lib/api-client.ts pulls import.meta.env, so it cannot load under node). */
function refusal(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function join(serve: () => Promise<JoinResult>) {
  const queryClient = new QueryClient();
  const catalogue = keys.ecosystems.list({ page: '1', per_page: '20' });
  queryClient.setQueryData(catalogue, 'cached');
  const toasts: Parameters<ShowToast>[0][] = [];
  let sessionRefreshes = 0;
  const options = joinEcosystemMutation(serve, async () => { sessionRefreshes += 1; });
  const outcome = new MutationObserver(queryClient, apiMutationOptions(options, { queryClient, toast: (copy) => toasts.push(copy) }))
    .mutate()
    .then((result) => ({ result, error: null }), (error: unknown) => ({ result: null, error }));
  return outcome.then(({ result, error }) => ({
    result,
    error,
    toasts,
    sessionRefreshes: () => sessionRefreshes,
    catalogueInvalidated: queryClient.getQueryState(catalogue)?.isInvalidated,
  }));
}

test('a join refreshes the session and only claims membership when the server made the caller active', async () => {
  const cases: Array<[string, string, RegExp]> = [
    ['joined', 'Joined', /You are now an active member/],
    ['consent_required', 'Orientation requested', /This does not make you a member yet/],
  ];
  for (const [status, title, description] of cases) {
    const message = status === 'joined' ? 'Welcome to Commons! You are now an active member.' : 'Consent to the ecosystem agreements before participating in Commons.';
    const run = await join(async () => ({ status, message }));
    assert.equal(run.sessionRefreshes(), 1, `${status}: /auth/me changed`);
    assert.equal(run.toasts.length, 1, status);
    assert.equal(run.toasts[0].title, title, status);
    assert.match(run.toasts[0].description ?? '', description, status);
    assert.equal(run.catalogueInvalidated, true, `${status}: the catalogue's Join buttons refresh`);
  }
});

test('a 409 means the membership already exists: it resolves, refreshes the stale session and toasts no failure', async () => {
  const run = await join(() => Promise.reject(refusal(409, 'Already a member of this ecosystem')));

  assert.equal(run.error, null);
  assert.equal(run.result?.status, 'already_member');
  assert.equal(run.sessionRefreshes(), 1);
  assert.deepEqual(run.toasts, [{ title: 'Already a member' }]);
});

test('any other refusal toasts the failure in the server\'s words and leaves the session alone', async () => {
  const run = await join(() => Promise.reject(refusal(404, 'Ecosystem not found')));

  assert.ok(run.error instanceof Error);
  assert.equal(run.sessionRefreshes(), 0);
  assert.deepEqual(run.toasts, [{ variant: 'destructive', title: 'Orientation request failed', description: 'Ecosystem not found' }]);
  assert.equal(run.catalogueInvalidated, false);
});

// Begin orientation / consent to an ethos: joinThen with the real join options as the join step.
function beginOrientation({ isMember, serveJoin }: { isMember: boolean; serveJoin: () => Promise<JoinResult> }) {
  const queryClient = new QueryClient();
  const toasts: Parameters<ShowToast>[0][] = [];
  const timeline: string[] = [];
  const joinOptions = joinEcosystemMutation(
    () => { timeline.push('join request'); return serveJoin(); },
    async () => { timeline.push('session refresh'); },
  );
  const joinObserver = new MutationObserver(queryClient, apiMutationOptions(joinOptions, { queryClient, toast: (copy) => toasts.push(copy) }));
  const start = async () => { timeline.push('start'); return 'progress saved'; };
  return joinThen(start, { isMember, join: () => joinObserver.mutate() })
    .then((result) => ({ result, error: null }), (error: unknown) => ({ result: null, error }))
    .then((outcome) => ({ ...outcome, timeline, toasts }));
}

test('a non-member begins in one click: the join (and its session refresh) lands before the start', async () => {
  const served: Array<[string, () => Promise<JoinResult>]> = [
    ['joined', () => Promise.resolve({ status: 'joined', message: 'Welcome to Commons! You are now an active member.' })],
    ['consent_required', () => Promise.resolve({ status: 'consent_required', message: 'Consent to the ecosystem agreements first.' })],
    // Joined in another tab: the stale session's 409 still starts.
    ['already_member', () => Promise.reject(refusal(409, 'Already a member of this ecosystem'))],
  ];
  for (const [status, serve] of served) {
    const run = await beginOrientation({ isMember: false, serveJoin: serve });
    assert.equal(run.error, null, status);
    assert.equal(run.result, 'progress saved', status);
    assert.deepEqual(run.timeline, ['join request', 'session refresh', 'start'], status);
    assert.equal(run.toasts.length, 1, `${status}: the join says what happened to the membership`);
  }
});

test('a member begins without joining, and a refused join never starts', async () => {
  const member = await beginOrientation({ isMember: true, serveJoin: () => Promise.reject(new Error('never called')) });
  assert.deepEqual(member.timeline, ['start']);
  assert.deepEqual(member.toasts, []);

  const refused = await beginOrientation({ isMember: false, serveJoin: () => Promise.reject(refusal(404, 'Ecosystem not found')) });
  assert.ok(refused.error instanceof Error);
  assert.deepEqual(refused.timeline, ['join request']);
  assert.deepEqual(refused.toasts, [{ variant: 'destructive', title: 'Orientation request failed', description: 'Ecosystem not found' }]);
});
