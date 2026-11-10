// Public copy for the introduction, About, and legal pages.
// The prerender step writes the same strings into the first HTML response.

export const SITE_ORIGIN = "https://neos.primusneo.com";

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
    "NEOS (New Earth Operating System) is a platform for communities to make shared decisions, manage agreements, and coordinate projects and resources.",
    "A visual workspace for learning, discovery, collaboration, and participatory governance.",
    "Discover people and projects you can contribute to. Explore a community before deciding to join.",
    ACT_SENTENCE,
    "There is no blockchain and no token. A browser sign-in can use a key generated on the device; the private key stays in that browser.",
  ],
} as const;

export const ABOUT = {
  title: "About NEOS — Governance in Practice",
  description:
    "NEOS is a platform for communities to make shared decisions, manage agreements, and coordinate projects and resources.",
  kicker: "About NEOS",
  heading: "The New Earth Operating System.",
  lead: "NEOS is a platform for communities to make shared decisions, manage agreements, and coordinate projects and resources. On this site, you can explore communities, join one that fits your interests, and take part in its work.",
  aside:
    "Communities here are also called ecosystems. Explore their purpose before joining, then complete any agreements and onboarding quizzes they require. Each community sets its own participation paths.",
} as const;

export const ABOUT_IS = [
  "A complete governance stack with 54 skills across 10 layers",
  "Open source software you can fork, adapt, and run yourself",
  "A platform for consent-based decision-making at any scale",
  "AI-augmented — assistants guide, but never decide",
  "Designed around dignity, sovereignty, and collective intelligence",
] as const;

export const ABOUT_IS_NOT = [
  "A blockchain, token, or crypto project",
  "A voting platform — consent is not majority rule",
  "A corporate hierarchy tool rebranded as flat",
  "A platform where AI makes decisions for humans",
  "A utopian experiment — it is practical governance infrastructure",
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
      "Built-in safeguards detect when power concentrates inappropriately: term limits on roles, mandatory rotation, transparency requirements, and whistleblower protections are encoded into the governance stack.",
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
      "Every decision, experiment, and conflict resolution becomes part of the community's institutional memory. Patterns are recognized, lessons are encoded, and governance wisdom compounds over time.",
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
    "NEOS is not a voting app. It is a complete governance operating system. Every layer is a concrete governance need; each skill is a reusable process that satisfies that need. The features in the app are the manual surface of this protocol stack.",
    ACT_SENTENCE,
    ECONOMIC_DETAIL,
  ],
} as const;

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

function paragraphsHtml(paragraphs: readonly string[]): string {
  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
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
    `<p>${escapeHtml(ABOUT.lead)}</p>`,
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

function page(path: string, title: string, description: string, html: string): PublicPage {
  const canonical = path === "/" ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${path}`;
  return { path, title, description, canonical, html };
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
