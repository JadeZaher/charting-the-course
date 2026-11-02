import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mayRestoreSupportScope, readSupportChatScope } from './support-chat';

test('support mode must be explicit, target one organization and carry an exact public reason category', () => {
  const valid = { enabled: true, organization_id: 'org-b', reason: 'Data correction' };
  assert.deepEqual(readSupportChatScope(valid), { enabled: true, organization_id: 'org-b', reason: 'Data correction' });
  for (const invalid of [null, {}, { ...valid, enabled: 'true' }, { ...valid, enabled: false }, { ...valid, organization_id: '' }, { ...valid, reason: 'ab' }, { ...valid, reason: 'Private recovery details' }, { ...valid, reason: ' Data correction ' }, { ...valid, reason: 'x'.repeat(501) }]) assert.equal(readSupportChatScope(invalid), null);
});
test('member histories remain available, but support histories require current node authority', () => {
  const scope = { enabled: true, organization_id: 'org', reason: 'Technical support' };
  assert.equal(mayRestoreSupportScope(undefined, false), true);
  assert.equal(mayRestoreSupportScope(null, false), true);
  assert.equal(mayRestoreSupportScope(scope, false), false);
  assert.equal(mayRestoreSupportScope(scope, true), true);
  assert.equal(mayRestoreSupportScope({ ...scope, enabled: false }, true), false);
});
