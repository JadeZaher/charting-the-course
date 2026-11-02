import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  canOpenAdminPanel, ecosystemPickerLabel, navPermissionsFor, readPlatformAdmin, routeAccess, showsNewcomers, visibleNavItems,
  type NavAccess,
} from './nav-access';
import type { MembershipRow } from './ecosystem-join';

// The sidebar's Content Management links (components/AppSidebar.tsx facilitatorItems).
const links: { title: string; access: NavAccess }[] = [
  { title: 'Manage Quizzes', access: 'quiz-steward' },
  { title: 'Manage Shares & Needs', access: 'admin-panel' },
];

test('each member sees only the links whose page admits them', () => {
  // The /auth/me rows the sidebar reads; quiz authoring is a steward's (api/quizzes.py), whatever the member's profile.
  const townhall = { id: 'omni', membership_status: 'active', role: 'user', is_steward: false };
  const pending = { id: 'omni', membership_status: 'pending_consent', role: 'user', is_steward: false };
  const steward = { id: 'omni', membership_status: 'active', role: 'mod', is_steward: true };
  const founder = { id: 'fresh', membership_status: 'active', role: 'user', is_steward: true };
  const cases: [string, boolean, string[], MembershipRow[], string[], boolean][] = [
    // p3-collaboration-and-moderation-10: a townhall or pending newcomer was offered Manage Quizzes, which the server refuses.
    ['townhall member', false, ['omni'], [townhall], [], false],
    ['pending newcomer', false, [], [pending], [], false],
    ['steward of the selected ecosystem', false, ['omni'], [steward], ['Manage Quizzes'], false],
    ['founder of their own ecosystem, selected', false, ['fresh'], [townhall, founder], ['Manage Quizzes'], false],
    ['steward elsewhere, a non-stewarded ecosystem selected', false, ['omni'], [townhall, founder], [], false],
    ['platform admin', true, ['omni'], [townhall], ['Manage Quizzes', 'Manage Shares & Needs'], true],
  ];
  for (const [who, isPlatformAdmin, selectedIds, memberships, titles, adminPanel] of cases) {
    const permissions = navPermissionsFor({ isPlatformAdmin, isNodeAdmin: isPlatformAdmin, selectedIds, memberships });
    assert.deepEqual(visibleNavItems(links, permissions).map((link) => link.title), titles, who);
    assert.equal(canOpenAdminPanel(permissions), adminPanel, who);
  }
});

test('Manage Quizzes and the /quiz/manage route admit the same members', () => {
  // The route used to read the profile of the /auth/me `member` row (the oldest active one), so a member whose sign-up row
  // has no profile (services/member_lifecycle.py sets none) and who founded or stewards the selected ecosystem saw the
  // link and landed on Access Denied. The route now asks routeAccess over the link's permissions; no profile is an input.
  const signUp = { id: 'omni', membership_status: 'active', role: 'user', is_steward: false }; // profile null, oldest
  const founded = { id: 'fresh', membership_status: 'active', role: 'user', is_steward: true }; // co_creator row, newer
  const moderates = { id: 'river', membership_status: 'active', role: 'mod', is_steward: true }; // mod rank, profile null
  const cases: [string, boolean, string[], MembershipRow[], boolean][] = [
    ['founder, sign-up row has no profile, own ecosystem selected', false, ['fresh'], [signUp, founded], true],
    ['steward by rank with no profile, that ecosystem selected', false, ['river'], [signUp, moderates], true],
    ['same founder with the sign-up ecosystem selected', false, ['omni'], [signUp, founded], false],
    ['townhall or collaborator, not a steward', false, ['omni'], [signUp], false],
    ['platform admin', true, ['omni'], [signUp], true],
  ];
  for (const [who, isPlatformAdmin, selectedIds, memberships, admitted] of cases) {
    const permissions = navPermissionsFor({ isPlatformAdmin, isNodeAdmin: isPlatformAdmin, selectedIds, memberships });
    const linkShown = visibleNavItems(links, permissions).some((link) => link.title === 'Manage Quizzes');
    assert.equal(linkShown, admitted, `${who}: link`);
    assert.equal(routeAccess('quiz-steward', permissions, true), admitted ? 'allow' : 'deny', `${who}: route`);
  }
});

test('the quiz route waits for the header selection instead of refusing a steward before it is restored', () => {
  const founded = { id: 'fresh', membership_status: 'active', role: 'user', is_steward: true };
  const restoring = navPermissionsFor({ isPlatformAdmin: false, selectedIds: [], memberships: [founded] });
  assert.equal(routeAccess('quiz-steward', restoring, false), 'wait');
  assert.equal(routeAccess('quiz-steward', restoring, true), 'deny'); // restored to nothing: held at the consent gate
  const admin = navPermissionsFor({ isPlatformAdmin: true, selectedIds: [], memberships: [] });
  assert.equal(routeAccess('quiz-steward', admin, false), 'allow');
});

test('the ecosystem picker never reads "0 ecosystems"', () => {
  const omni = { name: 'OmniOne' };
  const oasis = { name: 'Oasis' };
  const cases: [string, Parameters<typeof ecosystemPickerLabel>[0], string][] = [
    ['one selected', { selected: [omni], activeCount: 2, awaitingConsent: [] }, 'OmniOne'],
    ['every active one selected', { selected: [omni, oasis], activeCount: 2, awaitingConsent: [] }, 'All Ecosystems'],
    ['some selected', { selected: [omni, oasis], activeCount: 3, awaitingConsent: [] }, '2 ecosystems'],
    // p3-collaboration-and-moderation-10: a pending newcomer has nothing selectable.
    ['pending newcomer', { selected: [], activeCount: 0, awaitingConsent: [omni] }, 'OmniOne (awaiting your consent)'],
    ['pending in two', { selected: [], activeCount: 0, awaitingConsent: [omni, oasis] }, '2 ecosystems awaiting your consent'],
    ['active but nothing selected', { selected: [], activeCount: 1, awaitingConsent: [] }, 'Choose an ecosystem'],
  ];
  for (const [who, input, expected] of cases) assert.equal(ecosystemPickerLabel(input), expected, who);
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


test('node administration ignores legacy platform flags and organization selection', () => {
  const legacy = navPermissionsFor({ isPlatformAdmin: true, selectedIds: [], memberships: [] });
  assert.equal(routeAccess('admin-panel', legacy, true), 'deny');
  assert.equal(routeAccess('admin-panel', legacy, false), 'deny');
  const node = navPermissionsFor({ isPlatformAdmin: false, isNodeAdmin: true, selectedIds: [], memberships: [] });
  assert.equal(routeAccess('admin-panel', node, false), 'allow');
  assert.equal(canOpenAdminPanel(node), true);
});
