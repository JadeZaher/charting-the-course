const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const RASTER_DATA_URL = /^data:image\/(?:avif|gif|jpeg|png|webp);/i;

export function resolveExternalUrl(value?: string | null): string | undefined {
  const url = value?.trim();
  if (!url) return undefined;

  try {
    const parsed = new URL(url.startsWith('//') ? `https:${url}` : url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? parsed.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

export function resolveInternalPath(value?: string | null): string | undefined {
  const path = value?.trim();
  if (!path || !path.startsWith('/') || path.startsWith('//') || path.includes('\\')) {
    return undefined;
  }

  try {
    const base = new URL('https://neos.local');
    const parsed = new URL(path, base);
    return parsed.origin === base.origin
      ? `${parsed.pathname}${parsed.search}${parsed.hash}`
      : undefined;
  } catch {
    return undefined;
  }
}

export function resolveResourceUrl(value?: string | null): string | undefined {
  const internalPath = resolveInternalPath(value);
  if (internalPath?.startsWith('/api/') && API_BASE_URL) {
    return `${API_BASE_URL}${internalPath}`;
  }
  return internalPath ?? resolveExternalUrl(value);
}

export function resolveMediaUrl(value?: string | null): string | undefined {
  const url = value?.trim();
  if (!url) return undefined;

  if (url.startsWith('/api/') && API_BASE_URL) {
    return `${API_BASE_URL}${url}`;
  }

  if (url.startsWith('/') && !url.startsWith('//')) return url;
  if (url.startsWith('blob:') || RASTER_DATA_URL.test(url)) return url;
  return resolveExternalUrl(url);
}

export function resolveMiroEmbedUrl(value?: string | null): string | undefined {
  const url = resolveExternalUrl(value);
  if (!url) return undefined;

  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();
  return parsed.protocol === 'https:' && (host === 'miro.com' || host.endsWith('.miro.com'))
    ? parsed.toString()
    : undefined;
}

export function resolvePreziUrl(value?: string | null): string | undefined {
  const url = resolveExternalUrl(value);
  if (!url) return undefined;

  const parsed = new URL(url);
  const host = parsed.hostname.toLowerCase();
  return parsed.protocol === 'https:' && (host === 'prezi.com' || host.endsWith('.prezi.com'))
    ? parsed.toString()
    : undefined;
}

export function resolvePreziEmbedUrl(value?: string | null): string | undefined {
  const url = resolvePreziUrl(value);
  if (!url) return undefined;

  const parsed = new URL(url);
  const match = parsed.pathname.match(/^\/(?:view|p\/embed|p)\/([a-z0-9_-]+)(?:\/|$)/i);
  return match ? `https://prezi.com/p/embed/${match[1]}/` : undefined;
}
