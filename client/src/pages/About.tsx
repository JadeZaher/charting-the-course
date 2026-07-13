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
  Globe,
  Leaf,
  Check,
  X,
} from "lucide-react";

const LAYERS_DETAIL = [
  {
    num: "I",
    name: "Agreement",
    icon: ScrollText,
    short: "How commitments are created, reviewed, and evolved",
    detail:
      "Every governance act begins and ends with an agreement. Agreements are living documents with clear domains, expiration dates, and review cycles. They encode the community's will into actionable, testable commitments.",
  },
  {
    num: "II",
    name: "Authority",
    icon: Crown,
    short: "Who decides what, and how roles flow",
    detail:
      "Authority in NEOS is distributed through roles, not positions. Roles are created by consent, carry explicit domains of authority, and can be filled, amended, or dissolved by the circle that holds them.",
  },
  {
    num: "III",
    name: "ACT Engine",
    icon: Cog,
    short: "The Advice-Consent-Test decision protocol",
    detail:
      "The ACT Engine is the core decision protocol: Advice gathers wisdom from those affected, Consent checks for reasoned objections (not agreement), and Test puts proposals into practice with measurable criteria.",
  },
  {
    num: "IV",
    name: "Economic",
    icon: Coins,
    short: "Resource allocation without extraction",
    detail:
      "Current-See is the internal unit of account that tracks contributions without creating speculation or extraction. Resources flow to where they are needed, governed by transparent budgeting agreements.",
  },
  {
    num: "V",
    name: "Inter-Unit",
    icon: Network,
    short: "Coordination across autonomous groups",
    detail:
      "Circles, pods, and ecosystems coordinate through shared agreements and liaison roles. Autonomy is preserved while enabling collaboration across organizational boundaries.",
  },
  {
    num: "VI",
    name: "Conflict",
    icon: Scale,
    short: "Repair and restoration, not punishment",
    detail:
      "Conflict resolution follows a restorative path: direct conversation, facilitated dialogue, mediation, and community process. The goal is always repair and learning, never punishment.",
  },
  {
    num: "VII",
    name: "Safeguard",
    icon: ShieldAlert,
    short: "Detecting and preventing power capture",
    detail:
      "Built-in safeguards detect when power concentrates inappropriately: term limits on roles, mandatory rotation, transparency requirements, and whistleblower protections are encoded into the governance stack.",
  },
  {
    num: "VIII",
    name: "Emergency",
    icon: Siren,
    short: "Pre-authorized protocols for crisis",
    detail:
      "When crises arise, pre-authorized emergency protocols activate with clear scope, duration, and accountability. Emergency powers automatically sunset and require community ratification.",
  },
  {
    num: "IX",
    name: "Memory",
    icon: Brain,
    short: "Institutional learning that compounds",
    detail:
      "Every decision, experiment, and conflict resolution becomes part of the community's institutional memory. Patterns are recognized, lessons are encoded, and governance wisdom compounds over time.",
  },
  {
    num: "X",
    name: "Exit",
    icon: DoorOpen,
    short: "The right to leave with dignity and data",
    detail:
      "Members can leave any circle, ecosystem, or the platform entirely, taking their data and contribution history with them. Exit rights are fundamental and cannot be restricted by agreement.",
  },
];

const TERMINOLOGY = [
  {
    term: "ETHOS",
    def: "Ecosystem Transforming Holistic Operating System — the full governance framework that NEOS implements.",
  },
  {
    term: "Current-See",
    def: "An internal unit of account for tracking contributions and allocating resources without creating a speculative token economy.",
  },
  {
    term: "Steward",
    def: "A role carrying responsibility for a specific domain. Stewards facilitate, they do not command.",
  },
  {
    term: "ACT",
    def: "Advice-Consent-Test — the three-phase decision protocol at the heart of NEOS governance.",
  },
  {
    term: "Agreement Field",
    def: "The living collection of all active agreements within a circle or ecosystem, with their review dates and domains.",
  },
  {
    term: "Circle",
    def: "A self-governing group with a clear domain, members, and its own set of agreements. The fundamental organizational unit.",
  },
  {
    term: "Ecosystem",
    def: "A network of circles operating under shared foundational agreements. An ecosystem is a sovereign governance community.",
  },
  {
    term: "Domain",
    def: "The scope of authority and responsibility assigned to a role, circle, or agreement.",
  },
];

const IS_ITEMS = [
  "A complete governance stack with 54 skills across 10 layers",
  "Open source software you can fork, adapt, and run yourself",
  "A platform for consent-based decision-making at any scale",
  "AI-augmented — assistants guide, but never decide",
  "Designed around dignity, sovereignty, and collective intelligence",
];

const IS_NOT_ITEMS = [
  "A blockchain, token, or crypto project",
  "A voting platform — consent is not majority rule",
  "A corporate hierarchy tool rebranded as flat",
  "A platform where AI makes decisions for humans",
  "A utopian experiment — it is practical governance infrastructure",
];

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="sticky top-0 z-50 border-b border-foreground bg-background">
        <div className="flex min-h-14 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <p className="hidden text-xs font-black uppercase tracking-[0.18em] sm:block">NEOS / System brief</p>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm">
              <Link href="/login">Get started</Link>
            </Button>
          </div>
        </div>
      </nav>

      <main>
        <header className="grid border-b border-foreground lg:grid-cols-12">
          <div className="px-4 py-16 sm:px-6 lg:col-span-8 lg:px-8 lg:py-24">
            <p className="text-xs font-bold uppercase tracking-[0.18em]">About NEOS / 2026</p>
            <h1 className="mt-10 max-w-5xl text-[clamp(3.5rem,8vw,8rem)] font-black uppercase leading-[0.84] tracking-[-0.07em]">
              The New Earth Operating System.
            </h1>
          </div>
          <div className="flex items-end border-t border-foreground bg-foreground p-6 text-background lg:col-span-4 lg:border-l lg:border-t-0 lg:p-8">
            <p className="max-w-md text-lg font-medium leading-relaxed">
              Governance infrastructure for communities that make decisions together without concentrating power in the hands of a few.
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
              {IS_ITEMS.map((item, index) => (
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
              {IS_NOT_ITEMS.map((item, index) => (
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
            {LAYERS_DETAIL.map((layer) => (
              <article key={layer.num} className="grid border-b border-r border-foreground bg-card sm:grid-cols-[5rem_1fr] lg:grid-cols-[7rem_15rem_1fr]">
                <div className="flex items-center justify-between border-b border-foreground p-5 sm:flex-col sm:items-start sm:border-b-0 sm:border-r lg:p-6">
                  <span className="text-xs font-black tracking-[0.18em]">{layer.num}</span>
                  <layer.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <div className="border-b border-foreground p-5 sm:col-start-2 sm:border-b-0 lg:border-r lg:p-6">
                  <h3 className="text-xl font-black uppercase">{layer.name}</h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">{layer.short}</p>
                </div>
                <p className="p-5 text-sm leading-relaxed text-muted-foreground sm:col-span-2 lg:col-span-1 lg:p-6">{layer.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid border-b border-foreground lg:grid-cols-12">
          <div className="bg-foreground p-6 text-background sm:p-8 lg:col-span-4 lg:p-10">
            <Globe className="h-8 w-8" aria-hidden="true" />
            <p className="mt-16 text-xs font-bold uppercase tracking-[0.18em] text-background/70">First live ecosystem</p>
            <h2 className="mt-5 text-4xl font-black uppercase leading-none tracking-[-0.04em] sm:text-5xl">OmniOne, Bali.</h2>
          </div>
          <div className="p-6 sm:p-8 lg:col-span-8 lg:p-12">
            <div className="flex items-center gap-3 border-b border-foreground pb-5">
              <Leaf className="h-5 w-5" aria-hidden="true" />
              <h3 className="text-xl font-black uppercase">Governance in practice</h3>
            </div>
            <div className="mt-8 grid gap-6 text-base leading-relaxed text-muted-foreground md:grid-cols-2">
              <p>
                The first NEOS ecosystem is OmniOne, based in Bali, Indonesia and stewarded by Green Earth Vision. It is the proving ground where real communities use ACT, circles, and all ten governance layers.
              </p>
              <p>
                From composting policies to resource allocation, conflict repair, and member onboarding, OmniOne demonstrates that consent-based governance works in practice, not just in theory.
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-foreground px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mb-12 grid gap-6 lg:grid-cols-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] lg:col-span-3">02 / Working language</p>
            <h2 className="text-4xl font-black uppercase leading-none tracking-[-0.04em] sm:text-6xl lg:col-span-9">Key terminology.</h2>
          </div>
          <dl className="grid border-l border-t border-foreground sm:grid-cols-2">
            {TERMINOLOGY.map((item, index) => (
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
                <Link href="/login">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full border-background/60 text-background hover:bg-background hover:text-foreground">
                <Link href="/">
                  Back to home
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
