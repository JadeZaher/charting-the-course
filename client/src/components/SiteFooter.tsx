import { Link } from "wouter";
import { ESCHERBRIDGE_SITES } from "@/lib/public-documents";

export function SiteFooter({ auditLink = false }: { auditLink?: boolean }) {
  return (
    <footer className="border-t border-foreground px-4 py-6 text-muted-foreground sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 text-xs font-bold uppercase tracking-[0.12em] sm:flex-row sm:items-center sm:justify-between">
        <p>NEOS — New Earth Operating System</p>
        <nav aria-label="Site" className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/about" className="inline-flex min-h-11 items-center underline">About</Link>
          <Link href="/writing" className="inline-flex min-h-11 items-center underline">Writing</Link>
          <Link href="/terms" className="inline-flex min-h-11 items-center underline">Terms</Link>
          <Link href="/privacy" className="inline-flex min-h-11 items-center underline">Privacy</Link>
          {auditLink && <a className="inline-flex min-h-11 items-center underline" href="/node/audit">Public node support history</a>}
        </nav>
      </div>
      <nav aria-label="An Escherbridge project" className="mt-4 border-t border-border pt-4 font-mono text-xs normal-case tracking-normal">
        <p className="font-medium uppercase tracking-[0.14em]">An Escherbridge project</p>
        <ul className="mt-2 flex flex-col sm:flex-row sm:flex-wrap sm:gap-x-4">
          {ESCHERBRIDGE_SITES.map((site) => (
            <li key={site.href}>
              <a href={site.href} className="inline-flex min-h-11 items-center text-link underline">
                {site.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
