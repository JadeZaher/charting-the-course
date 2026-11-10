import { Link, Redirect, useRoute } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { InlineText } from "@/components/InlineText";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { BLOG, ESSAYS, plainParagraph, type Essay } from "@/lib/writing";
import { NEWS, PRACTICES_INDEX } from "@/lib/practices";
import NotFound from "@/pages/not-found";

function ModuleNav({ current }: { current: string }) {
  return (
    <nav aria-label="Writing navigation" className="border-b border-foreground">
      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">Home</Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link href="/blog">Blog</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/practices">Practices</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/news">News</Link></Button>
          <Button asChild variant="ghost" size="sm"><Link href="/about">About</Link></Button>
          <ThemeToggle />
        </div>
      </div>
      <p className="sr-only">{current}</p>
    </nav>
  );
}

export function BlogIndex() {
  useDocumentMeta(BLOG.title, BLOG.description, BLOG.path);
  const posts = [...ESSAYS].sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModuleNav current="Blog" />
      <main className="mx-auto w-full max-w-[68ch] px-4 py-12 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">Escherbridge</p>
        <h1 className="mt-4 font-sans text-4xl font-black tracking-[-0.04em] sm:text-6xl">{BLOG.heading}</h1>
        <div className="mt-10 space-y-10">
          {posts.map((essay) => (
            <article key={essay.slug} className="border-t border-foreground pt-6">
              <p className="font-mono text-xs text-muted-foreground">{essay.date}</p>
              <p className="mt-1 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{essay.topics.join(" · ")}</p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.03em]">
                <Link href={essay.path} className="text-link underline">{essay.title}</Link>
              </h2>
              <p className="mt-4 font-serif text-lg leading-relaxed">{essay.summary}</p>
            </article>
          ))}
        </div>
        <p className="mt-10"><a href="/feed.xml" className="text-link underline">RSS</a></p>
        <p className="mt-4"><Link href="/practices" className="text-link underline">{PRACTICES_INDEX.heading}</Link></p>
        <p className="mt-4"><Link href="/news" className="text-link underline">News</Link>. Nothing has been announced there yet.</p>
      </main>
    </div>
  );
}

function EssayDocument({ essay }: { essay: Essay }) {
  useDocumentMeta(`${essay.title} — NEOS`, essay.summary, essay.path);
  const related = ESSAYS.filter((item) => item.slug !== essay.slug);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModuleNav current={essay.title} />
      <main className="mx-auto w-full max-w-[68ch] px-4 py-12 sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <Link href="/blog" className="text-link underline">Blog</Link>
          <span aria-hidden="true"> · </span>
          Escherbridge
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
        <section className="mt-10 border-t border-foreground pt-6">
          <h2 className="font-mono text-xs uppercase tracking-[0.14em]">Related</h2>
          <ul className="mt-3 space-y-2">
            {related.map((item) => (
              <li key={item.slug}><Link href={item.path} className="inline-flex min-h-11 items-center text-link underline">{item.title}</Link></li>
            ))}
            <li><Link href="/practices" className="inline-flex min-h-11 items-center text-link underline">{PRACTICES_INDEX.heading}</Link></li>
            <li><a href="https://primusneo.com" className="inline-flex min-h-11 items-center text-link underline">PrimusNeo, the lab whose stack this product belongs to</a></li>
          </ul>
        </section>
        <p className="mt-8"><a href="/feed.xml" className="text-link underline">RSS</a></p>
      </main>
    </div>
  );
}

export function BlogEssay() {
  const [, params] = useRoute<{ slug: string }>("/blog/:slug");
  const essay = ESSAYS.find((item) => item.slug === params?.slug);
  if (!essay) return <NotFound />;
  return <EssayDocument essay={essay} />;
}

export function NewsIndex() {
  useDocumentMeta(NEWS.title, NEWS.description, NEWS.path);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModuleNav current="News" />
      <main className="mx-auto w-full max-w-[68ch] px-4 py-12 sm:px-6">
        <h1 className="font-sans text-4xl font-black tracking-[-0.04em] sm:text-6xl">{NEWS.heading}</h1>
        <p className="mt-6 font-serif text-lg leading-relaxed">{NEWS.body}</p>
        <p className="mt-8"><Link href="/blog" className="text-link underline">Blog</Link></p>
      </main>
    </div>
  );
}

const WRITING_REDIRECTS: Record<string, string> = {
  "/writing": "/blog",
  "/writing/act-is-not-a-vote": "/blog/act-is-not-a-vote",
  "/writing/the-key-stays-in-the-browser": "/blog/the-key-stays-in-the-browser",
};

export function WritingRedirect() {
  const [matchEssay, essay] = useRoute<{ slug: string }>("/writing/:slug");
  if (matchEssay && essay?.slug && WRITING_REDIRECTS[`/writing/${essay.slug}`]) {
    return <Redirect to={WRITING_REDIRECTS[`/writing/${essay.slug}`]} />;
  }
  if (matchEssay) return <NotFound />;
  return <Redirect to="/blog" />;
}
