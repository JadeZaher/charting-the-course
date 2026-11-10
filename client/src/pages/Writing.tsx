import { Link, useRoute } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { InlineText } from "@/components/InlineText";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { ESSAYS, WRITING, plainParagraph, type Essay } from "@/lib/public-documents";
import NotFound from "@/pages/not-found";

function WritingNav() {
  return (
    <nav aria-label="Writing navigation" className="border-b border-foreground">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Home</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link href="/writing">Writing</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/about">About</Link></Button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

export function WritingIndex() {
  useDocumentMeta(WRITING.title, WRITING.description);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <WritingNav />
      <main className="mx-auto w-full max-w-[68ch] px-4 py-12 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">Notes</p>
        <h1 className="mt-4 font-sans text-4xl font-black tracking-[-0.04em] sm:text-6xl">{WRITING.heading}</h1>
        <div className="mt-10 space-y-10">
          {ESSAYS.map((essay) => (
            <article key={essay.slug} className="border-t border-foreground pt-6">
              <h2 className="text-2xl font-black tracking-[-0.03em]">
                <Link href={essay.path} className="text-link underline">{essay.title}</Link>
              </h2>
              <p className="mt-2 font-mono text-xs text-muted-foreground">{essay.date}</p>
              <p className="mt-4 font-serif text-lg leading-relaxed">{essay.summary}</p>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}

function EssayDocument({ essay }: { essay: Essay }) {
  useDocumentMeta(`${essay.title} — NEOS`, essay.summary);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <WritingNav />
      <main className="mx-auto w-full max-w-[68ch] px-4 py-12 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <Link href="/writing" className="text-link underline">Writing</Link>
          <span aria-hidden="true"> · </span>
          {essay.date}
        </p>
        <h1 className="mt-4 font-sans text-4xl font-black tracking-[-0.04em] sm:text-5xl">{essay.title}</h1>
        <div className="mt-8 space-y-6 font-serif text-lg leading-relaxed">
          {essay.paragraphs.map((paragraph) => (
            <p key={plainParagraph(paragraph)}>
              <InlineText value={paragraph} />
            </p>
          ))}
        </div>
        <section className="mt-12 border-t border-foreground pt-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em]">Sources</h2>
          <ul className="mt-3 space-y-2">
            {essay.sources.map((source) => (
              <li key={source.href}>
                <a href={source.href} className="inline-flex min-h-11 items-center text-link underline">{source.label}</a>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

export function WritingEssay() {
  const [, params] = useRoute<{ slug: string }>("/writing/:slug");
  const essay = ESSAYS.find((item) => item.slug === params?.slug);
  if (!essay) return <NotFound />;
  return <EssayDocument essay={essay} />;
}
