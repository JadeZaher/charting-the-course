import { Link, useRoute } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { PRACTICES, PRACTICES_INDEX } from "@/lib/practices";
import NotFound from "@/pages/not-found";

function ModuleNav() {
  return (
    <nav aria-label="Practices navigation" className="border-b border-foreground">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm"><Link href="/">Home</Link></Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link href="/blog">Blog</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/practices">Practices</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/news">News</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/governance-model">Governance model</Link></Button>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

export function PracticesIndex() {
  useDocumentMeta(PRACTICES_INDEX.title, PRACTICES_INDEX.description, PRACTICES_INDEX.path);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModuleNav />
      <main className="mx-auto w-full max-w-[68ch] px-4 py-12 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{PRACTICES_INDEX.kicker}</p>
        <h1 className="mt-4 font-sans text-4xl font-black tracking-[-0.04em] sm:text-6xl">{PRACTICES_INDEX.heading}</h1>
        <p className="mt-6 font-serif text-lg leading-relaxed">{PRACTICES_INDEX.standfirst}</p>
        <p className="mt-4 text-muted-foreground">{PRACTICES_INDEX.emptyMetrics}</p>
        <div className="mt-10 space-y-8">
          {PRACTICES.map((practice) => (
            <article key={practice.slug} className="border-t border-foreground pt-6">
              <h2 className="text-2xl font-black tracking-[-0.03em]">{practice.title}</h2>
              <p className="mt-3 font-serif text-lg leading-relaxed">{practice.description}</p>
              <p className="mt-3"><Link href={practice.path} className="text-link underline">View {practice.title}</Link></p>
            </article>
          ))}
        </div>
        <section className="mt-12 border-t border-foreground pt-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em]">On this site</h2>
          <p className="mt-4"><Link href="/governance-model" className="text-link underline">How NEOS governs.</Link></p>
          <p className="mt-3"><Link href="/communities" className="text-link underline">Find a community.</Link></p>
          <p className="mt-3"><Link href="/blog" className="text-link underline">Blog</Link></p>
          <p className="mt-4 font-serif text-lg leading-relaxed">
            NEOS is part of <a href="https://primusneo.com" className="text-link underline">PrimusNeo, the lab whose stack this product belongs to</a>. It is offered here as its own product.
          </p>
          <p className="mt-4"><a href="/feed.xml" className="text-link underline">RSS</a></p>
        </section>
      </main>
    </div>
  );
}

export function PracticePage() {
  const [, params] = useRoute<{ slug: string }>("/practices/:slug");
  const practice = PRACTICES.find((item) => item.slug === params?.slug);
  if (!practice) return <NotFound />;
  const siblings = practice.siblings.map((slug) => PRACTICES.find((item) => item.slug === slug)).filter((item) => item !== undefined);
  return <PracticeDocument practice={practice} siblings={siblings} />;
}

function PracticeDocument({
  practice,
  siblings,
}: {
  practice: (typeof PRACTICES)[number];
  siblings: (typeof PRACTICES)[number][];
}) {
  useDocumentMeta(practice.seoTitle, practice.description, practice.path);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModuleNav />
      <main className="mx-auto w-full max-w-[68ch] px-4 py-12 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <Link href="/practices" className="text-link underline">Practices</Link>
          <span aria-hidden="true"> · </span>
          {practice.eyebrow}
        </p>
        <h1 className="mt-4 font-sans text-4xl font-black tracking-[-0.04em] sm:text-5xl">{practice.h1}</h1>
        <p className="mt-4 font-mono text-xs text-muted-foreground">Escherbridge · {practice.dateLabel}</p>
        <div className="mt-8 space-y-6 font-serif text-lg leading-relaxed">
          {practice.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <section className="mt-12 border-t border-foreground pt-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em]">Where this is already said</h2>
          <ul className="mt-3 space-y-2">
            {practice.links.map((link) => (
              <li key={link.href}>
                {link.href.startsWith("/")
                  ? <Link href={link.href} className="inline-flex min-h-11 items-center text-link underline">{link.text}</Link>
                  : <a href={link.href} className="inline-flex min-h-11 items-center text-link underline">{link.text}</a>}
              </li>
            ))}
          </ul>
        </section>
        <section className="mt-10 border-t border-foreground pt-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em]">Sources</h2>
          <ul className="mt-3 space-y-2">
            {practice.sourceList.map((source) => (
              <li key={source.href}><a href={source.href} className="inline-flex min-h-11 items-center text-link underline">{source.label}</a></li>
            ))}
          </ul>
        </section>
        <section className="mt-10 border-t border-foreground pt-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em]">Also in this section</h2>
          <ul className="mt-3 space-y-2">
            {siblings.map((sibling) => (
              <li key={sibling.slug}><Link href={sibling.path} className="inline-flex min-h-11 items-center text-link underline">{sibling.title}</Link></li>
            ))}
          </ul>
          <p className="mt-4"><Link href="/practices" className="text-link underline">{PRACTICES_INDEX.heading}</Link></p>
        </section>
      </main>
    </div>
  );
}
