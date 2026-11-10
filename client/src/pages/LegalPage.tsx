import { Link } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { PRIVACY_PAGE, TERMS_PAGE, type LegalSection } from "@/lib/public-documents";

function LegalDocument({
  title,
  description,
  heading,
  updated,
  intro = [],
  sections,
}: {
  title: string;
  description: string;
  heading: string;
  updated: string;
  intro?: readonly string[];
  sections: readonly LegalSection[];
}) {
  useDocumentMeta(title, description);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav aria-label="Legal navigation" className="border-b border-foreground">
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
          <h1 className="mt-4 text-4xl font-black uppercase tracking-[-0.04em] sm:text-6xl">{heading}</h1>
          <p className="mt-4 text-sm text-muted-foreground">Updated {updated}</p>
        </header>
        {intro.map((paragraph) => (
          <p key={paragraph} className="text-base leading-relaxed">{paragraph}</p>
        ))}
        {sections.map((section) => (
          <section key={section.heading} className="space-y-3 border-t border-foreground pt-6">
            <h2 className="text-xl font-black uppercase">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-base leading-relaxed text-muted-foreground">{paragraph}</p>
            ))}
          </section>
        ))}
      </main>
    </div>
  );
}

export function TermsPage() {
  return <LegalDocument {...TERMS_PAGE} />;
}

export function PrivacyPage() {
  return <LegalDocument {...PRIVACY_PAGE} />;
}
