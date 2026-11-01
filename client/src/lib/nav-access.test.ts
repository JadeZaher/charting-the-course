import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canOpenAdminPanel, visibleNavItems, type NavAccess, type NavPermissions } from './nav-access';

// The sidebar's Content Management links (components/AppSidebar.tsx facilitatorItems).
const links: { title: string; access: NavAccess }[] = [
  { title: 'Manage Quizzes', access: 'content' },
  { title: 'Manage Shares & Needs', access: 'admin-panel' },
];

test('each member sees only the links whose page admits them', () => {
  // Flags as hooks/usePermissions derives them from the member profile.
  const cases: [string, NavPermissions, string[], boolean][] = [
    ['townhall', { isAdmin: false, canManageUsers: false, canManageContent: true }, ['Manage Quizzes'], false],
    ['collaborator', { isAdmin: false, canManageUsers: false, canManageContent: true }, ['Manage Quizzes'], false],
    ['builder', { isAdmin: true, canManageUsers: true, canManageContent: true }, ['Manage Quizzes', 'Manage Shares & Needs'], true],
    ['no profile', { isAdmin: false, canManageUsers: false, canManageContent: false }, [], false],
    ['user manager without content', { isAdmin: false, canManageUsers: true, canManageContent: false }, ['Manage Shares & Needs'], true],
  ];
  for (const [who, permissions, titles, adminPanel] of cases) {
    assert.deepEqual(visibleNavItems(links, permissions).map((link) => link.title), titles, who);
    assert.equal(canOpenAdminPanel(permissions), adminPanel, who);
  }
});
