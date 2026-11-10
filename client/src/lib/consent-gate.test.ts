import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeEcosystemIds, consentGateRedirect, defaultEcosystemId, isHeldAtConsentGate } from './consent-gate';
import { CONSENT_GATE_PATH } from './member-status';

const garden = { id: 'eco-garden' };
const commons = { id: 'eco-commons' };
const river = { id: 'eco-river' };
const pendingInGarden = [{ ecosystem_id: garden.id }];
const memberRow = (ecosystem: { id: string }, current_status: string) => ({ ecosystem_id: ecosystem.id, current_status });

test('a newcomer waiting on consent is kept on the gate but can read what they are asked to accept', () => {
  const cases: Array<[path: string, expected: string | null]> = [
    ['/dashboard', CONSENT_GATE_PATH],
    ['/proposals/p-1', CONSENT_GATE_PATH],
    ['/agreements', CONSENT_GATE_PATH],
    ['/agreements/new', CONSENT_GATE_PATH],
    ['/agreements/a-1/edit', CONSENT_GATE_PATH],
    ['/ethosx', CONSENT_GATE_PATH],
    ['/orientation', CONSENT_GATE_PATH],
    ['/orientation/garden/journey/extra', CONSENT_GATE_PATH],
    ['/orientationx/garden', CONSENT_GATE_PATH],
    [CONSENT_GATE_PATH, null],
    ['/agreements/a-1', null],
    ['/agreements/a-1/', null],
    ['/agreements/a-1/history', null],
    ['/ethos/garden', null],
    ['/ethos/garden/detail', null],
    // G-Onboard: walkthrough first, then consent.
    ['/orientation/garden', null],
    ['/orientation/garden/journey', null],
    ['/orientation/garden/complete', null],
    ['/users/kofi', null],
    ['/about', null],
    ['/terms', null],
    ['/privacy', null],
  ];
  for (const [path, expected] of cases) {
    const redirect = consentGateRedirect({ isAuthenticated: true, pendingConsents: pendingInGarden, memberships: [garden], path });
    assert.equal(redirect, expected, path);
  }
});

test('only an ACTIVE membership elsewhere lets a pending member past the gate', () => {
  const cases: Array<[elsewhere: string, member: ReturnType<typeof memberRow> | null, held: boolean]> = [
    ['active elsewhere', memberRow(commons, 'active'), false],
    ['elsewhere, status unknown to the client', null, false],
    ['exited elsewhere', memberRow(commons, 'exited'), true],
    ['suspended elsewhere', memberRow(commons, 'suspended'), true],
    ['pending elsewhere too', memberRow(commons, 'pending_consent'), true],
  ];
  for (const [elsewhere, member, held] of cases) {
    const input = { isAuthenticated: true, pendingConsents: pendingInGarden, memberships: [garden, commons], member };
    assert.equal(isHeldAtConsentGate(input), held, elsewhere);
    assert.equal(consentGateRedirect({ ...input, path: '/dashboard' }), held ? CONSENT_GATE_PATH : null, elsewhere);
  }
  assert.equal(consentGateRedirect({ isAuthenticated: true, pendingConsents: [], memberships: [garden], path: '/dashboard' }), null);
  assert.equal(consentGateRedirect({ isAuthenticated: false, pendingConsents: pendingInGarden, memberships: [garden], path: '/dashboard' }), null);
});

test('the default ecosystem is one the member is active in, the oldest when the client knows it', () => {
  const cases: Array<[moment: string, member: ReturnType<typeof memberRow> | null, expected: string | null]> = [
    // /auth/me's member is the oldest membership; when it is active it is also the server's default.
    ['oldest membership active', memberRow(river, 'active'), river.id],
    ['oldest membership pending', memberRow(garden, 'pending_consent'), commons.id],
    ['oldest membership exited', memberRow(commons, 'exited'), river.id],
    ['no member row', null, commons.id],
  ];
  for (const [moment, member, expected] of cases) {
    const input = { pendingConsents: pendingInGarden, memberships: [garden, commons, river], member };
    assert.equal(defaultEcosystemId(input), expected, moment);
  }
  assert.equal(defaultEcosystemId({ pendingConsents: pendingInGarden, memberships: [garden], member: null }), null, 'nothing active');
});

// G-Onboard: /auth/me reports each membership's own status; it wins over the pending list and the default row.
test('with a per-ecosystem status, only an active row counts: a leaver or a paused member elsewhere is held', () => {
  const withStatus = (ecosystem: { id: string }, membership_status: string) => ({ ...ecosystem, membership_status });
  const cases: Array<[elsewhere: string, membershipStatus: string, held: boolean]> = [
    ['active elsewhere', 'active', false],
    ['left elsewhere', 'exited', true],
    ['suspended elsewhere', 'suspended', true],
    ['inactive elsewhere', 'inactive', true],
  ];
  for (const [elsewhere, membershipStatus, held] of cases) {
    // The default row says active: under the old rule every case would pass the gate.
    const input = {
      isAuthenticated: true,
      pendingConsents: pendingInGarden,
      memberships: [withStatus(garden, 'pending_consent'), withStatus(commons, membershipStatus)],
      member: memberRow(commons, 'active'),
    };
    assert.equal(isHeldAtConsentGate(input), held, elsewhere);
  }
  // A row the server calls pending is not active even when the gate list has not caught up.
  assert.deepEqual(
    activeEcosystemIds({ pendingConsents: [], memberships: [withStatus(garden, 'pending_consent'), withStatus(river, 'active')], member: null }),
    [river.id],
  );
  // A leaver's old ecosystem is never selected, even when it is listed first.
  assert.equal(
    defaultEcosystemId({ pendingConsents: [], memberships: [withStatus(garden, 'exited'), withStatus(commons, 'active'), withStatus(river, 'active')], member: null }),
    commons.id,
  );
});


test('public node support history remains readable while held at membership consent', () => {
  const input = { isAuthenticated: true, pendingConsents: [{ ecosystem_id: 'org' }], memberships: [{ id: 'org', membership_status: 'pending_consent' }] };
  assert.equal(consentGateRedirect({ ...input, path: '/node/audit' }), null);
  assert.equal(consentGateRedirect({ ...input, path: '/node/audit/entry-1' }), null);
  assert.notEqual(consentGateRedirect({ ...input, path: '/admin' }), null);
});


test('an assigned node admin can reach support while their own membership awaits consent', () => {
  const input = { isAuthenticated: true, isNodeAdmin: true, pendingConsents: [{ ecosystem_id: 'org' }], memberships: [{ id: 'org', membership_status: 'pending_consent' }] };
  assert.equal(consentGateRedirect({ ...input, path: '/admin' }), null);
  assert.equal(consentGateRedirect({ ...input, path: '/admin/node-admins' }), null);
  assert.notEqual(consentGateRedirect({ ...input, isNodeAdmin: false, path: '/admin' }), null);
  assert.notEqual(consentGateRedirect({ ...input, path: '/proposals/new' }), null);
});
