import { Link } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { CONTACT_LINE, CONTACT_PAGE } from "@/lib/public-documents";

export default function ContactPage() {
  useDocumentMeta(CONTACT_PAGE.title, CONTACT_PAGE.description, CONTACT_PAGE.path);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav aria-label="Contact navigation" className="border-b border-foreground">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Home</Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/about">About</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/terms">Terms</Link></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/privacy">Privacy</Link></Button>
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-12 sm:px-6">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.18em]">NEOS</p>
          <h1 className="mt-4 text-4xl font-black uppercase tracking-[-0.04em] sm:text-6xl">{CONTACT_PAGE.heading}</h1>
        </header>
        <p className="text-base leading-relaxed">{CONTACT_LINE}</p>
        <p className="text-base leading-relaxed">
          <a className="inline-flex min-h-11 items-center text-link underline" href={`mailto:${CONTACT_PAGE.email}`}>{CONTACT_PAGE.email}</a>
        </p>
        <p className="text-base leading-relaxed text-muted-foreground">{CONTACT_PAGE.body}</p>
      </main>
    </div>
  );
}
