// Short names for a community owner in Messaging. The long sentence stays on the community and ethos pages.
import { isPlaceholderDisplayName } from './placeholder-name';

export const COMMUNITY_OWNER = 'Community owner';
export const OWNER_COMMUNITY_KEY = 'neos:owner-communities';

export interface OwnerCommunityIndex {
  byParticipantId: Record<string, string>;
  byConversationId: Record<string, string>;
}

export interface OwnerCommunityStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/** "Owner of PGT" when the community is known. Otherwise "Community owner". Never a generated name. */
export function ownerOfCommunity(communityName: string | null | undefined): string {
  const name = communityName?.replace(/[\u0000-\u001f\u007f]/g, '').trim() ?? '';
  if (!name || isPlaceholderDisplayName(name)) return COMMUNITY_OWNER;
  return `Owner of ${name}`;
}

function cleanCommunityName(value: string | null | undefined): string | null {
  const name = value?.replace(/[\u0000-\u001f\u007f]/g, '').trim() ?? '';
  if (!name || isPlaceholderDisplayName(name)) return null;
  return name;
}

export function emptyOwnerCommunities(): OwnerCommunityIndex {
  return { byParticipantId: {}, byConversationId: {} };
}

export function readOwnerCommunities(storage: OwnerCommunityStorage | null | undefined): OwnerCommunityIndex {
  if (!storage) return emptyOwnerCommunities();
  try {
    const raw = storage.getItem(OWNER_COMMUNITY_KEY);
    if (!raw) return emptyOwnerCommunities();
    const parsed = JSON.parse(raw) as { owners?: unknown; conversations?: unknown };
    return {
      byParticipantId: stringMap(parsed.owners),
      byConversationId: stringMap(parsed.conversations),
    };
  } catch {
    return emptyOwnerCommunities();
  }
}

function stringMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object') return {};
  const result: Record<string, string> = {};
  for (const [key, item] of Object.entries(value)) {
    const name = cleanCommunityName(typeof item === 'string' ? item : undefined);
    const id = key.trim();
    if (id && name) result[id] = name;
  }
  return result;
}

/** Remember which community an owner message belongs to, so Messaging can say "Owner of PGT". */
export function rememberOwnerCommunity(
  storage: OwnerCommunityStorage | null | undefined,
  input: { ownerId: string; conversationId: string; communityName: string | null | undefined },
): void {
  if (!storage) return;
  const name = cleanCommunityName(input.communityName);
  const ownerId = input.ownerId.trim();
  const conversationId = input.conversationId.trim();
  if (!name || !ownerId || !conversationId) return;
  const current = readOwnerCommunities(storage);
  current.byParticipantId[ownerId] = name;
  current.byConversationId[conversationId] = name;
  try {
    storage.setItem(OWNER_COMMUNITY_KEY, JSON.stringify({ owners: current.byParticipantId, conversations: current.byConversationId }));
  } catch {
    // Messaging falls back to "Community owner" when the name cannot be stored.
  }
}
