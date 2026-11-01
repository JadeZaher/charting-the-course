import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settleFieldError, validateRequired } from './required-fields';

const testReportMessages = {
  observations: 'Describe what you observed.',
  outcome: 'Choose an outcome.',
} as const;

test('submitting with blank fields reports each one and focuses the first in form order', () => {
  // Values arrive in a different order than the form; whitespace-only counts as blank.
  const result = validateRequired({ outcome: undefined, observations: '   ' }, testReportMessages);
  assert.deepEqual(result.errors, {
    observations: 'Describe what you observed.',
    outcome: 'Choose an outcome.',
  });
  assert.equal(result.firstInvalid, 'observations');
});

test('a complete form has no errors and nothing to focus', () => {
  assert.deepEqual(validateRequired({ observations: 'Ran for two weeks', outcome: 'met' }, testReportMessages), {
    errors: {},
    firstInvalid: null,
  });
});

test('typing clears a shown error only once the field holds text, and never raises a new one', () => {
  const shown = { observations: 'Describe what you observed.' };
  assert.equal(settleFieldError(shown, 'observations', '  '), shown, 'still blank: error stays');
  assert.deepEqual(settleFieldError(shown, 'observations', 'It worked'), {});
  assert.deepEqual(settleFieldError<'observations' | 'outcome'>({}, 'outcome', ''), {}, 'no error before submit');
});
