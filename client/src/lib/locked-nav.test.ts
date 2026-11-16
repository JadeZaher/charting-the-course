import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spaceHomeCopy } from './space-home-copy';
import { activateLockedNav, isNavDestinationLocked, lockedNavLabel, navItemForMember, pendingMembershipEcosystemId } from './locked-nav';

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

test('a pending member activating a locked item sees the join sentence and link while the route stays closed', () => {
  const location = '/communities';
  const ecosystemId = pendingMembershipEcosystemId({ pendingConsents: [{ ecosystem_id: 'eco-42' }] });
  const activated = activateLockedNav({
    title: 'Proposals',
    url: '/proposals',
    held: true,
    isNodeAdmin: false,
    ecosystemId,
  });
  assert.equal(activated.routeStaysClosed, true);
  assert.equal(location, '/communities');
  assert.equal(activated.note?.sentence, lockedNavLabel('Proposals'));
  assert.equal(
    activated.note?.sentence,
    'Proposals opens once you finish joining. "What to do next" shows the steps that are left.',
  );
  assert.equal(activated.note?.linkLabel, spaceHomeCopy.header.finishJoining);
  assert.equal(activated.note?.linkLabel, 'Finish joining');
  assert.equal(activated.note?.href, '/ethos/eco-42#what-to-do-next');
  assert.notEqual(activated.note?.href, '/proposals');
  assert.notEqual(activated.note?.href, '/welcome/consent');
  const control = navItemForMember({ title: 'Proposals', url: '/proposals' }, { held: true });
  assert.equal(control.locked, true);
  if (control.locked) {
    assert.equal(control.ariaDisabled, true);
    assert.equal(control.focusable, true);
    assert.equal(control.label, activated.note?.sentence);
  }
});

test('a pending membership with no ecosystem id points the link at the consent gate and still does not open the item', () => {
  const location = '/updates';
  const activated = activateLockedNav({
    title: 'Dashboard',
    url: '/dashboard',
    held: true,
    ecosystemId: pendingMembershipEcosystemId({
      pendingConsents: [{ ecosystem_id: '  ' }],
      member: { ecosystem_id: '', current_status: 'pending_consent' },
    }),
  });
  assert.equal(activated.routeStaysClosed, true);
  assert.equal(location, '/updates');
  assert.equal(activated.note?.sentence, 'Dashboard opens once you finish joining. "What to do next" shows the steps that are left.');
  assert.equal(activated.note?.linkLabel, 'Finish joining');
  assert.equal(activated.note?.href, '/welcome/consent');
  assert.notEqual(activated.note?.href, '/dashboard');
});

test('the pending member row supplies the ecosystem id when the consent list has none', () => {
  assert.equal(
    pendingMembershipEcosystemId({
      pendingConsents: [{ ecosystem_id: '' }],
      member: { ecosystem_id: 'eco-7', current_status: 'pending_consent' },
    }),
    'eco-7',
  );
  assert.equal(
    activateLockedNav({
      title: 'Me',
      url: '/me',
      held: true,
      ecosystemId: 'eco-7',
    }).note?.href,
    '/ethos/eco-7#what-to-do-next',
  );
});

test("an active member's nav is unchanged", () => {
  for (const item of [
    { title: 'Dashboard', url: '/dashboard' },
    { title: 'Messaging', url: '/messaging' },
    { title: 'Proposals', url: '/proposals' },
  ]) {
    assert.deepEqual(navItemForMember(item, { held: false }), { locked: false, href: item.url });
    assert.deepEqual(
      activateLockedNav({ ...item, held: false, ecosystemId: 'eco-42' }),
      { routeStaysClosed: false, note: null },
    );
  }
});
