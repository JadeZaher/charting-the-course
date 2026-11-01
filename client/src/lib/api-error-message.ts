// One plain-language sentence for any thrown error (see client/src/AGENTS.md "Shared data and feedback contracts").
import type { ApiFetchError } from './api-client';

const STATUS_MESSAGES: Readonly<Record<number, string>> = {
  400: 'Some of the details were not accepted. Check them and try again.',
  401: 'Your session has ended. Sign in again to continue.',
  403: "You don't have permission to do that.",
  404: "We couldn't find that. It may have been moved or removed.",
  409: 'That clashes with a recent change. Refresh the page and try again.',
  422: 'Some of the details were not accepted. Check them and try again.',
  429: 'Too many attempts. Wait a moment and try again.',
};
const SERVER_FAILURE_MESSAGE = 'Something went wrong on our side. Try again in a moment.';
const NETWORK_FAILURE_MESSAGE = "We couldn't reach the server. Check your connection and try again.";
const FALLBACK_MESSAGE = 'Something went wrong. Try again.';

/** HTTP reason phrases a server sends when it has nothing specific to say. */
const REASON_PHRASES = new Set([
  'bad request', 'unauthorized', 'forbidden', 'not found', 'method not allowed', 'conflict',
  'payload too large', 'unprocessable entity', 'unprocessable content', 'too many requests',
  'internal server error', 'bad gateway', 'service unavailable', 'gateway timeout',
]);

/** User-facing message for a failed request or action: the server's own words when it gave any, else plain words for the status. */
export function apiErrorMessage(error: unknown): string {
  const message = messageOf(error);
  const status = httpStatusOf(error);
  if (status !== null) {
    if (message && !REASON_PHRASES.has(message.toLowerCase().replace(/\.$/, ''))) return message;
    return status >= 500 ? SERVER_FAILURE_MESSAGE : STATUS_MESSAGES[status] ?? FALLBACK_MESSAGE;
  }
  // fetch() rejects with a TypeError when the request never reached the server.
  if (error instanceof TypeError && /fetch|network|load failed/i.test(message)) return NETWORK_FAILURE_MESSAGE;
  // Engine errors (a bad JSON body, a client bug) carry developer text, never words for a member.
  if (error instanceof TypeError || error instanceof SyntaxError || error instanceof RangeError || error instanceof ReferenceError) {
    return FALLBACK_MESSAGE;
  }
  return message || FALLBACK_MESSAGE;
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message.trim();
  return typeof error === 'string' ? error.trim() : '';
}

/** Status of an ApiFetchError (lib/api-client.ts), matched by shape so this module stays free of import.meta.env. */
function httpStatusOf(error: unknown): number | null {
  if (!(error instanceof Error)) return null;
  const { status } = error as Partial<ApiFetchError>;
  return typeof status === 'number' ? status : null;
}
