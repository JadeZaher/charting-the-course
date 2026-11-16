import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conversationIdFromQuery } from './exchange';
import { messagingLocation } from './messaging-location';

test('the open conversation stays in the messaging URL, including a refresh', () => {
  const href = messagingLocation('', { conversation: 'dm-1' });
  assert.equal(href, '/messaging?conversation=dm-1');
  const query = href.slice(href.indexOf('?') + 1);
  assert.equal(conversationIdFromQuery(query), 'dm-1');
  assert.equal(messagingLocation(query), href);
  assert.equal(messagingLocation(`?${query}`), href);
});

test('switching threads replaces the conversation and keeps every other parameter', () => {
  assert.equal(
    messagingLocation('conversation=dm-1&tab=x', { conversation: 'dm-2' }),
    '/messaging?conversation=dm-2&tab=x',
  );
  assert.equal(messagingLocation('conversation=dm-1', { conversation: '  dm-2  ' }), '/messaging?conversation=dm-2');
});

test('an unsafe conversation id is not written into the URL', () => {
  assert.equal(messagingLocation('conversation=dm-1', { conversation: '../admin' }), '/messaging');
  assert.equal(messagingLocation('', { conversation: '' }), '/messaging');
  assert.equal(messagingLocation('conversation=dm-1', { conversation: null }), '/messaging');
});

test('the one-shot member hint is dropped without closing the open thread', () => {
  assert.equal(
    messagingLocation('member=mem-1&conversation=dm-1', { dropMember: true }),
    '/messaging?conversation=dm-1',
  );
  assert.equal(messagingLocation('?member=mem-1', { dropMember: true }), '/messaging');
});
