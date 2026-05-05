import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
    def: "Ecosystem Transforming Holistic Operating System -- the full governance framework that NEOS implements.",
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
    def: "Advice-Consent-Test -- the three-phase decision protocol at the heart of NEOS governance.",
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

export default function About() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      <article className="max-w-4xl mx-auto px-6 py-16 space-y-20">
        {/* Header */}
        <header className="space-y-6">
          <Badge variant="outline" className="text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700">
            About NEOS
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            The New Earth Operating System
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl">
            NEOS is a governance platform for communities that want to make decisions together
            without concentrating power in the hands of a few. It is built on decades of
            experience with sociocracy, consent-based governance, and distributed organizing.
          </p>
        </header>

        <Separator />

        {/* What NEOS Is / Isn't */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold">What NEOS Is</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-emerald-700 dark:text-emerald-400">It is...</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">+</span>
                  A complete governance stack with 54 skills across 10 layers
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">+</span>
                  Open source software you can fork, adapt, and run yourself
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">+</span>
                  A platform for consent-based decision-making at any scale
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">+</span>
                  AI-augmented -- assistants guide, but never decide
                </li>
                <li className="flex gap-2">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold shrink-0">+</span>
                  Designed around dignity, sovereignty, and collective intelligence
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">It is not...</h3>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold shrink-0">-</span>
                  A blockchain, token, or crypto project
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold shrink-0">-</span>
                  A voting platform (consent is not majority rule)
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold shrink-0">-</span>
                  A corporate hierarchy tool rebranded as "flat"
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold shrink-0">-</span>
                  A platform where AI makes decisions for humans
                </li>
                <li className="flex gap-2">
                  <span className="text-red-500 font-bold shrink-0">-</span>
                  A utopian experiment -- it is practical governance infrastructure
                </li>
              </ul>
            </div>
          </div>
        </section>

        <Separator />

        {/* 10 Layers Detail */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold">The 10 Governance Layers</h2>
          <p className="text-muted-foreground text-lg">
            Each layer addresses a fundamental governance need. Together they form a complete,
            interlocking system where no single layer can be captured without the others providing checks.
          </p>

          <div className="space-y-6">
            {LAYERS_DETAIL.map((layer) => (
              <Card key={layer.num} className="overflow-hidden">
                <CardContent className="p-6 flex gap-5 items-start">
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                    <layer.icon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-widest">
                        Layer {layer.num}
                      </span>
                      <h3 className="text-lg font-semibold">{layer.name}</h3>
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">{layer.short}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{layer.detail}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* First Ecosystem */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <Globe className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-3xl font-bold">The First Ecosystem: OmniOne</h2>
          </div>

          <Card className="overflow-hidden border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-3">
                <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xl font-semibold">OmniOne, Bali</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                The first NEOS ecosystem is OmniOne, based in Bali, Indonesia. It is stewarded by
                Green Earth Vision, a 501(c)(3) nonprofit organization. OmniOne serves as the proving ground
                for NEOS governance, where real communities are using the ACT process, circles, and
                all 10 governance layers to coordinate their shared life.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                From composting policies to resource allocation, from conflict resolution to
                onboarding new members -- OmniOne demonstrates that consent-based governance
                works in practice, not just in theory.
              </p>
            </CardContent>
          </Card>
        </section>

        <Separator />

        {/* Terminology */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold">Key Terminology</h2>
          <p className="text-muted-foreground text-lg">
            NEOS uses specific terms to describe its governance concepts. Here is a quick reference.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {TERMINOLOGY.map((item) => (
              <Card key={item.term} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-5 space-y-2">
                  <h3 className="font-bold text-emerald-700 dark:text-emerald-400">{item.term}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.def}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator />

        {/* CTA */}
        <section className="text-center space-y-6 py-8">
          <h2 className="text-3xl font-bold">Join the Movement</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Whether you want to join an existing ecosystem or start one of your own,
            NEOS gives you the tools to govern together.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline">
                Back to Home
              </Button>
            </Link>
          </div>
        </section>
      </article>

      <footer className="py-8 px-6 border-t text-center text-sm text-muted-foreground">
        <p>NEOS -- New Earth Operating System. Open source. Community governed.</p>
      </footer>
    </div>
  );
}
