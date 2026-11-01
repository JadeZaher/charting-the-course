import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handoffNotice } from './exit-status';

const today = new Date('2026-10-31T15:30:00Z');
const asGiven = (iso: string) => iso;

test('an open exit says when the handoff ends, and what happens once that date has passed', () => {
  const cases: Array<[status: string, target: string | null, expected: RegExp | null]> = [
    ['declared', '2026-11-30', /ends 2026-11-30, in 30 days/],
    ['unwinding', '2026-11-01', /ends 2026-11-01, in 1 day \(/],
    ['cooling_off', '2026-10-31', /ends today/],
    ['unwinding', '2026-10-29', /has passed\. A steward confirms the departure/],
    ['completed', '2026-10-29', null],
    ['cancelled', '2026-11-30', null],
    ['declared', null, null],
  ];
  for (const [status, target, expected] of cases) {
    const notice = handoffNotice({ status, target_completion_date: target }, today, asGiven);
    if (expected === null) assert.equal(notice, null, `${status} ${target}`);
    else assert.match(notice ?? '', expected, `${status} ${target}`);
  }
});
