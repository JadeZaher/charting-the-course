import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  COMMUNITY_OWNER,
  rememberOwnerCommunity,
  ownerOfCommunity,
  readOwnerCommunities,
  type OwnerCommunityStorage,
} from './owner-community';

function memory(): OwnerCommunityStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => { data.set(key, value); },
  };
}

test('a placeholder owner in Messaging is Owner of the community, or Community owner', () => {
  assert.equal(ownerOfCommunity('PGT'), 'Owner of PGT');
  assert.equal(ownerOfCommunity('  PGT  '), 'Owner of PGT');
  assert.equal(ownerOfCommunity(''), COMMUNITY_OWNER);
  assert.equal(ownerOfCommunity('   '), COMMUNITY_OWNER);
  assert.equal(ownerOfCommunity(null), COMMUNITY_OWNER);
  assert.equal(ownerOfCommunity('Member-mMdYcHC7'), COMMUNITY_OWNER);
  assert.equal(COMMUNITY_OWNER, 'Community owner');
});

test('the community name is remembered for the owner and the conversation', () => {
  const store = memory();
  rememberOwnerCommunity(store, { ownerId: 'mem-owner', conversationId: 'dm-1', communityName: 'PGT' });
  const known = readOwnerCommunities(store);
  assert.equal(known.byParticipantId['mem-owner'], 'PGT');
  assert.equal(known.byConversationId['dm-1'], 'PGT');
  rememberOwnerCommunity(store, { ownerId: 'mem-owner', conversationId: 'dm-1', communityName: '  ' });
  assert.equal(readOwnerCommunities(store).byParticipantId['mem-owner'], 'PGT');
  rememberOwnerCommunity(null, { ownerId: 'mem-owner', conversationId: 'dm-2', communityName: 'PGT' });
  assert.deepEqual(readOwnerCommunities(null), { byParticipantId: {}, byConversationId: {} });
});

test('a broken store does not invent a community name', () => {
  const broken: OwnerCommunityStorage = {
    getItem: () => '{',
    setItem: () => { throw new Error('full'); },
  };
  assert.deepEqual(readOwnerCommunities(broken), { byParticipantId: {}, byConversationId: {} });
  rememberOwnerCommunity(broken, { ownerId: 'mem-owner', conversationId: 'dm-1', communityName: 'PGT' });
});
