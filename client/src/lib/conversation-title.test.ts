import { test } from 'node:test';
import assert from 'node:assert/strict';
import { conversationTitle } from './conversation-title';

const oren = { id: 'm-oren', display_name: 'Oren' };
const amara = { id: 'm-amara', display_name: 'Amara' };
const ines = { id: 'm-ines', display_name: 'Ines' };

test('a conversation is named for the caller by the people in it, never by the caller', () => {
  const cases: [Parameters<typeof conversationTitle>[0], Parameters<typeof conversationTitle>[1], string, string][] = [
    [{ participants: [oren, amara] }, oren, 'Amara', 'a direct message shows the other person'],
    [{ participants: [oren, amara, ines] }, amara, 'Oren, Ines', 'a group lists everyone else'],
    // Signed in through another ecosystem's member row: the id differs, the name still drops them.
    [{ participants: [{ id: 'm-oren-oasis', display_name: 'Oren' }, amara] }, oren, 'Amara', 'the caller by name'],
    // Matched by id first, so a namesake stays in the name.
    [{ participants: [oren, { id: 'm-oren-2', display_name: 'Oren' }] }, oren, 'Oren', 'two members called Oren'],
    [{ title: 'Tool shed rota', participants: [oren, amara] }, oren, 'Tool shed rota', 'a title wins'],
    [{ participants: [oren] }, oren, 'Oren', 'a conversation with only the caller still has a name'],
    [{ participants: [oren, amara] }, null, 'Oren, Amara', 'signed out: everyone'],
  ];
  for (const [conversation, caller, expected, why] of cases) assert.equal(conversationTitle(conversation, caller), expected, why);
});
