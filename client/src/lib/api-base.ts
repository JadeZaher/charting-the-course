/** Where the browser sends API calls.
 * Production is same-origin: nginx proxies /api and /messaging/ws, so the session cookie is first-party.
 * Development uses VITE_API_URL when it is set, and otherwise stays relative for the Vite proxy.
 * A trailing slash is removed so paths that start with / do not gain a double slash.
 */
export function apiBaseUrl(configured: string | null | undefined, production: boolean): string {
  if (production) return '';
  return (configured ?? '').trim().replace(/\/+$/, '');
}

/** WebSocket URL for the messaging socket, on the same base as HTTP calls. */
export function messagingWebSocketUrl(base: string, page: { protocol: string; host: string }, path = '/messaging/ws'): string {
  if (base) return `${base.replace(/^http/, 'ws')}${path}`;
  const protocol = page.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${page.host}${path}`;
}
