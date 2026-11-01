import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyToolResult, pendingConfirmation, type ToolChip } from './chat-tools';

const WITHDRAW = "Withdrawing 'Bike shed' ends it for good.";

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
