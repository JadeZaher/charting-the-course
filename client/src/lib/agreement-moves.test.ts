import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agreementMoveControl, isMembershipAgreement } from './agreement-moves';

test('each server move renders as its own control, and an unknown one as nothing', () => {
  const cases: Array<[{ move: string; kind?: 'consent' }, string | null]> = [
    [{ move: 'under_review' }, 'review'],
    [{ move: 'active' }, 'review'],
    [{ move: 'sunset' }, 'review'],
    [{ move: 'archived' }, 'review'],
    // F2: an owner who has not consented got "Archive this agreement?" and a 400 for {status: "attest"}.
    [{ move: 'attest', kind: 'consent' }, 'consent'],
    [{ move: 'attest' }, 'consent'], // an older server without `kind` still never reaches the review dialog
    [{ move: 'test' }, null],
    [{ move: 'publish' }, null],
  ];
  for (const [move, control] of cases) assert.equal(agreementMoveControl(move), control, move.move);
});

test('a membership agreement is one scoped to the ecosystem', () => {
  assert.equal(isMembershipAgreement({ prerequisite_scopes: ['ecosystem'] }), true);
  assert.equal(isMembershipAgreement({ prerequisite_scopes: ['domain'] }), false);
  assert.equal(isMembershipAgreement({ prerequisite_scopes: null }), false);
});
