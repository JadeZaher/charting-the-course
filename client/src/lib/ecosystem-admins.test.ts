import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  SEAT_HELD_MESSAGE,
  adminDesignationText,
  canChangeLink,
  canClaimSeat,
  canCreateQuiz,
  canGrantLink,
  designationLabel,
  ecosystemHasActiveAdmin,
  isSeatHeld,
  redesignateTargets,
  vacantDesignations,
  type AdminActor,
} from './ecosystem-admins';

const member = (overrides: Partial<AdminActor> = {}): AdminActor => ({
  memberId: 'mem-1',
  role: 'user',
  active: true,
  isNodeAdmin: false,
  held: [],
  ...overrides,
});

test('designations read as Lead Link and Rep Link', () => {
  assert.equal(designationLabel('internal'), 'Lead Link');
  assert.equal(designationLabel('external'), 'Rep Link');
  assert.equal(adminDesignationText(['internal', 'external']), 'Lead Link, Rep Link');
});

test('grant is an owner, an internal admin, or a node admin', () => {
  assert.equal(canGrantLink(member({ role: 'owner' })), true);
  assert.equal(canGrantLink(member({ held: ['internal'] })), true);
  assert.equal(canGrantLink(member({ isNodeAdmin: true, active: false, memberId: null })), true);
  assert.equal(canGrantLink(member({ held: ['external'] })), false);
  assert.equal(canGrantLink(member({ role: 'owner', active: false })), false);
  assert.equal(canGrantLink(member({ role: 'admin' })), false);
  assert.equal(canGrantLink(member()), false);
});

test('revoke and re-designate belong to that admin or a node admin', () => {
  const self = member({ memberId: 'ada', held: ['external'] });
  assert.equal(canChangeLink(self, 'ada'), true);
  assert.equal(canChangeLink(self, 'bea'), false);
  assert.equal(canChangeLink(member({ role: 'owner', memberId: 'owner' }), 'ada'), false);
  assert.equal(canChangeLink(member({ held: ['internal'], memberId: 'lead' }), 'ada'), false);
  assert.equal(canChangeLink(member({ isNodeAdmin: true, memberId: null, active: false }), 'ada'), true);
  assert.equal(canChangeLink(member({ memberId: 'ada', active: false, held: ['internal'] }), 'ada'), false);
});

test('a vacant seat can be claimed by any active member', () => {
  const admins = [{ designations: ['internal'] }];
  assert.deepEqual(vacantDesignations(admins), ['external']);
  assert.deepEqual(vacantDesignations([]), ['internal', 'external']);
  assert.deepEqual(vacantDesignations([{ designations: ['internal'] }, { designations: ['external'] }]), []);
  assert.equal(canClaimSeat(member(), ['external']), true);
  assert.equal(canClaimSeat(member(), []), false);
  assert.equal(canClaimSeat(member({ active: false }), ['internal', 'external']), false);
  assert.deepEqual(redesignateTargets(['internal']), ['external']);
  assert.deepEqual(redesignateTargets(['internal', 'external']), ['internal', 'external']);
});

test('a held seat is the 403 SEAT_HELD refusal', () => {
  assert.equal(isSeatHeld(Object.assign(new Error('That admin seat is already held.'), { status: 403, code: 'SEAT_HELD' })), true);
  assert.equal(isSeatHeld(Object.assign(new Error('nope'), { status: 403, code: 'ADMIN_REQUIRED' })), false);
  assert.equal(isSeatHeld(Object.assign(new Error('That admin seat is already held.'), { status: 403 })), true);
  assert.equal(SEAT_HELD_MESSAGE, 'That seat is already held.');
});

test('quiz creation opens to any active member only while the ecosystem has no admin', () => {
  assert.equal(canCreateQuiz({ hasActiveAdmin: false, isActiveMember: true, stewardGate: false }), true);
  assert.equal(canCreateQuiz({ hasActiveAdmin: false, isActiveMember: false, stewardGate: false }), false);
  assert.equal(canCreateQuiz({ hasActiveAdmin: true, isActiveMember: true, stewardGate: false }), false);
  assert.equal(canCreateQuiz({ hasActiveAdmin: true, isActiveMember: true, stewardGate: true }), true);
  assert.equal(canCreateQuiz({ hasActiveAdmin: false, isActiveMember: false, stewardGate: true }), true);
  assert.equal(ecosystemHasActiveAdmin(null, true), false);
  assert.equal(ecosystemHasActiveAdmin({ id: 'ada' }, true), true);
  assert.equal(ecosystemHasActiveAdmin(undefined, false), true);
});
