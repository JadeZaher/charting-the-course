import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  ChevronDown,
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
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  {
    icon: ShieldCheck,
    title: "Consent",
    desc: "Not 'do you agree?' but 'can you live with this?' Objections improve the proposal.",
    color: "text-teal-600 dark:text-teal-400",
    bg: "bg-teal-50 dark:bg-teal-950/40",
    border: "border-teal-200 dark:border-teal-800",
  },
  {
    icon: FlaskConical,
    title: "Test",
    desc: "Try it in practice. Measure results. Adapt or adopt.",
    color: "text-cyan-600 dark:text-cyan-400",
    bg: "bg-cyan-50 dark:bg-cyan-950/40",
    border: "border-cyan-200 dark:border-cyan-800",
  },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24 overflow-hidden">
        {/* Animated gradient background */}
        <div
          className="absolute inset-0 -z-10 animate-pulse"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(16,185,129,0.12) 0%, rgba(20,184,166,0.08) 40%, transparent 70%)",
            animationDuration: "6s",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.04] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <Badge variant="outline" className="mb-6 text-sm px-4 py-1 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
          Open Source Governance
        </Badge>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-center max-w-4xl leading-tight tracking-tight">
          Governance for the{" "}
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            New Earth
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-muted-foreground text-center max-w-2xl leading-relaxed">
          NEOS is an open operating system for communities that govern themselves.
          No kings. No tokens. Just agreements, consent, and collective intelligence.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <Link href="/login">
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
              Join a Community
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            onClick={() => scrollToSection("how-it-works")}
            className="border-emerald-300 dark:border-emerald-700"
          >
            Explore How It Works
            <ChevronDown className="ml-2 w-4 h-4" />
          </Button>
        </div>

        <button
          onClick={() => scrollToSection("how-it-works")}
          className="absolute bottom-10 animate-bounce text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Scroll down"
        >
          <ArrowDown className="w-6 h-6" />
        </button>
      </section>

      {/* ── ACT Process ── */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">The ACT Process</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">Decisions That Everyone Can Trust</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connector lines (desktop) */}
            <div className="hidden md:block absolute top-1/2 left-[33%] right-[33%] h-px bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 dark:from-emerald-700 dark:via-teal-700 dark:to-cyan-700 -translate-y-1/2 z-0" />

            {ACT_STEPS.map((step, i) => (
              <Card
                key={step.title}
                className={`relative z-10 border ${step.border} ${step.bg} hover:shadow-lg transition-shadow duration-300`}
              >
                <CardContent className="pt-8 pb-6 px-6 text-center space-y-4">
                  <div className="mx-auto w-14 h-14 rounded-full bg-white dark:bg-slate-800 border flex items-center justify-center shadow-sm">
                    <step.icon className={`w-7 h-7 ${step.color}`} />
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Step {i + 1}
                  </div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10 Governance Layers ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Layers className="w-3 h-3 mr-1" />
              Full Stack
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">A Complete Governance Stack</h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-xl mx-auto">
              54 governance skills across 10 layers. Everything a self-organizing community needs.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {LAYERS.map((layer) => (
              <Card
                key={layer.num}
                className="group hover:shadow-md hover:-translate-y-1 transition-all duration-300 border-slate-200 dark:border-slate-800"
              >
                <CardContent className="pt-6 pb-5 px-4 text-center space-y-3">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-widest">
                    {layer.num}
                  </div>
                  <div className="mx-auto w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-colors">
                    <layer.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="font-semibold text-sm">{layer.name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{layer.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-24 px-6 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-6">
          {[
            { icon: Layers, big: "10 Layers", sub: "54 governance skills" },
            { icon: Globe, big: "First Ecosystem", sub: "OmniOne, Bali" },
            { icon: GitFork, big: "Open Source", sub: "Fork it. Make it yours." },
          ].map((stat) => (
            <Card key={stat.big} className="text-center hover:shadow-md transition-shadow">
              <CardContent className="pt-8 pb-6 space-y-3">
                <stat.icon className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400" />
                <div className="text-2xl font-bold">{stat.big}</div>
                <div className="text-muted-foreground">{stat.sub}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ── AI Governance ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <Badge variant="outline" className="mb-2">
              <Sparkles className="w-3 h-3 mr-1" />
              AI-Augmented
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold">An AI That Serves the Community</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              The NEOS governance agent helps facilitate discussions, summarize proposals,
              and guide participants through decision processes. It never decides for you --
              it makes sure the community's voice is heard clearly.
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-1 text-emerald-600 dark:text-emerald-400 shrink-0" />
                Summarizes objections and proposals impartially
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-1 text-emerald-600 dark:text-emerald-400 shrink-0" />
                Guides new members through governance processes
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-1 text-emerald-600 dark:text-emerald-400 shrink-0" />
                Works across ecosystems while respecting local sovereignty
              </li>
            </ul>
          </div>

          {/* Chat mockup */}
          <div className="bg-slate-100 dark:bg-slate-800/60 rounded-2xl p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div className="bg-white dark:bg-slate-700 rounded-xl rounded-tl-sm px-4 py-3 text-sm max-w-xs shadow-sm">
                How do I propose a composting policy?
              </div>
            </div>
            <div className="flex items-start gap-3 flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-teal-700 dark:text-teal-300" />
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/60 rounded-xl rounded-tr-sm px-4 py-3 text-sm max-w-sm shadow-sm space-y-2">
                <p className="font-medium text-foreground">Great question! Here is the ACT process:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-xs">
                  <li><strong>Advice</strong> -- Post your draft in the composting domain and tag affected members.</li>
                  <li><strong>Consent</strong> -- After advice rounds, call a consent round. Members raise objections or stand aside.</li>
                  <li><strong>Test</strong> -- Set a 90-day trial with clear success metrics.</li>
                </ol>
                <p className="text-xs text-muted-foreground">Want me to draft a proposal template for you?</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 bg-gradient-to-b from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to govern differently?</h2>
          <p className="text-lg text-muted-foreground">
            Join an existing ecosystem or start your own.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link href="/login">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t text-center text-sm text-muted-foreground">
        <p>NEOS -- New Earth Operating System. Open source. Community governed.</p>
      </footer>
    </div>
  );
}
