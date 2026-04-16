import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Prezi share URL to an embed URL, stripping query parameters.
 * Prezi share: https://prezi.com/p/abc123/?token=... or /view/abc123/
 * Prezi embed: https://prezi.com/p/embed/abc123/
 * Non-Prezi URLs are returned as-is.
 */
export function prezify(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('prezi.com')) {
      // Extract id from /view/{id}/ or /p/{id}/ or /p/embed/{id}/
      const viewMatch = parsed.pathname.match(/^\/view\/([^/]+)/);
      const pMatch = parsed.pathname.match(/^\/p\/(?!embed\/)([^/]+)/);
      const id = viewMatch?.[1] ?? pMatch?.[1];
      if (id) {
        return `https://prezi.com/p/embed/${id}/`;
      }
    }
    return url;
  } catch {
    return url;
  }
}

export const APP_SETTINGS_KEYS = {
  ctcMap: 'ctc_map',
} as const;
