import { test } from 'node:test';
import assert from 'node:assert/strict';
import { domainCode, domainLabel, domainOptionLabel } from './domain-label';

test('a named domain reads by its name, with the generated code as secondary text', () => {
  const garden = { domain_id: 'DOM-1A2B3C4D', display_name: 'Newcomer Garden' };
  assert.equal(domainLabel(garden), 'Newcomer Garden');
  assert.equal(domainCode(garden), 'DOM-1A2B3C4D');
  assert.equal(domainOptionLabel(garden), 'Newcomer Garden (DOM-1A2B3C4D)');
});

test('a domain without a usable name falls back to its code exactly once', () => {
  for (const display_name of [undefined, null, '', '   ', 'DOM-1A2B3C4D']) {
    const domain = { domain_id: 'DOM-1A2B3C4D', display_name };
    assert.equal(domainLabel(domain), 'DOM-1A2B3C4D');
    assert.equal(domainCode(domain), null);
    assert.equal(domainOptionLabel(domain), 'DOM-1A2B3C4D');
  }
});
