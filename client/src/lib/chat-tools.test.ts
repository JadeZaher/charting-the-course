import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QueryClient, hashKey, type QueryKey } from '@tanstack/react-query';
import { applyToolResult, pendingConfirmation, refreshAfterTool, settleChatResponse, touchedRecord, type ToolChip, type ToolResultEvent } from './chat-tools';
import { healthKeys, keys, onboardingKeys } from './query-keys';

const WITHDRAW = "Withdrawing 'Bike shed' ends it for good.";

test('an empty completed or stopped response gives a readable recovery action', () => {
  for (const isStreaming of [true, false]) {
    const messages = [{ role: 'assistant' as const, content: '', isStreaming }];
    assert.equal(settleChatResponse(messages)[0].content, 'No reply arrived. Try again.');
    assert.equal(messages[0].content, '');
  }
});

test('a stopped response preserves known writes and marks unfinished action outcomes as unknown', () => {
  const tools: ToolChip[] = [{ name: 'record_advice', status: 'success' }, { name: 'join_domain', status: 'running' }];
  const messages = [{ role: 'assistant' as const, content: '', isStreaming: true, tools }];
  const [finished] = settleChatResponse(messages);
  assert.equal(finished.tools?.[0].status, 'success');
  assert.equal(finished.tools?.[1].status, 'unknown');
  assert.match(finished.tools?.[1].error ?? '', /Check the record before trying again/);
  assert.equal(finished.isStreaming, false);
  assert.equal(messages[0].tools[1].status, 'running');
  assert.equal(finished.content, 'Check the action results above.');
});

test('a tool result settles the oldest running call of that tool, with its outcome', () => {
  const chips: ToolChip[] = [
    { name: 'search_proposals', label: 'Searching proposals', status: 'success' },
    { name: 'update_proposal_status', label: 'Moving a proposal on', status: 'running' },
    { name: 'update_proposal_status', label: 'Moving a proposal on', status: 'running' },
  ];
  const cases = [
    { event: { name: 'update_proposal_status', success: false, needs_confirmation: WITHDRAW }, status: 'needs_confirmation', confirmation: WITHDRAW },
    { event: { name: 'update_proposal_status', success: false, error: 'Only the proposer or an ecosystem steward can change this proposal' }, status: 'error', confirmation: undefined },
    { event: { name: 'update_proposal_status', success: true }, status: 'success', confirmation: undefined },
  ] as const;
  for (const { event, status, confirmation } of cases) {
    const after = applyToolResult(chips, event);
    assert.equal(after[1].status, status, event.success ? 'success' : event.needs_confirmation ? 'asked' : 'refused');
    assert.equal(after[1].confirmation, confirmation);
    assert.equal(after[2].status, 'running', 'the second call is still in flight');
    assert.equal(after[0].status, 'success', 'other tools are untouched');
  }
});

test('the confirmation card shows only while the latest finished reply is waiting for the member', () => {
  const asked = { role: 'assistant' as const, tools: [{ name: 'update_proposal_status', status: 'needs_confirmation' as const, confirmation: WITHDRAW }] };
  const rows = [
    { messages: [{ role: 'user' as const }, asked], expected: WITHDRAW },
    { messages: [{ role: 'user' as const }, { ...asked, isStreaming: true }], expected: null },
    { messages: [asked, { role: 'user' as const }], expected: null }, // the member already answered
    { messages: [{ role: 'user' as const }, { role: 'assistant' as const, tools: [{ name: 'update_proposal_status', status: 'success' as const }] }], expected: null },
    { messages: [], expected: null },
  ];
  for (const { messages, expected } of rows) {
    assert.equal(pendingConfirmation(messages), expected);
  }
});

test('failed, waiting and read-only tools do not refresh data or membership', () => {
  const events: ToolResultEvent[] = [
    { name: 'get_proposal', success: true, data: { link: '/proposals/p1' } },
    { name: 'explain_status', success: true },
    { name: 'what_needs_me', success: true },
    { name: 'find_shares_needs', success: true },
    { name: 'update_proposal_status', success: false, error: 'no' },
    { name: 'join_ecosystem', success: false, needs_confirmation: 'Sure?' },
    { name: 'attest_agreement_consent', success: true, needs_confirmation: 'Sure?' },
  ];
  for (const event of events) assert.deepEqual(refreshAfterTool(event), { queryKeys: [], refreshSession: false }, event.name);
});

async function staleAfter(event: ToolResultEvent, cached: readonly QueryKey[]) {
  const client = new QueryClient();
  for (const key of cached) client.setQueryData(key, 'cached');
  for (const queryKey of refreshAfterTool(event).queryKeys) await client.invalidateQueries({ queryKey });
  return new Set(client.getQueryCache().findAll().filter((query) => query.state.isInvalidated).map((query) => query.queryHash));
}

test('assistant proposal actions refresh detail, filtered lists, decisions, dashboard and computed health', async () => {
  const affected = [keys.proposals.detail('p1'), keys.proposals.explain('p1'),
    keys.proposals.list({ status: 'advice' }), keys.proposals.list({ status: 'consent' }),
    keys.decisions.list(), keys.myDecisions.list(), keys.dashboard.summary(['e1']),
    keys.nextSteps.mine(), healthKeys.snapshot({ ecosystem_id: 'e1' })];
  const unrelated = keys.conversations.list();
  for (const event of [
    { name: 'update_proposal_status', success: true, data: { link: '/proposals/p1' } },
    { name: 'record_advice', success: true, data: {} },
  ]) {
    const stale = await staleAfter(event, [...affected, unrelated]);
    for (const key of affected) assert.ok(stale.has(hashKey(key)), `${event.name}: ${hashKey(key)} stayed stale on screen`);
    assert.equal(stale.has(hashKey(unrelated)), false);
  }
});

test('exchange actions refresh posts and messages even when the result links only to the conversation', async () => {
  const affected = [keys.sharesNeeds.detail('p1'), keys.sharesNeeds.list({ type: 'need' }),
    keys.sharesNeeds.forDomain('d1'), keys.sharesNeeds.forEcosystem('e1'), keys.sharesNeeds.moderation(),
    keys.conversations.detail('c1'), keys.conversations.messages('c1', 1), keys.conversations.list(),
    keys.profiles.mine(), keys.nextSteps.mine()];
  const stale = await staleAfter({ name: 'respond_to_share_need', success: true, data: { link: '/messaging?conversation=c1' } }, affected);
  for (const key of affected) assert.ok(stale.has(hashKey(key)), `${hashKey(key)} did not follow the assistant's answer`);
});

test('collaboration actions refresh their filtered lists and steward queue', async () => {
  const affected = [keys.collaborations.detail('c1'), keys.collaborations.list({ status: 'proposed' }), keys.nextSteps.mine()];
  const stale = await staleAfter({ name: 'approve_collaboration', success: true, data: { link: '/discover/collaborations/c1' } }, affected);
  for (const key of affected) assert.ok(stale.has(hashKey(key)));
});

test('joining or attesting membership consent refreshes the session and newcomer surfaces', async () => {
  for (const name of ['join_ecosystem', 'attest_agreement_consent']) {
    const event = { name, success: true };
    assert.equal(refreshAfterTool(event).refreshSession, true);
    const affected = [keys.members.list(), keys.nextSteps.mine(), onboardingKeys.newcomers(), keys.ecosystems.list()];
    const stale = await staleAfter(event, affected);
    for (const key of affected) assert.ok(stale.has(hashKey(key)), `${name}: ${hashKey(key)}`);
  }
  const affected = [keys.members.profile('m1'), onboardingKeys.newcomers()];
  const stale = await staleAfter({ name: 'move_member', success: true }, affected);
  for (const key of affected) assert.ok(stale.has(hashKey(key)));
  assert.equal(refreshAfterTool({ name: 'record_advice', success: true }).refreshSession, false);
});

test('only safe internal record and query routes identify the touched data', () => {
  const routes = [
    ['/proposals/p1?from=assistant#details', 'proposals', 'p1'],
    ['/discover?tab=shares-needs&post=p1', 'sharesNeeds', 'p1'],
    ['/messaging?conversation=c1', 'conversations', 'c1'],
    ['/discover/collaborations/c1', 'collaborations', 'c1'],
    ['/collaborations/c1', 'collaborations', 'c1'],
    ['/ecosystems/e1', 'ecosystems', 'e1'],
    ['/members/m1', 'members', 'm1'],
  ] as const;
  for (const [link, collection, id] of routes) assert.deepEqual(touchedRecord({ name: 'act', data: { link } }), { collection, id });
  assert.deepEqual(touchedRecord({ name: 'act', artifact: { route: '/exit/e9' } }), { collection: 'exits', id: 'e9' });
  for (const link of ['https://evil.example/proposals/p1', '//evil.example/proposals/p1', '/.//evil.example/proposals/p1',
    '/\\evil.example/proposals/p1', '/discover?tab=shares-needs&post=https://evil.example', '/messaging?conversation=../c1']) {
    assert.equal(touchedRecord({ name: 'act', data: { link } }), null, link);
  }
});

test('typed support proposal refreshes proposals only after the frozen change completes', async () => {
  const affected = [keys.proposals.all, keys.nextSteps.all, keys.dashboard.all];
  const prepared = { name: 'node_support_prepare_proposal', success: false, needs_confirmation: 'Review this draft' };
  assert.deepEqual(refreshAfterTool(prepared).queryKeys, []);
  const completed = { name: 'node_support_prepare_proposal', success: true, data: { link: '/proposals/typed-p1' } };
  const stale = await staleAfter(completed, affected);
  for (const key of affected) assert.ok(stale.has(hashKey(key)));
});
