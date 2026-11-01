import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agreementListParams, agreementListScope, inAgreementListScope } from './agreement-list';

// The health page's "N Agreement reviews overdue" counts one ecosystem's own agreements (services/health._attention);
// with two ecosystems selected the registry used to list both ecosystems' overdue agreements (p3-health-audit-and-review-9).
const items = [
  { id: 'oasis-late', ecosystem_id: 'oasis', review_overdue: true },
  { id: 'oasis-fine', ecosystem_id: 'oasis', review_overdue: false },
  { id: 'river-late', ecosystem_id: 'river', review_overdue: true },
];

test('the health link opens only that ecosystem\'s overdue reviews, from the server or an older one that ignores the filters', () => {
  const cases: [string, string, Record<string, string>, string[]][] = [
    ['health link, two ecosystems selected', '?review=overdue&ecosystem_id=oasis',
      { ecosystem_ids: 'oasis,river', review: 'overdue', ecosystem_id: 'oasis' }, ['oasis-late']],
    ['overdue across the selection', '?review=overdue', { ecosystem_ids: 'oasis,river', review: 'overdue' }, ['oasis-late', 'river-late']],
    ['plain registry', '', { ecosystem_ids: 'oasis,river' }, ['oasis-late', 'oasis-fine', 'river-late']],
    ['an id that is not plain is dropped', '?review=overdue&ecosystem_id=..%2Fadmin', { ecosystem_ids: 'oasis,river', review: 'overdue' },
      ['oasis-late', 'river-late']],
  ];
  for (const [what, query, params, shown] of cases) {
    const scope = agreementListScope(query);
    assert.deepEqual(agreementListParams({ ecosystem_ids: 'oasis,river' }, scope), params, what);
    assert.deepEqual(inAgreementListScope(items, scope).map((item) => item.id), shown, what);
  }
});
