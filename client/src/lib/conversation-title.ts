// Conversation names for the signed-in member; see client/src/AGENTS.md §Messaging.

export type NamedParticipant = { id: string; display_name: string };

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

/**
 * Its title, else the other participants (never the caller). A titled two-person conversation also names the other
 * person ("Ana · Re: Spare drill"), so every answer to one post does not read alike (p3-plain-words-and-joining-3).
 */
export function conversationTitle(
  conversation: { title?: string | null; participants: NamedParticipant[] },
  caller: { id?: string | null; display_name?: string | null } | null | undefined,
): string {
  const everyone = conversation.participants;
  const others = othersThan(everyone, caller);
  if (conversation.title) {
    const other = everyone.length === 2 && others.length === 1 ? others[0].display_name.trim() : '';
    const alreadyNamed = other !== '' && conversation.title.toLowerCase().includes(other.toLowerCase());
    return other && !alreadyNamed ? `${other} · ${conversation.title}` : conversation.title;
  }
  return others.map((participant) => participant.display_name).join(', ');
}
