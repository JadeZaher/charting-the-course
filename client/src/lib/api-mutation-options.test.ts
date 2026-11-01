import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MutationObserver, QueryClient, QueryObserver } from '@tanstack/react-query';
import { apiMutationOptions, type ApiMutationOptions, type ShowToast } from './api-mutation-options';

// The options run through TanStack's own MutationObserver and a real QueryClient: the engine useMutation drives.

type Saved = { id: string };
const PROPOSAL = ['proposals', 'detail', 'p-1'];
const MEMBERS = ['members', 'list', {}];

const later = <Value>(value: Value) => new Promise<Value>((resolve) => setTimeout(() => resolve(value), 5));

/** A QueryClient with a cached proposal and member list, a toast recorder, and a runner for one mutation. */
function harness() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(PROPOSAL, 'stale');
  queryClient.setQueryData(MEMBERS, []);
  const toasts: Parameters<ShowToast>[0][] = [];
  const toast: ShowToast = (copy) => toasts.push(copy);
  const run = <Variables>(options: ApiMutationOptions<Saved, Variables, unknown>, variables: Variables) =>
    new MutationObserver(queryClient, apiMutationOptions(options, { queryClient, toast })).mutate(variables);
  return { queryClient, toasts, run };
}

test('a successful write runs the caller first, then refreshes exactly the declared keys before resolving', async () => {
  const { queryClient, toasts, run } = harness();
  let served = 'stale';
  // An on-screen proposal: invalidation refetches it, slowly enough that an unawaited refetch would lose the race.
  const onScreen = new QueryObserver(queryClient, { queryKey: PROPOSAL, queryFn: () => later(served), staleTime: Infinity });
  const unsubscribe = onScreen.subscribe(() => {});
  served = 'fresh';
  const invalidatedWhenCallerRan: Array<boolean | undefined> = [];

  const saved = await run({
    mutationFn: async (id: string) => ({ id }),
    onSuccess: () => {
      invalidatedWhenCallerRan.push(queryClient.getQueryState(PROPOSAL)?.isInvalidated);
    },
    success: (result) => `Saved ${result.id}`,
    invalidates: [['proposals']],
  }, 'p-1');
  unsubscribe();

  assert.deepEqual(saved, { id: 'p-1' });
  assert.deepEqual(invalidatedWhenCallerRan, [false], 'the caller ran once, before anything was invalidated');
  assert.deepEqual(toasts, [{ title: 'Saved p-1' }]);
  assert.equal(queryClient.getQueryData(PROPOSAL), 'fresh', 'the refetch landed before the mutation resolved');
  assert.equal(queryClient.getQueryState(MEMBERS)?.isInvalidated, false, 'keys outside `invalidates` are untouched');
});

test('a throwing onSuccess is logged, and the write still reports success without a rollback', async () => {
  const { queryClient, toasts, run } = harness();
  const rollbacks: unknown[] = [];
  const logged: unknown[][] = [];
  const consoleError = console.error;
  console.error = (...args: unknown[]) => void logged.push(args);
  try {
    const saved = await run({
      mutationFn: async () => ({ id: 'p-1' }),
      onSuccess: () => {
        throw new TypeError("Cannot read properties of undefined (reading 'items')");
      },
      onError: (error) => void rollbacks.push(error),
      success: 'Saved',
      invalidates: [['proposals']],
    }, undefined);
    assert.deepEqual(saved, { id: 'p-1' });
  } finally {
    console.error = consoleError;
  }

  assert.deepEqual(rollbacks, [], "the caller's onError (its rollback) never ran");
  assert.deepEqual(toasts, [{ title: 'Saved' }], 'the success toast, not a destructive one');
  assert.equal(queryClient.getQueryState(PROPOSAL)?.isInvalidated, true, 'the declared keys were still invalidated');
  assert.equal(logged.length, 1, 'the callback failure is reported to the console');
});

test('a failed write toasts its error unless silent, then hands it to the caller for rollback', async () => {
  for (const silent of [false, true]) {
    const { queryClient, toasts, run } = harness();
    const failure = Object.assign(new Error('Forbidden'), { status: 403 });
    const toastsBeforeRollback: number[] = [];

    await assert.rejects(run({
      mutationFn: async () => {
        throw failure;
      },
      onError: () => void toastsBeforeRollback.push(toasts.length),
      error: 'Consent not recorded',
      silent,
      invalidates: [['proposals']],
    }, undefined), failure);

    const expectedToasts = silent
      ? []
      : [{ variant: 'destructive', title: 'Consent not recorded', description: "You don't have permission to do that." }];
    assert.deepEqual(toasts, expectedToasts, `silent: ${silent}`);
    assert.deepEqual(toastsBeforeRollback, [expectedToasts.length], 'the rollback runs once, after the toast');
    assert.equal(queryClient.getQueryState(PROPOSAL)?.isInvalidated, false, 'nothing is refreshed after a failure');
  }
});
