import { test } from 'node:test';
import assert from 'node:assert/strict';
import { memberQueriesEnabled } from './member-queries';

test('ordinary member queries require a membership identity regardless of global user or node authority', () => {
  for (const member of [null, undefined, {}, { id: '' }, { id: 1 }]) assert.equal(memberQueriesEnabled(member), false);
  assert.equal(memberQueriesEnabled({ id: 'membership-uuid' }), true);
  const memberlessNodeAdmin = { isAuthenticated: true, isNodeAdmin: true, user: { id: 'global-user' }, member: null };
  assert.equal(memberQueriesEnabled(memberlessNodeAdmin.member), false);
});
