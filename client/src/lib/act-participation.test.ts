import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MutationObserver, QueryClient } from '@tanstack/react-query';
import { actParticipationMutation, type ActStep } from './act-participation';
import { apiMutationOptions, type ShowToast } from './api-mutation-options';
import type { ActOutcome } from './proposal-vocab';
import { keys } from './query-keys';

// Drives the options through TanStack's MutationObserver and a real QueryClient, as useApiMutation does.

/** A QueryClient holding every surface a proposal appears on, plus a toast recorder. */
function harness() {
  const queryClient = new QueryClient();
  const surfaces = {
    detail: keys.proposals.detail('p-1'),
    listBadge: keys.proposals.list({ status: 'consent' }),
    dashboardQueue: keys.dashboard.summary(['e-1']),
    members: keys.members.list(),
  };
  for (const key of Object.values(surfaces)) queryClient.setQueryData(key, 'cached');
  const toasts: Parameters<ShowToast>[0][] = [];
  const submit = (step: ActStep, served: ActOutcome) =>
    new MutationObserver(
      queryClient,
      apiMutationOptions(actParticipationMutation(async () => served, step), { queryClient, toast: (copy) => toasts.push(copy) }),
    ).mutate({ position: 'consent' });
  const invalidated = (key: readonly unknown[]) => queryClient.getQueryState(key)?.isInvalidated;
  return { surfaces, toasts, submit, invalidated };
}

test('a position that completes the consent round announces the move and refreshes the list badge and queue, not only the page', async () => {
  const { surfaces, toasts, submit, invalidated } = harness();

  await submit('consent', { auto_transitions: ['consent->test'] });

  assert.equal(toasts.length, 1);
  assert.equal(toasts[0].title, 'Proposal moved to Test');
  assert.equal(invalidated(surfaces.detail), true);
  assert.equal(invalidated(surfaces.listBadge), true, 'the list badge still read Consent before (F01)');
  assert.equal(invalidated(surfaces.dashboardQueue), true, 'the dashboard queue still listed it as awaiting consent');
  assert.equal(invalidated(surfaces.members), false, 'surfaces a proposal move cannot change are left alone');
});

test('an entry that leaves the proposal in its phase confirms the entry instead of claiming a move', async () => {
  const cases: Array<[ActStep, string]> = [
    ['advice', 'Advice submitted'],
    ['consent', 'Position recorded'],
    ['test', 'Test report submitted'],
  ];
  for (const [step, title] of cases) {
    const { toasts, submit } = harness();
    await submit(step, { auto_transitions: [] });
    assert.deepEqual(toasts.map((toast) => toast.title), [title], step);
  }
});
