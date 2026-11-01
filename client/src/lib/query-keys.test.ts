import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient, hashKey, type QueryKey } from '@tanstack/react-query';
import { affects, ecosystemScoped, keys } from './query-keys';

// Invalidation is checked with a real QueryClient: the same prefix matching invalidateQueries uses in the app.

/** Hashes of the cached keys that invalidating `prefixes` marks stale. */
async function invalidatedBy(prefixes: readonly QueryKey[], cached: readonly QueryKey[]): Promise<Set<string>> {
  const client = new QueryClient();
  for (const key of cached) client.setQueryData(key, 'cached');
  for (const queryKey of prefixes) await client.invalidateQueries({ queryKey });
  const stale = client.getQueryCache().findAll().filter((query) => query.state.isInvalidated);
  return new Set(stale.map((query) => query.queryHash));
}

/** Every key an entity can produce, calling each key function with placeholder arguments. */
function sampleKeys(entity: Record<string, unknown>): QueryKey[] {
  return Object.values(entity).map((value) => {
    if (typeof value !== 'function') return value as QueryKey;
    const placeholders = Array.from({ length: value.length }, (_, index) => `sample-${index}`);
    return value(...placeholders) as QueryKey;
  });
}

const entities = Object.entries(keys) as Array<[string, Record<string, unknown> & { all: QueryKey }]>;

test('invalidating an entity reaches every key it produces, and nothing owned by another entity', async () => {
  const everyKey = entities.flatMap(([, entity]) => sampleKeys(entity));
  for (const [name, entity] of entities) {
    const own = new Set(sampleKeys(entity).map(hashKey));
    const reached = await invalidatedBy([entity.all], everyKey);
    assert.deepEqual([...own].filter((hash) => !reached.has(hash)), [], `${name}.all misses some of its own keys`);
    assert.deepEqual([...reached].filter((hash) => !own.has(hash)), [], `${name}.all reaches another entity's keys`);
  }
});

test('every invalidation and ecosystem-switch prefix names a root the factory owns', () => {
  const roots = new Set(entities.map(([, entity]) => hashKey(entity.all)));
  const prefixes = [...Object.values(affects).flat(), ...ecosystemScoped];
  for (const prefix of prefixes) {
    assert.ok(roots.has(hashKey([prefix[0]])), `${hashKey(prefix)} is not a factory root (phantom key)`);
  }
});

test('a proposal change refreshes its page, every list badge, the dashboard queue and my decisions', async () => {
  const surfaces = [
    keys.proposals.detail('p-1'),
    keys.proposals.list({ phase: 'advice', ecosystem_ids: 'e-1' }),
    keys.dashboard.summary(['e-1']),
    keys.myDecisions.list(),
    keys.decisions.list(),
  ];
  const untouched = keys.members.list();
  const reached = await invalidatedBy(affects.proposals, [...surfaces, untouched]);
  for (const surface of surfaces) assert.ok(reached.has(hashKey(surface)), `${hashKey(surface)} stays stale`);
  assert.ok(!reached.has(hashKey(untouched)), 'a proposal change should not refetch the member list');
});

test('a share or need change refreshes every surface that lists shares and needs', async () => {
  const surfaces = [
    keys.sharesNeeds.list({ type: 'share' }),
    keys.sharesNeeds.moderation({ status: 'active' }),
    keys.sharesNeeds.forEcosystem('e-1'),
    keys.sharesNeeds.forDomain('d-1'),
    keys.profiles.detail('kofi'),
    keys.profiles.mine(),
    keys.myDecisions.list(),
  ];
  const reached = await invalidatedBy(affects.sharesNeeds, surfaces);
  for (const surface of surfaces) assert.ok(reached.has(hashKey(surface)), `${hashKey(surface)} stays stale`);
});

// GET handlers that filter by the selected-ecosystem cookie (api/helpers.py get_ecosystem_ids), surveyed 2026-10-31.
const cookieScopedReads: Array<[endpoint: string, key: QueryKey]> = [
  ['/agreements/', keys.agreements.list()],
  ['/badges/', keys.badges.list()],
  ['/chat/sessions', keys.chatSessions.list()],
  ['/compliance/latest', keys.compliance.latest()],
  ['/compliance/history', keys.compliance.history()],
  ['/conflicts/', keys.conflicts.list()],
  ['/courses/', keys.courses.list()],
  ['/dashboard/summary', keys.dashboard.summary(['e-1'])],
  ['/decisions/', keys.decisions.list()],
  ['/domains/', keys.domains.list()],
  ['/emergency/', keys.emergency.list()],
  ['/emergency/:id', keys.emergency.detail('em-1')],
  ['/exit/', keys.exits.list()],
  ['/exit/:id', keys.exits.detail('x-1')],
  ['/members/', keys.members.list()],
  ['/messaging/conversations', keys.conversations.list()],
  ['/messaging/conversations/:id', keys.conversations.detail('c-1')],
  ['/messaging/conversations/:id/messages', keys.conversations.messages('c-1', 1)],
  ['/messaging/search', keys.conversations.search('budget')],
  ['/onboarding/', keys.onboarding.list()],
  ['/onboarding/:member_id/ceremony', keys.onboarding.ceremony('m-1')],
  ['/proposals/', keys.proposals.list()],
  ['/quiz-assignments/', keys.quizAssignments.list()],
  ['/safeguards/', keys.safeguards.overview()],
  ['/safeguards/audits', keys.audits.list()],
  ['/teams/', keys.teams.list()],
];

test('switching ecosystems refetches every read the server scopes to the selection', async () => {
  const reached = await invalidatedBy(ecosystemScoped, cookieScopedReads.map(([, key]) => key));
  for (const [endpoint, key] of cookieScopedReads) {
    assert.ok(reached.has(hashKey(key)), `GET /api/v1${endpoint} keeps the previous ecosystem's data`);
  }
});

// G-Next: the bell and the dashboard queue (keys.nextSteps) and each record's status banner (`explain`).
test("a governance act refreshes the member's queue and that record's status banner", async () => {
  const banners: Array<[keyof typeof affects, QueryKey | null]> = [
    ['proposals', keys.proposals.explain('p-1')],
    ['agreements', keys.agreements.explain('a-1')],
    ['conflicts', keys.conflicts.explain('c-1')],
    ['emergency', keys.emergency.explain('em-1')],
    ['exits', keys.exits.explain('x-1')],
    ['audits', null],
  ];
  for (const [domain, banner] of banners) {
    const surfaces = [keys.nextSteps.mine(), ...(banner ? [banner] : [])];
    const reached = await invalidatedBy(affects[domain], surfaces);
    for (const surface of surfaces) assert.ok(reached.has(hashKey(surface)), `${domain}: ${hashKey(surface)} stays stale`);
  }
});
