import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Prezi share URL to an embed URL.
 * Prezi share: https://prezi.com/p/abc123/
 * Prezi embed: https://prezi.com/p/abc123/embed
 * Non-Prezi URLs are returned as-is.
 */
export function prezify(url: string): string {
  if (!url) return '';
  if (url.includes('prezi.com') && !url.includes('/embed')) {
    return url.replace(/\/?$/, '/embed');
  }
  return url;
}

export const APP_SETTINGS_KEYS = {
  ctcMap: 'ctc_map',
} as const;
