import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isNavDestinationLocked, lockedNavLabel } from './locked-nav';

test('the locked name is the copy-table sentence and includes the item', () => {
  assert.equal(
    lockedNavLabel('Dashboard'),
    'Dashboard opens once you finish joining. "What to do next" shows the steps that are left.',
  );
  assert.equal(
    lockedNavLabel('Messaging'),
    'Messaging opens once you finish joining. "What to do next" shows the steps that are left.',
  );
});

test('a held member can still open the paths the gate allows, and the rest stay locked', () => {
  const held = { held: true as const, isNodeAdmin: false };
  const open = ['/updates', '/communities', '/ethos/eco-1', '/node/audit', '/settings/notifications', '/welcome/consent'];
  const locked = ['/dashboard', '/discover', '/me', '/agreements', '/proposals', '/decisions', '/members', '/domains', '/teams', '/ecosystems', '/messaging', '/onboarding', '/conflicts', '/quiz/manage', '/admin'];
  for (const path of open) assert.equal(isNavDestinationLocked(path, held), false, path);
  for (const path of locked) assert.equal(isNavDestinationLocked(path, held), true, path);
});

test('an active member and a node admin are not locked out of their own destinations', () => {
  assert.equal(isNavDestinationLocked('/dashboard', { held: false }), false);
  assert.equal(isNavDestinationLocked('/admin', { held: true, isNodeAdmin: true }), false);
  assert.equal(isNavDestinationLocked('/dashboard', { held: true, isNodeAdmin: true }), true);
});
