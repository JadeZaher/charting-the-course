// Conversation names for the signed-in member; see client/src/AGENTS.md §Messaging.

export type NamedParticipant = { id: string; display_name: string };

/** Its title, else the other participants (never the caller); the caller is matched by member id, then by name. */
export function conversationTitle(
  conversation: { title?: string | null; participants: NamedParticipant[] },
  caller: { id?: string | null; display_name?: string | null } | null | undefined,
): string {
  if (conversation.title) return conversation.title;
  const everyone = conversation.participants;
  let others = everyone.filter((participant) => participant.id !== caller?.id);
  // The caller may sit in this conversation through another ecosystem's member row, so fall back to their name.
  if (others.length === everyone.length) {
    const byName = everyone.filter((participant) => participant.display_name !== caller?.display_name);
    if (byName.length > 0) others = byName;
  }
  return (others.length > 0 ? others : everyone).map((participant) => participant.display_name).join(', ');
}
