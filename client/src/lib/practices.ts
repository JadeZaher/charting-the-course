// Practices the public site already names. Sentences below are those definitions.
// No new figure, member, council, or deployment.

export interface PracticeLink {
  href: string;
  text: string;
}

export interface PracticeSource {
  label: string;
  href: string;
}

export interface Practice {
  slug: string;
  path: string;
  eyebrow: string;
  title: string;
  seoTitle: string;
  description: string;
  h1: string;
  published: string;
  dateLabel: string;
  paragraphs: readonly string[];
  links: readonly PracticeLink[];
  sourceList: readonly PracticeSource[];
  siblings: readonly string[];
}

const PRIMUS = {
  href: "https://primusneo.com",
  text: "PrimusNeo, the lab whose stack this product belongs to",
} as const;

const NO_FIGURE =
  "This page does not add a figure, a member count, or a deployment. It does not include a worked example.";

const STACK =
  "NEOS is part of PrimusNeo, and it is offered here as its own product.";

export const PRACTICES_INDEX = {
  path: "/practices",
  title: "Practices — NEOS",
  description:
    "Four practices the public site already names: ACT, agreements and decision records, keys that stay in the browser, and learning before joining.",
  kicker: "Four practices",
  heading: "What the workspace already names.",
  standfirst:
    "ACT, agreements and decision records, keys that stay in the browser, and learning and discovery in a community. Each page restates the public definition and links to it. No new deployment is claimed.",
  emptyMetrics:
    "These pages do not add figures. A sourced metric is omitted where this site has not published one.",
} as const;

export const PRACTICES: readonly Practice[] = [
  {
    slug: "act",
    path: "/practices/act",
    eyebrow: "ACT",
    title: "ACT is not a vote",
    seoTitle: "ACT — Practices | NEOS",
    description:
      "ACT means Advice, Consent, and Test. It is not a popularity vote and not a share of ownership. This page restates the public definition.",
    h1: "ACT is not a vote.",
    published: "2026-11-10",
    dateLabel: "10 November 2026",
    paragraphs: [
      "ACT means Advice, Consent, and Test: advice from the people affected, consent as a check for a reasoned objection, and a test of the proposal in practice. It is not a popularity vote and not a share of ownership.",
      "NEOS is not a voting app. It is a governance operating system: each layer is a concrete need, and each skill is a reusable process for that need. The features in the app are the manual surface of that stack.",
      "Consent is not majority rule. The About page already says NEOS is not a voting platform.",
      NO_FIGURE,
      STACK,
    ],
    links: [
      { href: "/governance-model", text: "How NEOS governs." },
      { href: "/blog/act-is-not-a-vote", text: "ACT is not a vote" },
      PRIMUS,
    ],
    sourceList: [
      { label: "How NEOS governs", href: "https://neos.primusneo.com/governance-model" },
      { label: "About NEOS", href: "https://neos.primusneo.com/about" },
      { label: "ACT is not a vote", href: "https://neos.primusneo.com/blog/act-is-not-a-vote" },
      { label: "PrimusNeo", href: "https://primusneo.com" },
    ],
    siblings: ["agreements-and-decision-records", "keys-in-the-browser"],
  },
  {
    slug: "agreements-and-decision-records",
    path: "/practices/agreements-and-decision-records",
    eyebrow: "Agreements",
    title: "Agreements and decision records",
    seoTitle: "Agreements and decision records — Practices | NEOS",
    description:
      "Agreements and decision records, as the public About page already states them. This page adds no figure and no deployment.",
    h1: "Decisions should remain findable.",
    published: "2026-11-10",
    dateLabel: "10 November 2026",
    paragraphs: [
      "Every governance act begins and ends with an agreement. Agreements are living documents with clear domains, expiration dates, and review cycles. They encode the community's will into actionable, testable commitments.",
      "Decisions, experiments, and conflict records are supposed to remain findable, so a later member can see what was already decided.",
      "Economic coordination is a recorded practice in the skill stack. This workspace does not move money, issue a token, sell a share, or run a funding pool.",
      "Exit is not a payment or a transfer of ownership.",
      NO_FIGURE,
      STACK,
    ],
    links: [
      { href: "/governance-model", text: "How NEOS governs." },
      { href: "/about", text: "The New Earth Operating System." },
      { href: "/blog/act-is-not-a-vote", text: "ACT is not a vote" },
      PRIMUS,
    ],
    sourceList: [
      { label: "About NEOS", href: "https://neos.primusneo.com/about" },
      { label: "How NEOS governs", href: "https://neos.primusneo.com/governance-model" },
      { label: "PrimusNeo", href: "https://primusneo.com" },
    ],
    siblings: ["act", "keys-in-the-browser"],
  },
  {
    slug: "keys-in-the-browser",
    path: "/practices/keys-in-the-browser",
    eyebrow: "Keys",
    title: "Keys that stay in the browser",
    seoTitle: "Keys that stay in the browser — Practices | NEOS",
    description:
      "There is no blockchain and no token. A browser sign-in can use a key generated on the device; the private key stays in that browser.",
    h1: "The key stays in the browser.",
    published: "2026-11-10",
    dateLabel: "10 November 2026",
    paragraphs: [
      "There is no blockchain and no token. A browser sign-in can use a key generated on the device; the private key stays in that browser.",
      "OmniOne is a name carried in the NEOS operating-system notes. This site does not state a location, a steward, or whether a deployment is live.",
      NO_FIGURE,
      STACK,
    ],
    links: [
      { href: "/blog/the-key-stays-in-the-browser", text: "The key stays in the browser" },
      { href: "/about", text: "The New Earth Operating System." },
      PRIMUS,
    ],
    sourceList: [
      { label: "NEOS — Governance in Practice", href: "https://neos.primusneo.com" },
      { label: "About NEOS", href: "https://neos.primusneo.com/about" },
      { label: "The key stays in the browser", href: "https://neos.primusneo.com/blog/the-key-stays-in-the-browser" },
      { label: "PrimusNeo", href: "https://primusneo.com" },
    ],
    siblings: ["act", "learning-and-discovery"],
  },
  {
    slug: "learning-and-discovery",
    path: "/practices/learning-and-discovery",
    eyebrow: "Learning",
    title: "Learning and discovery",
    seoTitle: "Learning and discovery — Practices | NEOS",
    description:
      "Discover people and projects you can contribute to. Explore a community before deciding to join. This page adds no member count.",
    h1: "Explore a community before joining.",
    published: "2026-11-10",
    dateLabel: "10 November 2026",
    paragraphs: [
      "Discover people and projects you can contribute to. Explore a community before deciding to join.",
      "A visual workspace for learning, discovery, collaboration, and participatory governance.",
      "Communities here are also called ecosystems. Explore their purpose before joining, then complete any agreements and onboarding quizzes they require. Each community sets its own participation paths.",
      "This page does not report a member count or a study. The list of communities is on the communities page.",
      NO_FIGURE,
      STACK,
    ],
    links: [
      { href: "/communities", text: "Find a community." },
      { href: "/about", text: "The New Earth Operating System." },
      PRIMUS,
    ],
    sourceList: [
      { label: "NEOS — Governance in Practice", href: "https://neos.primusneo.com" },
      { label: "About NEOS", href: "https://neos.primusneo.com/about" },
      { label: "Communities", href: "https://neos.primusneo.com/communities" },
      { label: "PrimusNeo", href: "https://primusneo.com" },
    ],
    siblings: ["act", "agreements-and-decision-records"],
  },
];

export const NEWS = {
  path: "/news",
  title: "News — NEOS",
  description: "Nothing has been announced here yet.",
  heading: "News",
  body: "Nothing has been announced here yet. This page will list a public, dated fact when one exists. It does not repeat the blog.",
} as const;
