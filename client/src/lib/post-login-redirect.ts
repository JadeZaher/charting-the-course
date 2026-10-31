import { resolveInternalPath } from './internal-path';

export const DEFAULT_DESTINATION = '/dashboard';

/** Same-origin in-app path to land on after sign-in; anything else becomes the dashboard. */
export function safeRedirect(raw: string | null | undefined): string {
  const path = resolveInternalPath(raw);
  if (!path || /^\/login(?:[/?#]|$)/.test(path)) return DEFAULT_DESTINATION;
  return path;
}
