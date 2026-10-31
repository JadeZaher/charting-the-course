// Same-origin path validation shared by links, media and post-login redirects (no env access, so node tests can import it).

const BASE = 'https://neos.local';

/** Normalised same-origin path (pathname + search + hash), or undefined for anything that could leave the app. */
export function resolveInternalPath(value?: string | null): string | undefined {
  const path = value?.trim();
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return undefined;
  }

  try {
    const base = new URL(BASE);
    const parsed = new URL(path, base);
    if (parsed.origin !== base.origin) return undefined;
    // Dot segments can normalise "/.//evil.com" to "//evil.com", which a browser reads as another host.
    if (parsed.pathname.startsWith('//')) return undefined;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return undefined;
  }
}
