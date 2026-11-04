import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isPlatformTourEligible, parsePlatformTourProgress, platformTourKey, readPlatformTourProgress,
  savePlatformTourProgress, shouldOfferPlatformTour, type PlatformTourProgress,
} from './platform-tour';

test('only an authenticated owner with an active membership is eligible for the tour', () => {
  const base = { userId: 'owner', isAuthenticated: true, pendingConsents: [], memberships: [] };
  assert.equal(isPlatformTourEligible(base), false);
  for (const membership_status of ['pending_consent', 'prospective', 'suspended', 'exited']) {
    assert.equal(isPlatformTourEligible({ ...base, memberships: [{ id: 'one', membership_status }] }), false);
  }
  const active = { ...base, memberships: [{ id: 'one', membership_status: 'active' }] };
  assert.equal(isPlatformTourEligible(active), true);
  assert.equal(isPlatformTourEligible({ ...active, isAuthenticated: false }), false);
  assert.equal(isPlatformTourEligible({ ...active, userId: undefined }), false);
  assert.equal(isPlatformTourEligible({ ...active, pendingConsents: [{ ecosystem_id: 'other' }] }), true);
  assert.equal(isPlatformTourEligible({ ...base, memberships: [{ id: 'one' }], pendingConsents: [{ ecosystem_id: 'one' }] }), false);
});

test('automatic introduction is confined to dashboard aliases and never repeats a started tour', () => {
  assert.equal(shouldOfferPlatformTour('/', null), true);
  assert.equal(shouldOfferPlatformTour('/dashboard', null), true);
  for (const path of ['/proposals/new', '/welcome/consent', '/ethos/one', '/communities', '/about']) {
    assert.equal(shouldOfferPlatformTour(path, null), false);
  }
  for (const status of ['in_progress', 'paused', 'completed'] as const) {
    assert.equal(shouldOfferPlatformTour('/dashboard', { version: 1, status, step: 0 }), false);
  }
});

test('malformed, stale and out-of-range progress never selects an invalid step', () => {
  for (const raw of [null, 'bad json', 'null', '{}', '{"version":2,"status":"paused","step":0}',
    '{"version":1,"status":"done","step":0}', '{"version":1,"status":"paused","step":-1}',
    '{"version":1,"status":"paused","step":99}', '{"version":1,"status":"paused","step":1.5}']) {
    assert.equal(parsePlatformTourProgress(raw), null);
  }
  assert.deepEqual(parsePlatformTourProgress('{"version":1,"status":"paused","step":3}'), { version: 1, status: 'paused', step: 3 });
});

test('progress survives storage denial and remains isolated by actual user ID', () => {
  const denied = () => { throw new Error('Storage denied'); };
  const progress: PlatformTourProgress = { version: 1, status: 'paused', step: 4 };
  assert.equal(savePlatformTourProgress('tour-test-owner-a', progress, denied), false);
  assert.deepEqual(readPlatformTourProgress('tour-test-owner-a', denied), progress);
  assert.equal(readPlatformTourProgress('tour-test-owner-b', denied), null);
  assert.notEqual(platformTourKey('a:b'), platformTourKey('a%3Ab'));
});

test('browser persistence records only this owner’s versioned tour progress', () => {
  const items = new Map<string, string>();
  const storage = () => ({ getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => { items.set(key, value); } });
  const progress: PlatformTourProgress = { version: 1, status: 'completed', step: 7 };
  assert.equal(savePlatformTourProgress('tour-test-owner-c', progress, storage), true);
  assert.equal(items.size, 1);
  assert.deepEqual(JSON.parse(items.get(platformTourKey('tour-test-owner-c'))!), progress);
  items.set(platformTourKey('tour-test-owner-d'), JSON.stringify({ ...progress, status: 'paused', step: 2 }));
  assert.deepEqual(readPlatformTourProgress('tour-test-owner-d', storage), { version: 1, status: 'paused', step: 2 });
});
