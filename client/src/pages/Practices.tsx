import { Link, Redirect, useRoute } from "wouter";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import {
  PRACTICES,
  PRACTICES_INDEX,
  type Practice,
  type PracticeBlock,
  type PracticeInline,
  type PracticeRun,
  type PracticeSource,
} from "@/lib/practices";
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

const FORMER_PRACTICE_SLUGS: Record<string, string> = {
  act: "/practices/act-is-not-a-vote",
  "agreements-and-decision-records": "/practices/agreements-decision-records",
};

function PracticeInlineView({ part }: { part: PracticeInline }) {
  if (typeof part === "string") return part;
  if ("em" in part) return <em>{part.em}</em>;
  const text = part.strong ? <strong>{part.text}</strong> : part.text;
  return part.href.startsWith("/")
    ? <Link href={part.href} className="text-link underline">{text}</Link>
    : <a href={part.href} className="text-link underline">{text}</a>;
}

function PracticeRunView({ value }: { value: PracticeRun }) {
  if (typeof value === "string") return value;
  if ("strongLead" in value) {
    return (
      <>
        <strong>{value.strongLead.map((part, index) => <PracticeInlineView key={index} part={part} />)}</strong>
        {value.rest?.map((part, index) => <PracticeInlineView key={index} part={part} />)}
      </>
    );
  }
  return value.map((part, index) => <PracticeInlineView key={index} part={part} />);
}

function PracticeBlocks({ blocks, sources }: { blocks: readonly PracticeBlock[]; sources?: readonly PracticeSource[] }) {
  return (
    <div className="mt-8 space-y-6">
      {blocks.map((block, index) => {
        if (block.kind === "h2") {
          return (
            <h2 key={index} className="border-t border-foreground pt-6 font-sans text-2xl font-black tracking-[-0.03em]">
              {block.text}
            </h2>
          );
        }
        if (block.kind === "p") {
          return (
            <p key={index} className="font-serif text-lg leading-relaxed">
              <PracticeRunView value={block.body} />
            </p>
          );
        }
        if (block.kind === "ul") {
          return (
            <ul key={index} className="list-disc space-y-4 pl-5 font-serif text-lg leading-relaxed">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}><PracticeRunView value={item} /></li>
              ))}
            </ul>
          );
        }
        return (
          <ol key={index} className="list-decimal space-y-3 pl-5 font-serif text-lg leading-relaxed">
            {(sources ?? []).map((source) => (
              <li key={source.name}><PracticeRunView value={source.body} /></li>
            ))}
          </ol>
        );
      })}
    </div>
  );
}

export function PracticesIndex() {
  useDocumentMeta(PRACTICES_INDEX.title, PRACTICES_INDEX.description, PRACTICES_INDEX.path);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModuleNav />
      <main className="mx-auto w-full max-w-[68ch] px-4 py-12 [overflow-wrap:anywhere] sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">{PRACTICES_INDEX.eyebrow}</p>
        <h1 className="mt-4 font-sans text-4xl font-black tracking-[-0.04em] sm:text-6xl">{PRACTICES_INDEX.heading}</h1>
        <PracticeBlocks blocks={PRACTICES_INDEX.blocks} />
        <p className="mt-8"><a href="/feed.xml" className="text-link underline">RSS</a></p>
      </main>
    </div>
  );
}

export function PracticePage() {
  const [, params] = useRoute<{ slug: string }>("/practices/:slug");
  const redirected = params?.slug ? FORMER_PRACTICE_SLUGS[params.slug] : undefined;
  if (redirected) return <Redirect to={redirected} />;
  const practice = PRACTICES.find((item) => item.slug === params?.slug);
  if (!practice) return <NotFound />;
  return <PracticeDocument practice={practice} />;
}

function PracticeDocument({ practice }: { practice: Practice }) {
  useDocumentMeta(practice.seoTitle, practice.description, practice.path);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModuleNav />
      <main className="mx-auto w-full max-w-[68ch] px-4 py-12 [overflow-wrap:anywhere] sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <Link href="/practices" className="text-link underline">Practices</Link>
          <span aria-hidden="true"> · </span>
          {practice.eyebrow}
        </p>
        <h1 className="mt-4 font-sans text-4xl font-black tracking-[-0.04em] sm:text-5xl">{practice.h1}</h1>
        <p className="mt-4 font-mono text-xs text-muted-foreground">Escherbridge · {practice.dateLabel}</p>
        <PracticeBlocks blocks={practice.blocks} sources={practice.sources} />
      </main>
    </div>
  );
}
