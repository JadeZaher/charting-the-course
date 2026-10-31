import { Fragment } from 'react';
import { Link } from 'wouter';
import { resolveExternalUrl } from '@/lib/media';
import { cn } from '@/lib/utils';

// Candidate URLs: http(s) scheme up to whitespace or a character that cannot end a pasted link.
const URL_CANDIDATE = /\bhttps?:\/\/[^\s<>"]+/gi;
const TRAILING_PUNCTUATION = /[.,;:!?'"\]}]$/;

export type LinkifiedSegment =
  | { kind: 'text'; value: string }
  | { kind: 'link'; value: string; href: string; inApp: boolean };

/** Drop sentence punctuation a URL picked up, keeping a ")" that closes a "(" inside the URL. */
function trimUrl(candidate: string): string {
  let url = candidate;
  for (;;) {
    if (TRAILING_PUNCTUATION.test(url)) {
      url = url.slice(0, -1);
    } else if (url.endsWith(')') && url.split('(').length < url.split(')').length) {
      url = url.slice(0, -1);
    } else {
      return url;
    }
  }
}

/** Split message text into plain-text and link segments (http/https only). */
export function linkifySegments(text: string, appOrigin: string): LinkifiedSegment[] {
  const segments: LinkifiedSegment[] = [];
  let cursor = 0;
  for (const match of Array.from(text.matchAll(URL_CANDIDATE))) {
    const start = match.index ?? 0;
    const raw = trimUrl(match[0]);
    const href = resolveExternalUrl(raw);
    if (!href) continue;
    if (start > cursor) segments.push({ kind: 'text', value: text.slice(cursor, start) });
    const parsed = new URL(href);
    // "https://app//evil.com" has path "//evil.com", which an in-app <a href> would send off-site.
    const inApp = parsed.origin === appOrigin && !parsed.pathname.startsWith('//');
    segments.push({
      kind: 'link',
      value: raw,
      href: inApp ? `${parsed.pathname}${parsed.search}${parsed.hash}` : href,
      inApp,
    });
    cursor = start + raw.length;
  }
  if (cursor < text.length) segments.push({ kind: 'text', value: text.slice(cursor) });
  return segments;
}

interface LinkifiedTextProps {
  text: string;
  linkClassName?: string;
}

/** Message text with pasted URLs as links; same-origin URLs navigate in-app. React escapes the text. */
export function LinkifiedText({ text, linkClassName }: LinkifiedTextProps) {
  const className = cn('break-words font-medium underline underline-offset-2', linkClassName);
  return (
    <>
      {linkifySegments(text, window.location.origin).map((segment, index) => {
        if (segment.kind === 'text') return <Fragment key={index}>{segment.value}</Fragment>;
        if (segment.inApp) {
          return <Link key={index} href={segment.href} className={className}>{segment.value}</Link>;
        }
        return (
          <a key={index} href={segment.href} target="_blank" rel="noopener noreferrer" className={className}>
            {segment.value}
          </a>
        );
      })}
    </>
  );
}
