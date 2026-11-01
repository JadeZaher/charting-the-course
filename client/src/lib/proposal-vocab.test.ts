import { test } from 'node:test';
import assert from 'node:assert/strict';
import { announceActOutcome } from './proposal-vocab';

test('advice that completes the round explains the move to Consent and what members can do now', () => {
  assert.deepEqual(announceActOutcome({ auto_transitions: ['advice->consent'] }), {
    title: 'Proposal moved to Consent',
    description:
      'The advice round is complete. Members can now record whether they consent, stand aside or object.',
  });
});

test('a cascade names every completed step once and lands on the final phase', () => {
  assert.deepEqual(announceActOutcome({ auto_transitions: ['advice->consent', 'consent->test'] }), {
    title: 'Proposal moved to Test',
    description:
      'The advice round and the consent round are complete. The proposal is now being tried in practice.',
  });
});

test('ratification mentions the decision record only when the server minted one', () => {
  const ratified = announceActOutcome({ auto_transitions: ['test->ratified'], decision_record_id: 'd-1' });
  assert.equal(ratified?.title, 'Proposal ratified');
  assert.equal(
    ratified?.description,
    'The test period is complete. The proposal is ratified and now active. A decision record was created.',
  );
  const withoutRecord = announceActOutcome({ auto_transitions: ['test->ratified'] });
  assert.ok(!withoutRecord?.description.includes('decision record'));
});

test('no automatic move yields no announcement, so the caller keeps its own confirmation', () => {
  for (const auto_transitions of [undefined, null, [], ['not-a-transition']]) {
    assert.equal(announceActOutcome({ auto_transitions }), null, JSON.stringify(auto_transitions));
  }
});
