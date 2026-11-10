import { test } from 'node:test';
import assert from 'node:assert/strict';
import { apiBaseUrl, messagingWebSocketUrl } from './api-base';

const railway = 'https://neos-operating-system-production.up.railway.app';

test('production calls stay on this origin even when an API url is configured', () => {
  assert.equal(apiBaseUrl(railway, true), '');
  assert.equal(apiBaseUrl(`${railway}/`, true), '');
  assert.equal(apiBaseUrl(undefined, true), '');
  assert.equal(apiBaseUrl(null, true), '');
});

test('development uses a configured API url, otherwise relative paths', () => {
  assert.equal(apiBaseUrl(`${railway}/`, false), railway);
  assert.equal(apiBaseUrl('  http://localhost:8000/  ', false), 'http://localhost:8000');
  assert.equal(apiBaseUrl('   ', false), '');
  assert.equal(apiBaseUrl(undefined, false), '');
});

test('the messaging socket follows that same base', () => {
  const member = { protocol: 'https:', host: 'neos.primusneo.com' };
  assert.equal(messagingWebSocketUrl(apiBaseUrl(railway, true), member), 'wss://neos.primusneo.com/messaging/ws');
  assert.equal(
    messagingWebSocketUrl(apiBaseUrl('http://localhost:8000/', false), { protocol: 'http:', host: 'localhost:5173' }),
    'ws://localhost:8000/messaging/ws',
  );
  assert.equal(
    messagingWebSocketUrl(apiBaseUrl(undefined, false), { protocol: 'http:', host: 'localhost:5173' }, '/messaging/ws'),
    'ws://localhost:5173/messaging/ws',
  );
});
