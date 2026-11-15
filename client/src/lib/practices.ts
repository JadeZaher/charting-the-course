// Practices the reviewed research drafts name. The sentences below are those drafts.
// The quoted ACT sentence is the live site sentence and is not improved.
// No deployment, certificate, wallet, or token is claimed.

export interface PracticeLink {
  text: string;
  href: string;
  strong?: boolean;
}

export type PracticeInline = string | { em: string } | PracticeLink;

/** A bold lead, then the rest of the sentence. The space between them lives in `rest`. */
export interface PracticeLead {
  strongLead: readonly PracticeInline[];
  rest?: readonly PracticeInline[];
}

export type PracticeRun = string | readonly PracticeInline[] | PracticeLead;

export type PracticeBlock =
  | { kind: "p"; body: PracticeRun }
  | { kind: "h2"; text: string }
  | { kind: "ul"; items: readonly PracticeRun[] }
  | { kind: "sources" };

export interface PracticeSource {
  name: string;
  urls: readonly string[];
  datePublished?: string;
  body: PracticeRun;
}

export interface Practice {
  slug: string;
  path: string;
  /** Short name for the breadcrumb and the index item list. */
  title: string;
  eyebrow: string;
  seoTitle: string;
  description: string;
  h1: string;
  published: string;
  dateLabel: string;
  blocks: readonly PracticeBlock[];
  sources: readonly PracticeSource[];
}

/** Live homepage sentence. Do not improve it. */
export const LIVE_ACT_SENTENCE =
  "ACT means Advice, Consent, and Test: advice from the people affected, consent as a check for a reasoned objection, and a test of the proposal in practice. It is not a popularity vote and not a share of ownership.";

const PRIMUS = "https://primusneo.com";
const GOVERNANCE = "/governance-model";
const BLOG_ACT = "/blog/act-is-not-a-vote";
const BLOG_KEY = "/blog/the-key-stays-in-the-browser";
const ACT_PATH = "/practices/act-is-not-a-vote";
const AGREEMENTS_PATH = "/practices/agreements-decision-records";
const KEYS_PATH = "/practices/keys-in-the-browser";
const CONSENT_PATH = "/practices/consent-is-not-consensus";
const WEBAUTHN_PATH = "/practices/webauthn-and-passkeys";
const CIRCLES_PATH = "/practices/circles-and-domains";
const OBJECTION_PATH = "/practices/well-founded-objection";
const SYNCED_PATH = "/practices/synced-vs-device-bound-passkeys";
const ROLES_PATH = "/practices/roles-that-cannot-be-delegated";
const CTAP_PATH = "/practices/fido2-ctap";
const LEVELS_PATH = "/practices/webauthn-level-versions";

const AUTHOR = "Author: Escherbridge. Last reviewed: 2026-11-10, America/Denver.";

function link(text: string, href: string): PracticeLink {
  return { text, href };
}

function source(name: string, url: string, before: string, datePublished?: string): PracticeSource {
  return {
    name,
    urls: [url],
    ...(datePublished ? { datePublished } : {}),
    body: [before, link(url, url)],
  };
}

export const PRACTICES_INDEX = {
  path: "/practices",
  title: "Practices | NEOS",
  description:
    "Plain-language guides to community practices in NEOS: Advice, Consent, and Test (ACT), findable agreements, clear circles, and browser-owned sign-ins.",
  eyebrow: "Practices · Shared Stewardship",
  heading: "How healthy communities share power without endless meetings.",
  published: "2026-11-10",
  blocks: [
    {
      kind: "p",
      body: "Running a housing co-op, neighborhood land trust, or creative studio means making dozens of small choices together every month. These guides unpack the everyday habits NEOS is built around: using Advice, Consent, and Test instead of exhausting straw polls, keeping community agreements where future members can actually find them, and signing in with keys that stay under your own roof rather than locked inside someone else's account table.",
    },
    {
      kind: "p",
      body: [
        "Every guide cites its public primary sources openly and explains where NEOS leaves off — and if you want to see how the whole toolset fits together inside the app, start with ",
        link("How NEOS governs", GOVERNANCE),
        ".",
      ],
    },
    { kind: "h2", text: "Core community practices" },
    {
      kind: "ul",
      items: [
        {
          strongLead: [link("ACT is not a vote", ACT_PATH)],
          rest: [
            " — why gathering quick advice, checking for real risks, and running a small trial keeps groups moving better than a 60–40 headcount.",
          ],
        },
        {
          strongLead: [link("Agreements and decision records", AGREEMENTS_PATH)],
          rest: [
            " — why decisions buried in group chat become rumours, and what makes an agreement findable six months later.",
          ],
        },
        {
          strongLead: [link("Keys in the browser", KEYS_PATH)],
          rest: [
            " — signing in with a private key kept on your own device so nobody owns your community identity but you, alongside classic password login.",
          ],
        },
      ],
    },
    { kind: "h2", text: "Field notes on consent, circles, and sign-in keys" },
    {
      kind: "p",
      body: "These eight companion notes explain the broader cooperative governance ideas and open browser standards referenced across community workshops — what Sociocracy calls consent and clear circles, and how modern passkey standards actually work behind the scenes.",
    },
    {
      kind: "ul",
      items: [
        {
          strongLead: [link("Consent is not consensus", CONSENT_PATH)],
          rest: [
            " — why consent asks whether anyone spots an unaffordable risk, rather than waiting for every person in the room to agree.",
          ],
        },
        {
          strongLead: [link("WebAuthn and passkeys", WEBAUTHN_PATH)],
          rest: [
            " — how browser-native sign-in keys replace fragile shared passwords using open W3C and FIDO standards.",
          ],
        },
        {
          strongLead: [link("Circles, policy, and domains", CIRCLES_PATH)],
          rest: [
            " — how a working circle sets shared boundaries once, then trusts stewards with clear day-to-day autonomy.",
          ],
        },
        {
          strongLead: [link("What is a well-founded objection", OBJECTION_PATH)],
          rest: [
            " — telling the difference between a helpful preference and a real safety or sustainability risk the group cannot afford.",
          ],
        },
        {
          strongLead: [link("Synced and device-bound passkeys", SYNCED_PATH)],
          rest: [
            " — knowing whether your sign-in key follows you across personal devices or stays locked to one laptop or phone.",
          ],
        },
        {
          strongLead: [link("Roles that cannot be delegated", ROLES_PATH)],
          rest: [
            " — why groups choose key representatives together rather than letting one person silently appoint them.",
          ],
        },
        {
          strongLead: [link("CTAP and FIDO2", CTAP_PATH)],
          rest: [
            " — how a laptop browser talks cleanly to a physical security key or phone when signing in.",
          ],
        },
        {
          strongLead: [link("WebAuthn Level 2 and Level 3", LEVELS_PATH)],
          rest: [
            " — keeping track of the two published W3C browser sign-in editions as standards evolve.",
          ],
        },
      ],
    },
    { kind: "h2", text: "Where NEOS fits" },
    {
      kind: "p",
      body: [
        "NEOS is a calm workspace for community agreements and participatory decisions, part of the ",
        link("PrimusNeo", PRIMUS),
        " family of open tools (with no blockchain and no token). Read our plain-language essays ",
        link("ACT is not a vote", BLOG_ACT),
        " and ",
        link("The key stays in the browser", BLOG_KEY),
        ", browse ",
        link("About", "/about"),
        ", ",
        link("How NEOS governs", GOVERNANCE),
        ", and our ",
        link("Terms", "/terms"),
        ", or follow dated updates on ",
        link("News", "/news"),
        ". Software status notes such as 54 skills across 10 layers and v0.1.0 reflect what is currently published, not a finished-product claim.",
      ],
    },
    { kind: "p", body: AUTHOR },
  ] as readonly PracticeBlock[],
} as const;

export const PRACTICES: readonly Practice[] = [
  {
    slug: "act-is-not-a-vote",
    path: ACT_PATH,
    title: "ACT is not a vote",
    eyebrow: "ACT is not a vote",
    seoTitle: "ACT is not a vote — Practices | NEOS",
    description:
      "ACT is Advice, Consent, and Test on the live NEOS site, not a popularity vote or a share of ownership. Sociocracy is related practice, not a certificate.",
    h1: "A tally can be a mood that learned how to count. ACT is slower on purpose.",
    published: "2026-11-10",
    dateLabel: "10 November 2026",
    blocks: [
      {
        kind: "p",
        body: "Raise hands at the end of a long community meeting, count a 60–40 split, and half the group goes home wondering why nobody listened before the vote was called. In NEOS, Advice, Consent, and Test (ACT) replaces quick show-of-hands tallies with a human rhythm communities can actually live with afterward.",
      },
      {
        kind: "p",
        body: `In our workspace, “${LIVE_ACT_SENTENCE}” Instead of forcing everyone to love an option or split into winners and losers, the goal is a shared decision a group can find later, test safely, and adjust together.`,
      },
      {
        kind: "p",
        body: "Sociocracy’s public consent method shares strong kinship with this habit. The Sociocracy Group’s public “4 principles” page describes consent as “the way of decision-making in which the arguments for taking a decision are central, which is expressed by the fact that none of the members has a paramount and well-founded objection against that decision.” They sum it up warmly: “Consent is not consensus — it does not mean that everyone agrees. It means that nobody is aware of a risk that we cannot afford to take.”",
      },
      {
        kind: "p",
        body: "That same Sociocracy Group overview notes how a circle “decides about policy and delegates the execution to the members,” while electing key roles such as a circle representative stays with the circle by consent rather than being handed off. Those descriptions belong to sociocracy as a method; NEOS draws inspiration from consent-based stewardship, and NEOS is not TSG-certified or SCM-certified.",
      },
      {
        kind: "p",
        body: [
          "As our essay ",
          link("ACT is not a vote", BLOG_ACT),
          " warns, a tally can easily be collected in a room that never consulted the neighbors who live with the rule—and treating silence as a yes, or calling a narrow majority a mandate, turns a cooperative meeting right back into a popularity vote.",
        ],
      },
      { kind: "h2", text: "Where quick tallies break trust" },
      {
        kind: "ul",
        items: [
          { strongLead: ["Confusing ACT with a popularity vote, majority win, or ownership share."] },
          { strongLead: ["Assuming quiet members agree when nobody actually checked in."] },
          {
            strongLead: ["Overstating what a tool can certify:"],
            rest: [
              " NEOS supports consent-style workflows and does not claim TSG/SCM certification, nor does NEOS consent govern external legal privacy agreements.",
            ],
          },
        ],
      },
      { kind: "h2", text: "How Advice, Consent, and Test work in practice" },
      {
        kind: "ul",
        items: [
          { strongLead: ["Ask the people who live with the rule first (Advice)."] },
          { strongLead: ["Listen for concrete risks to safety, budget, or trust rather than personal preference (Consent)."] },
          {
            strongLead: ["Run a bounded trial and write down how it went (Test)."],
            rest: [
              " A small real-world trial teaches far more than an hour of hypothetical debate. See ",
              link("How NEOS governs", GOVERNANCE),
              " for how the app organizes these steps.",
            ],
          },
        ],
      },
      { kind: "h2", text: "A situation like this" },
      {
        kind: "p",
        body: "For example, a co-op hears a resident's concern about shared laundry noise conflicting with quiet-hours rules, trims back the proposed repair window so everyone can sleep, and writes down a 30-day check-in rather than pushing through a tense 60–40 vote. It takes ten extra minutes now and saves weeks of friction later.",
      },
      { kind: "h2", text: "Scope and boundaries" },
      {
        kind: "p",
        body: [
          "NEOS is a shared workspace for community agreements and decisions, part of ",
          link("PrimusNeo", PRIMUS),
          " and offered as its own product. There is no blockchain and no token, and the workspace does not issue shares or investments. Our ",
          link("About", "/about"),
          " page and ",
          link("Terms", "/terms"),
          " (updated 10 November 2026) note that assistants may guide without deciding, and current v0.1.0 / 54-skills / 10-layers references reflect published workspace status rather than a finished-product guarantee.",
        ],
      },
      { kind: "h2", text: "Sources" },
      { kind: "sources" },
      { kind: "h2", text: "Also in this section" },
      {
        kind: "ul",
        items: [
          {
            strongLead: [link("Agreements and decision records", AGREEMENTS_PATH)],
            rest: [" — an agreement that cannot be found later is not in force. It is a rumour."],
          },
          {
            strongLead: [link("Keys in the browser", KEYS_PATH)],
            rest: [" — the private key stays with the authenticator. The workspace keeps a public fact, not a spare copy of you."],
          },
        ],
      },
      {
        kind: "p",
        body: [
          "Related: ",
          link("ACT is not a vote", BLOG_ACT),
          ", ",
          link("The key stays in the browser", BLOG_KEY),
          ", ",
          link("About", "/about"),
          ", ",
          link("How NEOS governs", GOVERNANCE),
          ", ",
          link("PrimusNeo, Governance", `${PRIMUS}/industries/governance`),
          ".",
        ],
      },
      {
        kind: "p",
        body: [
          "The useful next step is to read ",
          link("How NEOS governs", GOVERNANCE),
          " and the ",
          link("Terms", "/terms"),
          ". A tally run under a friendlier name is still a tally.",
        ],
      },
      { kind: "p", body: AUTHOR },
    ],
    sources: [
      source(
        "The Sociocracy Group, “4 principles”",
        "https://thesociocracygroup.com/4-principles/",
        "The Sociocracy Group, “4 principles” (consent is not consensus; paramount, well-founded objection). Opened 2026-11-10; no publication date stated on the page. ",
      ),
      source(
        "NEOS, “ACT is not a vote”",
        "https://neos.primusneo.com/blog/act-is-not-a-vote",
        "NEOS, “ACT is not a vote,” 9 November 2026 (sibling essay). ",
        "2026-11-09",
      ),
      source(
        "NEOS homepage",
        "https://neos.primusneo.com/",
        "NEOS homepage (ACT definition; no blockchain and no token). ",
      ),
      source(
        "NEOS About",
        "https://neos.primusneo.com/about",
        "NEOS About (not a voting platform; consent is not majority rule; assistants do not decide). ",
      ),
      source(
        "NEOS, How NEOS governs",
        "https://neos.primusneo.com/governance-model",
        "NEOS, How NEOS governs. ",
      ),
      source(
        "NEOS Terms of use",
        "https://neos.primusneo.com/terms",
        "NEOS Terms of use, updated 10 November 2026 (ACT; no token, investment, or share). ",
      ),
      source(
        "NEOS /practices",
        "https://neos.primusneo.com/practices",
        "NEOS /practices (the section index). ",
      ),
      source(
        "PrimusNeo, Industries: Governance",
        "https://primusneo.com/industries/governance",
        "PrimusNeo, Industries: Governance (sister page; not a case study). ",
      ),
    ],
  },
  {
    slug: "agreements-decision-records",
    path: AGREEMENTS_PATH,
    title: "Agreements and decision records",
    eyebrow: "Agreements and decision records",
    seoTitle: "Agreements and records — Practices | NEOS",
    description:
      "Agreements and decision records should be contemporaneous and findable by a later member. On NEOS they are the operating record, not equity or legal title.",
    h1: "An agreement that cannot be found later is not in force. It is a rumour.",
    published: "2026-11-10",
    dateLabel: "10 November 2026",
    blocks: [
      {
        kind: "p",
        body: "Every collective eventually hits the same awkward moment: someone asks “Wait, didn't we agree to stop charging late tool fees last spring?” and everyone starts digging through old group chats while nobody agrees on what was actually decided. Keeping clear agreements means writing down what a group decided, who took part, and when you will revisit it — so newcomers six months later don't have to rely on folklore.",
      },
      {
        kind: "p",
        body: "Records specialists put this simply. HMRC's records policy (published 19 May 2026, quoting ISO 15489-1:2016) defines records as evidence of “what happened, what was decided, and how to do things,” built to stay “accurate, up-to-date and accessible when it is needed.” UK private-office guidance (29 December 2023) adds a helpful habit for informal groups too: record the date, who took part, and what was decided even when choices happen online or on calls.",
      },
      {
        kind: "p",
        body: "Formal company law illustrates why steady minutes matter even outside corporations. Under UK Companies Act rules, authenticated directors' minutes “are evidence… of the proceedings at the meeting” and must be preserved alongside member resolutions for at least ten years. In a cooperative association, the ICA Statement on the Cooperative Identity (1995, Principle 2) ties visible records directly to fairness: cooperatives are “controlled by their members, who actively participate in setting their policies and making decisions,” with stewards “accountable to the membership.”",
      },
      {
        kind: "p",
        body: "On NEOS, agreements work as living documents with clear scopes, expiration dates, and review dates — turning consent into commitments anyone in the group can check later.",
      },
      { kind: "h2", text: "Where scattered notes let groups down" },
      {
        kind: "ul",
        items: [
          { strongLead: ["Undated chat decisions that newcomers cannot verify or teach."] },
          { strongLead: ["Confusing an internal group record with ownership shares, payout rights, or legal title."] },
          { strongLead: ["Forgetting to set a review date so temporary fixes harden into forgotten rules."] },
        ],
      },
      { kind: "h2", text: "Practical habits for findable group agreements" },
      {
        kind: "ul",
        items: [
          { strongLead: ["Include domain, date, and review cycle"], rest: [" whenever an agreement goes into effect."] },
          {
            strongLead: ["Keep the advice, any objections, and the trial outcome right next to the agreement."],
            rest: [" See ", link("ACT is not a vote", ACT_PATH), " and ", link("How NEOS governs", GOVERNANCE), "."],
          },
          { strongLead: ["Keep plain boundaries visible"], rest: [" on budgets and roles: records coordinate shared stewardship without issuing equity or payment claims."] },
        ],
      },
      { kind: "h2", text: "A situation like this" },
      {
        kind: "p",
        body: "For example, when a new steward rotates onto a land-trust committee six months later, they can pull up the exact role agreement, see what risk shaped its guardrails during consent, and check the upcoming review date — instead of calling an emergency meeting to re-debate history.",
      },
      { kind: "h2", text: "Scope and boundaries" },
      {
        kind: "p",
        body: [
          "These public standards serve as useful reference points: NEOS itself is not a UK company, public authority, or ICA-registered cooperative, and the ten-year companies rule is UK statutory context rather than a universal workspace retention policy. In our ",
          link("Terms", "/terms"),
          ", records you submit form the community's operating record and are not equity, payment rights, or legal title; economic coordination is a recorded practice rather than a money rail, token, or funding pool. Part of ",
          link("PrimusNeo", PRIMUS),
          " — see also ",
          link("ArdaNova, A record is not a right", "https://ardanova.com/notes/a-record-is-not-a-right"),
          ".",
        ],
      },
      { kind: "h2", text: "Sources" },
      { kind: "sources" },
      { kind: "h2", text: "Also in this section" },
      {
        kind: "ul",
        items: [
          {
            strongLead: [link("ACT is not a vote", ACT_PATH)],
            rest: [" — a tally can be a mood that learned how to count. ACT is slower on purpose."],
          },
          {
            strongLead: [link("Keys in the browser", KEYS_PATH)],
            rest: [" — the private key stays with the authenticator."],
          },
          {
            strongLead: [link("Roles that cannot be delegated", ROLES_PATH)],
            rest: [" — the election of an important role, particularly the representative, cannot be delegated."],
          },
        ],
      },
      {
        kind: "p",
        body: [
          "Related: ",
          link("How NEOS governs", GOVERNANCE),
          ", ",
          link("About", "/about"),
          ", ",
          link("The key stays in the browser", BLOG_KEY),
          ", ",
          link("PrimusNeo, Governance", `${PRIMUS}/industries/governance`),
          ".",
        ],
      },
      {
        kind: "p",
        body: [
          "The useful next step is to read ",
          link("How NEOS governs", GOVERNANCE),
          " and the ",
          link("Terms", "/terms"),
          ". A decision that cannot be found later is hard to teach or check.",
        ],
      },
      { kind: "p", body: AUTHOR },
    ],
    sources: [
      source(
        "HMRC Records and Information Collection Policy",
        "https://www.gov.uk/government/publications/records-and-information-created-by-hmrc/hmrc-records-and-information-collection-policy",
        "HMRC Records and Information Collection Policy, 19 May 2026 (ISO 15489-1:2016; what was decided; accessible when needed). ",
        "2026-05-19",
      ),
      source(
        "Private Office information and records guidance",
        "https://www.gov.uk/government/publications/guidance-management-of-private-office-information-and-records/guidance-for-the-management-of-private-office-information-and-records-html",
        "Private Office information and records guidance, 29 December 2023. ",
        "2023-12-29",
      ),
      source(
        "Companies Act 2006, s.248",
        "https://www.legislation.gov.uk/ukpga/2006/46/section/248",
        "Companies Act 2006, s.248 (minutes recorded; at least ten years). ",
        "2006",
      ),
      source(
        "Companies Act 2006, s.249",
        "https://www.legislation.gov.uk/ukpga/2006/46/section/249",
        "Companies Act 2006, s.249 (minutes as evidence of proceedings). ",
        "2006",
      ),
      source(
        "Companies Act 2006, s.355",
        "https://www.legislation.gov.uk/ukpga/2006/46/section/355",
        "Companies Act 2006, s.355 (records of resolutions and meetings; at least ten years). ",
        "2006",
      ),
      source(
        "ICA Statement on the Cooperative Identity, Principle 2",
        "https://ica.coop/en/cooperatives/cooperative-identity",
        "ICA Statement on the Cooperative Identity, Principle 2. ",
        "1995",
      ),
      {
        name: "NEOS About and Terms",
        urls: ["https://neos.primusneo.com/about", "https://neos.primusneo.com/terms"],
        body: [
          "NEOS About and Terms (agreements as living documents; operating record is not title; no token or funding pool). ",
          link("https://neos.primusneo.com/about", "https://neos.primusneo.com/about"),
          " and ",
          link("https://neos.primusneo.com/terms", "https://neos.primusneo.com/terms"),
        ],
      },
      source(
        "NEOS, “ACT is not a vote”",
        "https://neos.primusneo.com/blog/act-is-not-a-vote",
        "NEOS, “ACT is not a vote,” 9 November 2026. ",
        "2026-11-09",
      ),
    ],
  },
  {
    slug: "keys-in-the-browser",
    path: KEYS_PATH,
    title: "Keys in the browser",
    eyebrow: "Keys that stay in the browser",
    seoTitle: "Keys in the browser — Practices | NEOS",
    description:
      "WebAuthn-style credentials keep the private key on the authenticator and the public key with the relying party. No wallet, token, or server copy to restore.",
    h1: "The private key stays with the authenticator. The workspace keeps a public fact, not a spare copy of you.",
    published: "2026-11-10",
    dateLabel: "10 November 2026",
    blocks: [
      {
        kind: "p",
        body: "Most accounts online are really just a temporary loan of a row in someone else's database. On NEOS, you can sign in with a standard username and password — or choose a browser key generated directly on your device so your private key stays with you rather than living on a central server.",
      },
      {
        kind: "p",
        body: [
          "Open browser standards help explain why that approach matters. Under the W3C Recommendation ",
          { em: "Web Authentication (WebAuthn) Level 2" },
          " (8 April 2021), a private key credential stays inside your authenticator — either built into your laptop or phone (a platform authenticator) or carried on a USB, BLE, or NFC device (a roaming authenticator) — “expected to never be exposed to any other party, not even to the owner,” while the server holds only the public key and waits for your consent before signing anything.",
        ],
      },
      {
        kind: "p",
        body: [
          "CISA's October 2022 guidance, ",
          { em: "Implementing Phishing-Resistant MFA" },
          ", notes that phishing-resistant WebAuthn keys hold up much better against look-alike login traps than typed codes alone because keys are locked to the exact site you created them on.",
        ],
      },
      {
        kind: "p",
        body: [
          "What matters for community members is simple: this key is for signing into conversations and consent decisions — it is not a wallet, not a token, and not connected to any blockchain. And as our ",
          link("The key stays in the browser", BLOG_KEY),
          " essay explains, there is a practical tradeoff: if you lose your browser profile, NEOS keeps no secret server copy to restore, so password login remains available whenever your group prefers ordinary credentials.",
        ],
      },
      { kind: "h2", text: "What to keep clear with your group" },
      {
        kind: "ul",
        items: [
          { strongLead: ["Browser keys stay local:"], rest: [" the workspace keeps only your public key, never a spare copy of your private secret."] },
          {
            strongLead: ["No blockchain and no token:"],
            rest: [" your key signs membership decisions without buying or transferring coins."],
          },
          {
            strongLead: ["Password sign-in is still offered:"],
            rest: [" every member can pick whichever sign-in option fits their comfort and backup habits."],
          },
        ],
      },
      { kind: "h2", text: "A situation like this" },
      {
        kind: "p",
        body: "For example, if a community coordinator replaces an old laptop and forgot to use a password backup alongside their browser key, NEOS cannot pull a spare private key out of a server vault. The key was never a wallet, and the server never held a copy — so the member signs back in using password credentials or starts fresh.",
      },
      { kind: "h2", text: "Scope and boundaries" },
      {
        kind: "p",
        body: [
          "Citing W3C WebAuthn Level 2 and CISA here explains the general model behind browser-held keys; this page does not claim that NEOS implements WebAuthn Level 2, FIDO2, or holds formal W3C or CISA assessment, and uses its own browser-key option alongside username and password login as stated in our ",
          link("Terms", "/terms"),
          ". Current v0.1.0 and 54-skills / 10-layers notices reflect published build status rather than security certification. Related reading: ",
          link("ACT is not a vote", ACT_PATH),
          ".",
        ],
      },
      { kind: "h2", text: "Sources" },
      { kind: "sources" },
      { kind: "h2", text: "Also in this section" },
      {
        kind: "ul",
        items: [
          {
            strongLead: [link("ACT is not a vote", ACT_PATH)],
            rest: [" — a tally can be a mood that learned how to count. ACT is slower on purpose."],
          },
          {
            strongLead: [link("Agreements and decision records", AGREEMENTS_PATH)],
            rest: [" — an agreement that cannot be found later is not in force. It is a rumour."],
          },
          {
            strongLead: [link("CTAP and FIDO2", CTAP_PATH)],
            rest: [" — the client-to-authenticator protocol, a Proposed Standard of 21 June 2022."],
          },
          {
            strongLead: [link("WebAuthn Level 2 and Level 3", LEVELS_PATH)],
            rest: [" — Level 2, 8 April 2021, and Level 3, 25 August 2026, are both Recommendations."],
          },
        ],
      },
      {
        kind: "p",
        body: [
          "Related: ",
          link("The key stays in the browser", BLOG_KEY),
          ", ",
          link("ACT is not a vote", BLOG_ACT),
          ", ",
          link("About", "/about"),
          ", ",
          link("Terms", "/terms"),
          ", ",
          link("How NEOS governs", GOVERNANCE),
          ", ",
          link("PrimusNeo", PRIMUS),
          ".",
        ],
      },
      {
        kind: "p",
        body: [
          "The useful next step is to read the ",
          link("Terms", "/terms"),
          " and ",
          link("About", "/about"),
          ". The Terms already say that if you lose the browser key, this workspace has no copy to restore.",
        ],
      },
      { kind: "p", body: AUTHOR },
    ],
    sources: [
      {
        name: "W3C, Web Authentication Level 2",
        urls: ["https://www.w3.org/TR/webauthn-2/"],
        datePublished: "2021-04-08",
        body: [
          "W3C, ",
          { em: "Web Authentication: An API for accessing Public Key Credentials — Level 2," },
          " Recommendation, 8 April 2021. ",
          link("https://www.w3.org/TR/webauthn-2/", "https://www.w3.org/TR/webauthn-2/"),
        ],
      },
      source(
        "W3C Recommendation, 8 April 2021",
        "https://www.w3.org/TR/2021/REC-webauthn-2-20210408/",
        "Dated W3C Recommendation. ",
        "2021-04-08",
      ),
      {
        name: "CISA, Implementing Phishing-Resistant MFA",
        urls: ["https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf"],
        datePublished: "2022-10",
        body: [
          "Cybersecurity and Infrastructure Security Agency, ",
          { em: "Implementing Phishing-Resistant MFA," },
          " October 2022. ",
          link(
            "https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf",
            "https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf",
          ),
        ],
      },
      source(
        "NEOS, “The key stays in the browser”",
        "https://neos.primusneo.com/blog/the-key-stays-in-the-browser",
        "NEOS, “The key stays in the browser,” 9 November 2026 (sibling essay). ",
        "2026-11-09",
      ),
      source(
        "NEOS homepage",
        "https://neos.primusneo.com/",
        "NEOS homepage (no blockchain and no token; key generated on the device). ",
      ),
      source(
        "NEOS Terms",
        "https://neos.primusneo.com/terms",
        "NEOS Terms, updated 10 November 2026 (private key stays in the browser; no server copy to restore; password sign-in still offered). ",
      ),
      source(
        "NEOS About",
        "https://neos.primusneo.com/about",
        "NEOS About (not a blockchain, token, or crypto project). ",
      ),
      source(
        "NEOS, “ACT is not a vote”",
        "https://neos.primusneo.com/blog/act-is-not-a-vote",
        "NEOS, “ACT is not a vote.” ",
      ),
    ],
  },
  {
    slug: "consent-is-not-consensus",
    path: CONSENT_PATH,
    title: "Consent is not consensus",
    eyebrow: "Consent is not consensus",
    seoTitle: "Consent is not consensus — Practices | NEOS",
    description:
      "The Sociocracy Group states consent as the absence of a paramount, well-founded objection, not that everyone agrees. This guide covers that public definition.",
    h1: "Consent is not consensus",
    published: "2026-11-10",
    dateLabel: "10 November 2026",
    blocks: [
      {
        kind: "p",
        body: "Nothing slows down a creative collective faster than believing everyone around the table has to be thrilled before anything can move forward. In Sociocracy, consent means something much lighter and more realistic: nobody spots a paramount, well-founded objection — a concrete risk the community cannot afford to take.",
      },
      {
        kind: "p",
        body: "The Sociocracy Group puts it plainly on its “4 principles” page: “The consent principle is the way of decision-making in which the arguments for taking a decision are central, which is expressed by the fact that none of the members has a paramount and well-founded objection against that decision.” And right beside it: “Consent is not consensus — it does not mean that everyone agrees. It means that nobody is aware of a risk that we cannot afford to take.”",
      },
      { kind: "h2", text: "What makes consent easier for real groups" },
      {
        kind: "p",
        body: [
          "Notice why this opens doors for tired organizers: you can think option B is slightly prettier than option A and still give consent to option A because option A solves the problem safely. Where preference ends and risk begins is explored further in ",
          link("What is a well-founded objection", OBJECTION_PATH),
          ", while ",
          link("Circles, policy, and domains", CIRCLES_PATH),
          " shows how groups separate big shared policy from everyday stewardship.",
        ],
      },
      {
        kind: "p",
        body: [
          "Inside NEOS, ",
          link("ACT is not a vote", BLOG_ACT),
          " follows a kindred spirit: Advice, Consent, and Test — not a popularity vote and not a share of ownership — and as that essay warns, silence is not consent and a 60-40 headcount is not a mandate. Explore how those steps look inside the product on ",
          link("How NEOS governs", GOVERNANCE),
          ".",
        ],
      },
      { kind: "h2", text: "A situation like this" },
      {
        kind: "p",
        body: "For example, a community garden facilitator asks everyone if they “agree on Tuesday's compost plan,” mistaking quiet shrugs for unanimous enthusiasm. Asking instead “Does anyone see a risk we cannot afford if we test Tuesday morning for two weeks?” invites real fixes without demanding universal applause.",
      },
      { kind: "h2", text: "Scope and boundaries" },
      {
        kind: "p",
        body: [
          "NEOS is not a certified implementation of The Sociocracy Group's method. This guide does not claim TSG endorsement, training badges, or double-link structure. NEOS is part of ",
          link("PrimusNeo", PRIMUS),
          " and lists v0.1.0 only as its current published operator version. There is no blockchain and no token.",
        ],
      },
      { kind: "h2", text: "Sources" },
      { kind: "sources" },
      { kind: "h2", text: "Also in this section" },
      {
        kind: "ul",
        items: [
          {
            strongLead: [link("What is a well-founded objection", OBJECTION_PATH)],
            rest: [" — the operational test: a risk the group cannot afford, not a preference that was not met."],
          },
          {
            strongLead: [link("Circles, policy, and domains", CIRCLES_PATH)],
            rest: [" — the circle decides policy and delegates the work."],
          },
          {
            strongLead: [link("Keys in the browser", KEYS_PATH)],
            rest: [" — a credential that is not supposed to live on someone else's server."],
          },
          {
            strongLead: [link("Roles that cannot be delegated", ROLES_PATH)],
            rest: [" — the election of an important role, particularly the representative, cannot be delegated."],
          },
        ],
      },
      {
        kind: "p",
        body: [
          "NEOS is part of ",
          link("PrimusNeo, the lab whose stack this product belongs to", PRIMUS),
          ". There is no blockchain and no token. Operator software describes itself as version 0.1.0; that is a published fact, not a maturity badge.",
        ],
      },
      {
        kind: "p",
        body: [
          "The useful next step is to read TSG's four principles, or ",
          link("ACT is not a vote", BLOG_ACT),
          ". If something on this page is wrong, ",
          link("write to us", "/about"),
          ".",
        ],
      },
      { kind: "p", body: AUTHOR },
    ],
    sources: [
      source(
        "The Sociocracy Group, “4 principles”",
        "https://thesociocracygroup.com/4-principles/",
        "The Sociocracy Group, “4 principles.” ",
      ),
      {
        name: "House sibling: ACT is not a vote",
        urls: ["https://neos.primusneo.com/blog/act-is-not-a-vote"],
        body: [
          "House sibling, not a third-party source: ",
          link("ACT is not a vote", BLOG_ACT),
        ],
      },
    ],
  },
  {
    slug: "webauthn-and-passkeys",
    path: WEBAUTHN_PATH,
    title: "WebAuthn and passkeys",
    eyebrow: "WebAuthn and passkeys",
    seoTitle: "WebAuthn and passkeys — Practices | NEOS",
    description:
      "W3C WebAuthn is the browser API for scoped public-key credentials. FIDO describes a passkey as a FIDO credential, unlocked as the device is unlocked.",
    h1: "WebAuthn and passkeys",
    published: "2026-11-10",
    dateLabel: "10 November 2026",
    blocks: [
      {
        kind: "p",
        body: "Every community coordinator has seen a shared spreadsheet of passwords turn into a quiet headache when laptops get replaced or volunteers rotate off a project. Open browser sign-in standards take a cleaner path: W3C WebAuthn lets your browser use a public-key credential stored safely on your device, and FIDO calls those everyday FIDO credentials “passkeys” — unlocked the exact same way you unlock your phone or laptop.",
      },
      {
        kind: "p",
        body: [
          "In W3C's Recommendation ",
          { em: "Web Authentication: An API for accessing Public Key Credentials Level 2," },
          " (8 April 2021), the specification states: “This specification defines an API enabling the creation and use of strong, attested, scoped, public key-based credentials by web applications, for the purpose of strongly authenticating users.” Each credential is scoped specifically to one site and bound to an authenticator rather than stored as a typed shared secret.",
        ],
      },
      {
        kind: "p",
        body: "FIDO Alliance explains passkeys in everyday words: “A passkey is an authentication credential based on FIDO standards, that can be stored on your phone or computer, or in a hardware security key allowing a user to sign in to apps and websites with the same process that they use to unlock their device (biometrics, PIN, or pattern).” Unlike typed passwords, FIDO emphasizes that passkeys “are phishing-resistant, are always strong, and are designed so that there are no shared secrets.” (And in FIDO's style note, passkey is written as a lowercase common noun, just like password.)",
      },
      { kind: "h2", text: "How WebAuthn and passkeys fit together" },
      {
        kind: "p",
        body: [
          "Together, WebAuthn (the browser API) and CTAP (how a browser talks to an external security device) form FIDO2. For the practical choices that matter when people change phones or share duties, see ",
          link("Synced and device-bound passkeys", SYNCED_PATH),
          ", ",
          link("Keys in the browser", KEYS_PATH),
          ", and ",
          link("The key stays in the browser", BLOG_KEY),
          ".",
        ],
      },
      { kind: "h2", text: "A situation like this" },
      {
        kind: "p",
        body: "For example, a community portal claims to “support passkeys” while actually still mailing out plain reset links and keeping typed passwords as its sole credential store. W3C's scoped public-key model helps a steward tell real device-held keys apart from ordinary password logins.",
      },
      { kind: "h2", text: "Scope and boundaries" },
      {
        kind: "p",
        body: [
          "This note explains the open W3C WebAuthn Level 2 (8 April 2021) and FIDO Alliance definitions — it is not a password-manager review and does not import third-party benchmark figures from FIDO partner spotlights. This page does not claim a NEOS certification, a particular authenticator, or a token. There is no blockchain and no token. For how NEOS currently handles browser keys and passwords, read ",
          link("Keys in the browser", KEYS_PATH),
          ". Part of ",
          link("PrimusNeo", PRIMUS),
          ".",
        ],
      },
      { kind: "h2", text: "Sources" },
      { kind: "sources" },
      { kind: "h2", text: "Also in this section" },
      {
        kind: "ul",
        items: [
          {
            strongLead: [link("Synced and device-bound passkeys", SYNCED_PATH)],
            rest: [" — say which arrangement the credential actually is."],
          },
          {
            strongLead: [link("Keys in the browser", KEYS_PATH)],
            rest: [" — the house practice sibling."],
          },
          {
            strongLead: [link("The key stays in the browser", BLOG_KEY)],
            rest: [" — the house essay."],
          },
          {
            strongLead: [link("CTAP and FIDO2", CTAP_PATH)],
            rest: [" — the client-to-authenticator protocol, a Proposed Standard of 21 June 2022."],
          },
          {
            strongLead: [link("WebAuthn Level 2 and Level 3", LEVELS_PATH)],
            rest: [" — Level 2, 8 April 2021, and Level 3, 25 August 2026, are both Recommendations."],
          },
        ],
      },
      {
        kind: "p",
        body: [
          "NEOS is part of ",
          link("PrimusNeo, the lab whose stack this product belongs to", PRIMUS),
          ". There is no blockchain and no token.",
        ],
      },
      {
        kind: "p",
        body: [
          "The useful next step is to read the W3C recommendation, or ",
          link("Keys in the browser", KEYS_PATH),
          ". If something on this page is wrong, ",
          link("write to us", "/about"),
          ".",
        ],
      },
      { kind: "p", body: AUTHOR },
    ],
    sources: [
      {
        name: "W3C, Web Authentication Level 2",
        urls: ["https://www.w3.org/TR/webauthn-2/", "https://www.w3.org/TR/2021/REC-webauthn-2-20210408/"],
        datePublished: "2021-04-08",
        body: [
          "W3C, ",
          { em: "Web Authentication: An API for accessing Public Key Credentials Level 2," },
          " W3C Recommendation, 8 April 2021. ",
          link("https://www.w3.org/TR/webauthn-2/", "https://www.w3.org/TR/webauthn-2/"),
          " · this version: ",
          link("https://www.w3.org/TR/2021/REC-webauthn-2-20210408/", "https://www.w3.org/TR/2021/REC-webauthn-2-20210408/"),
        ],
      },
      source(
        "FIDO Alliance, “Passkeys”",
        "https://fidoalliance.org/passkeys/",
        "FIDO Alliance, “Passkeys.” ",
      ),
      {
        name: "House sibling: Keys in the browser",
        urls: ["https://neos.primusneo.com/practices/keys-in-the-browser"],
        body: ["House sibling: ", link("Keys in the browser", KEYS_PATH)],
      },
    ],
  },
  {
    slug: "circles-and-domains",
    path: CIRCLES_PATH,
    title: "Circles, policy, and domains",
    eyebrow: "Circles and domains",
    seoTitle: "Circles, policy, and domains — Practices | NEOS",
    description:
      "The Sociocracy Group describes a circle as a semi-autonomous team that decides policy and delegates execution into clear domains. This covers that method.",
    h1: "Circles, policy, and domains",
    published: "2026-11-10",
    dateLabel: "10 November 2026",
    blocks: [
      {
        kind: "p",
        body: "When a small studio or housing co-op puts every repair bill, kitchen norm, and hardware purchase into one shared meeting agenda, nobody actually feels free to get everyday work done. In Sociocracy, a circle separates the two jobs cleanly: the circle decides shared policy by consent, then trusts members inside clear domains with genuine freedom to act day to day.",
      },
      {
        kind: "p",
        body: "The Sociocracy Group's “4 principles” puts it concisely: “The circle decides about policy and delegates the execution to the members. This means delegates clear domains with freedom to decide.” On what a circle itself is: “A circle is a semi autonomous team of individuals who determine policy according to the Sociocratic method for the realization of a common aim.” “Each circle defines its policy and decides by consent to use other decision-making methods.”",
      },
      { kind: "h2", text: "Why clear domains stop micromanagement" },
      {
        kind: "p",
        body: [
          "Instead of polling twenty neighbors every time a broken lock needs replacing, a group agrees up front on safety limits and budget bounds, then lets the steward inside that domain act without nagging. For how objections and consent work inside that circle, read ",
          link("Consent is not consensus", CONSENT_PATH),
          " and ",
          link("What is a well-founded objection", OBJECTION_PATH),
          "; see ",
          link("How NEOS governs", GOVERNANCE),
          " and ",
          link("ACT is not a vote", BLOG_ACT),
          " for how NEOS structures roles and explicit domains.",
        ],
      },
      { kind: "h2", text: "A situation like this" },
      {
        kind: "p",
        body: "For example, a volunteer bike kitchen calls itself a “circle,” yet members still spend forty minutes debating which chain lube to restock because nobody ever named a clear purchasing domain. Writing down the domain boundary turns an endless discussion back into trusted work.",
      },
      { kind: "h2", text: "Scope and boundaries" },
      {
        kind: "p",
        body: [
          "NEOS is not a certified implementation of The Sociocracy Group's method. References on About or ",
          link("How NEOS governs", GOVERNANCE),
          " describe roles created by consent with clear domains without claiming a TSG double-link, election badge, or org-chart certification. NEOS is part of ",
          link("PrimusNeo", PRIMUS),
          " and reports version 0.1.0 only as its published build status. There is no blockchain and no token.",
        ],
      },
      { kind: "h2", text: "Sources" },
      { kind: "sources" },
      { kind: "h2", text: "Also in this section" },
      {
        kind: "ul",
        items: [
          {
            strongLead: [link("Consent is not consensus", CONSENT_PATH)],
            rest: [" — arguments are central; not that everyone agrees."],
          },
          {
            strongLead: [link("What is a well-founded objection", OBJECTION_PATH)],
            rest: [" — a risk the group cannot afford, not a preference."],
          },
          {
            strongLead: [link("ACT is not a vote", BLOG_ACT)],
            rest: [" — the house essay."],
          },
          {
            strongLead: [link("Roles that cannot be delegated", ROLES_PATH)],
            rest: [" — the election of an important role, particularly the representative, cannot be delegated."],
          },
        ],
      },
      {
        kind: "p",
        body: [
          "NEOS is part of ",
          link("PrimusNeo, the lab whose stack this product belongs to", PRIMUS),
          ". There is no blockchain and no token. Operator software describes itself as version 0.1.0; that is a published fact, not a maturity badge.",
        ],
      },
      {
        kind: "p",
        body: [
          "The useful next step is to say which domain a decision sits in, or to read ",
          link("Consent is not consensus", CONSENT_PATH),
          ". If something on this page is wrong, ",
          link("write to us", "/about"),
          ".",
        ],
      },
      { kind: "p", body: AUTHOR },
    ],
    sources: [
      source(
        "The Sociocracy Group, “4 principles”",
        "https://thesociocracygroup.com/4-principles/",
        "The Sociocracy Group, “4 principles.” ",
      ),
      {
        name: "House siblings: How NEOS governs and ACT is not a vote",
        urls: ["https://neos.primusneo.com/governance-model", "https://neos.primusneo.com/blog/act-is-not-a-vote"],
        body: [
          "House siblings, for already-public NEOS wording only, not as evidence of a TSG certification: ",
          link("How NEOS governs", GOVERNANCE),
          ", ",
          link("ACT is not a vote", BLOG_ACT),
        ],
      },
    ],
  },
  {
    slug: "well-founded-objection",
    path: OBJECTION_PATH,
    title: "What is a well-founded objection",
    eyebrow: "A well-founded objection",
    seoTitle: "What is a well-founded objection — Practices | NEOS",
    description:
      "In The Sociocracy Group’s consent principle, a decision stands when no member has a paramount, well-founded objection: a risk the group cannot afford to take.",
    h1: "What is a well-founded objection",
    published: "2026-11-10",
    dateLabel: "10 November 2026",
    blocks: [
      {
        kind: "p",
        body: "When a group shifts from majority voting to consent, the very first worry facilitators hear is “Wait — couldn't one stubborn person block everything forever?” That fear usually disappears the moment a group learns what an objection actually asks for: not whether you personally love option two better, but whether you spot a concrete risk the community cannot afford to take.",
      },
      {
        kind: "p",
        body: "The Sociocracy Group's “4 principles” defines consent as “expressed by the fact that none of the members has a paramount and well-founded objection against that decision,” and immediately anchors what that feels like in practice: “Consent is not consensus — it does not mean that everyone agrees. It means that nobody is aware of a risk that we cannot afford to take.”",
      },
      { kind: "h2", text: "Preference versus genuine risk" },
      {
        kind: "p",
        body: [
          "Saying “I'd rather host potluck on Saturday than Sunday” is a helpful preference during Advice — not a blocker once Sunday avoids overlapping with clinic parking. Pointing out “Sunday blocks the loading bay for the food pantry truck” names a real operational risk that helps the group tighten the proposal. For the broader distinction between unanimous harmony and workable consent, see ",
          link("Consent is not consensus", CONSENT_PATH),
          ", ",
          link("Circles, policy, and domains", CIRCLES_PATH),
          ", and ",
          link("ACT is not a vote", BLOG_ACT),
          " (where NEOS reminds groups that quietness isn't consent and narrow headcounts aren't mandates), alongside ",
          link("How NEOS governs", GOVERNANCE),
          ".",
        ],
      },
      { kind: "h2", text: "A situation like this" },
      {
        kind: "p",
        body: "For example, during a neighborhood mural proposal, a member asks to stop the plan purely because they preferred warm ochre over slate blue, without pointing to safety, budget, or shared-wall agreements. Under consent, a facilitator thanks them for the aesthetic note and checks again for concrete risk — keeping the project moving without bulldozing real warnings.",
      },
      { kind: "h2", text: "Scope and boundaries" },
      {
        kind: "p",
        body: [
          "NEOS is not a certified implementation of The Sociocracy Group's method. This field note presents TSG's public wording as a helpful test without prescribing fixed objection timers or veto checklists. Part of ",
          link("PrimusNeo", PRIMUS),
          "; v0.1.0 is cited solely as published operator status. There is no blockchain and no token.",
        ],
      },
      { kind: "h2", text: "Sources" },
      { kind: "sources" },
      { kind: "h2", text: "Also in this section" },
      {
        kind: "ul",
        items: [
          {
            strongLead: [link("Consent is not consensus", CONSENT_PATH)],
            rest: [" — the definition sibling: not that everyone agrees, and not a tally."],
          },
          {
            strongLead: [link("Circles, policy, and domains", CIRCLES_PATH)],
            rest: [" — the circle decides policy and delegates the work."],
          },
          {
            strongLead: [link("ACT is not a vote", BLOG_ACT)],
            rest: [" — the house essay."],
          },
          {
            strongLead: [link("Roles that cannot be delegated", ROLES_PATH)],
            rest: [" — the election of an important role, particularly the representative, cannot be delegated."],
          },
        ],
      },
      {
        kind: "p",
        body: [
          "NEOS is part of ",
          link("PrimusNeo, the lab whose stack this product belongs to", PRIMUS),
          ". There is no blockchain and no token. Operator software describes itself as version 0.1.0; that is a published fact, not a maturity badge.",
        ],
      },
      {
        kind: "p",
        body: [
          "The useful next step is to name the risk, if there is one, or to read ",
          link("Consent is not consensus", CONSENT_PATH),
          ". If something on this page is wrong, ",
          link("write to us", "/about"),
          ".",
        ],
      },
      { kind: "p", body: AUTHOR },
    ],
    sources: [
      source(
        "The Sociocracy Group, “4 principles”",
        "https://thesociocracygroup.com/4-principles/",
        "The Sociocracy Group, “4 principles.” ",
      ),
      {
        name: "House sibling: ACT is not a vote",
        urls: ["https://neos.primusneo.com/blog/act-is-not-a-vote"],
        body: ["House sibling: ", link("ACT is not a vote", BLOG_ACT)],
      },
    ],
  },
  {
    slug: "synced-vs-device-bound-passkeys",
    path: SYNCED_PATH,
    title: "Synced and device-bound passkeys",
    eyebrow: "Synced and device-bound passkeys",
    seoTitle: "Synced and device-bound passkeys — Practices | NEOS",
    description:
      "FIDO says passkeys can be synced across a user’s devices, or bound to a particular device. Those are not the same, and a record should say which one it is.",
    h1: "Synced and device-bound passkeys",
    published: "2026-11-10",
    dateLabel: "10 November 2026",
    blocks: [
      {
        kind: "p",
        body: "When someone says “just use a passkey,” it is easy to assume every key behaves the exact same way — until your laptop breaks on a Friday afternoon and you wonder whether your sign-in followed you to your phone or stayed locked to the dead machine. FIDO distinguishes two arrangements clearly: synced passkeys that follow your account across personal devices, and device-bound passkeys tied strictly to one phone, computer, or USB key.",
      },
      {
        kind: "p",
        body: "FIDO Alliance puts both options side by side on its Passkeys overview: “Passkeys can be securely synced across a user's devices, or bound to a particular device (device-bound passkeys).” Either way, “the cryptographic keys are used from end-user devices (computers, phones, or security keys) for user authentication,” and even FIDO's convenience features — working “across all of a user's devices, and even other devices within physical proximity” — sit alongside intentionally non-syncing device-bound keys for groups that want credentials anchored to one piece of hardware.",
      },
      { kind: "h2", text: "Why clarity helps stewards and newcomers" },
      {
        kind: "p",
        body: [
          "Saying simply “we used a passkey” hides the single detail someone needs during recovery or handoff: did that key sync across their devices, or was it bound to one browser or security stick? Meanwhile, W3C WebAuthn Level 2 (8 April 2021) defines the underlying browser API for origin-scoped public-key credentials — see ",
          link("WebAuthn and passkeys", WEBAUTHN_PATH),
          " and ",
          link("Keys in the browser", KEYS_PATH),
          " for how those pieces fit.",
        ],
      },
      { kind: "h2", text: "A situation like this" },
      {
        kind: "p",
        body: "For example, a community onboarding checklist promises “the key never leaves this single computer,” while the member actually saved a synced passkey through their phone account. Writing down whether credentials are synced or device-bound avoids painful surprises later.",
      },
      { kind: "h2", text: "Scope and boundaries" },
      {
        kind: "p",
        body: [
          "This distinction is not a claim that NEOS syncs keys; on NEOS today, “The key stays in the browser” means what ",
          link("Keys in the browser", KEYS_PATH),
          " describes, and this note does not quietly extend it into a sync product. Password sign-in remains available. Part of ",
          link("PrimusNeo", PRIMUS),
          ", with no recovery escrow promises and no external vendor percentages. There is no blockchain and no token.",
        ],
      },
      { kind: "h2", text: "Sources" },
      { kind: "sources" },
      { kind: "h2", text: "Also in this section" },
      {
        kind: "ul",
        items: [
          {
            strongLead: [link("WebAuthn and passkeys", WEBAUTHN_PATH)],
            rest: [" — the browser API, and passkey as a common noun."],
          },
          {
            strongLead: [link("Keys in the browser", KEYS_PATH)],
            rest: [" — the house practice sibling."],
          },
          {
            strongLead: [link("The key stays in the browser", BLOG_KEY)],
            rest: [" — the house essay."],
          },
          {
            strongLead: [link("CTAP and FIDO2", CTAP_PATH)],
            rest: [" — the client-to-authenticator protocol, a Proposed Standard of 21 June 2022."],
          },
          {
            strongLead: [link("WebAuthn Level 2 and Level 3", LEVELS_PATH)],
            rest: [" — Level 2, 8 April 2021, and Level 3, 25 August 2026, are both Recommendations."],
          },
        ],
      },
      {
        kind: "p",
        body: [
          "NEOS is part of ",
          link("PrimusNeo, the lab whose stack this product belongs to", PRIMUS),
          ". There is no blockchain and no token.",
        ],
      },
      {
        kind: "p",
        body: [
          "The useful next step is to say whether a credential is synced or device-bound, or to read the ",
          link("WebAuthn guide", WEBAUTHN_PATH),
          ". If something on this page is wrong, ",
          link("write to us", "/about"),
          ".",
        ],
      },
      { kind: "p", body: AUTHOR },
    ],
    sources: [
      source(
        "FIDO Alliance, “Passkeys”",
        "https://fidoalliance.org/passkeys/",
        "FIDO Alliance, “Passkeys.” ",
      ),
      {
        name: "W3C, Web Authentication Level 2",
        urls: ["https://www.w3.org/TR/webauthn-2/"],
        datePublished: "2021-04-08",
        body: [
          "W3C, ",
          { em: "Web Authentication: An API for accessing Public Key Credentials Level 2," },
          " as the API sibling. ",
          link("https://www.w3.org/TR/webauthn-2/", "https://www.w3.org/TR/webauthn-2/"),
        ],
      },
      {
        name: "House sibling: Keys in the browser",
        urls: ["https://neos.primusneo.com/practices/keys-in-the-browser"],
        body: ["House sibling: ", link("Keys in the browser", KEYS_PATH)],
      },
    ],
  },
  {
    slug: "roles-that-cannot-be-delegated",
    path: ROLES_PATH,
    title: "Roles that cannot be delegated",
    eyebrow: "Roles that cannot be delegated",
    seoTitle: "Roles that cannot be delegated — Practices | NEOS",
    description:
      "In The Sociocracy Group’s method, the election of an important role cannot be delegated. NEOS is not a certified implementation of that method.",
    h1: "Roles that cannot be delegated: electing a representative",
    published: "2026-11-10",
    dateLabel: "10 November 2026",
    blocks: [
      {
        kind: "p",
        body: "Healthy groups delegate plenty of daily tasks so nobody waits on a full meeting just to restock paint or fix a fence latch. When it comes to choosing who speaks for a circle or carries a core leadership role, however, handing that decision off silently behind closed doors breaks trust fast. In sociocratic practice, almost any day-to-day duty can be delegated — except choosing the people who represent the circle.",
      },
      {
        kind: "p",
        body: "The Sociocracy Group states this clearly under Election on its “4 principles” page: “The Principle of Election by consent provides an important counter-balance. While we can delegate almost any decision to operational roles or processes, using a policy decision made with consent, the one sort of decision we cannot delegate is the election of an important role — particularly the representative. Representatives must be chosen by consent of the circle which they represent. This ensures that the organization is woven together by a web of consent, and that power flows in circles through the entire organization.”",
      },
      {
        kind: "p",
        body: "The same TSG page describes Double link by saying a circle “has a link with the next higher circle in such a way that at least two persons, the functional leader and at least one elected representative from the circle, belong to the next higher circle and participate in the higher circle on an equivalent basis” (with starred patterns marked “TSG Standard: Patterns for application, Anchoring of SCM in legal terms.”).",
      },
      { kind: "h2", text: "How circles keep selection accountable" },
      {
        kind: "p",
        body: [
          "Naming domains explicitly goes hand in hand with choosing stewards openly: see ",
          link("Circles, policy, and domains", CIRCLES_PATH),
          ", ",
          link("Consent is not consensus", CONSENT_PATH),
          ", ",
          link("What is a well-founded objection", OBJECTION_PATH),
          ", and ",
          link("Agreements and decision records", AGREEMENTS_PATH),
          " for recording role terms clearly. For NEOS's own workspace conventions, read ",
          link("How NEOS governs", GOVERNANCE),
          " and ",
          link("ACT is not a vote", BLOG_ACT),
          ".",
        ],
      },
      { kind: "h2", text: "A situation like this" },
      {
        kind: "p",
        body: "For example, an executive committee quietly “appoints” a coordinator to represent a neighborhood working group without asking the members in that working group first. Electing that representative by consent keeps representation rooted in the people being spoken for.",
      },
      { kind: "h2", text: "Scope and boundaries" },
      {
        kind: "p",
        body: [
          "The Double link and election rules above are quoted only as TSG's description of its method. NEOS is not a certified implementation of The Sociocracy Group's method. Live NEOS About and governance-model pages do not claim a TSG double-link, election process, or role list beyond what they state. Part of ",
          link("PrimusNeo", PRIMUS),
          ". There is no blockchain and no token.",
        ],
      },
      { kind: "h2", text: "Sources" },
      { kind: "sources" },
      { kind: "h2", text: "Also in this section" },
      {
        kind: "ul",
        items: [
          {
            strongLead: [link("Circles, policy, and domains", CIRCLES_PATH)],
            rest: [" — say which domain a decision sits in."],
          },
          {
            strongLead: [link("Consent is not consensus", CONSENT_PATH)],
            rest: [" — arguments are central; not that everyone agrees."],
          },
          {
            strongLead: [link("What is a well-founded objection", OBJECTION_PATH)],
            rest: [" — a risk the group cannot afford, not a preference."],
          },
          {
            strongLead: [link("Agreements and decision records", AGREEMENTS_PATH)],
            rest: [" — an agreement that cannot be found later is not in force."],
          },
        ],
      },
      {
        kind: "p",
        body: [
          "NEOS is part of ",
          link("PrimusNeo, the lab whose stack this product belongs to", PRIMUS),
          ". There is no blockchain and no token.",
        ],
      },
      {
        kind: "p",
        body: [
          "The useful next step is to read TSG's election paragraph as TSG's method, or ",
          link("Circles, policy, and domains", CIRCLES_PATH),
          ". If something on this page is wrong, ",
          link("write to us", "/about"),
          ".",
        ],
      },
      { kind: "p", body: AUTHOR },
    ],
    sources: [
      source(
        "The Sociocracy Group, “4 principles”",
        "https://thesociocracygroup.com/4-principles/",
        "The Sociocracy Group, “4 principles.” ",
      ),
    ],
  },
  {
    slug: "fido2-ctap",
    path: CTAP_PATH,
    title: "CTAP and FIDO2",
    eyebrow: "CTAP and FIDO2",
    seoTitle: "CTAP and FIDO2 — Practices | NEOS",
    description:
      "CTAP is the protocol between a client or platform and a roaming authenticator, and is part of FIDO2 alongside WebAuthn. This is not a hardware tutorial.",
    h1: "CTAP and FIDO2: how a client talks to an authenticator",
    published: "2026-11-10",
    dateLabel: "10 November 2026",
    blocks: [
      {
        kind: "p",
        body: "When a community volunteer plugs in a USB security key or taps their phone to confirm a browser sign-in, two open standards quietly cooperate under the hood: WebAuthn handles the conversation with the website in your browser, while CTAP (Client to Authenticator Protocol) carries the handshake between your computer and the separate device in your hand.",
      },
      {
        kind: "p",
        body: "In the FIDO Alliance Proposed Standard specification Client to Authenticator Protocol (CTAP), Proposed Standard, 21 June 2022 (version fido-v2.1-ps-20210615, errata of 21 June 2022), the abstract states: “This specification describes an application layer protocol for communication between a roaming authenticator and another client/platform, as well as bindings of this application protocol to a variety of transport protocols using different physical media.”",
      },
      {
        kind: "p",
        body: "In plain terms, that lets a browser on one laptop prompt a roaming authenticator — like a smartphone or dedicated USB key — over shared transports: USB Human Interface Device (USB HID), Near Field Communication (NFC), and Bluetooth Smart / Bluetooth Low Energy Technology (BLE). CTAP covers both CTAP1/U2F (“defined by the U2F Raw Messages specification”) and CTAP2 (“whose messages are encoded in the CTAP2 canonical CBOR encoding form”). Alongside WebAuthn, it makes up the FIDO2 standards family.",
      },
      { kind: "h2", text: "Related practices and sign-in guides" },
      {
        kind: "p",
        body: [
          "To see how browser sign-ins fit alongside password login and passkeys, read ",
          link("WebAuthn and passkeys", WEBAUTHN_PATH),
          ", ",
          link("Synced and device-bound passkeys", SYNCED_PATH),
          ", ",
          link("WebAuthn Level 2 and Level 3", LEVELS_PATH),
          ", and ",
          link("Keys in the browser", KEYS_PATH),
          ".",
        ],
      },
      { kind: "h2", text: "A situation like this" },
      {
        kind: "p",
        body: "For example, a platform advertises itself as “FIDO2 certified” simply because it calls the WebAuthn browser API, without mentioning how external keys talk over CTAP or holding formal certification. As CTAP itself notes, “for certifications, other requirements than those specified in this specification may apply.”",
      },
      { kind: "h2", text: "Scope and boundaries" },
      {
        kind: "p",
        body: [
          "This overview maps the protocol relationship — it does not write command lists, PIN flows, or interop recipes, does not treat “Proposed Standard, 21 June 2022” as a later final edition (though later FIDO updates may supersede it), and is not a claim that NEOS implements CTAP or holds a FIDO certification. Part of ",
          link("PrimusNeo", PRIMUS),
          "; no third-party marketing figures are cited, and there is no blockchain and no token.",
        ],
      },
      { kind: "h2", text: "Sources" },
      { kind: "sources" },
      { kind: "h2", text: "Also in this section" },
      {
        kind: "ul",
        items: [
          {
            strongLead: [link("WebAuthn and passkeys", WEBAUTHN_PATH)],
            rest: [" — the web API for scoped public-key credentials."],
          },
          {
            strongLead: [link("WebAuthn Level 2 and Level 3", LEVELS_PATH)],
            rest: [" — two Recommendations, and their official dates."],
          },
          {
            strongLead: [link("Synced and device-bound passkeys", SYNCED_PATH)],
            rest: [" — say which arrangement the credential actually is."],
          },
          {
            strongLead: [link("Keys in the browser", KEYS_PATH)],
            rest: [" — the house practice sibling."],
          },
        ],
      },
      {
        kind: "p",
        body: [
          "NEOS is part of ",
          link("PrimusNeo, the lab whose stack this product belongs to", PRIMUS),
          ". There is no blockchain and no token.",
        ],
      },
      {
        kind: "p",
        body: [
          "The useful next step is to read the opened CTAP specification, or ",
          link("WebAuthn and passkeys", WEBAUTHN_PATH),
          ". If something on this page is wrong, ",
          link("write to us", "/about"),
          ".",
        ],
      },
      { kind: "p", body: AUTHOR },
    ],
    sources: [
      {
        name: "FIDO Alliance, Client to Authenticator Protocol (CTAP)",
        urls: ["https://fidoalliance.org/specs/fido-v2.1-ps-20210615/fido-client-to-authenticator-protocol-v2.1-ps-errata-20220621.html"],
        datePublished: "2022-06-21",
        body: [
          { em: "Client to Authenticator Protocol (CTAP)," },
          " FIDO Alliance Proposed Standard, 21 June 2022 (fido-v2.1-ps-20210615, errata of 21 June 2022). ",
          link(
            "https://fidoalliance.org/specs/fido-v2.1-ps-20210615/fido-client-to-authenticator-protocol-v2.1-ps-errata-20220621.html",
            "https://fidoalliance.org/specs/fido-v2.1-ps-20210615/fido-client-to-authenticator-protocol-v2.1-ps-errata-20220621.html",
          ),
        ],
      },
    ],
  },
  {
    slug: "webauthn-level-versions",
    path: LEVELS_PATH,
    title: "WebAuthn Level 2 and Level 3",
    eyebrow: "WebAuthn Level 2 and Level 3",
    seoTitle: "WebAuthn Level 2 and Level 3 — Practices | NEOS",
    description:
      "WebAuthn Level 2 remains a W3C Recommendation dated 8 April 2021. Level 3 is now a Recommendation too, dated 25 August 2026. This guide records that status.",
    h1: "WebAuthn Level 2 and Level 3",
    published: "2026-11-10",
    dateLabel: "10 November 2026",
    blocks: [
      {
        kind: "p",
        body: "Browser standards don't stand still — and when community coordinators check how passwordless sign-in works, it helps to know which published WebAuthn Recommendation a document is citing. W3C WebAuthn Level 3 is now a W3C Recommendation dated 25 August 2026, standing alongside Level 2 (8 April 2021, following Level 1 on 4 March 2019 and a Candidate Recommendation Snapshot on 26 May 2026).",
      },
      {
        kind: "p",
        body: [
          "Across both editions, the core promise stays simple: ",
          { em: "Web Authentication: An API for accessing Public Key Credentials Level 3" },
          " (",
          link("REC-webauthn-3-20260825", "https://www.w3.org/TR/2026/REC-webauthn-3-20260825/"),
          ", latest at ",
          link("https://www.w3.org/TR/webauthn-3/", "https://www.w3.org/TR/webauthn-3/"),
          ") defines origin-scoped public-key credentials where “Authenticators are responsible for ensuring that no operation is performed without user consent.” Keys registered for one site stay isolated from other sites across registration and authentication.",
        ],
      },
      { kind: "h2", text: "What changed in WebAuthn Level 3" },
      {
        kind: "p",
        body: "In its Changes since Web Authentication Level 2 appendix, Level 3 formalizes a clearer credential record concept alongside substantive additions including JSON (de)serialization methods, create operations in cross-origin iframes, conditional mediation for create and for get, a “hybrid” transport value, signal methods for credential changes, a “topOrigin” client-data attribute, user-agent hints, Web Authentication across related origins, backup-state flags, compound attestation statement format, a pseudo-random function extension, and “attestationFormats” — plus updated timeout guidance and deprecations.",
      },
      { kind: "h2", text: "A situation like this" },
      {
        kind: "p",
        body: "For example, a policy summary says “we follow WebAuthn” without noting whether it targets the 8 April 2021 Level 2 Recommendation or the 25 August 2026 Level 3 Recommendation. Naming the edition avoids confusion whenever newer browser passkey features come up.",
      },
      { kind: "h2", text: "Scope and boundaries" },
      {
        kind: "p",
        body: [
          "This status guide records the published W3C editions and feature names without building a browser support matrix or a “create()” and “get()” walkthrough — it is not a claim that NEOS implements either level, and NEOS is not described as implementing Level 2 or Level 3, so no NEOS support matrix is invented. Related reading: ",
          link("CTAP and FIDO2", CTAP_PATH),
          ", ",
          link("Synced and device-bound passkeys", SYNCED_PATH),
          ", ",
          link("WebAuthn and passkeys", WEBAUTHN_PATH),
          ", and ",
          link("Keys in the browser", KEYS_PATH),
          ". Part of ",
          link("PrimusNeo", PRIMUS),
          "; there is no blockchain and no token.",
        ],
      },
      { kind: "h2", text: "Sources" },
      { kind: "sources" },
      { kind: "h2", text: "Also in this section" },
      {
        kind: "ul",
        items: [
          {
            strongLead: [link("WebAuthn and passkeys", WEBAUTHN_PATH)],
            rest: [" — the Level 2 brief, which this page does not replace."],
          },
          {
            strongLead: [link("CTAP and FIDO2", CTAP_PATH)],
            rest: [" — the companion client-to-authenticator protocol."],
          },
          {
            strongLead: [link("Synced and device-bound passkeys", SYNCED_PATH)],
            rest: [" — say which arrangement the credential actually is."],
          },
          {
            strongLead: [link("Keys in the browser", KEYS_PATH)],
            rest: [" — the house practice sibling."],
          },
        ],
      },
      {
        kind: "p",
        body: [
          "NEOS is part of ",
          link("PrimusNeo, the lab whose stack this product belongs to", PRIMUS),
          ". There is no blockchain and no token.",
        ],
      },
      {
        kind: "p",
        body: [
          "The useful next step is to say which Recommendation you are reading, or to open ",
          link("WebAuthn and passkeys", WEBAUTHN_PATH),
          ". If something on this page is wrong, ",
          link("write to us", "/about"),
          ".",
        ],
      },
      { kind: "p", body: AUTHOR },
    ],
    sources: [
      {
        name: "W3C, Web Authentication Level 3",
        urls: ["https://www.w3.org/TR/2026/REC-webauthn-3-20260825/", "https://www.w3.org/TR/webauthn-3/"],
        datePublished: "2026-08-25",
        body: [
          { em: "Web Authentication: An API for accessing Public Key Credentials Level 3," },
          " W3C Recommendation, 25 August 2026. ",
          link("https://www.w3.org/TR/2026/REC-webauthn-3-20260825/", "https://www.w3.org/TR/2026/REC-webauthn-3-20260825/"),
          " · latest: ",
          link("https://www.w3.org/TR/webauthn-3/", "https://www.w3.org/TR/webauthn-3/"),
        ],
      },
      {
        name: "W3C, Web Authentication Level 2",
        urls: ["https://www.w3.org/TR/webauthn-2/"],
        datePublished: "2021-04-08",
        body: [
          { em: "Web Authentication: An API for accessing Public Key Credentials Level 2," },
          " W3C Recommendation, 8 April 2021. ",
          link("https://www.w3.org/TR/webauthn-2/", "https://www.w3.org/TR/webauthn-2/"),
        ],
      },
    ],
  },
];

export const NEWS = {
  path: "/news",
  title: "News — NEOS",
  description: "Nothing has been announced here yet.",
  heading: "News",
  body: "Nothing has been announced here yet. This page will list a public, dated fact when one exists. It does not repeat the blog.",
} as const;
