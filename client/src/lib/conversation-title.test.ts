import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ADD_DISPLAY_NAME, PROFILE_SETTINGS_HREF, UNNAMED_OWNER } from './placeholder-name';
import { conversationHeading, conversationTitle } from './conversation-title';

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
    [{ participants: [oren] }, oren, 'Oren', 'a conversation with only the caller still has a name'],
    [{ participants: [oren, amara] }, null, 'Oren, Amara', 'signed out: everyone'],
  ];
  for (const [conversation, caller, expected, why] of cases) assert.equal(conversationTitle(conversation, caller), expected, why);
});

// p3-plain-words-and-joining-3: every answer to one post is stored as "Re: <post>"; the poster tells them apart by who wrote.
test('a titled conversation between two people also names the other one', () => {
  const answer = (responder: typeof oren) => ({ title: 'Re: Spare drill', participants: [responder, amara] });
  const cases: [Parameters<typeof conversationTitle>[0], Parameters<typeof conversationTitle>[1], string, string][] = [
    [answer(oren), amara, 'Oren · Re: Spare drill', 'the poster sees who answered'],
    [answer(ines), amara, 'Ines · Re: Spare drill', 'a second answer to the same post reads differently'],
    [answer(oren), oren, 'Amara · Re: Spare drill', 'the responder sees whose post it was'],
    [answer({ id: 'm-oren-oasis', display_name: 'Oren' }), oren, 'Amara · Re: Spare drill', 'the caller matched by name'],
    [{ title: 'Tool shed rota', participants: [oren, amara, ines] }, oren, 'Tool shed rota', 'a group keeps its title'],
    [{ title: 'Amara and Oren: tools', participants: [oren, amara] }, oren, 'Amara and Oren: tools', 'a title that already names them'],
    [answer(oren), null, 'Re: Spare drill', 'signed out: no other person to single out'],
  ];
  for (const [conversation, caller, expected, why] of cases) assert.equal(conversationTitle(conversation, caller), expected, why);
});

const placeholder = { id: 'm-owner', display_name: 'Member-mMdYcHC7' };

test('a generated Member- name is not shown in the thread heading', () => {
  const guest = { id: 'm-guest', display_name: 'Ada' };
  assert.equal(conversationTitle({ participants: [placeholder, guest] }, guest), UNNAMED_OWNER);
  assert.equal(conversationTitle({ participants: [placeholder, guest] }, placeholder), 'Ada');
  assert.equal(
    conversationTitle({ title: 'Re: Spare drill', participants: [placeholder, guest] }, guest),
    `${UNNAMED_OWNER} · Re: Spare drill`,
  );
  assert.equal(conversationTitle({ title: 'Member-mMdYcHC7', participants: [placeholder, guest] }, guest), UNNAMED_OWNER);
  assert.equal(conversationTitle({ participants: [placeholder] }, placeholder), ADD_DISPLAY_NAME);
  const heading = conversationHeading({ participants: [placeholder] }, placeholder);
  assert.equal(heading.prompt?.text, ADD_DISPLAY_NAME);
  assert.equal(heading.prompt?.href, PROFILE_SETTINGS_HREF);
  assert.equal(conversationHeading({ participants: [placeholder, guest] }, guest).prompt, null);
  assert.equal(JSON.stringify(conversationTitle({ participants: [placeholder, guest] }, guest)).includes('Member-mMdYcHC7'), false);
});
