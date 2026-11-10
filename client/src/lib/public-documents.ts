// Public copy for the introduction, About, legal pages, and the two notes.
// The prerender step writes the same strings into the first HTML response.

import { ESSAYS, WRITING, type Essay, type Inline, type Paragraph } from "./writing";

export type { Essay, FollowLink, Inline, Paragraph } from "./writing";
export { ESSAYS, WRITING, plainParagraph } from "./writing";

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

export function organizationJsonLd(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "NEOS",
    url: `${SITE_ORIGIN}/`,
    parentOrganization: { "@type": "Organization", name: OPERATOR.name },
    sameAs: ESCHERBRIDGE_SITES.map((site) => site.href),
  });
}

const PUBLIC_NAV: readonly { href: string; label: string }[] = [
  { href: "/", label: "Home" },
  { href: "/communities", label: "Communities" },
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

export interface PublicPage {
  path: string;
  title: string;
  description: string;
  canonical: string;
  html: string;
}

function essayHtml(essay: Essay): string {
  const sources = essay.sources
    .map((source) => `<li><a href="${escapeHtml(source.href)}">${escapeHtml(source.label)}</a></li>`)
    .join("");
  return [
    `<h1>${escapeHtml(essay.title)}</h1>`,
    `<p>${escapeHtml(essay.date)}</p>`,
    paragraphsHtml(essay.paragraphs),
    `<h2>Sources</h2><ul>${sources}</ul>`,
    navHtml(),
  ].join("");
}

function writingIndexHtml(): string {
  const items = ESSAYS.map(
    (essay) =>
      `<article><h2><a href="${escapeHtml(essay.path)}">${escapeHtml(essay.title)}</a></h2><p>${escapeHtml(essay.summary)}</p></article>`,
  ).join("");
  return [`<h1>${escapeHtml(WRITING.heading)}</h1>`, items, navHtml()].join("");
}

function page(path: string, title: string, description: string, html: string): PublicPage {
  const canonical = path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
  return { path, title, description, canonical, html: `${html}${footerHtml()}` };
}

export const PUBLIC_PAGES: readonly PublicPage[] = [
  page("/", INTRO.title, INTRO.description, `<h1>${escapeHtml(INTRO.heading)}</h1>${paragraphsHtml(INTRO.paragraphs)}${navHtml()}`),
  page(
    "/communities",
    INTRO.title,
    INTRO.description,
    `<h1>${escapeHtml(INTRO.heading)}</h1>${paragraphsHtml(INTRO.paragraphs)}${navHtml()}`,
  ),
  page("/about", ABOUT.title, ABOUT.description, aboutHtml()),
  page(
    "/governance-model",
    GOVERNANCE_LEAD.title,
    GOVERNANCE_LEAD.description,
    `<h1>${escapeHtml(GOVERNANCE_LEAD.heading)}</h1>${paragraphsHtml(GOVERNANCE_LEAD.paragraphs)}${navHtml()}`,
  ),
  page("/terms", TERMS_PAGE.title, TERMS_PAGE.description, legalHtml(TERMS_PAGE)),
  page("/privacy", PRIVACY_PAGE.title, PRIVACY_PAGE.description, legalHtml(PRIVACY_PAGE)),
  page(WRITING.path, WRITING.title, WRITING.description, writingIndexHtml()),
  ...ESSAYS.map((essay) => page(essay.path, `${essay.title} — NEOS`, essay.summary, essayHtml(essay))),
];

export function outputFile(path: string): string {
  if (path === "/") return "index.html";
  return `${path.replace(/^\//, "")}/index.html`;
}

/** Swap title, description, canonical, and the crawlable block inside a built index.html shell. */
export function renderShell(shell: string, publicPage: PublicPage): string {
  if (!shell.includes("<!--crawlable-->") || !shell.includes("<!--/crawlable-->")) {
    throw new Error("index.html is missing crawlable markers");
  }
  const title = escapeHtml(publicPage.title);
  const description = escapeHtml(publicPage.description);
  const canonical = escapeHtml(publicPage.canonical);
  let html = shell.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);
  const descriptionTag = `<meta name="description" content="${description}" />`;
  if (/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/.test(html)) {
    html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/, descriptionTag);
  } else {
    html = html.replace("</title>", `</title>\n    ${descriptionTag}`);
  }
  const canonicalTag = `<link rel="canonical" href="${canonical}" />`;
  if (/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/.test(html)) {
    html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/, canonicalTag);
  } else {
    html = html.replace("</title>", `</title>\n    ${canonicalTag}`);
  }
  html = html.replace(
    /<!--crawlable-->[\s\S]*?<!--\/crawlable-->/,
    `<!--crawlable-->${publicPage.html}<!--/crawlable-->`,
  );
  return html;
}

export function sitemapXml(pages: readonly PublicPage[] = PUBLIC_PAGES): string {
  const urls = pages
    .map((publicPage) => `  <url><loc>${escapeHtml(publicPage.canonical)}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const ROBOTS_TXT = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
