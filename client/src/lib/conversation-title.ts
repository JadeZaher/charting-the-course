// Conversation names for the signed-in member; see client/src/AGENTS.md §Messaging.
import {
  ADD_DISPLAY_NAME,
  PROFILE_SETTINGS_HREF,
  UNNAMED_OWNER,
  isPlaceholderDisplayName,
  presentPlaceholderName,
  type ViewerIdentity,
} from './placeholder-name';

export type NamedParticipant = { id: string; display_name: string };

export interface ConversationHeadingModel {
  text: string;
  /** Set when the heading contains the viewer's own prompt, so the thread header can link it. */
  prompt: { text: string; href: string } | null;
}

/** The participants other than the caller, matched by member id, then by name; everyone when that leaves nobody. */
function othersThan(
  everyone: NamedParticipant[],
  caller: { id?: string | null; display_name?: string | null } | null | undefined,
): NamedParticipant[] {
  const others = everyone.filter((participant) => participant.id !== caller?.id);
  if (others.length < everyone.length) return others.length > 0 ? others : everyone;
  // The caller may sit in this conversation through another ecosystem's member row, so fall back to their name.
  const byName = everyone.filter((participant) => participant.display_name !== caller?.display_name);
  return byName.length > 0 ? byName : everyone;
}

function presentedName(participant: NamedParticipant, caller: ViewerIdentity | null | undefined): string {
  const presented = presentPlaceholderName({
    name: participant.display_name,
    personId: participant.id,
    viewer: caller,
    asOwner: true,
  });
  if (presented.kind === 'given') return presented.text;
  if (presented.kind === 'self') return ADD_DISPLAY_NAME;
  if (presented.kind === 'unnamed-owner') return UNNAMED_OWNER;
  return '';
}

/** A title that stored the generated string is rewritten; the raw placeholder is not shown. */
function presentedTitle(title: string, participants: readonly NamedParticipant[], caller: ViewerIdentity | null | undefined): string {
  let result = title;
  for (const participant of participants) {
    const raw = participant.display_name?.trim() ?? '';
    if (!isPlaceholderDisplayName(raw)) continue;
    const replacement = presentedName(participant, caller);
    if (replacement && replacement !== raw) result = result.split(raw).join(replacement);
  }
  return result;
}

/**
 * Its title, else the other participants (never the caller). A titled two-person conversation also names the other
 * person ("Ana · Re: Spare drill"), so every answer to one post does not read alike (p3-plain-words-and-joining-3).
 * A generated `Member-…` name is the unnamed-owner sentence, or the viewer's own prompt.
 */
export function conversationHeading(
  conversation: { title?: string | null; participants: NamedParticipant[] },
  caller: ViewerIdentity | null | undefined,
): ConversationHeadingModel {
  const everyone = conversation.participants;
  const others = othersThan(everyone, caller);
  const names = others.map((participant) => presentedName(participant, caller)).filter((name) => name !== '');
  const title = conversation.title ? presentedTitle(conversation.title, everyone, caller) : '';
  let text: string;
  if (title) {
    const other = everyone.length === 2 && others.length === 1 ? names[0] ?? '' : '';
    const alreadyNamed = other !== '' && title.toLowerCase().includes(other.toLowerCase());
    text = other && !alreadyNamed ? `${other} · ${title}` : title;
  } else {
    text = names.join(', ');
  }
  const prompt = text.includes(ADD_DISPLAY_NAME) ? { text: ADD_DISPLAY_NAME, href: PROFILE_SETTINGS_HREF } : null;
  return { text, prompt };
}

export function conversationTitle(
  conversation: { title?: string | null; participants: NamedParticipant[] },
  caller: { id?: string | null; display_name?: string | null } | null | undefined,
): string {
  return conversationHeading(conversation, caller).text;
}
