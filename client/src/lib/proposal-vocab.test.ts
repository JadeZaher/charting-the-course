import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  adviceClosePrompt,
  announceActOutcome,
  groupProposalMoves,
  positionLabel,
  proposalEditLock,
  proposalPhaseAnnouncement,
  quorumExplanation,
  ratifiedBanner,
} from './proposal-vocab';

test('consent that completes the round explains the move to Test and what happens now', () => {
  assert.deepEqual(announceActOutcome({ auto_transitions: ['consent->test'] }), {
    title: 'Proposal moved to Test',
    description: 'The consent round is complete. The proposal is now being tried in practice.',
  });
});

test('a cascade names every completed step once and lands on the final phase', () => {
  assert.deepEqual(announceActOutcome({ auto_transitions: ['advice->consent', 'consent->test'] }), {
    title: 'Proposal moved to Test',
    description:
      'The advice round and the consent round are complete. The proposal is now being tried in practice.',
  });
});

test('ratification never claims the proposal is in force, and mentions the decision record only when minted', () => {
  const ratified = announceActOutcome({ auto_transitions: ['test->ratified'], decision_record_id: 'd-1' });
  assert.equal(ratified?.title, 'Proposal ratified');
  assert.ok(!/now active|in force/.test(ratified?.description ?? ''), ratified?.description);
  assert.ok(ratified?.description.includes('registers it'));
  assert.ok(ratified?.description.endsWith('A decision record was created.'));
  const withoutRecord = announceActOutcome({ auto_transitions: ['test->ratified'] });
  assert.ok(!withoutRecord?.description.includes('decision record'));
});

test('no automatic move yields no announcement, so the caller keeps its own confirmation', () => {
  for (const auto_transitions of [undefined, null, [], ['not-a-transition']]) {
    assert.equal(announceActOutcome({ auto_transitions }), null, JSON.stringify(auto_transitions));
  }
});

test('a send-back is announced as a revision, not as a plain move to Advice', () => {
  assert.equal(proposalPhaseAnnouncement('advice', 'consent').title, 'Sent back for revision');
  assert.equal(proposalPhaseAnnouncement('advice', 'draft').title, 'Status changed to Advice');
});

test('offered moves are drawn by kind and only when ready', () => {
  const groups = groupProposalMoves([
    { to: 'advice', ready: true, note_required: true },
    { to: 'test', ready: false, gate: 'consent' },
    { to: 'ratified', ready: true, gate: 'test', steward_only: true },
    { to: 'withdrawn', ready: true },
  ]);
  assert.deepEqual(groups.forward, []);  // the unmet consent gate hides "Start the test period"
  assert.equal(groups.ratify?.to, 'ratified');
  assert.equal(groups.revise?.to, 'advice');
  assert.equal(groups.withdraw?.to, 'withdrawn');
  assert.deepEqual(groupProposalMoves([{ to: 'consent', ready: true, gate: 'advice' }]).forward.map((m) => m.to), ['consent']);
  assert.deepEqual(groupProposalMoves(undefined), { forward: [], ratify: null, ratifyNeedsAnotherSteward: false, revise: null, withdraw: null });
});

test('the author is told another steward confirms, and gets no ratify button', () => {
  const groups = groupProposalMoves([{ to: 'ratified', ready: true, steward_only: true, blocked: 'needs_another_steward' }]);
  assert.equal(groups.ratify, null);
  assert.equal(groups.ratifyNeedsAnotherSteward, true);
  assert.equal(groupProposalMoves([{ to: 'ratified', ready: false, blocked: 'needs_another_steward' }]).ratifyNeedsAnotherSteward, false);
});

test('the quorum is explained from where the engine took it', () => {
  const cases: [Parameters<typeof quorumExplanation>, string][] = [
    [[{ required: true, quorum: 2, quorum_source: 'agreement', positions: 1 }, 'How we decide'],
      'Needs 2 positions, set by the governing agreement “How we decide”, and no open objection.'],
    [[{ required: true, quorum: 1, quorum_source: 'default', positions: 0 }],
      'Needs 1 position (the default: no quorum declared), and no open objection.'],
    [[{ required: true, quorum: 3, quorum_source: 'proposal', mode: 'consensus', positions: 0 }],
      'Needs 3 positions, declared on this proposal, and no open objection. Consensus: every position must be consent.'],
    [[{ required: true, quorum: null, quorum_source: 'all_members', consented: 1 }],
      "Needs every participating member's consent (no quorum declared)."],
    [[{ required: true, quorum: 2, quorum_source: 'agreement', consented: 1 }],
      'Needs 2 members to consent, declared on this agreement, and no open objection.'],
    [[{ required: false }], 'No consent round is required.'],
  ];
  for (const [args, expected] of cases) assert.equal(quorumExplanation(...args), expected);
});

test('the proposer is prompted to close advice only once its gate is met, more firmly past the deadline', () => {
  const met = { met: true, deadline: '2026-10-01', deadline_passed: true };
  assert.equal(adviceClosePrompt({ status: 'advice', adviceGate: met, canClose: true })?.title,
    'Advice deadline passed: move to consent?');
  assert.equal(adviceClosePrompt({ status: 'advice', adviceGate: { met: true }, canClose: true })?.tone, 'ready');
  assert.equal(adviceClosePrompt({ status: 'advice', adviceGate: { ...met, met: false }, canClose: true }), null);
  assert.equal(adviceClosePrompt({ status: 'advice', adviceGate: met, canClose: false }), null);  // not theirs to close
  assert.equal(adviceClosePrompt({ status: 'consent', adviceGate: met, canClose: true }), null);
});

test('the ratified banner says registered only when it is', () => {
  assert.equal(ratifiedBanner(null).title, 'Ratified, not yet registered');
  assert.ok(ratifiedBanner(null, 'How we decide').body.includes('keeps its current text'));
  assert.equal(ratifiedBanner({ title: 'Garden hours', agreement_id: 'AGR-1' }).title, 'Ratified and registered');
});

test('positions read as words, the assistant spelling included', () => {
  assert.deepEqual(['object', 'objection', 'stand_aside', 'withdrawn', null].map(positionLabel),
    ['Object', 'Object', 'Stand aside', 'Withdrawn', '-']);
});

test('the text is editable only before members decide on it, and a lock says the way out', () => {
  assert.deepEqual(['draft', 'advice'].map(proposalEditLock), [null, null]);
  for (const deciding of ['consent', 'test']) {
    assert.ok(proposalEditLock(deciding)?.includes('send it back for revision'), deciding);
  }
  for (const decided of ['ratified', 'withdrawn']) {
    const lock = proposalEditLock(decided);
    assert.ok(lock?.includes('record of what was decided') && !lock.includes('send it back'), decided);
  }
});
