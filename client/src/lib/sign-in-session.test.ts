import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiErrorMessage } from './api-error-message';
import { checkedSession, signInSuccessNotice } from './sign-in-session';

function apiFetchError(message: string, status: number): Error {
  return Object.assign(new Error(message), { name: 'ApiFetchError', status });
}

test('a failed /me is not a session and does not claim Login Successful', () => {
  const session = checkedSession({ ok: false });
  assert.deepEqual(session, { signedIn: false, consentRequired: false });
  assert.equal(signInSuccessNotice(session), null);
  // The line Login already shows for that 401. No new copy.
  assert.equal(
    apiErrorMessage(apiFetchError('Unauthorized', 401)),
    'Your session has ended. Sign in again to continue.',
  );
  assert.equal(apiErrorMessage(apiFetchError('Invalid username or password', 401)), 'Invalid username or password');
});

test('a session keeps the existing success toast and the consent flag', () => {
  const open = checkedSession({ ok: true, pendingConsents: [] });
  assert.deepEqual(signInSuccessNotice(open), {
    title: 'Login Successful',
    description: 'Welcome to NEOS!',
    consentRequired: false,
  });
  const gated = checkedSession({ ok: true, pendingConsents: [{ ecosystem_id: 'e1' }] });
  assert.equal(signInSuccessNotice(gated)?.consentRequired, true);
  assert.equal(checkedSession({ ok: true, pendingConsents: null }).consentRequired, false);
});
