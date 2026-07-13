import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Link } from "wouter";
import {
  HandHeart,
  ShieldCheck,
  FlaskConical,
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
  ArrowRight,
  ArrowDown,
  Sparkles,
  Globe,
  GitFork,
  Layers,
  Bot,
  User,
} from "lucide-react";

const LAYERS = [
  { num: "I", name: "Agreement", icon: ScrollText, desc: "How commitments are created, reviewed, and evolved" },
  { num: "II", name: "Authority", icon: Crown, desc: "Who decides what, and how roles flow" },
  { num: "III", name: "ACT Engine", icon: Cog, desc: "The Advice-Consent-Test decision protocol" },
  { num: "IV", name: "Economic", icon: Coins, desc: "Resource allocation without extraction" },
  { num: "V", name: "Inter-Unit", icon: Network, desc: "Coordination across autonomous groups" },
  { num: "VI", name: "Conflict", icon: Scale, desc: "Repair and restoration, not punishment" },
  { num: "VII", name: "Safeguard", icon: ShieldAlert, desc: "Detecting and preventing power capture" },
  { num: "VIII", name: "Emergency", icon: Siren, desc: "Pre-authorized protocols for crisis" },
  { num: "IX", name: "Memory", icon: Brain, desc: "Institutional learning that compounds" },
  { num: "X", name: "Exit", icon: DoorOpen, desc: "The right to leave with dignity and data" },
];

const ACT_STEPS = [
  {
    icon: HandHeart,
    title: "Advice",
    desc: "Gather wisdom from the people affected. No one decides alone.",
  },
  {
    icon: ShieldCheck,
    title: "Consent",
    desc: "Not 'do you agree?' but 'can you live with this?' Objections improve the proposal.",
  },
  {
    icon: FlaskConical,
    title: "Test",
    desc: "Try it in practice. Measure results. Adapt or adopt.",
  },
];

function scrollToSection(id: string) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
}

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-foreground bg-background">
        <div className="flex min-h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex min-h-11 items-center text-sm font-black uppercase tracking-[0.18em]">
            NEOS
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/about">About</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/governance-model">Governance Model</Link>
            </Button>
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/login">Enter NEOS</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="grid min-h-[calc(100svh-3.5rem)] border-b border-foreground lg:grid-cols-12">
          <div className="flex flex-col justify-between px-4 py-10 sm:px-6 sm:py-14 lg:col-span-8 lg:px-8 lg:py-20">
            <p className="text-xs font-bold uppercase tracking-[0.18em]">Open-source governance infrastructure</p>
            <div className="max-w-5xl py-16 lg:py-24">
              <h1 className="text-[clamp(3.5rem,9vw,9rem)] font-black uppercase leading-[0.82] tracking-[-0.07em]">
                Govern<br />together.<br />Stay free.
              </h1>
              <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
                NEOS is an operating system for communities that govern themselves. No kings. No tokens.
                Just agreements, consent, and collective intelligence.
                The core system and framework are represented in a manually accessible front and an internally reachable governance page; the AI agent is an opt-in add-on.
              </p>
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row">
              <Button asChild size="lg" className="min-w-48 justify-between">
                <Link href="/login">
                  Join a community
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollToSection("how-it-works")}>
                Read the system
                <ArrowDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <aside className="flex min-h-80 flex-col justify-between border-t border-foreground bg-foreground p-6 text-background lg:col-span-4 lg:border-l lg:border-t-0 lg:p-8">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.18em]">
              <span>System index</span>
              <span>01—10</span>
            </div>
            <div>
              <p className="text-[clamp(5rem,14vw,12rem)] font-black leading-none tracking-[-0.08em]">10</p>
              <p className="max-w-xs text-lg font-bold uppercase leading-tight">Interlocking layers of accountable governance.</p>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-background/75">
              Authority stays visible. Decisions remain testable. Every member retains the right to repair, learn, and exit.
            </p>
          </aside>
        </section>

        <section id="how-it-works" className="border-b border-foreground px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mb-10 grid gap-5 lg:grid-cols-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] lg:col-span-3">01 / The ACT process</p>
            <h2 className="text-4xl font-black uppercase leading-none tracking-[-0.04em] sm:text-6xl lg:col-span-9">
              Decisions people can trust.
            </h2>
          </div>
          <div className="grid border-l border-t border-foreground md:grid-cols-3">
            {ACT_STEPS.map((step, index) => (
              <article key={step.title} className="flex min-h-72 flex-col justify-between border-b border-r border-foreground bg-card p-6 sm:p-8">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.18em]">0{index + 1}</span>
                  <step.icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-3xl font-black uppercase tracking-[-0.03em]">{step.title}</h3>
                  <p className="mt-4 max-w-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="border-b border-foreground px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mb-10 grid gap-5 lg:grid-cols-12">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] lg:col-span-3">
              <Layers className="h-4 w-4" aria-hidden="true" />
              02 / Full stack
            </div>
            <div className="lg:col-span-9">
              <h2 className="text-4xl font-black uppercase leading-none tracking-[-0.04em] sm:text-6xl">A complete governance stack.</h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                54 governance skills across 10 layers. Everything a self-organizing community needs, indexed and accountable.
              </p>
            </div>
          </div>

          <div className="grid border-l border-t border-foreground sm:grid-cols-2 lg:grid-cols-5">
            {LAYERS.map((layer) => (
              <article key={layer.num} className="flex min-h-56 flex-col justify-between border-b border-r border-foreground bg-card p-5 sm:p-6">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-black tracking-[0.18em]">{layer.num}</span>
                  <layer.icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-lg font-black uppercase">{layer.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{layer.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid border-b border-foreground bg-foreground text-background sm:grid-cols-3">
          {[
            { icon: Layers, big: "10 layers", sub: "54 governance skills" },
            { icon: Globe, big: "OmniOne", sub: "First ecosystem · Bali" },
            { icon: GitFork, big: "Open source", sub: "Fork it. Make it yours." },
          ].map((stat) => (
            <div key={stat.big} className="border-b border-background/40 p-8 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 lg:p-12">
              <stat.icon className="mb-10 h-7 w-7" aria-hidden="true" />
              <p className="text-3xl font-black uppercase tracking-[-0.03em]">{stat.big}</p>
              <p className="mt-2 text-sm text-background/70">{stat.sub}</p>
            </div>
          ))}
        </section>

        <section className="grid border-b border-foreground lg:grid-cols-12">
          <div className="px-4 py-16 sm:px-6 lg:col-span-6 lg:px-8 lg:py-24">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em]">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              03 / AI add-on
            </div>
            <h2 className="mt-8 text-4xl font-black uppercase leading-none tracking-[-0.04em] sm:text-6xl">An opt-in AI assistant.</h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              The NEOS agent is an opt-in add-on. The core governance framework and every layer are accessible without it, through the manual front and the internal governance page.
            </p>
            <ul className="mt-8 divide-y divide-border border-y border-border">
              {[
                "Optional: the core framework is fully manual",
                "Summarizes objections and proposals impartially",
                "Guides new members through governance processes",
                "Works across ecosystems while respecting local sovereignty",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 py-4 text-sm">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="border-t border-foreground bg-card p-4 sm:p-6 lg:col-span-6 lg:border-l lg:border-t-0 lg:p-8">
            <div className="flex h-full min-h-[30rem] flex-col justify-between border border-foreground">
              <div className="flex items-center justify-between border-b border-foreground p-4 text-xs font-bold uppercase tracking-[0.18em]">
                <span>Governance assistant (optional)</span>
                <span>Manual protocol</span>
              </div>
              <div className="space-y-8 p-5 sm:p-8">
                <div className="grid grid-cols-[2rem_1fr] gap-4">
                  <div className="flex h-8 w-8 items-center justify-center border border-foreground"><User className="h-4 w-4" /></div>
                  <p className="border border-foreground p-4 text-sm">How do I propose a composting policy?</p>
                </div>
                <div className="grid grid-cols-[2rem_1fr] gap-4">
                  <div className="flex h-8 w-8 items-center justify-center bg-foreground text-background"><Bot className="h-4 w-4" /></div>
                  <div className="bg-foreground p-5 text-sm text-background">
                    <p className="font-bold uppercase">Start with ACT</p>
                    <ol className="mt-4 list-decimal space-y-2 pl-4 text-background/75">
                      <li>Post the draft and request advice from affected members.</li>
                      <li>Call a consent round and integrate reasoned objections.</li>
                      <li>Run a 90-day test with visible success measures.</li>
                    </ol>
                  </div>
                </div>
              </div>
              <p className="border-t border-foreground p-4 text-xs text-muted-foreground">Manual governance remains available at every step.</p>
            </div>
          </div>
        </section>

        <section className="bg-foreground px-4 py-16 text-background sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-background/70">The next agreement starts here</p>
              <h2 className="mt-6 text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-7xl">Ready to govern differently?</h2>
            </div>
            <div className="flex flex-col gap-3 lg:col-span-4">
              <Button asChild size="lg" variant="secondary" className="w-full justify-between">
                <Link href="/login">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full border-background/60 text-background hover:bg-background hover:text-foreground">
                <Link href="/about">
                  Read about NEOS
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 border-t border-foreground px-4 py-6 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>NEOS — New Earth Operating System</p>
        <p>Open source · Community governed</p>
      </footer>
    </div>
  );
}
