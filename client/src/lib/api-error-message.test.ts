import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiErrorMessage } from './api-error-message';

/** Same shape apiFetch throws (lib/api-client.ts ApiFetchError: body.error || statusText, plus status). */
function apiFetchError(message: string, status: number): Error {
  return Object.assign(new Error(message), { name: 'ApiFetchError', status });
}

test("the server's own explanation reaches the member at any status", () => {
  const cases: Array<[string, number]> = [
    ['You cannot give advice on your own proposal', 409],
    ["Ecosystem role 'steward' or higher required", 403],
    ['Invalid username or password', 401],
    ['Media storage is unavailable', 503],
  ];
  for (const [message, status] of cases) {
    assert.equal(apiErrorMessage(apiFetchError(message, status)), message, `${status}`);
  }
});

test('a bare status line becomes plain words for that status', () => {
  const cases: Array<[string, number, string]> = [
    ['Unauthorized', 401, 'Your session has ended. Sign in again to continue.'],
    ['', 403, "You don't have permission to do that."],
    ['Not found', 404, "We couldn't find that. It may have been moved or removed."],
    ['Internal Server Error', 500, 'Something went wrong on our side. Try again in a moment.'],
    ['', 502, 'Something went wrong on our side. Try again in a moment.'],
    ['Too Many Requests', 429, 'Too many attempts. Wait a moment and try again.'],
  ];
  for (const [message, status, expected] of cases) {
    assert.equal(apiErrorMessage(apiFetchError(message, status)), expected, `${status} ${message}`);
  }
});

test('an unreachable server reads as a connection problem', () => {
  for (const message of ['Failed to fetch', 'NetworkError when attempting to fetch resource.', 'Load failed']) {
    assert.equal(apiErrorMessage(new TypeError(message)), "We couldn't reach the server. Check your connection and try again.");
  }
});

test('developer error text never reaches the member', () => {
  const cases: unknown[] = [
    new TypeError("Cannot read properties of undefined (reading 'items')"),
    new SyntaxError("Unexpected token '<', \"<!DOCTYPE \"... is not valid JSON"),
    undefined,
    { detail: 'not an error' },
  ];
  for (const error of cases) assert.equal(apiErrorMessage(error), 'Something went wrong. Try again.');
});

test('a plain Error thrown by our own code keeps its message', () => {
  assert.equal(apiErrorMessage(new Error('Not authenticated')), 'Not authenticated');
});
