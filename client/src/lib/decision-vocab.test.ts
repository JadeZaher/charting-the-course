import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decisionHeadline } from './decision-vocab';

test('a decision is named by what was decided, not by its record id', () => {
  const long = `Tool library ${'opening hours '.repeat(10)}`.trim();
  const cases: [string | null, string, string][] = [
    ['Tool library late fees — ratified after completing the ACT process. Fees are 1 credit a day.',
      'Tool library late fees', 'the ACT engine holding: the proposal title'],
    ['Members may borrow two tools at once.', 'Members may borrow two tools at once.', 'a hand-written holding'],
    [null, 'DEC-PROP-0042', 'no holding: the record id'],
    ['   ', 'DEC-PROP-0042', 'a blank holding: the record id'],
    [long, `${long.slice(0, 99).trimEnd()}…`, 'a long holding is cut to 100 characters'],
  ];
  for (const [holding, expected, why] of cases) assert.equal(decisionHeadline(holding, 'DEC-PROP-0042'), expected, why);
});
