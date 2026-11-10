import { Link } from "wouter";

export function SiteFooter({ auditLink = false }: { auditLink?: boolean }) {
  return (
    <footer className="flex flex-col gap-3 border-t border-foreground px-4 py-6 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
      <p>NEOS — New Earth Operating System</p>
      <nav aria-label="Site" className="flex flex-wrap gap-x-4 gap-y-2">
        <Link href="/about" className="underline">About</Link>
        <Link href="/terms" className="underline">Terms</Link>
        <Link href="/privacy" className="underline">Privacy</Link>
        {auditLink && <a className="underline" href="/node/audit">Public node support history</a>}
      </nav>
    </footer>
  );
}
