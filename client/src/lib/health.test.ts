import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditDueText, bandLabel, formatMeasured, ratingsNeeded, scoreText, trendLabel } from './health';

test('measured values read with their unit; nothing measured says so', () => {
  const cases: Array<[Parameters<typeof formatMeasured>[0], Parameters<typeof formatMeasured>[1], string]> = [
    [50, '%', '50%'], [7.14285, '%', '7.14%'], [0.8217, 'ratio', '0.82'], [1, 'ratio', '1.00'],
    [3, 'cycles', '3 cycles'], [1, 'cycles', '1 cycle'], [4, 'per quarter', '4 per quarter'],
    [0, '%', '0%'], // a measured zero is data, not "No data"
    [null, '%', 'No data'], [undefined, null, 'No data'], ['12', '%', '12%'],
  ];
  for (const [value, unit, expected] of cases) assert.equal(formatMeasured(value, unit), expected, `${value} ${unit}`);
});

test('bands and trends have plain names, and unknowns stay quiet', () => {
  assert.deepEqual(['healthy', 'warning', 'critical', null].map((b) => bandLabel(b as never)), ['Healthy', 'Warning', 'Critical', 'No threshold']);
  assert.deepEqual(['improving', 'stable', 'degrading', 'baseline', null, 'odd'].map(trendLabel), ['Improving', 'Steady', 'Getting worse', 'First measurement', '', '']);
});

test('the audit due line follows the server flag, not the date', () => {
  const format = (date: string) => `on ${date}`;
  assert.equal(auditDueText('2026-12-01', false, format), 'Next audit due on 2026-12-01');
  assert.equal(auditDueText('2026-12-01', true, format), 'Next audit overdue since on 2026-12-01');
  // F17: the server sends null for an ecosystem with no start date and no audit; it printed "Invalid date".
  assert.equal(auditDueText(null, false, () => 'Invalid date'), 'No audit date yet');
});

test('publishing needs a rating only for indicators that are computable and have data', () => {
  const indicators = [
    { indicator_id: 'GHI-01', computable: true, measured_value: 7 },
    { indicator_id: 'GHI-02', computable: true, measured_value: 0 }, // zero is data
    { indicator_id: 'GHI-03', computable: false, measured_value: null }, // not computable yet
    { indicator_id: 'GHI-04', computable: true, measured_value: null }, // no data in the period
  ];
  assert.deepEqual(ratingsNeeded(indicators), ['GHI-01', 'GHI-02']);
});

test('a score that was not measured never reads as a number', () => {
  assert.deepEqual([scoreText(null), scoreText(undefined), scoreText(0), scoreText(72, '%'), scoreText(Number.NaN)],
    ['Not measured', 'Not measured', '0', '72%', 'Not measured']);
});
