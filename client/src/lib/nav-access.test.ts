import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canOpenAdminPanel, readPlatformAdmin, showsNewcomers, visibleNavItems, type NavAccess, type NavPermissions } from './nav-access';
import type { MembershipRow } from './ecosystem-join';

// The sidebar's Content Management links (components/AppSidebar.tsx facilitatorItems).
const links: { title: string; access: NavAccess }[] = [
  { title: 'Manage Quizzes', access: 'content' },
  { title: 'Manage Shares & Needs', access: 'admin-panel' },
];

test('each member sees only the links whose page admits them', () => {
  // canManageContent as hooks/usePermissions derives it from the profile; isPlatformAdmin is the server's flag.
  const cases: [string, NavPermissions, string[], boolean][] = [
    ['townhall', { canManageContent: true, isPlatformAdmin: false }, ['Manage Quizzes'], false],
    ['founder of their own ecosystem (co_creator there)', { canManageContent: true, isPlatformAdmin: false }, ['Manage Quizzes'], false],
    ['platform admin', { canManageContent: true, isPlatformAdmin: true }, ['Manage Quizzes', 'Manage Shares & Needs'], true],
    ['no profile', { canManageContent: false, isPlatformAdmin: false }, [], false],
  ];
  for (const [who, permissions, titles, adminPanel] of cases) {
    assert.deepEqual(visibleNavItems(links, permissions).map((link) => link.title), titles, who);
    assert.equal(canOpenAdminPanel(permissions), adminPanel, who);
  }
});

test('only an explicit true from /auth/me makes a platform admin', () => {
  // The auth context's one source (contexts/AuthContext.tsx `isPlatformAdmin`); a profile never counts.
  const cases: [string, object, boolean][] = [
    ['flag set', { member: {}, isPlatformAdmin: true }, true],
    ['flag false', { isPlatformAdmin: false }, false],
    ['truthy but not true', { isPlatformAdmin: 'yes' }, false],
    ['signed out', { member: null, isPlatformAdmin: false }, false],
    ['co_creator profile without the flag', { member: { profile: 'co_creator' } }, false],
    ['the retired user-shaped copy is not read', { user: { is_platform_admin: true } }, false],
  ];
  for (const [who, auth, expected] of cases) assert.equal(readPlatformAdmin(auth), expected, who);
});

test('Newcomers shows only to a steward of a selected ecosystem', () => {
  const oasis = { id: 'oasis', membership_status: 'active', role: 'user', is_steward: false };
  const escher = { id: 'escher', membership_status: 'active', role: 'mod', is_steward: true };
  const fresh = { id: 'fresh', membership_status: 'active', role: 'user', is_steward: true }; // its founder
  const cases: [string, string[], MembershipRow[], boolean][] = [
    ['member of the selected ecosystem only', ['oasis'], [oasis, escher], false],
    ['steward of the selected ecosystem', ['escher'], [oasis, escher], true],
    ['founder of the selected ecosystem', ['fresh'], [fresh], true],
    ['one of several selected is stewarded', ['oasis', 'escher'], [oasis, escher], true],
    ['steward elsewhere, nothing of theirs selected', ['oasis'], [oasis, fresh], false],
    ['steward row still pending', ['escher'], [{ ...escher, membership_status: 'pending_consent' }], false],
  ];
  for (const [who, selected, rows, expected] of cases) {
    assert.equal(showsNewcomers(selected, rows), expected, who);
  }
});
