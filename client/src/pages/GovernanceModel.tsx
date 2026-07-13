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
  HandHeart,
  ShieldCheck,
  FlaskConical,
} from "lucide-react";

type Feature = {
  title: string;
  href: string;
  description: string;
};

type Skill = {
  name: string;
  description: string;
};

type Layer = {
  num: string;
  name: string;
  icon: React.ElementType;
  short: string;
  detail: string;
  skills: Skill[];
  features: Feature[];
};

const GOVERNANCE_MODEL: Layer[] = [
  {
    num: "I",
    name: "Agreement",
    icon: ScrollText,
    short: "How commitments are created, reviewed, and evolved",
    detail:
      "Every governance act begins and ends with an agreement. Agreements are living documents with clear domains, expiration dates, and review cycles. They encode the community's will into actionable, testable commitments.",
    skills: [
      {
        name: "agreement-creation",
        description:
          "Create a new binding agreement -- space agreement, access agreement, agreement field, or UAF -- through a structured, consent-based process that prevents unilateral imposition and ensures traceability.",
      },
      {
        name: "agreement-amendment",
        description:
          "Modify an existing agreement through proper process -- classifying the amendment type, routing through the appropriate ACT level, and producing a versioned amendment record that maintains the full change history.",
      },
      {
        name: "agreement-registry",
        description:
          "Maintain and query the single source of truth for all active agreements -- handling writes from agreement-creation, amendment, and review, and providing open query access to any participant.",
      },
      {
        name: "agreement-review",
        description:
          "Run the periodic review cycle for any agreement -- evaluating current relevance, checking for staleness or conflict, and producing a review outcome: renew as-is, revise through amendment, or sunset with graceful deprecation.",
      },
      {
        name: "universal-agreement-field",
        description:
          "The root agreement every ecosystem participant consents to upon entry -- defines baseline commitments for accountability, processes, conflict, stewardship, and sovereignty that all other agreements inherit from.",
      },
    ],
    features: [
      {
        title: "Agreements",
        href: "/agreements",
        description: "Create, amend, review, and register agreements with version history and consent records.",
      },
      {
        title: "Agreement history",
        href: "/agreements",
        description: "Trace every version and amendment so no change can be claimed as accidental.",
      },
      {
        title: "Onboarding",
        href: "/onboarding",
        description: "Consent to the Universal Agreement Field as the entry ceremony for new participants.",
      },
    ],
  },
  {
    num: "II",
    name: "Authority",
    icon: Crown,
    short: "Who decides what, and how roles flow",
    detail:
      "Authority in NEOS is distributed through roles, not positions. Roles are created by consent, carry explicit domains of authority, and can be filled, amended, or dissolved by the circle that holds them.",
    skills: [
      {
        name: "domain-mapping",
        description:
          "Define or refine a governance domain using the 11-element contract -- purpose, responsibilities, customers, deliverables, dependencies, constraints, challenges, resources, delegator responsibilities, competencies, metrics, evaluation schedule -- so that authority scope is explicit, bounded, and reviewable.",
      },
      {
        name: "role-assignment",
        description:
          "Assign a person to a defined governance domain with scoped authority -- verifying competency, checking conflicts of interest, recording consent, and ensuring the separation of role and person so that authority is explicit and traceable.",
      },
      {
        name: "role-transfer",
        description:
          "Hand off a governance role from one steward to another without losing institutional knowledge or continuity -- structured handover with overlap period, commitment inventory, and formal reassignment through the assigning body.",
      },
      {
        name: "role-sunset",
        description:
          "Dissolve a governance domain that has served its purpose -- inventorying all responsibilities and agreements, executing a disposition plan, archiving the domain contract, and providing a 90-day reactivation window so that defunct roles do not linger as zombie authority.",
      },
      {
        name: "member-lifecycle",
        description:
          "Track and manage ecosystem participant status transitions -- onboarding consent ceremony, active participation, inactivity detection, reactivation, and exit -- so that governance always knows who is participating and what their status means.",
      },
      {
        name: "domain-review",
        description:
          "Evaluate an existing governance domain through scheduled review -- assessing each of the 11 contract elements, steward effectiveness, and domain health to determine whether to reaffirm, refine, reassign, merge, or sunset the domain.",
      },
      {
        name: "authority-boundary-negotiation",
        description:
          "Resolve overlapping or ambiguous domain boundaries between roles or circles through structured integrative discussion -- so that authority disputes are resolved structurally, not through informal power or hierarchy.",
      },
    ],
    features: [
      {
        title: "Members",
        href: "/members",
        description: "Track member lifecycle, roles, and authority assignments across the ecosystem.",
      },
      {
        title: "Domains",
        href: "/domains",
        description: "Map, review, and negotiate authority domains with the 11-element contract.",
      },
      {
        title: "Onboarding",
        href: "/onboarding",
        description: "Move participants through the consent ceremony and active membership status.",
      },
      {
        title: "Profile",
        href: "/profile",
        description: "Each participant's record of roles, domains, and contributions.",
      },
    ],
  },
  {
    num: "III",
    name: "ACT Engine",
    icon: Cog,
    short: "The Advice-Consent-Test decision protocol",
    detail:
      "The ACT Engine is the core decision protocol: Advice gathers wisdom from those affected, Consent checks for reasoned objections (not agreement), and Test puts proposals into practice with measurable criteria.",
    skills: [
      {
        name: "proposal-creation",
        description:
          "Create and submit a formal proposal to change agreements, processes, resources, or structure -- routing it through the appropriate ACT decision level with synergy check and impact analysis.",
      },
      {
        name: "act-advice-phase",
        description:
          "Run the Advice phase of the ACT process -- gather input from all impacted parties, document each piece of advice, and produce an advice log showing how the proposer integrated or responded to every input received.",
      },
      {
        name: "act-consent-phase",
        description:
          "Run the Consent phase of the ACT process -- present the advised proposal to the deciding body, record each member's position (consent, stand-aside, or objection), integrate objections through structured rounds, and produce a consent record documenting the legitimate outcome.",
      },
      {
        name: "act-test-phase",
        description:
          "Run the Test phase of the ACT process -- implement the consented proposal on a reversible, time-limited basis with defined success criteria, midpoint check-in, and structured review leading to adoption, extension, modification, or revert.",
      },
      {
        name: "consensus-check",
        description:
          "Verify whether consent or consensus exists among affected parties -- the reusable procedure for determining group agreement, handling quorum, absent members, and edge cases across both decision modes.",
      },
      {
        name: "proposal-resolution",
        description:
          "Resolve stalled proposals through the GAIA 6-level escalation -- from in-circle consensus through coaching, alignment sense-making, and value-based decision resolution -- with clear entry criteria, process, and handoff at each level.",
      },
    ],
    features: [
      {
        title: "Proposals",
        href: "/proposals",
        description: "Create proposals, move through Advice, Consent, and Test, and record outcomes.",
      },
      {
        title: "Decisions",
        href: "/decisions",
        description: "Searchable decision register holding, reasoning, and dissent for every consented proposal.",
      },
      {
        title: "Agreements",
        href: "/agreements",
        description: "Agreements themselves are ratified through the ACT process and store consent records.",
      },
    ],
  },
  {
    num: "IV",
    name: "Economic",
    icon: Coins,
    short: "Resource allocation without extraction",
    detail:
      "Current-See is the internal unit of account that tracks contributions without creating speculation or extraction. Resources flow to where they are needed, governed by transparent budgeting agreements.",
    skills: [
      {
        name: "resource-request",
        description:
          "Request resources from ecosystem funding pools -- financial, physical, time, access, or expertise -- through a structured ACT process that prevents self-approval and separates economic need from governance authority.",
      },
      {
        name: "funding-pool-stewardship",
        description:
          "Create and govern funding pools that hold ecosystem resources -- define boundaries, inflow sources, outflow rules, steward accountability, and transparency schedules so every pool operates as a living agreement rather than an opaque treasury.",
      },
      {
        name: "commons-monitoring",
        description:
          "Track resource flows across funding pools and commons resources, detect over-draw or concentration, and trigger graduated community responses -- monitoring by the community, not external auditors or opaque algorithms.",
      },
      {
        name: "participatory-allocation",
        description:
          "Run participatory budgeting assemblies where circle members collectively allocate funding pool resources through structured deliberation and consent -- not majority vote, not first-come-first-served, not steward fiat.",
      },
      {
        name: "access-economy-transition",
        description:
          "Manage the staged transition from currency-dependent resource exchange to access-based resource flow -- assess readiness, run pilots, govern the pace of change, and protect the ecosystem from both premature leaps and captured stagnation.",
      },
    ],
    features: [
      {
        title: "Discover",
        href: "/discover",
        description: "Surface shares, needs, and collaborations across the ecosystem and beyond.",
      },
      {
        title: "Ecosystems",
        href: "/ecosystems",
        description: "Govern pools, resource sharing, and shared economic agreements between ETHOS.",
      },
      {
        title: "Manage Shares & Needs",
        href: "/admin#shares-needs",
        description: "Facilitators steward shares, needs, and resource visibility from the admin panel.",
      },
    ],
  },
  {
    num: "V",
    name: "Inter-Unit",
    icon: Network,
    short: "Coordination across autonomous groups",
    detail:
      "Circles, pods, and ecosystems coordinate through shared agreements and liaison roles. Autonomy is preserved while enabling collaboration across organizational boundaries.",
    skills: [
      {
        name: "cross-ethos-request",
        description:
          "Initiate and track requests across ETHOS boundaries -- resource, information, collaboration, or service requests -- through dual-consent routing that respects both units' autonomy.",
      },
      {
        name: "federation-agreement",
        description:
          "Draft, negotiate, and ratify bilateral or multilateral agreements between ETHOS -- defining terms, shared protocols, dispute handling, and graduated engagement tiers -- through each ETHOS's own ACT process.",
      },
      {
        name: "inter-unit-liaison",
        description:
          "Define and maintain ongoing cross-ETHOS coordination through designated liaison roles -- with explicit mandate boundaries, accountability structures, and mandatory rotation to prevent information capture.",
      },
      {
        name: "polycentric-conflict-navigation",
        description:
          "Resolve structural disputes between ETHOS -- authority overlaps, agreement contradictions, resource competition, and boundary disputes -- through a three-tier lateral resolution protocol that preserves every unit's autonomy.",
      },
      {
        name: "shared-resource-stewardship",
        description:
          "Govern jointly-held resources across multiple ETHOS -- shared pools, infrastructure, repositories, and services -- through multi-party consent with rotating stewardship and equitable access rules.",
      },
    ],
    features: [
      {
        title: "Ecosystems",
        href: "/ecosystems",
        description: "List and manage ETHOS, federation agreements, and shared resources.",
      },
      {
        title: "Discover",
        href: "/discover",
        description: "Cross-ETHOS shares, needs, and collaboration requests.",
      },
      {
        title: "Collaborations",
        href: "/discover/collaborations/new",
        description: "Propose and track cross-ETHOS collaborations.",
      },
    ],
  },
  {
    num: "VI",
    name: "Conflict",
    icon: Scale,
    short: "Repair and restoration, not punishment",
    detail:
      "Conflict resolution follows a restorative path: direct conversation, facilitated dialogue, mediation, and community process. The goal is always repair and learning, never punishment.",
    skills: [
      {
        name: "nvc-dialogue",
        description:
          "Apply Nonviolent Communication in high-tension governance conversations -- transform evaluations into observations, blame into needs, and demands into requests so that conflict becomes navigable.",
      },
      {
        name: "coaching-intervention",
        description:
          "Design coaching responses for conflicts rooted in skill gaps rather than values conflicts -- identify the gap, select an appropriate coach, build a voluntary coaching plan, and assess whether the gap has closed before the conflict escalates further.",
      },
      {
        name: "harm-circle",
        description:
          "Convene a restorative circle when harm has occurred -- bring together the person harmed, the person who caused harm, and affected community members to understand impact, surface needs, and produce a consent-based repair agreement.",
      },
      {
        name: "repair-agreement",
        description:
          "Formalize conflict resolution outcomes into trackable, versioned governance agreements -- transform verbal commitments from harm circles, coaching, and dialogue into registered artifacts with timelines, follow-up schedules, and completion criteria.",
      },
      {
        name: "escalation-triage",
        description:
          "Assess conflict severity, scope, root cause, and safety to route each situation to the right resolution tier -- direct dialogue, coaching, harm circle, or community-wide assessment -- so that no conflict is over-escalated or swept aside.",
      },
      {
        name: "community-impact-assessment",
        description:
          "Facilitate ETHOS-wide or ecosystem-wide processing when harm extends beyond direct parties -- surface systemic patterns, identify structural gaps, and route governance change recommendations through ACT so that recurring conflicts become structural improvements.",
      },
    ],
    features: [
      {
        title: "Conflicts",
        href: "/conflicts",
        description: "File, triage, and track conflicts from dialogue to harm circle and repair agreement.",
      },
      {
        title: "Repair agreements",
        href: "/conflicts",
        description: "Turn conflict resolution into registered agreements with follow-up and completion criteria.",
      },
      {
        title: "Proposals",
        href: "/proposals",
        description: "Route structural lessons from conflicts through ACT to update agreements or domains.",
      },
    ],
  },
  {
    num: "VII",
    name: "Safeguard",
    icon: ShieldAlert,
    short: "Detecting and preventing power capture",
    detail:
      "Built-in safeguards detect when power concentrates inappropriately: term limits on roles, mandatory rotation, transparency requirements, and whistleblower protections are encoded into the governance stack.",
    skills: [
      {
        name: "governance-health-audit",
        description:
          "Conduct a structured, quantified review of governance health indicators across an ETHOS or ecosystem -- run this whenever decision patterns, participation, or resource flows need independent assessment.",
      },
      {
        name: "capture-pattern-recognition",
        description:
          "Analyze governance health data for the four capture types -- capital, charisma, emergency, ossification -- and produce an evidence-based Capture Assessment Report with confidence scores and recommended responses.",
      },
      {
        name: "independent-monitoring",
        description:
          "Establish and operate the independent monitor role -- a rotating, structurally separated function that collects and publishes raw governance health data without interpretation or decision authority.",
      },
      {
        name: "safeguard-trigger-design",
        description:
          "Design, install, and maintain measurable safeguard triggers -- automatic thresholds that activate specific governance interventions when governance health indicators cross defined boundaries.",
      },
      {
        name: "structural-diversity-maintenance",
        description:
          "Proactively maintain the structural conditions that resist governance capture -- diverse proposal authorship, equitable approval rates, distributed funding, leadership rotation, and broad participation -- through bounded interventions with sunset dates.",
      },
    ],
    features: [
      {
        title: "Safeguards",
        href: "/safeguards",
        description: "Monitor governance health, capture patterns, and trigger thresholds.",
      },
      {
        title: "Audits",
        href: "/safeguards/audits",
        description: "Review independent audits of governance health indicators.",
      },
      {
        title: "Compliance",
        href: "/compliance",
        description: "Track compliance obligations and transparency requirements.",
      },
      {
        title: "Admin / Users",
        href: "/admin/users",
        description: "Rotate roles, manage access, and enforce separation of duties.",
      },
    ],
  },
  {
    num: "VIII",
    name: "Emergency",
    icon: Siren,
    short: "Pre-authorized protocols for crisis",
    detail:
      "When crises arise, pre-authorized emergency protocols activate with clear scope, duration, and accountability. Emergency powers automatically sunset and require community ratification.",
    skills: [
      {
        name: "emergency-criteria-design",
        description:
          "Define objective, measurable emergency criteria with matching exit conditions -- run this before any crisis arrives so the ecosystem never debates whether an emergency is real while one is happening.",
      },
      {
        name: "pre-authorization-protocol",
        description:
          "Define emergency roles with pre-consented authority scopes, hard ceilings, and auto-expiration before any crisis arrives -- so the ecosystem never improvises power during fear.",
      },
      {
        name: "crisis-coordination",
        description:
          "Operate compressed decision timelines during an active emergency -- immediate, short-cycle, and deferred -- so the ecosystem acts quickly without abandoning structural accountability.",
      },
      {
        name: "emergency-reversion",
        description:
          "Return governance from emergency to normal operations through a mandatory recovery state -- authority ceases immediately, crisis decisions face ratification, and the circuit breaker cannot skip Half-Open.",
      },
      {
        name: "post-emergency-review",
        description:
          "Conduct a mandatory retrospective of every emergency -- decision by decision, against authorization scope -- by a review body that excludes anyone who held emergency authority during the crisis.",
      },
    ],
    features: [
      {
        title: "Emergency",
        href: "/emergency",
        description: "Activate and track emergency protocols, roles, and reversion conditions.",
      },
      {
        title: "Decisions",
        href: "/decisions",
        description: "Ratify emergency decisions and review them against authorization scope.",
      },
      {
        title: "Safeguards",
        href: "/safeguards",
        description: "Monitor triggers and post-emergency review recommendations.",
      },
    ],
  },
  {
    num: "IX",
    name: "Memory",
    icon: Brain,
    short: "Institutional learning that compounds",
    detail:
      "Every decision, experiment, and conflict resolution becomes part of the community's institutional memory. Patterns are recognized, lessons are encoded, and governance wisdom compounds over time.",
    skills: [
      {
        name: "decision-record",
        description:
          "Record a governance decision with its holding, reasoning, context, and dissent -- wrap any artifact from any layer into a searchable, classifiable, challengeable precedent.",
      },
      {
        name: "agreement-versioning",
        description:
          "Track the full version history of every living agreement with immutable snapshots, diffs, and rationale -- so no one can claim a change was never consented to.",
      },
      {
        name: "semantic-tagging",
        description:
          "Classify and tag every governance decision for retrieval, pattern detection, and cross-domain search -- without tags, governance memory is a warehouse with no shelving system.",
      },
      {
        name: "precedent-search",
        description:
          "Query governance memory to find relevant precedents before making new decisions -- without search, decision records are inert data that no one can use.",
      },
      {
        name: "precedent-challenge",
        description:
          "Formally challenge an existing precedent when circumstances have changed or the original rationale no longer holds -- without this, precedent becomes inertia and governance cannot learn.",
      },
    ],
    features: [
      {
        title: "Decisions",
        href: "/decisions",
        description: "A searchable register of decisions, reasoning, and dissent.",
      },
      {
        title: "Agreements",
        href: "/agreements",
        description: "Versioned agreement history with immutable snapshots and diffs.",
      },
      {
        title: "My quiz history",
        href: "/my-quiz-history",
        description: "Personal learning record and portable contribution history.",
      },
      {
        title: "Safeguards audits",
        href: "/safeguards/audits",
        description: "Longitudinal governance health records used for pattern detection.",
      },
    ],
  },
  {
    num: "X",
    name: "Exit",
    icon: DoorOpen,
    short: "The right to leave with dignity and data",
    detail:
      "Members can leave any circle, ecosystem, or the platform entirely, taking their data and contribution history with them. Exit rights are fundamental and cannot be restricted by agreement.",
    skills: [
      {
        name: "voluntary-exit",
        description:
          "Execute a complete, dignified individual departure from an ecosystem -- run this whenever any member chooses to leave, ensuring commitment handoff, data export, and a clean governance record.",
      },
      {
        name: "commitment-unwinding",
        description:
          "Systematically resolve every outstanding commitment held by a departing member -- run this during any voluntary exit or ETHOS dissolution to ensure no obligation is orphaned, trapped, or weaponized.",
      },
      {
        name: "portable-record",
        description:
          "Generate a structured, machine-readable governance participation history that a departing member owns and carries -- run this during any departure to ensure governance experience travels with the person, not trapped in the ecosystem they leave.",
      },
      {
        name: "re-entry-integration",
        description:
          "Execute a structured return for a former member who chooses to rejoin -- run this whenever someone comes back, ensuring they consent to current agreements, carry their historical context, and integrate without preferential treatment or second-class status.",
      },
      {
        name: "ethos-dissolution",
        description:
          "Execute the orderly dissolution of an entire ETHOS -- run this when a unit can no longer sustain operations, ensuring assets are settled, members transition, and governance records are permanently archived.",
      },
    ],
    features: [
      {
        title: "Exit",
        href: "/exit",
        description: "File and track voluntary exits, commitment unwinding, and handoff.",
      },
      {
        title: "Profile",
        href: "/profile",
        description: "Own your data, export your record, and manage departure preferences.",
      },
      {
        title: "My quiz history",
        href: "/my-quiz-history",
        description: "Portable participation and learning record.",
      },
    ],
  },
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

export default function GovernanceModel() {
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
          <p className="hidden text-xs font-black uppercase tracking-[0.18em] sm:block">
            NEOS / Governance model
          </p>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/about">About</Link>
            </Button>
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
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              54 skills · 10 layers · ACT protocol
            </p>
            <h1 className="mt-10 max-w-5xl text-[clamp(3.5rem,8vw,8rem)] font-black uppercase leading-[0.84] tracking-[-0.07em]">
              How NEOS governs.
            </h1>
            <p className="mt-8 max-w-3xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              NEOS is not a voting app. It is a complete governance operating system. Every layer below
              is a concrete governance need; each skill is a reusable process that satisfies that need.
              The features in the app are the manual surface of this protocol stack.
            </p>
          </div>
          <div className="flex flex-col justify-end border-t border-foreground bg-foreground p-6 text-background lg:col-span-4 lg:border-l lg:border-t-0 lg:p-8">
            <p className="max-w-md text-lg font-medium leading-relaxed">
              The AI agent is an opt-in add-on. The core system and every layer are fully accessible
              through the manual front and this governance page.
            </p>
          </div>
        </header>

        <section className="border-b border-foreground px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mb-12 grid gap-6 lg:grid-cols-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] lg:col-span-3">
              00 / Core protocol
            </p>
            <div className="lg:col-span-9">
              <h2 className="text-4xl font-black uppercase leading-none tracking-[-0.04em] sm:text-6xl">
                The ACT engine.
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                Advice, Consent, and Test is the decision protocol that powers nearly every skill in the
                stack. It keeps governance from collapsing into either bureaucracy or autocracy.
              </p>
            </div>
          </div>

          <div className="grid border-l border-t border-foreground sm:grid-cols-3">
            {ACT_STEPS.map((step) => (
              <div
                key={step.title}
                className="flex flex-col justify-between border-b border-r border-foreground bg-card p-6 sm:p-8"
              >
                <step.icon className="h-8 w-8" aria-hidden="true" />
                <div className="mt-12">
                  <h3 className="text-2xl font-black uppercase tracking-[-0.03em]">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-b border-foreground px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mb-12 grid gap-6 lg:grid-cols-12">
            <p className="text-xs font-bold uppercase tracking-[0.18em] lg:col-span-3">
              01 — 10 / Layers
            </p>
            <div className="lg:col-span-9">
              <h2 className="text-4xl font-black uppercase leading-none tracking-[-0.04em] sm:text-6xl">
                Skills and features by layer.
              </h2>
              <p className="mt-5 max-w-3xl text-lg leading-relaxed text-muted-foreground">
                Each layer lists the skills that implement it, followed by the app features that make
                those skills manually operable.
              </p>
            </div>
          </div>

          <div className="border-l border-t border-foreground">
            {GOVERNANCE_MODEL.map((layer) => (
              <article
                key={layer.num}
                className="grid border-b border-r border-foreground bg-card"
              >
                <div className="grid border-b border-foreground sm:grid-cols-[5rem_1fr] lg:grid-cols-[7rem_20rem_1fr]">
                  <div className="flex items-center justify-between border-b border-foreground p-5 sm:flex-col sm:items-start sm:border-b-0 sm:border-r lg:p-6">
                    <span className="text-xs font-black tracking-[0.18em]">{layer.num}</span>
                    <layer.icon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="border-b border-foreground p-5 sm:col-start-2 sm:border-b-0 lg:border-r lg:p-6">
                    <h3 className="text-2xl font-black uppercase tracking-[-0.03em]">{layer.name}</h3>
                    <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                      {layer.short}
                    </p>
                  </div>
                  <p className="p-5 text-sm leading-relaxed text-muted-foreground sm:col-span-2 lg:col-span-1 lg:p-6">
                    {layer.detail}
                  </p>
                </div>

                <div className="grid border-b border-foreground lg:grid-cols-2">
                  <div className="border-b border-foreground p-5 lg:border-b-0 lg:border-r lg:p-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Skills
                    </h4>
                    <ul className="mt-4 space-y-4">
                      {layer.skills.map((skill) => (
                        <li key={skill.name}>
                          <p className="text-sm font-bold">{skill.name}</p>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {skill.description}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-5 lg:p-6">
                    <h4 className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Satisfied by site features
                    </h4>
                    <ul className="mt-4 space-y-3">
                      {layer.features.map((feature) => (
                        <li key={feature.title}>
                          <Link
                            href={feature.href}
                            className="inline-flex items-center gap-2 text-sm font-bold underline-offset-4 hover:underline"
                          >
                            <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                            {feature.title}
                          </Link>
                          <p className="text-sm leading-relaxed text-muted-foreground">
                            {feature.description}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid border-b border-foreground lg:grid-cols-12">
          <div className="bg-foreground p-6 text-background sm:p-8 lg:col-span-4 lg:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-background/70">
              Manual by design
            </p>
            <h2 className="mt-16 text-4xl font-black uppercase leading-none tracking-[-0.04em] sm:text-5xl">
              No AI required.
            </h2>
          </div>
          <div className="p-6 sm:p-8 lg:col-span-8 lg:p-12">
            <div className="flex items-center gap-3 border-b border-foreground pb-5">
              <DoorOpen className="h-5 w-5" aria-hidden="true" />
              <h3 className="text-xl font-black uppercase">The core system is human-first.</h3>
            </div>
            <div className="mt-8 grid gap-6 text-base leading-relaxed text-muted-foreground md:grid-cols-2">
              <p>
                The 54 skills on this page are implemented as processes, not prompts. They can be run
                by hand, through the app, or with the optional AI assistant. The agent can speed up
                drafting, but it cannot bypass consent, erase dissent, or create binding agreements on
                its own.
              </p>
              <p>
                This page is the manual map. If you want the operational surface, use the governance
                dashboard, agreements, proposals, and members. If you want the protocol reference, use
                the skill files in NEOS-core. If you want help, the AI is one opt-in tap away.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-foreground px-4 py-16 text-background sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-background/70">
                Your community can begin here
              </p>
              <h2 className="mt-6 text-5xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-7xl">
                Govern together.
              </h2>
            </div>
            <div className="flex flex-col gap-3 lg:col-span-4">
              <Button asChild size="lg" variant="secondary" className="w-full justify-between">
                <Link href="/login">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-background/60 text-background hover:bg-background hover:text-foreground"
              >
                <Link href="/about">Read the system brief</Link>
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
