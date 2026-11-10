import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "wouter";
import {
  ScrollText,
  Crown,
  Cog,
  Coins,
  Network,
  Scale,
  ShieldAlert,
  Siren,
  Brain,
  DoorOpen,
  ArrowLeft,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import { InlineText } from "@/components/InlineText";
import { useDocumentMeta } from "@/hooks/use-document-meta";
import { ABOUT, ABOUT_IS, ABOUT_IS_NOT, ABOUT_LAYERS, ABOUT_OMNI, ABOUT_TERMS } from "@/lib/public-documents";

const LAYER_ICONS = {
  I: ScrollText,
  II: Crown,
  III: Cog,
  IV: Coins,
  V: Network,
  VI: Scale,
  VII: ShieldAlert,
  VIII: Siren,
  IX: Brain,
  X: DoorOpen,
} as const;

export default function About() {
  useDocumentMeta(ABOUT.title, ABOUT.description, "/about");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav aria-label="About navigation" className="sticky top-0 z-50 border-b border-foreground bg-background">
        <div className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <p className="hidden text-xs font-black uppercase tracking-[0.18em] xl:block">NEOS / About</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/blog">Blog</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/governance-model">Governance Model</Link>
            </Button>
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/communities">Find a community</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <header className="grid border-b border-foreground lg:grid-cols-12">
          <div className="px-4 py-16 sm:px-6 lg:col-span-8 lg:px-8 lg:py-24">
            <p className="text-xs font-bold uppercase tracking-[0.18em]">{ABOUT.kicker}</p>
            <h1 className="mt-10 max-w-5xl text-[clamp(3.5rem,8vw,8rem)] font-black uppercase leading-[0.84] tracking-[-0.07em]">
              {ABOUT.heading}
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              <InlineText value={ABOUT.lead} />
            </p>
            <Button asChild size="lg" className="mt-8">
              <Link href="/communities">Find a community<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </Button>
          </div>
          <div className="flex items-end border-t border-foreground bg-foreground p-6 text-background lg:col-span-4 lg:border-l lg:border-t-0 lg:p-8">
            <p className="max-w-md text-lg font-medium leading-relaxed">
              {ABOUT.aside}
            </p>
          </div>
        </header>

        <section className="grid border-b border-foreground lg:grid-cols-2">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8 flex items-center justify-between border-b border-foreground pb-4">
              <h2 className="text-3xl font-black uppercase tracking-[-0.03em]">It is</h2>
              <Check className="h-7 w-7" aria-hidden="true" />
            </div>
            <ul className="divide-y divide-border border-y border-border">
              {ABOUT_IS.map((item, index) => (
                <li key={item} className="grid grid-cols-[2.5rem_1fr] gap-3 py-4 text-sm leading-relaxed sm:text-base">
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t border-foreground bg-card p-4 sm:p-6 lg:border-l lg:border-t-0 lg:p-8">
            <div className="mb-8 flex items-center justify-between border-b border-foreground pb-4">
              <h2 className="text-3xl font-black uppercase tracking-[-0.03em]">It is not</h2>
              <X className="h-7 w-7" aria-hidden="true" />
            </div>
            <ul className="divide-y divide-border border-y border-border">
              {ABOUT_IS_NOT.map((item, index) => (
                <li key={item} className="grid grid-cols-[2.5rem_1fr] gap-3 py-4 text-sm leading-relaxed sm:text-base">
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-b border-foreground px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mb-12 grid gap-6 lg:grid-cols-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] lg:col-span-3">01 / Architecture</p>
            <div className="lg:col-span-9">
              <h2 className="text-4xl font-black uppercase leading-none tracking-[-0.04em] sm:text-6xl">The 10 governance layers.</h2>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                Each layer addresses a fundamental governance need. Together they form an interlocking system in which capture of one layer is checked by the others.
              </p>
            </div>
          </div>

          <div className="border-l border-t border-foreground">
            {ABOUT_LAYERS.map((layer) => {
              const Icon = LAYER_ICONS[layer.num as keyof typeof LAYER_ICONS];
              return (
              <article key={layer.num} className="grid border-b border-r border-foreground bg-card sm:grid-cols-[5rem_1fr] lg:grid-cols-[7rem_15rem_1fr]">
                <div className="flex items-center justify-between border-b border-foreground p-5 sm:flex-col sm:items-start sm:border-b-0 sm:border-r lg:p-6">
                  <span className="text-xs font-black tracking-[0.18em]">{layer.num}</span>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="border-b border-foreground p-5 sm:col-start-2 sm:border-b-0 lg:border-r lg:p-6">
                  <h3 className="text-xl font-black uppercase">{layer.name}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">{layer.short}</p>
                </div>
                <p className="p-5 text-sm leading-relaxed text-muted-foreground sm:col-span-2 lg:col-span-1 lg:p-6">{layer.detail}</p>
              </article>
              );
            })}
          </div>
        </section>

        <section className="grid border-b border-foreground lg:grid-cols-12">
          <div className="bg-foreground p-6 text-background sm:p-8 lg:col-span-4 lg:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-background/70">{ABOUT_OMNI.kicker}</p>
            <h2 className="mt-5 text-4xl font-black uppercase leading-none tracking-[-0.04em] sm:text-5xl">{ABOUT_OMNI.heading}</h2>
          </div>
          <div className="p-6 sm:p-8 lg:col-span-8 lg:p-12">
            <h3 className="border-b border-foreground pb-5 text-xl font-black uppercase">Named, not described further</h3>
            <div className="mt-8 space-y-6 text-base leading-relaxed text-muted-foreground">
              {ABOUT_OMNI.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-foreground px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mb-12 grid gap-6 lg:grid-cols-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] lg:col-span-3">02 / Working language</p>
            <h2 className="text-4xl font-black uppercase leading-none tracking-[-0.04em] sm:text-6xl lg:col-span-9">Key terminology.</h2>
          </div>
          <dl className="grid border-l border-t border-foreground sm:grid-cols-2">
            {ABOUT_TERMS.map((item, index) => (
              <div key={item.term} className="min-h-48 border-b border-r border-foreground bg-card p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-xl font-black uppercase">{item.term}</dt>
                  <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                </div>
                <dd className="mt-8 max-w-xl text-sm leading-relaxed text-muted-foreground">{item.def}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="bg-foreground px-4 py-16 text-background sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-background/70">Your community can begin here</p>
              <h2 className="mt-6 text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-7xl">Govern together.</h2>
            </div>
            <div className="flex flex-col gap-3 lg:col-span-4">
              <Button asChild size="lg" variant="secondary" className="w-full justify-between">
                <Link href="/communities">
                  Find a community
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full border-background/60 text-background hover:bg-background hover:text-foreground">
                <Link href="/login">
                  Sign in
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

    </div>
  );
}
