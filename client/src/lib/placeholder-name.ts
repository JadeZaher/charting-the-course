// Generated membership names ("Member-" plus a random suffix) are not names a person chose.
// Who's here, the owner contact and a direct-message heading say so, and never invent a name.
import { spaceHomeCopy as copy } from './space-home-copy';

/** `Member-` plus at least six letters or digits. Shorter or punctuated strings are left alone. */
export const PLACEHOLDER_DISPLAY_NAME = /^Member-[A-Za-z0-9]{6,}$/;

/** Where the signed-in person edits the name other people see. */
export const PROFILE_SETTINGS_HREF = '/profile';

export const UNNAMED_OWNER = copy.whosHere.unnamedOwner;
export const ADD_DISPLAY_NAME = copy.whosHere.addDisplayName;

export interface ViewerIdentity {
  id?: string | null;
  display_name?: string | null;
}

export function isPlaceholderDisplayName(value: string | null | undefined): boolean {
  return PLACEHOLDER_DISPLAY_NAME.test(value?.trim() ?? '');
}

/**
 * True when the signed-in viewer is this person.
 * Member id matches across the same row. The same generated placeholder matches when
 * `/auth/me` is sitting on a different membership row than the one named here.
 */
export function viewerIsNamedPerson(
  person: { id?: string | null; display_name?: string | null },
  viewer: ViewerIdentity | null | undefined,
): boolean {
  if (!viewer) return false;
  const personId = person.id?.trim() ?? '';
  const viewerId = viewer.id?.trim() ?? '';
  if (personId && viewerId && personId === viewerId) return true;
  const personName = person.display_name?.trim() ?? '';
  const viewerName = viewer.display_name?.trim() ?? '';
  return isPlaceholderDisplayName(personName) && personName === viewerName;
}

export type PlaceholderPresentation =
  | { kind: 'given'; text: string }
  | { kind: 'unnamed-owner' }
  | { kind: 'self' }
  | { kind: 'hidden' };

/**
 * How to show a display name.
 * A real name is kept. A placeholder for the owner becomes the unnamed-owner sentence.
 * A placeholder for anyone else is hidden, so a generated string is never presented as a name.
 * When the viewer is that person, the result is the prompt that links to profile settings.
 */
export function presentPlaceholderName(input: {
  name: string | null | undefined;
  personId?: string | null;
  viewer?: ViewerIdentity | null;
  /** This person is the ecosystem owner (or the direct-message heading is standing in for them). */
  asOwner: boolean;
}): PlaceholderPresentation {
  const name = input.name?.trim() ?? '';
  if (!name) return { kind: 'hidden' };
  if (!isPlaceholderDisplayName(name)) return { kind: 'given', text: name };
  if (viewerIsNamedPerson({ id: input.personId, display_name: name }, input.viewer)) return { kind: 'self' };
  if (input.asOwner) return { kind: 'unnamed-owner' };
  return { kind: 'hidden' };
}
