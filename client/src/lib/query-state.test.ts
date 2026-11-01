import { test } from 'node:test';
import assert from 'node:assert/strict';
import { queryStatePhase, type QueryPhase, type QuerySnapshot } from './query-state';

type Journey = { steps: string[] };
const hasNoSteps = (journey: Journey) => journey.steps.length === 0;
const failure = new Error('Not found');

test('each query moment renders as the phase a member should see', () => {
  const cases: Array<[moment: string, query: QuerySnapshot<Journey>, expected: QueryPhase]> = [
    ['first load in flight', { data: undefined, error: null, fetchStatus: 'fetching' }, 'loading'],
    ['first load waiting for the network', { data: undefined, error: null, fetchStatus: 'paused' }, 'loading'],
    // M5: `enabled: ecosystemIds.length > 0` or `q.length > 2` is not a load in flight; it must not spin forever.
    ['disabled, never fetched', { data: undefined, error: null, fetchStatus: 'idle' }, 'idle'],
    // F02: a failed load must not read as "Journey complete or no steps found".
    ['first load failed', { data: undefined, error: failure, fetchStatus: 'idle' }, 'error'],
    ['loaded, nothing in it', { data: { steps: [] }, error: null, fetchStatus: 'idle' }, 'empty'],
    ['loaded with content', { data: { steps: ['Welcome'] }, error: null, fetchStatus: 'idle' }, 'ready'],
    ['refreshing over content', { data: { steps: ['Welcome'] }, error: null, fetchStatus: 'fetching' }, 'ready'],
    // A failed background refresh keeps content (and any half-filled form) on screen.
    ['refresh failed over content', { data: { steps: ['Welcome'] }, error: failure, fetchStatus: 'idle' }, 'ready'],
    // ...but never asserts absence it can no longer vouch for.
    ['refresh failed over an empty result', { data: { steps: [] }, error: failure, fetchStatus: 'idle' }, 'error'],
  ];
  for (const [moment, query, expected] of cases) {
    assert.equal(queryStatePhase(query, hasNoSteps), expected, moment);
  }
});

test('a query that resolved to null has loaded; only isEmpty decides it is empty', () => {
  assert.equal(queryStatePhase<Journey | null>({ data: null, error: null, fetchStatus: 'idle' }), 'ready');
  assert.equal(
    queryStatePhase<Journey | null>({ data: null, error: null, fetchStatus: 'idle' }, (journey) => journey === null),
    'empty',
  );
});
