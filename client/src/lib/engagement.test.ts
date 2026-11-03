import { test } from 'node:test';
import assert from 'node:assert/strict';
import { communityEntryPath, engagementPath, pacingSchema, canEnrollChannel, capabilityLabel, displayEventTime, toLocalDatetime, isEngagementScope } from './engagement';
import { consentGateRedirect } from './consent-gate';
import { signupEcosystemId } from './signup-ecosystem';

const ecosystem = '11111111-1111-4111-8111-111111111111';
test('deep-link scope accepts only explicit supported enum keys', () => {
  assert.equal(isEngagementScope('ecosystem'), true);
  for (const value of ['constructor', '__proto__', 'people', undefined]) assert.equal(isEngagementScope(value), false);
});
test('community entry preserves both selected signup ecosystem and sign-in return', () => {
  const href = communityEntryPath(ecosystem, false);
  const query = href.slice(href.indexOf('?'));
  assert.equal(new URLSearchParams(query).get('redirect'), `/ethos/${ecosystem}`);
  assert.equal(signupEcosystemId(query), ecosystem);
  assert.equal(communityEntryPath(ecosystem, true), `/ethos/${ecosystem}`);
});
test('activity links cannot leave the app or become protocol relative after normalization', () => {
  for (const value of ['https://other.example', '//other.example', '/.//other.example', '/\\other.example', 'javascript:alert(1)', undefined, {}]) assert.equal(engagementPath(value), '/updates');
  assert.equal(engagementPath('/proposals/one?from=updates'), '/proposals/one?from=updates');
});
test('pacing validates timezone and paired, distinct quiet-hour boundaries', () => {
  const valid = { timezone: 'America/Denver', quiet_start: '22:00', quiet_end: '07:00', paused_until: '', direct_messages: true };
  assert.equal(pacingSchema.safeParse(valid).success, true);
  for (const patch of [{ timezone: 'Mars/Olympus' }, { quiet_end: '' }, { quiet_end: '22:00' }, { quiet_start: '25:00' }, { paused_until: 'later' }, { direct_messages: 'true' }]) assert.equal(pacingSchema.safeParse({ ...valid, ...patch }).success, false);
  assert.equal(pacingSchema.safeParse({ ...valid, quiet_start: '', quiet_end: '' }).success, true);
});
test('pending setup and suppressed channels cannot enroll a destination', () => {
  for (const state of ['pending_setup', 'configured_disabled', 'suppressed', undefined]) assert.equal(canEnrollChannel(state), false);
  assert.equal(canEnrollChannel('needs_verification'), true);
  assert.equal(canEnrollChannel('ready'), true);
  assert.equal(capabilityLabel('pending_setup'), 'Setup pending');
});
test('pending entrants may inspect community and notification choices without opening governance routes', () => {
  const gate = { isAuthenticated: true, pendingConsents: [{ ecosystem_id: ecosystem }], memberships: [{ id: ecosystem, membership_status: 'pending_consent' }] };
  for (const path of ['/communities', `/communities/${ecosystem}`, '/updates', '/settings/notifications']) assert.equal(consentGateRedirect({ ...gate, path }), null);
  for (const path of ['/proposals/new', '/communities/x/private', '/settings/notifications/anything']) assert.equal(consentGateRedirect({ ...gate, path }), '/welcome/consent');
});
test('invalid dates have honest fallbacks and pause values round trip local input', () => {
  assert.equal(displayEventTime('bad'), 'Date unavailable');
  assert.equal(toLocalDatetime('bad'), '');
  const value = '2026-11-02T18:30:00Z';
  assert.equal(new Date(toLocalDatetime(value)).getTime(), new Date(value).getTime());
});
