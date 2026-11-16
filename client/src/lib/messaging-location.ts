// The open thread stays in the address bar (`/messaging?conversation=<id>`) so a refresh returns to it.

const PLAIN_ID = /^[A-Za-z0-9_-]{1,64}$/;

function searchParams(queryString: string): URLSearchParams {
  const raw = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  return new URLSearchParams(raw);
}

/**
 * Messaging path plus query.
 * `conversation` replaces the open thread (an id that is not plain is dropped).
 * `dropMember` removes the one-shot new-conversation hint and leaves the thread in place.
 * Every other parameter is kept.
 */
export function messagingLocation(
  queryString: string,
  update: { conversation?: string | null; dropMember?: boolean } = {},
): string {
  const params = searchParams(queryString);
  if (update.dropMember) params.delete('member');
  if (Object.prototype.hasOwnProperty.call(update, 'conversation')) {
    const id = update.conversation?.trim() ?? '';
    if (PLAIN_ID.test(id)) params.set('conversation', id);
    else params.delete('conversation');
  }
  const rest = params.toString();
  return rest ? `/messaging?${rest}` : '/messaging';
}
