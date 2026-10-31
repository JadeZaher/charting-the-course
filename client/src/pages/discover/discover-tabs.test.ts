import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discoverTabFromQuery, discoverTabHref } from './discover-tabs';

test('?tab= opens the named Discover tab; anything else opens Ecosystems', () => {
  const cases: Array<[string, string]> = [
    ['tab=shares-needs', 'shares-needs'],
    ['?tab=collaborations', 'collaborations'],
    ['q=garden&tab=solutions', 'solutions'],
    ['', 'ecosystems'],
    ['tab=', 'ecosystems'],
    ['tab=SHARES-NEEDS', 'ecosystems'],
    ['tab=admin', 'ecosystems'],
  ];
  for (const [query, expected] of cases) {
    assert.equal(discoverTabFromQuery(query), expected, query);
  }
});

test('switching tabs keeps other query params and drops ?tab= for the default tab', () => {
  assert.equal(discoverTabHref('/discover', 'q=garden', 'shares-needs'), '/discover?q=garden&tab=shares-needs');
  assert.equal(discoverTabHref('/discover', 'tab=solutions&q=garden', 'ecosystems'), '/discover?q=garden');
  assert.equal(discoverTabHref('/discover', 'tab=solutions', 'ecosystems'), '/discover');
});
