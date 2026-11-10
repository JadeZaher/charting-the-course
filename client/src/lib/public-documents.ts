// Public copy for the introduction, About, legal pages, and the two notes.
// The prerender step writes the same strings into the first HTML response.

import { NEWS, PRACTICES, PRACTICES_INDEX, type Practice } from "./practices";
import { BLOG, ESSAYS, type Essay, type Inline, type Paragraph } from "./writing";

export type { Essay, FollowLink, Inline, Paragraph } from "./writing";
export { BLOG, ESSAYS, plainParagraph } from "./writing";
export { NEWS, PRACTICES, PRACTICES_INDEX } from "./practices";

export const SITE_ORIGIN = "https://neos.primusneo.com";
export const PRIMUS_NEO_URL = "https://primusneo.com";

export const OPERATOR = {
  name: "Escherbridge, LLC",
  contact: "Ahmed Zaher",
  email: "contact@escherbridge.com",
  phone: "(509) 578-4603",
  address: "1140 S Colorado Ln, Boise, ID",
} as const;

/** Required venue sentence. Keep this string exact. */
export const IDAHO_VENUE =
  "These terms are governed by the laws of the State of Idaho, and any dispute will be resolved in the state or federal courts located in Ada County, Idaho.";

export const ACT_SENTENCE =
  "ACT means Advice, Consent, and Test: advice from the people affected, consent as a check for a reasoned objection, and a test of the proposal in practice. It is not a popularity vote and not a share of ownership.";

export const ECONOMIC_DETAIL =
  "Economic coordination is a recorded practice in the skill stack. This workspace does not move money, issue a token, sell a share, or run a funding pool.";

export const INTRO = {
  title: "NEOS — Governance in Practice",
  description: "A visual workspace for learning, discovery, collaboration, and participatory governance.",
  heading: "Find a community.",
  paragraphs: [
    "NEOS is a workspace for communities to make shared decisions, manage agreements, and coordinate projects and resources.",
    "A visual workspace for learning, discovery, collaboration, and participatory governance.",
    "Discover people and projects you can contribute to. Explore a community before deciding to join.",
    ACT_SENTENCE,
    "There is no blockchain and no token. A browser sign-in can use a key generated on the device; the private key stays in that browser.",
    [
      "NEOS is part of ",
      { text: "PrimusNeo, the lab whose stack this product belongs to", href: PRIMUS_NEO_URL },
      ". It is offered here as its own product.",
    ],
  ] as readonly Paragraph[],
};

export const ABOUT = {
  title: "About NEOS — Governance in Practice",
  description:
    "NEOS is a platform for communities to make shared decisions, manage agreements, and coordinate projects and resources.",
  kicker: "About NEOS",
  heading: "The New Earth Operating System.",
  lead: [
    "NEOS is a platform for communities to make shared decisions, manage agreements, and coordinate projects and resources. On this site, you can explore communities, join one that fits your interests, and take part in its work. It is part of the ",
    { text: "PrimusNeo", href: PRIMUS_NEO_URL },
    " stack, and it is offered here as its own product.",
  ] as Paragraph,
  aside:
    "Communities here are also called ecosystems. Explore their purpose before joining, then complete any agreements and onboarding quizzes they require. Each community sets its own participation paths.",
};

export const ABOUT_IS = [
  "A skill stack with 54 skills across 10 layers, as the public About and the operator health check currently report",
  "Open-source software you can fork, adapt, and run yourself",
  "A workspace for consent-based decisions, using ACT",
  "Assistants may guide; they do not decide",
] as const;

export const ABOUT_IS_NOT = [
  "A blockchain, token, or crypto project",
  "A voting platform — consent is not majority rule",
  "A corporate hierarchy tool rebranded as flat",
  "A platform where AI makes decisions for humans",
  "A finished government in a box.",
] as const;

export interface AboutLayer {
  num: string;
  name: string;
  short: string;
  detail: string;
}

export const ABOUT_LAYERS: readonly AboutLayer[] = [
  {
    num: "I",
    name: "Agreement",
    short: "How commitments are created, reviewed, and evolved",
    detail:
      "Every governance act begins and ends with an agreement. Agreements are living documents with clear domains, expiration dates, and review cycles. They encode the community's will into actionable, testable commitments.",
  },
  {
    num: "II",
    name: "Authority",
    short: "Who decides what, and how roles flow",
    detail:
      "Authority in NEOS is distributed through roles, not positions. Roles are created by consent, carry explicit domains of authority, and can be filled, amended, or dissolved by the circle that holds them.",
  },
  {
    num: "III",
    name: "ACT Engine",
    short: "Advice, Consent, and Test",
    detail: ACT_SENTENCE,
  },
  {
    num: "IV",
    name: "Economic",
    short: "Recorded resource practice, not a payment rail",
    detail: ECONOMIC_DETAIL,
  },
  {
    num: "V",
    name: "Inter-Unit",
    short: "Coordination across autonomous groups",
    detail:
      "Circles, pods, and ecosystems coordinate through shared agreements and liaison roles. Autonomy is preserved while enabling collaboration across organizational boundaries.",
  },
  {
    num: "VI",
    name: "Conflict",
    short: "Repair and restoration, not punishment",
    detail:
      "Conflict resolution follows a restorative path: direct conversation, facilitated dialogue, mediation, and community process. The goal is always repair and learning, never punishment.",
  },
  {
    num: "VII",
    name: "Safeguard",
    short: "Detecting and preventing power capture",
    detail:
      "The stack is designed to notice when power concentrates: term limits, rotation, transparency, and a way to raise an alarm. Treat those as part of the skill set, not as a claim that every community already runs them.",
  },
  {
    num: "VIII",
    name: "Emergency",
    short: "Pre-authorized protocols for crisis",
    detail:
      "When crises arise, pre-authorized emergency protocols activate with clear scope, duration, and accountability. Emergency powers automatically sunset and require community ratification.",
  },
  {
    num: "IX",
    name: "Memory",
    short: "Institutional learning that compounds",
    detail:
      "Decisions, experiments, and conflict records are supposed to remain findable, so a later member can see what was already decided.",
  },
  {
    num: "X",
    name: "Exit",
    short: "The right to leave with dignity and data",
    detail:
      "Members can leave any circle, ecosystem, or the platform entirely. A person who files an exit can download the portable governance record this workspace already offers. Exit is not a payment or a transfer of ownership.",
  },
];

export const ABOUT_TERMS: readonly { term: string; def: string }[] = [
  {
    term: "ETHOS",
    def: "Ecosystem Transforming Holistic Operating System — the full governance framework that NEOS implements.",
  },
  {
    term: "Steward",
    def: "A role carrying responsibility for a specific domain. Stewards facilitate, they do not command.",
  },
  {
    term: "ACT",
    def: "Advice, Consent, and Test — the three-phase decision protocol. Not a popularity vote and not a share sale.",
  },
  {
    term: "Agreement Field",
    def: "The living collection of all active agreements within a circle or ecosystem, with their review dates and domains.",
  },
  {
    term: "Circle",
    def: "A self-governing group with a clear domain, members, and its own set of agreements.",
  },
  {
    term: "Ecosystem",
    def: "A network of circles operating under shared foundational agreements.",
  },
  {
    term: "Domain",
    def: "The scope of authority and responsibility assigned to a role, circle, or agreement.",
  },
  {
    term: "OmniOne",
    def: "A name carried in the NEOS operating-system notes. This site does not state a location, a steward, or whether a deployment is live.",
  },
];

export const ABOUT_OMNI = {
  kicker: "Named ecosystem",
  heading: "OmniOne",
  paragraphs: [
    "OmniOne is a name carried in the NEOS operating-system notes. This site does not state a location, a steward, or whether a deployment is live.",
  ],
} as const;

export const GOVERNANCE_LEAD = {
  title: "How NEOS governs",
  description:
    "NEOS is a governance operating system for agreements, decision records, and coordination. ACT means Advice, Consent, and Test.",
  kicker: "54 skills · 10 layers · ACT protocol",
  heading: "How NEOS governs.",
  paragraphs: [
    "NEOS is not a voting app. It is a governance operating system: each layer is a concrete need, and each skill is a reusable process for that need. The features in the app are the manual surface of that stack.",
    ACT_SENTENCE,
    ECONOMIC_DETAIL,
    [
      "NEOS is part of ",
      { text: "PrimusNeo", href: PRIMUS_NEO_URL },
      ", and it is offered here as its own product.",
    ],
  ] as readonly Paragraph[],
};

export interface LegalSection {
  heading: string;
  paragraphs: readonly string[];
}

export const TERMS_PAGE = {
  title: "Terms of use — NEOS",
  description: "Terms of use for the NEOS workspace, operated by Escherbridge, LLC.",
  heading: "Terms of use",
  updated: "10 November 2026",
  sections: [
    {
      heading: "Who operates this site",
      paragraphs: [
        `The NEOS workspace at ${SITE_ORIGIN} is operated by ${OPERATOR.name}.`,
        `Contact ${OPERATOR.contact} at ${OPERATOR.email}, ${OPERATOR.phone}, ${OPERATOR.address}.`,
      ],
    },
    {
      heading: "What the workspace is",
      paragraphs: [
        "NEOS is a visual workspace for learning, discovery, collaboration, and participatory governance. Communities use it for agreements, decision records, and coordination.",
        ACT_SENTENCE,
        "This site does not issue a token, take an investment, or sell a share. Records you submit are the community's operating record. They are not, by themselves, equity, a payment right, or legal title.",
        ECONOMIC_DETAIL,
      ],
    },
    {
      heading: "Accounts and keys",
      paragraphs: [
        "You may create a username and password, or sign in with a key generated in your browser. The private key stays in that browser. If you lose it, this workspace does not have a copy to restore.",
        "If the operator has enabled an outside sign-in provider, choosing it sends your browser to that provider and, on return, sets a session cookie.",
        "You are responsible for the activity under the account you use and for the records you submit.",
      ],
    },
    {
      heading: "Communities",
      paragraphs: [
        "Each community sets its own agreements and onboarding. Joining one can require you to read those agreements and complete quizzes that community configured.",
      ],
    },
    {
      heading: "Changes",
      paragraphs: [
        "The operator may update these terms by publishing a new version at this URL.",
      ],
    },
    {
      heading: "Governing law",
      paragraphs: [IDAHO_VENUE],
    },
  ] as const satisfies readonly LegalSection[],
} as const;

export const PRIVACY_PAGE = {
  title: "Privacy — NEOS",
  description: "What the NEOS workspace collects, limited to what this client actually sends or stores.",
  heading: "Privacy",
  updated: "10 November 2026",
  intro: [
    `This page lists information the NEOS client at ${SITE_ORIGIN} sends or stores. It is operated by ${OPERATOR.name}.`,
    `Contact ${OPERATOR.contact} at ${OPERATOR.email}, ${OPERATOR.phone}, ${OPERATOR.address}.`,
    "This client does not set a retention schedule, and it does not state an age rule.",
  ],
  sections: [
    {
      heading: "Account",
      paragraphs: [
        "If you register or sign in with a password, the client sends a username and password to the NEOS API, and a display name when you provide one. A sign-up link can also send an ecosystem id.",
        "If you sign in with a browser key, this browser stores the private key in local storage. The sign-in request sends the public key's DID and a signature of a server challenge. The private key is not part of that request. The client also posts the DID and public key to the workspace DID endpoint.",
        "If an outside sign-in provider is enabled and you choose it, the browser is redirected to that provider. On return the API sets a session cookie. The membership can record which provider was used. This client does not show an email address or photo received from that provider.",
      ],
    },
    {
      heading: "Session and this browser",
      paragraphs: [
        "The API sets a neos_session cookie. The client stores the communities you select in a neos_selected_ecosystems cookie, and the sidebar stores an open or closed cookie.",
        "Local storage holds the theme, whether the route guide is open, platform-tour progress for the signed-in user id, the browser key material described above, and a push-owner id if you enable browser push.",
        "Session storage holds the in-app page to open after sign-in, and node-admin navigation if you use that screen.",
      ],
    },
    {
      heading: "Profile you publish",
      paragraphs: [
        "The profile editor can save a display name, username, headline, biography, location, profile image URL, website, LinkedIn URL, GitHub URL, skills, interests, and projects (name, description, URL, role, start, and end).",
      ],
    },
    {
      heading: "Membership fields a steward can enter",
      paragraphs: [
        "The member form can save a phone number and a profile image on a membership. The public profile page does not show phone numbers, authentication details, private notes, or raw quiz answers.",
      ],
    },
    {
      heading: "Records you submit",
      paragraphs: [
        "The workspace sends the governance and participation records you submit: agreements, proposals, advice, consent positions, test reports, messages, assistant chat, quiz answers with score and time spent when you submit, orientation progress and reflections, shares, needs, solutions, collaborations, conflict and emergency records, exit records, and personal decision notes.",
        "A person who files an exit and is the one leaving can download a JSON file of the portable governance record the exit page describes.",
        "Community search text is sent as a query.",
      ],
    },
    {
      heading: "Notifications you turn on",
      paragraphs: [
        "In-app updates do not require an email address or phone number. If you submit an email address or phone number for updates, the client sends that destination and, when you enter it, a verification code. The settings page then shows a masked destination. You can remove that contact.",
        "If you enable browser push, the client registers a push subscription for this browser.",
        "Notification settings can save a time zone, quiet hours, a pause time, and which updates you follow or mute.",
        "The settings page states that email, push, and SMS stay off until delivery setup is complete and you enable them. This page does not turn those providers on.",
      ],
    },
    {
      heading: "What this client does not include",
      paragraphs: [
        "The public HTML does not load an analytics, advertising, or tag-manager script.",
        "This page does not describe server logs, and it does not state how long any record is kept.",
      ],
    },
  ] as const satisfies readonly LegalSection[],
} as const;

/** Sister sites, omitting NEOS. Descriptive anchors, follow links, each site's own domain. */
export const ESCHERBRIDGE_SITES = [
  { href: PRIMUS_NEO_URL, label: "PrimusNeo, the technology innovation lab" },
  { href: "https://azoa.ardanova.com", label: "AZOA, an engine for structured workflows" },
  { href: "https://ardanova.com", label: "ArdaNova, a workspace for shared work" },
  { href: "https://aevani.com", label: "Aevani, a marketplace for growing tools" },
  { href: "https://plantgeo.aevani.com", label: "PlantGeo, a 3D map for planning a site" },
  { href: "https://overseasgenai.com", label: "OverseasGenAI, a venture shipyard" },
  { href: "https://glitxz.com", label: "Glitxz, an artist-led market for work in progress" },
] as const;

export const OG_IMAGE = `${SITE_ORIGIN}/og/neos-og-1200x630.png`;
export const LOGO = `${SITE_ORIGIN}/apple-touch-icon.png`;
const ORG_ID = `${SITE_ORIGIN}/#organization`;
const SITE_ID = `${SITE_ORIGIN}/#website`;

export function organizationNode() {
  return {
    "@type": "Organization",
    "@id": ORG_ID,
    name: "NEOS",
    url: `${SITE_ORIGIN}/`,
    logo: LOGO,
    email: OPERATOR.email,
    parentOrganization: { "@type": "Organization", name: OPERATOR.name },
    sameAs: ESCHERBRIDGE_SITES.map((site) => site.href),
  };
}

export function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": SITE_ID,
    url: `${SITE_ORIGIN}/`,
    name: "NEOS",
    inLanguage: "en-US",
    publisher: { "@id": ORG_ID },
  };
}

export function organizationJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [organizationNode(), websiteNode()],
  });
}

const PUBLIC_NAV: readonly { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/communities", label: "Communities" },
  { href: "/blog", label: "Blog" },
  { href: "/practices", label: "Practices" },
  { href: "/about", label: "About" },
  { href: "/governance-model", label: "Governance model" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/login", label: "Sign in" },
];

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function inlineHtml(part: Inline): string {
  if (typeof part === "string") return escapeHtml(part);
  return `<a href="${escapeHtml(part.href)}">${escapeHtml(part.text)}</a>`;
}

function paragraphHtml(paragraph: Paragraph): string {
  if (typeof paragraph === "string") return `<p>${escapeHtml(paragraph)}</p>`;
  return `<p>${paragraph.map((part) => inlineHtml(part)).join("")}</p>`;
}

function paragraphsHtml(paragraphs: readonly Paragraph[]): string {
  return paragraphs.map((paragraph) => paragraphHtml(paragraph)).join("");
}

function sectionsHtml(sections: readonly LegalSection[]): string {
  return sections
    .map(
      (section) =>
        `<section><h2>${escapeHtml(section.heading)}</h2>${paragraphsHtml(section.paragraphs)}</section>`,
    )
    .join("");
}

function navHtml(): string {
  const links = PUBLIC_NAV.map(
    (link) => `<a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`,
  ).join("");
  return `<nav aria-label="Public pages">${links}</nav>`;
}

function footerHtml(): string {
  const items = ESCHERBRIDGE_SITES.map(
    (site) => `<li><a href="${escapeHtml(site.href)}">${escapeHtml(site.label)}</a></li>`,
  ).join("");
  return `<footer><p>An Escherbridge project</p><ul>${items}</ul></footer>`;
}

function aboutHtml(): string {
  const layers = ABOUT_LAYERS.map(
    (layer) =>
      `<section><h2>${escapeHtml(`${layer.num}. ${layer.name}`)}</h2><p>${escapeHtml(layer.short)}</p><p>${escapeHtml(layer.detail)}</p></section>`,
  ).join("");
  const isItems = ABOUT_IS.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const isNot = ABOUT_IS_NOT.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const terms = ABOUT_TERMS.map(
    (item) => `<dt>${escapeHtml(item.term)}</dt><dd>${escapeHtml(item.def)}</dd>`,
  ).join("");
  return [
    `<h1>${escapeHtml(ABOUT.heading)}</h1>`,
    paragraphHtml(ABOUT.lead),
    `<p>${escapeHtml(ABOUT.aside)}</p>`,
    `<h2>It is</h2><ul>${isItems}</ul>`,
    `<h2>It is not</h2><ul>${isNot}</ul>`,
    `<h2>The 10 governance layers.</h2>`,
    layers,
    `<h2>${escapeHtml(ABOUT_OMNI.heading)}</h2>`,
    paragraphsHtml(ABOUT_OMNI.paragraphs),
    `<h2>Key terminology.</h2><dl>${terms}</dl>`,
    navHtml(),
  ].join("");
}

function legalHtml(page: { heading: string; updated: string; intro?: readonly string[]; sections: readonly LegalSection[] }): string {
  return [
    `<h1>${escapeHtml(page.heading)}</h1>`,
    `<p>Updated ${escapeHtml(page.updated)}</p>`,
    page.intro ? paragraphsHtml(page.intro) : "",
    sectionsHtml(page.sections),
    navHtml(),
  ].join("");
}

export const COMMUNITIES_PAGE = {
  title: "Communities — NEOS",
  description: "Discover people and projects you can contribute to. Explore a community before deciding to join.",
} as const;

export interface PublicPage {
  path: string;
  title: string;
  description: string;
  canonical: string;
  html: string;
  robots: "index, follow" | "noindex, follow";
  ogType: "website" | "article";
  published?: string;
  modified?: string;
  indexable: boolean;
  jsonLd: string;
}

function listHtml(links: readonly { href: string; text: string }[]): string {
  return `<ul>${links.map((link) => `<li><a href="${escapeHtml(link.href)}">${escapeHtml(link.text)}</a></li>`).join("")}</ul>`;
}

function essayHtml(essay: Essay): string {
  const sources = essay.sources
    .map((source) => `<li><a href="${escapeHtml(source.href)}">${escapeHtml(source.label)}</a></li>`)
    .join("");
  const related = [
    ...ESSAYS.filter((item) => item.slug !== essay.slug).map((item) => ({ href: item.path, text: item.title })),
    { href: "/practices", text: PRACTICES_INDEX.heading },
    { href: PRIMUS_NEO_URL, text: "PrimusNeo, the lab whose stack this product belongs to" },
  ];
  return [
    `<h1>${escapeHtml(essay.title)}</h1>`,
    `<p>Escherbridge</p>`,
    `<p>${escapeHtml(essay.date)}</p>`,
    `<ul>${essay.topics.map((topic) => `<li>${escapeHtml(topic)}</li>`).join("")}</ul>`,
    paragraphsHtml(essay.paragraphs),
    `<h2>Sources</h2><ul>${sources}</ul>`,
    `<h2>Related</h2>${listHtml(related)}`,
    `<p><a href="/feed.xml">RSS</a></p>`,
    navHtml(),
  ].join("");
}

function blogIndexHtml(): string {
  const posts = [...ESSAYS].sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));
  const items = posts
    .map(
      (essay) =>
        `<article><p>${escapeHtml(essay.date)}</p><p>${escapeHtml(essay.topics.join(", "))}</p><h2><a href="${escapeHtml(essay.path)}">${escapeHtml(essay.title)}</a></h2><p>${escapeHtml(essay.summary)}</p></article>`,
    )
    .join("");
  return [
    `<h1>${escapeHtml(BLOG.heading)}</h1>`,
    `<p>Escherbridge</p>`,
    items,
    `<p><a href="/feed.xml">RSS</a></p>`,
    `<p><a href="/practices">${escapeHtml(PRACTICES_INDEX.heading)}</a></p>`,
    `<p><a href="/news">News</a>. Nothing has been announced there yet.</p>`,
    navHtml(),
  ].join("");
}

function newsHtml(): string {
  return [
    `<h1>${escapeHtml(NEWS.heading)}</h1>`,
    `<p>${escapeHtml(NEWS.body)}</p>`,
    `<p><a href="/blog">Blog</a></p>`,
    navHtml(),
  ].join("");
}

function practicesIndexHtml(): string {
  const cards = PRACTICES.map(
    (practice) =>
      `<article><h2>${escapeHtml(practice.title)}</h2><p>${escapeHtml(practice.description)}</p><p><a href="${escapeHtml(practice.path)}">View ${escapeHtml(practice.title)}</a></p></article>`,
  ).join("");
  return [
    `<p>${escapeHtml(PRACTICES_INDEX.kicker)}</p>`,
    `<h1>${escapeHtml(PRACTICES_INDEX.heading)}</h1>`,
    `<p>${escapeHtml(PRACTICES_INDEX.standfirst)}</p>`,
    `<p>${escapeHtml(PRACTICES_INDEX.emptyMetrics)}</p>`,
    cards,
    `<h2>On this site</h2>`,
    `<p><a href="/governance-model">How NEOS governs.</a></p>`,
    `<p><a href="/communities">Find a community.</a></p>`,
    `<p><a href="/blog">Blog</a></p>`,
    `<p>NEOS is part of <a href="${PRIMUS_NEO_URL}">PrimusNeo, the lab whose stack this product belongs to</a>. It is offered here as its own product.</p>`,
    `<p><a href="/feed.xml">RSS</a></p>`,
    navHtml(),
  ].join("");
}

function practiceHtml(practice: Practice): string {
  const siblings = practice.siblings.map((slug) => {
    const sibling = PRACTICES.find((item) => item.slug === slug);
    if (!sibling) throw new Error(`Missing practice sibling ${slug}`);
    return { href: sibling.path, text: sibling.title };
  });
  return [
    `<p>${escapeHtml(practice.eyebrow)}</p>`,
    `<h1>${escapeHtml(practice.h1)}</h1>`,
    `<p>Escherbridge</p>`,
    `<p>${escapeHtml(practice.dateLabel)}</p>`,
    practice.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join(""),
    `<h2>Where this is already said</h2>${listHtml(practice.links)}`,
    `<h2>Sources</h2>${listHtml(practice.sourceList.map((source) => ({ href: source.href, text: source.label })))}`,
    `<h2>Also in this section</h2>${listHtml(siblings)}`,
    `<p><a href="/practices">${escapeHtml(PRACTICES_INDEX.heading)}</a></p>`,
    navHtml(),
  ].join("");
}

function absolute(path: string): string {
  return path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
}

function breadcrumb(items: readonly { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}

function pageJsonLd(input: {
  path: string;
  title: string;
  description: string;
  canonical: string;
  kind: "website" | "collection" | "article";
  published?: string;
  modified?: string;
  headline?: string;
  crumbs: readonly { name: string; path: string }[];
  items?: readonly { name: string; path: string }[];
}): string {
  const trail = breadcrumb(input.crumbs);
  if (input.kind === "article") {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        organizationNode(),
        websiteNode(),
        trail,
        {
          "@type": "Article",
          headline: input.headline ?? input.title,
          description: input.description,
          datePublished: input.published,
          dateModified: input.modified ?? input.published,
          author: { "@type": "Organization", name: "Escherbridge" },
          publisher: { "@id": ORG_ID },
          mainEntityOfPage: input.canonical,
          image: OG_IMAGE,
          url: input.canonical,
        },
      ],
    });
  }
  if (input.kind === "collection") {
    return JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        organizationNode(),
        websiteNode(),
        trail,
        {
          "@type": "CollectionPage",
          name: input.title,
          description: input.description,
          url: input.canonical,
          isPartOf: { "@id": SITE_ID },
          mainEntity: {
            "@type": "ItemList",
            itemListElement: (input.items ?? []).map((item, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: item.name,
              url: absolute(item.path),
            })),
          },
        },
      ],
    });
  }
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      organizationNode(),
      websiteNode(),
      trail,
      {
        "@type": "WebPage",
        name: input.title,
        description: input.description,
        url: input.canonical,
        isPartOf: { "@id": SITE_ID },
      },
    ],
  });
}

function page(
  path: string,
  title: string,
  description: string,
  html: string,
  extra: {
    kind?: "website" | "collection" | "article";
    robots?: PublicPage["robots"];
    published?: string;
    modified?: string;
    indexable?: boolean;
    headline?: string;
    crumbs?: readonly { name: string; path: string }[];
    items?: readonly { name: string; path: string }[];
  } = {},
): PublicPage {
  const canonical = absolute(path);
  const kind = extra.kind ?? "website";
  const crumbs = extra.crumbs ?? [{ name: "Home", path: "/" }, ...(path === "/" ? [] : [{ name: title, path }])];
  return {
    path,
    title,
    description,
    canonical,
    html: `${html}${footerHtml()}`,
    robots: extra.robots ?? "index, follow",
    ogType: kind === "article" ? "article" : "website",
    published: extra.published,
    modified: extra.modified,
    indexable: extra.indexable ?? true,
    jsonLd: pageJsonLd({
      path,
      title,
      description,
      canonical,
      kind,
      published: extra.published,
      modified: extra.modified,
      headline: extra.headline,
      crumbs,
      items: extra.items,
    }),
  };
}

const homeCrumbs = [{ name: "Home", path: "/" }] as const;

export const PUBLIC_PAGES: readonly PublicPage[] = [
  page("/", INTRO.title, INTRO.description, `<h1>${escapeHtml(INTRO.heading)}</h1>${paragraphsHtml(INTRO.paragraphs)}${navHtml()}`, {
    crumbs: homeCrumbs,
  }),
  page(
    "/communities",
    COMMUNITIES_PAGE.title,
    COMMUNITIES_PAGE.description,
    `<h1>${escapeHtml(INTRO.heading)}</h1>${paragraphsHtml(INTRO.paragraphs)}${navHtml()}`,
    { crumbs: [{ name: "Home", path: "/" }, { name: "Communities", path: "/communities" }] },
  ),
  page("/about", ABOUT.title, ABOUT.description, aboutHtml(), {
    crumbs: [{ name: "Home", path: "/" }, { name: "About", path: "/about" }],
  }),
  page(
    "/governance-model",
    GOVERNANCE_LEAD.title,
    GOVERNANCE_LEAD.description,
    `<h1>${escapeHtml(GOVERNANCE_LEAD.heading)}</h1>${paragraphsHtml(GOVERNANCE_LEAD.paragraphs)}${navHtml()}`,
    { crumbs: [{ name: "Home", path: "/" }, { name: "Governance model", path: "/governance-model" }] },
  ),
  page("/terms", TERMS_PAGE.title, TERMS_PAGE.description, legalHtml(TERMS_PAGE), {
    crumbs: [{ name: "Home", path: "/" }, { name: "Terms", path: "/terms" }],
  }),
  page("/privacy", PRIVACY_PAGE.title, PRIVACY_PAGE.description, legalHtml(PRIVACY_PAGE), {
    crumbs: [{ name: "Home", path: "/" }, { name: "Privacy", path: "/privacy" }],
  }),
  page(BLOG.path, BLOG.title, BLOG.description, blogIndexHtml(), {
    kind: "collection",
    crumbs: [{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }],
    items: ESSAYS.map((essay) => ({ name: essay.title, path: essay.path })),
  }),
  ...[...ESSAYS]
    .sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title))
    .map((essay) =>
      page(essay.path, `${essay.title} — NEOS`, essay.summary, essayHtml(essay), {
        kind: "article",
        published: essay.published,
        modified: essay.modified,
        headline: essay.title,
        crumbs: [
          { name: "Home", path: "/" },
          { name: "Blog", path: "/blog" },
          { name: essay.title, path: essay.path },
        ],
      }),
    ),
  page(NEWS.path, NEWS.title, NEWS.description, newsHtml(), {
    robots: "noindex, follow",
    indexable: false,
    crumbs: [{ name: "Home", path: "/" }, { name: "News", path: "/news" }],
  }),
  page(PRACTICES_INDEX.path, PRACTICES_INDEX.title, PRACTICES_INDEX.description, practicesIndexHtml(), {
    kind: "collection",
    crumbs: [{ name: "Home", path: "/" }, { name: "Practices", path: "/practices" }],
    items: PRACTICES.map((practice) => ({ name: practice.title, path: practice.path })),
  }),
  ...PRACTICES.map((practice) =>
    page(practice.path, practice.seoTitle, practice.description, practiceHtml(practice), {
      kind: "article",
      published: practice.published,
      headline: practice.h1,
      crumbs: [
        { name: "Home", path: "/" },
        { name: "Practices", path: "/practices" },
        { name: practice.title, path: practice.path },
      ],
    }),
  ),
];

export function outputFile(path: string): string {
  if (path === "/") return "index.html";
  return `${path.replace(/^\//, "")}/index.html`;
}

function upsertMeta(html: string, attr: "name" | "property", key: string, content: string): string {
  const tag = `<meta ${attr}="${key}" content="${content}" />`;
  const pattern = new RegExp(`<meta\\s+${attr}="${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"\\s+content="[^"]*"\\s*/?>`);
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace("</title>", `</title>\n    ${tag}`);
}

function upsertCanonical(html: string, href: string): string {
  const tag = `<link rel="canonical" href="${href}" />`;
  if (/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/.test(html)) {
    return html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/, tag);
  }
  return html.replace("</title>", `</title>\n    ${tag}`);
}

function upsertRss(html: string): string {
  const tag = `<link rel="alternate" type="application/rss+xml" title="NEOS" href="${SITE_ORIGIN}/feed.xml" />`;
  if (/<link\s+rel="alternate"\s+type="application\/rss\+xml"[^>]*>/.test(html)) {
    return html.replace(/<link\s+rel="alternate"\s+type="application\/rss\+xml"[^>]*>/, tag);
  }
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

function upsertJsonLd(html: string, json: string): string {
  const tag = `<script type="application/ld+json">${json}</script>`;
  if (/<script type="application\/ld\+json">[\s\S]*?<\/script>/.test(html)) {
    return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, tag);
  }
  return html.replace("</head>", `    ${tag}\n  </head>`);
}

/** Swap title, description, canonical, social tags, JSON-LD, and the crawlable block. */
export function renderShell(shell: string, publicPage: PublicPage): string {
  if (!shell.includes("<!--crawlable-->") || !shell.includes("<!--/crawlable-->")) {
    throw new Error("index.html is missing crawlable markers");
  }
  const title = escapeHtml(publicPage.title);
  const description = escapeHtml(publicPage.description);
  const canonical = escapeHtml(publicPage.canonical);
  let html = shell.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  html = upsertMeta(html, "name", "description", description);
  html = upsertMeta(html, "name", "author", "Escherbridge");
  html = upsertMeta(html, "name", "robots", publicPage.robots);
  html = upsertCanonical(html, canonical);
  html = upsertMeta(html, "property", "og:url", canonical);
  html = upsertMeta(html, "property", "og:title", title);
  html = upsertMeta(html, "property", "og:description", description);
  html = upsertMeta(html, "property", "og:type", publicPage.ogType);
  html = upsertMeta(html, "property", "og:image", OG_IMAGE);
  html = upsertMeta(html, "property", "og:image:width", "1200");
  html = upsertMeta(html, "property", "og:image:height", "630");
  html = upsertMeta(html, "property", "og:image:alt", "NEOS — Governance in Practice");
  html = upsertMeta(html, "name", "twitter:card", "summary_large_image");
  html = upsertMeta(html, "name", "twitter:title", title);
  html = upsertMeta(html, "name", "twitter:description", description);
  html = upsertMeta(html, "name", "twitter:image", OG_IMAGE);
  if (publicPage.ogType === "article" && publicPage.published) {
    html = upsertMeta(html, "property", "article:published_time", publicPage.published);
    html = upsertMeta(html, "property", "article:modified_time", publicPage.modified ?? publicPage.published);
  }
  html = upsertRss(html);
  html = upsertJsonLd(html, publicPage.jsonLd);
  html = html.replace(
    /<!--crawlable-->[\s\S]*?<!--\/crawlable-->/,
    `<!--crawlable-->${publicPage.html}<!--/crawlable-->`,
  );
  return html;
}

export function sitemapXml(pages: readonly PublicPage[] = PUBLIC_PAGES): string {
  const urls = pages
    .filter((publicPage) => publicPage.indexable)
    .map((publicPage) => {
      const lastmod = publicPage.modified ?? publicPage.published;
      const mod = lastmod ? `<lastmod>${lastmod}</lastmod>` : "";
      return `  <url><loc>${escapeHtml(publicPage.canonical)}</loc>${mod}</url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function rfc822(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toUTCString();
}

export function feedXml(pages: readonly PublicPage[] = PUBLIC_PAGES): string {
  const items = pages
    .filter((publicPage) => publicPage.ogType === "article" && publicPage.published)
    .sort((a, b) => (b.published ?? "").localeCompare(a.published ?? ""));
  const body = items
    .map(
      (publicPage) => `    <item>
      <title>${escapeHtml(publicPage.title)}</title>
      <link>${escapeHtml(publicPage.canonical)}</link>
      <guid>${escapeHtml(publicPage.canonical)}</guid>
      <pubDate>${rfc822(publicPage.published ?? "")}</pubDate>
      <description>${escapeHtml(publicPage.description)}</description>
      <author>${OPERATOR.email} (Escherbridge)</author>
    </item>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>NEOS</title>
    <link>${SITE_ORIGIN}/</link>
    <description>${escapeHtml(INTRO.description)}</description>
${body}
  </channel>
</rss>
`;
}

const ROBOT_DISALLOW = [
  "/dashboard",
  "/admin",
  "/agreements",
  "/proposals",
  "/discover",
  "/messaging",
  "/settings",
  "/members",
  "/ecosystems",
  "/quiz",
  "/quizzes",
  "/onboarding",
  "/safeguards",
  "/conflicts",
  "/emergency",
  "/exit",
  "/decisions",
  "/domains",
  "/teams",
  "/compliance",
  "/updates",
  "/welcome",
  "/orientation",
  "/ethos",
  "/profile",
  "/me",
] as const;

export const ROBOTS_TXT = `User-agent: *\nAllow: /\n${ROBOT_DISALLOW.map((path) => `Disallow: ${path}\n`).join("")}\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
