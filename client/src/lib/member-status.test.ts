import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memberStatusLabel } from './member-status';

test('member statuses read as words, never raw snake_case', () => {
  const cases: Array<[string | null | undefined, string]> = [
    ['pending_consent', 'Awaiting agreement consent'],
    ['active', 'Active member'],
    ['on_leave', 'On leave'], // unknown values still read as words
    [null, ''],
  ];
  for (const [status, expected] of cases) {
    assert.equal(memberStatusLabel(status), expected, String(status));
  }
});
