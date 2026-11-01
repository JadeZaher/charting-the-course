// A zone west of UTC: a date-only due read as UTC midnight would land on the day before.
process.env.TZ = 'America/Los_Angeles';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bellBadge, bellLabel, dueStatus, nextStepKindLabel, parseDue } from './next-steps';

test('the bell badge shows nothing at zero or while loading, and caps at 9+', () => {
  const cases: Array<[number | null | undefined, string | null]> = [
    [undefined, null], [null, null], [0, null], [1, '1'], [9, '9'], [10, '9+'], [42, '9+'],
  ];
  for (const [count, badge] of cases) assert.equal(bellBadge(count), badge, String(count));
});

test("the bell's name says the full count the badge may cap", () => {
  assert.equal(bellLabel(42), '42 things are waiting for you');
  assert.equal(bellLabel(1), '1 thing is waiting for you');
  assert.equal(bellLabel(0), 'Nothing is waiting for you');
});

test('a date-only due is that calendar day wherever the member is', () => {
  const day = parseDue('2026-11-03');
  assert.deepEqual([day.getFullYear(), day.getMonth(), day.getDate()], [2026, 10, 3]);
});

test('the server decides overdue; the client only words it', () => {
  const now = new Date(2026, 10, 3, 15, 0); // 3 Nov, 15:00 local
  const format = (date: Date, withTime: boolean) => (withTime ? `${date.getDate()}@${date.getHours()}h` : `${date.getDate()} Nov`);
  const cases: Array<[string | null, boolean, { text: string; overdue: boolean } | null]> = [
    ['2026-11-02', true, { text: 'Overdue since 2 Nov', overdue: true }],
    ['2026-11-02', false, { text: 'Due 2 Nov', overdue: false }], // local day passed, server says not overdue: never "Overdue"
    ['2026-11-03', false, { text: 'Due today', overdue: false }],
    ['2026-11-04', false, { text: 'Due tomorrow', overdue: false }],
    ['2026-11-10', false, { text: 'Due 10 Nov', overdue: false }],
    ['2026-11-03T20:00:00Z', true, { text: 'Overdue since 3@12h', overdue: true }],
    ['2026-11-03T20:00:00Z', false, { text: 'Due 3@12h', overdue: false }], // instant already past locally, server says not overdue
    ['2026-11-04T08:00:00Z', false, { text: 'Due 4@0h', overdue: false }],
    [null, true, null],
    ['not a date', false, null],
  ];
  for (const [due, overdue, expected] of cases) assert.deepEqual(dueStatus(due, overdue, now, format), expected, `${due} ${overdue}`);
});

test('every kind the queue sources emit has a plain name (the bell and Dashboard print it)', () => {
  const kinds = ['proposal', 'agreement', 'conflict', 'emergency', 'exit', 'audit', 'newcomer', 'share_need', 'collaboration'];
  const labels = kinds.map(nextStepKindLabel);
  assert.deepEqual(labels, ['Proposal', 'Agreement', 'Conflict case', 'Emergency', 'Exit', 'Audit', 'Newcomer',
    'Share or need', 'Collaboration']);
  assert.equal(nextStepKindLabel('something_new'), 'something_new'); // unknown kinds read as given
});
