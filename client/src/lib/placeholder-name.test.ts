import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ADD_DISPLAY_NAME,
  PLACEHOLDER_DISPLAY_NAME,
  PROFILE_SETTINGS_HREF,
  UNNAMED_OWNER,
  isPlaceholderDisplayName,
  presentPlaceholderName,
  viewerIsNamedPerson,
} from './placeholder-name';

const PLACEHOLDER = 'Member-mMdYcHC7';

test('a generated Member- name is a placeholder, and a chosen name is not', () => {
  assert.equal(UNNAMED_OWNER, "The owner hasn't added a display name yet");
  assert.equal(ADD_DISPLAY_NAME, "Add a display name so people know who they're messaging.");
  assert.equal(PROFILE_SETTINGS_HREF, '/profile');
  assert.equal(isPlaceholderDisplayName(PLACEHOLDER), true);
  assert.equal(isPlaceholderDisplayName(` ${PLACEHOLDER} `), true);
  assert.equal(PLACEHOLDER_DISPLAY_NAME.test('Member-abcdef'), true);
  assert.equal(isPlaceholderDisplayName('Member-abcde'), false);
  assert.equal(isPlaceholderDisplayName('Member-'), false);
  assert.equal(isPlaceholderDisplayName('Ada'), false);
  assert.equal(isPlaceholderDisplayName('Member mMdYcHC7'), false);
  assert.equal(isPlaceholderDisplayName('member-mMdYcHC7'), false);
  assert.equal(isPlaceholderDisplayName(''), false);
});

test('the viewer is that owner by member id, or by the same placeholder on another membership row', () => {
  assert.equal(viewerIsNamedPerson({ id: 'mem-owner', display_name: PLACEHOLDER }, { id: 'mem-owner', display_name: 'Ada' }), true);
  assert.equal(viewerIsNamedPerson({ id: 'mem-owner', display_name: PLACEHOLDER }, { id: 'mem-other-row', display_name: PLACEHOLDER }), true);
  assert.equal(viewerIsNamedPerson({ id: 'mem-owner', display_name: PLACEHOLDER }, { id: 'mem-guest', display_name: 'Ada' }), false);
  assert.equal(viewerIsNamedPerson({ id: 'mem-owner', display_name: 'Ada' }, { id: 'mem-guest', display_name: 'Ada' }), false);
  assert.equal(viewerIsNamedPerson({ id: 'mem-owner', display_name: PLACEHOLDER }, null), false);
});

test('a placeholder owner is the unnamed sentence, the prompt for themselves, and never the generated string', () => {
  assert.deepEqual(
    presentPlaceholderName({ name: 'Ada', asOwner: true }),
    { kind: 'given', text: 'Ada' },
  );
  assert.deepEqual(
    presentPlaceholderName({ name: PLACEHOLDER, personId: 'mem-owner', asOwner: true, viewer: { id: 'mem-guest', display_name: 'Ada' } }),
    { kind: 'unnamed-owner' },
  );
  assert.deepEqual(
    presentPlaceholderName({ name: PLACEHOLDER, personId: 'mem-owner', asOwner: true, viewer: { id: 'mem-owner', display_name: PLACEHOLDER } }),
    { kind: 'self' },
  );
  assert.deepEqual(
    presentPlaceholderName({ name: PLACEHOLDER, personId: 'mem-2', asOwner: false, viewer: { id: 'mem-guest', display_name: 'Ada' } }),
    { kind: 'hidden' },
  );
  assert.equal(presentPlaceholderName({ name: '   ', asOwner: true }).kind, 'hidden');
});
