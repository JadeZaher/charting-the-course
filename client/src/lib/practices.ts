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
    "Practices the workspace already names, plus field notes on consent, circles, a well-founded objection, WebAuthn, passkeys, and CTAP. No token and no share-vote.",
  eyebrow: "Eleven practices · no token, no share-vote",
  heading: "What the workspace already names.",
  published: "2026-11-10",
  blocks: [
    {
      kind: "p",
      body: "These pages are about practices the workspace already names: ACT (Advice, Consent, Test), agreements and decision records a later member can find, and keys that stay in the browser. The figures and standards are other people’s, with the links left on. NEOS is not a voting platform, not a certified sociocracy product, and not a wallet. There is no blockchain and no token. Pages in this section must be in the crawlable HTML, not only the app shell.",
    },
    {
      kind: "p",
      body: [
        link("How NEOS governs", GOVERNANCE),
        " stays a product page, linked from the ACT child, not forked.",
      ],
    },
    { kind: "h2", text: "The first three" },
    {
      kind: "ul",
      items: [
        {
          strongLead: [link("ACT is not a vote", ACT_PATH)],
          rest: [
            " — ACT is already defined on the live site as Advice, Consent, and Test, not a popularity vote or a share of ownership. Sociocracy’s consent principle (not consensus; no paramount, well-founded objection) is related practice, not a certificate.",
          ],
        },
        {
          strongLead: [link("Agreements and decision records", AGREEMENTS_PATH)],
          rest: [
            " — official minute-keeping already names the habit: what was agreed, by whom, and when, kept so a later person can find it. On NEOS that file is the operating record, not title.",
          ],
        },
        {
          strongLead: [link("Keys in the browser", KEYS_PATH)],
          rest: [
            " — WebAuthn-style credentials keep the private key with the authenticator and the public key with the relying party. If you lose it, this workspace does not have a copy to restore. Password sign-in is still offered.",
          ],
        },
      ],
    },
    { kind: "h2", text: "Field notes" },
    {
      kind: "p",
      body: "Eight notes sit beside those three. Each one quotes a public method or a public standard and leaves the link on. NEOS is not a certified implementation of The Sociocracy Group’s method. These notes do not claim that NEOS implements WebAuthn or CTAP, and they do not claim that NEOS syncs a passkey. There is no blockchain and no token.",
    },
    {
      kind: "ul",
      items: [
        {
          strongLead: [link("Consent is not consensus", CONSENT_PATH)],
          rest: [
            " — The Sociocracy Group states consent as the absence of a paramount, well-founded objection, not that everyone agrees.",
          ],
        },
        {
          strongLead: [link("WebAuthn and passkeys", WEBAUTHN_PATH)],
          rest: [
            " — W3C WebAuthn Level 2 is the browser API for scoped public-key credentials. FIDO describes a passkey as a FIDO credential, unlocked as the device is unlocked.",
          ],
        },
        {
          strongLead: [link("Circles, policy, and domains", CIRCLES_PATH)],
          rest: [
            " — The Sociocracy Group describes a circle as a semi-autonomous team that decides policy and delegates execution into clear domains.",
          ],
        },
        {
          strongLead: [link("What is a well-founded objection", OBJECTION_PATH)],
          rest: [
            " — In that consent principle, a decision stands when no member has a paramount, well-founded objection: a risk the group cannot afford to take.",
          ],
        },
        {
          strongLead: [link("Synced and device-bound passkeys", SYNCED_PATH)],
          rest: [
            " — FIDO says passkeys can be synced across a user’s devices, or bound to a particular device. A record should say which one it is.",
          ],
        },
        {
          strongLead: [link("Roles that cannot be delegated", ROLES_PATH)],
          rest: [
            " — In The Sociocracy Group’s method, the election of an important role cannot be delegated. NEOS is not a certified implementation of that method.",
          ],
        },
        {
          strongLead: [link("CTAP and FIDO2", CTAP_PATH)],
          rest: [
            " — CTAP is the protocol between a client or platform and a roaming authenticator, and is part of FIDO2 alongside WebAuthn. Proposed Standard, 21 June 2022.",
          ],
        },
        {
          strongLead: [link("WebAuthn Level 2 and Level 3", LEVELS_PATH)],
          rest: [
            " — Level 2 remains a W3C Recommendation dated 8 April 2021. Level 3 is a Recommendation dated 25 August 2026.",
          ],
        },
      ],
    },
    { kind: "h2", text: "What NEOS is doing here" },
    {
      kind: "p",
      body: [
        "NEOS is a visual workspace for learning, discovery, collaboration, and participatory governance, part of the ",
        link("PrimusNeo", PRIMUS),
        " stack and offered as its own product. Related house notes are ",
        link("ACT is not a vote", BLOG_ACT),
        " and ",
        link("The key stays in the browser", BLOG_KEY),
        ". Read ",
        link("About", "/about"),
        ", ",
        link("How NEOS governs", GOVERNANCE),
        ", and the ",
        link("Terms", "/terms"),
        ". The 54-skills / 10-layers count and v0.1.0 appear only as already published, not as a maturity badge. Site notes, when there is something true to announce, live in ",
        link("News", "/news"),
        ".",
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
        body: "A number at the end of a meeting can look like a decision and still be only a count of who was in the room. ACT, as already defined on the live NEOS site, is Advice, Consent, and Test — advice from the people affected, consent as a check for a reasoned objection, and a test of the proposal in practice. It is not a popularity vote and not a share of ownership. Sociocracy’s published consent principle is useful related practice, and this page must say plainly that NEOS is not a certified implementation of that method.",
      },
      {
        kind: "p",
        body: "The efficiency of a tally is the trap, and slowness is not a virtue for its own sake. The point is a decision that can be found, tested, and handed on. There is no blockchain and no token on this workspace.",
      },
      { kind: "h2", text: "Hero points" },
      {
        kind: "ul",
        items: [
          {
            strongLead: ["The live NEOS site already defines ACT, and this page does not improve the sentence:"],
            rest: [
              ` “${LIVE_ACT_SENTENCE}” About already says NEOS is not “A voting platform — consent is not majority rule,” and “Assistants may guide; they do not decide.” Terms, updated 10 November 2026, repeat the ACT definition and add: this site “does not issue a token, take an investment, or sell a share.”`,
            ],
          },
          {
            strongLead: ["The Sociocracy Group’s public “4 principles” page"],
            rest: [
              " states the consent principle as “the way of decision-making in which the arguments for taking a decision are central, which is expressed by the fact that none of the members has a paramount and well-founded objection against that decision.” It then says, in plain language: “Consent is not consensus — it does not mean that everyone agrees. It means that nobody is aware of a risk that we cannot afford to take.” The same page refers to “TSG Standard: Patterns for application, Anchoring of SCM in legal terms.” NEOS is not TSG-certified, not SCM-certified, and not “a sociocracy product.” The page does not state a publication date; it was opened 2026-11-10.",
            ],
          },
          {
            strongLead: ["On the same TSG page,"],
            rest: [
              " a circle “decides about policy and delegates the execution to the members,” and “defines its policy and decides by consent to use other decision-making methods.” Election of important roles, “particularly the representative,” is described as a decision that cannot be delegated and must be made by consent of the circle represented. If mentioned at all, that remains sociocracy’s practice, not a live NEOS rule. About and the governance-model pages describe roles created by consent and explicit domains; they do not claim a TSG double-link or a TSG election. No double-link implementation is invented here.",
            ],
          },
        ],
      },
      {
        kind: "p",
        body: [
          "The sibling essay ",
          link("ACT is not a vote", BLOG_ACT),
          " already warns that a tally can be produced in a room that did not hear from the people who will have to live with the result, and that a group which treats silence as consent, or a 60 percent tally as a mandate, “has gone back to running a vote under a friendlier name.” That distinction is reused. The percentages in that sentence are not research findings.",
        ],
      },
      { kind: "h2", text: "The bill for a split system" },
      {
        kind: "ul",
        items: [
          { strongLead: ["Calling ACT a vote, a majority, or a share of ownership."] },
          { strongLead: ["Treating silence as consent, or a percentage tally as a mandate."] },
          {
            strongLead: ["Claiming NEOS is certified sociocracy, TSG-standard, or “the official method,”"],
            rest: [
              " or adding OmniOne or Bali colour. Those deployments are not described on this page. If AZOA is mentioned, GDPR “consent” and ACT “consent” are different uses of the word.",
            ],
          },
        ],
      },
      { kind: "h2", text: "A shared record, applied here" },
      {
        kind: "ul",
        items: [
          { strongLead: ["Ask the people who will have to live with the rule before it is adopted (Advice)."] },
          { strongLead: ["Look for a concrete, reasoned objection, not for enthusiasm (Consent)."] },
          {
            strongLead: ["Try the proposal in a bounded way and write down whether it survived (Test)."],
            rest: [
              " A proposal that cannot be tried is a statement of values. The product page for this protocol is ",
              link("How NEOS governs", GOVERNANCE),
              "; this research child does not fork it.",
            ],
          },
        ],
      },
      { kind: "h2", text: "What NEOS is, and is not, on this page" },
      {
        kind: "p",
        body: [
          "A visual workspace for agreements and decisions, part of the ",
          link("PrimusNeo", PRIMUS),
          " stack and offered as its own product. No blockchain, no token. The “54 skills across 10 layers” count and the v0.1.0 tag appear only as already stated on About, never as a maturity or security badge.",
        ],
      },
      { kind: "h2", text: "Sources" },
      { kind: "p", body: "Every stat on this page is cited." },
      { kind: "sources" },
      { kind: "h2", text: "An illustrative scenario" },
      {
        kind: "p",
        body: "This is a worked example, not a named community and not a customer. A circle hears a reasoned objection about harm to an existing agreement, amends the proposal, and records a small test — not a 60–40 win. The tally would have been faster. It would not have been the same decision.",
      },
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
        body: "A community workspace needs the same habits public minute-keeping and records-management already describe: a contemporaneous record of what was agreed, by whom, and when, kept so a later member can find it. A circle that cannot show what it already agreed will re-argue it, or worse, invent a tradition. On NEOS those records are the community’s operating record, and they are not, by themselves, equity, a payment right, or legal title.",
      },
      {
        kind: "p",
        body: "This page is not a secretary’s manual from a regulator, and “living documents” is not marketing mist. NEOS is not a UK company, not a public authority, and not a cooperative.",
      },
      { kind: "h2", text: "Hero points" },
      {
        kind: "ul",
        items: [
          {
            strongLead: ["ISO 15489-1:2016, as quoted by HMRC (policy published 19 May 2026):"],
            rest: [
              " records are “information created, received and maintained as evidence and information by an organisation or person, in pursuance of legal obligations or in the transaction of business.” HMRC creates records “to provide information about what happened, what was decided, and how to do things,” valuable when “accurate, up-to-date and accessible when it is needed.” That is the bar for an agreement record in a community workspace.",
            ],
          },
          {
            strongLead: ["UK private-office records guidance (published 29 December 2023):"],
            rest: [
              " for meetings on substantive issues, “Record the date, time, location or format…, who took part, and decisions or undertakings,” whatever the medium, and “Record decisions arising from telephone or online meetings or via non-corporate communication channels.” This is a public model of the fields, not a claim that NEOS communities are public authorities.",
            ],
          },
          {
            strongLead: ["Companies Act 2006, s.248–s.249 and s.355, as a public minute-keeping contrast:"],
            rest: [
              " directors’ minutes of all proceedings must be recorded and kept for at least ten years; authenticated minutes “are evidence… of the proceedings at the meeting,” and until the contrary is proved the meeting and its proceedings are deemed duly held; companies must also keep members’ resolutions and general-meeting minutes for at least ten years. The transferable point is that an official minute is a record of proceedings with evidential effect, not a share certificate. The ten-year figure is the UK companies figure, not a house retention policy.",
            ],
          },
          {
            strongLead: ["ICA Statement on the Cooperative Identity (adopted 1995), Principle 2:"],
            rest: [
              " cooperatives are “controlled by their members, who actively participate in setting their policies and making decisions,” and “Men and women serving as elected representatives are accountable to the membership.” Use as a public association-governance primer: decisions and accountability are supposed to be visible to the membership. NEOS is not a cooperative and is not ICA-registered.",
            ],
          },
        ],
      },
      {
        kind: "p",
        body: "The live About page already describes agreements as living documents “with clear domains, expiration dates, and review cycles” that “encode the community’s will into actionable, testable commitments.” Terms say: “Records you submit are the community’s operating record. They are not, by themselves, equity, a payment right, or legal title.” “Economic coordination is a recorded practice in the skill stack. This workspace does not move money, issue a token, sell a share, or run a funding pool.” ACT remains the decision protocol. Those sentences are not upgraded into case studies, and OmniOne or Bali is not added.",
      },
      { kind: "h2", text: "The bill for a split system" },
      {
        kind: "ul",
        items: [
          { strongLead: ["An undated chat decision that cannot be found by the next member."] },
          { strongLead: ["Treating the record as equity, a payment right, or legal title."] },
          {
            strongLead: ["OmniOne or Bali deployment stories, or “a council is already live on this stack,”"],
            rest: [" which the live site does not state."],
          },
        ],
      },
      { kind: "h2", text: "A shared record, applied here" },
      {
        kind: "ul",
        items: [
          { strongLead: ["Write agreements with domain, date, and a review or expiration,"], rest: [" as About already describes."] },
          {
            strongLead: ["Record ACT outcomes — advice heard, objections, the test — in the same place as the agreement."],
            rest: [" See ", link("ACT is not a vote", ACT_PATH), " and ", link("How NEOS governs", GOVERNANCE), "."],
          },
          { strongLead: ["Keep the “not, by themselves, equity” sentence next to any economic or membership record."] },
        ],
      },
      { kind: "h2", text: "What NEOS is, and is not, on this page" },
      {
        kind: "p",
        body: [
          "NEOS is part of the ",
          link("PrimusNeo", PRIMUS),
          " stack and is offered as its own product, with no token and no share-vote. The 54-skills / 10-layers count and v0.1.0 appear only as already published, not as a maturity badge. Related thinking in the stack, still simulated on that side: ",
          link("ArdaNova, A record is not a right", "https://ardanova.com/notes/a-record-is-not-a-right"),
          ". This page does not link unbuilt research routes on sister sites.",
        ],
      },
      { kind: "h2", text: "Sources" },
      { kind: "p", body: "Every stat on this page is cited." },
      { kind: "sources" },
      { kind: "h2", text: "An illustrative scenario" },
      {
        kind: "p",
        body: "This is a worked example, not a named community. A new member, six months later, can find the agreement that created a role, the objection that amended it, and the date it comes up for review. The record can be taught and checked. A rumour cannot.",
      },
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
        body: "Most accounts are a loan of a row in someone else’s table. Public WebAuthn-style credentials invert the custody of the secret: they are created and stored by an authenticator, and the credential private key is expected never to be exposed — even to the owner — while the relying party stores the public key. That is the public model for “the key stays in the browser.” This page must not invent NEOS’s cryptography, call the key a wallet, or imply a token, a blockchain, or a recoverable server-side copy.",
      },
      {
        kind: "p",
        body: "“Your account” is often a generous pronoun. The sibling essay already has that line, and this page will not overwork it. Be precise about what the public standards say, and quieter than a security-vendor landing page about what NEOS does.",
      },
      {
        kind: "p",
        body: "There is no blockchain and no token. If you lose the browser key, this workspace does not have a copy to restore. Password sign-in is still offered in the Terms and has not been withdrawn.",
      },
      { kind: "h2", text: "Hero points" },
      {
        kind: "ul",
        items: [
          {
            strongLead: [
              "W3C Recommendation, ",
              { em: "Web Authentication: An API for accessing Public Key Credentials — Level 2," },
              " 8 April 2021:",
            ],
            rest: [
              " “A public key credential is created and stored by a WebAuthn Authenticator at the behest of a WebAuthn Relying Party, subject to user consent.” “Subsequently, the public key credential can only be accessed by origins belonging to that Relying Party.” In the terminology, “The credential private key is bound to a particular authenticator — its managing authenticator — and is expected to never be exposed to any other party, not even to the owner of the authenticator.” The registration walk-through in the same specification has the server store “the credential public key.” This page does not claim that NEOS implements WebAuthn Level 2, FIDO2, or a particular authenticator. It uses the public model of a device-held private key and a server-held public key.",
            ],
          },
          {
            strongLead: ["The same specification:"],
            rest: [
              " “Authenticators are responsible for ensuring that no operation is performed without user consent.” Platform authenticators are implemented on the device; roaming authenticators are off-device (USB, BLE, or NFC). If the page mentions device-held keys, that distinction is kept. Which kind NEOS uses is not invented; Terms say “a key generated in your browser. The private key stays in that browser.”",
            ],
          },
          {
            strongLead: [
              "CISA, ",
              { em: "Implementing Phishing-Resistant MFA," },
              " October 2022:",
            ],
            rest: [
              " “The only widely available phishing-resistant authentication is FIDO/WebAuthn authentication.” “The FIDO Alliance originally developed the WebAuthn protocol as part of FIDO2 standards and is now published by the World Wide Web Consortium (W3C).” Authenticators “can either be: separate physical tokens (called ‘roaming’ authenticators)… or embedded into laptops or mobile devices as ‘platform’ authenticators.” CISA calls phishing-resistant MFA the gold standard and notes that not all MFA is equally secure (OTP and push are described as weaker / phishing-vulnerable). That explains why a device-held key is a different habit from a reused secret. It is not a claim that NEOS is CISA-assessed, or that W3C endorses the product.",
            ],
          },
        ],
      },
      {
        kind: "p",
        body: [
          "The live homepage and Terms already state the product claim this page does not embroider: “There is no blockchain and no token. A browser sign-in can use a key generated on the device; the private key stays in that browser.” Terms: “You may create a username and password, or sign in with a key generated in your browser. The private key stays in that browser. If you lose it, this workspace does not have a copy to restore.” The sibling essay ",
          link("The key stays in the browser", BLOG_KEY),
          " already says the key is not a wallet, and refuses to invent OmniOne details. Follow it.",
        ],
      },
      { kind: "h2", text: "The bill for a split system" },
      {
        kind: "ul",
        items: [
          { strongLead: ["Calling the key a wallet, a token, or a share."] },
          { strongLead: ["Inventing NEOS cryptography, a WebAuthn certification, or a recovery backdoor the Terms say does not exist."] },
          { strongLead: ["OmniOne or Bali travelogues, or implying password sign-in has been removed."] },
        ],
      },
      { kind: "h2", text: "A shared record, applied here" },
      {
        kind: "ul",
        items: [
          { strongLead: ["Say, in the same breath, where the private key lives and that the workspace cannot restore it."] },
          {
            strongLead: ["Keep “no blockchain and no token” in the same section,"],
            rest: [" because the usual alternative to a rented account is a rented coin."],
          },
          {
            strongLead: ["Treat fail-closed refusal of a request as compatible with this model:"],
            rest: [" the workspace can still say no; it should not become the owner of the identity it recognises."],
          },
        ],
      },
      { kind: "h2", text: "What NEOS is, and is not, on this page" },
      {
        kind: "p",
        body: [
          "Early software. v0.1.0 and the 54-skills / 10-layers count appear only as already published, not as a security badge. This page does not invent a location, a steward, or a live deployment for OmniOne. The key is for signing a decision, not for buying a representation of one — see ",
          link("ACT is not a vote", ACT_PATH),
          ".",
        ],
      },
      { kind: "h2", text: "Sources" },
      { kind: "p", body: "Every stat on this page is cited." },
      { kind: "sources" },
      { kind: "h2", text: "An illustrative scenario" },
      {
        kind: "p",
        body: "This is a worked example, not a customer. A member signs a decision from a browser key and later loses the browser profile. The workspace cannot mint a replacement key. The person uses whatever other sign-in the Terms still offer, or starts again. The key was never a wallet, and there was never a spare copy.",
      },
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
        body: "The Sociocracy Group states the consent principle as a way of deciding in which the arguments are central, because none of the members has a paramount and well-founded objection — and it says, in those words, that consent is not consensus: it does not mean that everyone agrees. Consent, in this public method, is the absence of a paramount, well-founded objection — not a room in which everyone agrees, and not a tally.",
      },
      {
        kind: "p",
        body: [
          "This is a field definition of consent as a decision rule, not a NEOS-certification claim, and not a rewrite of the live essay ",
          link("ACT is not a vote", BLOG_ACT),
          ". NEOS is not a certified implementation of The Sociocracy Group's method. This page does not invent a double-link, a TSG election, a training badge, or an objection percentage. It does not say that TSG endorses NEOS. There is no blockchain and no token.",
        ],
      },
      { kind: "h2", text: "Hero figures" },
      {
        kind: "ul",
        items: [
          {
            strongLead: ["The Sociocracy Group, “4 principles.”"],
            rest: [
              " “The consent principle is the way of decision-making in which the arguments for taking a decision are central, which is expressed by the fact that none of the members has a paramount and well-founded objection against that decision.”",
            ],
          },
          {
            strongLead: ["The same page, on consensus:"],
            rest: [
              " “Consent is not consensus — it does not mean that everyone agrees. It means that nobody is aware of a risk that we cannot afford to take.”",
            ],
          },
        ],
      },
      { kind: "h2", text: "TSG's words" },
      {
        kind: "p",
        body: [
          "Arguments are central; no paramount, well-founded objection; not consensus; “nobody is aware of a risk that we cannot afford to take.” The operational sibling — what makes an objection paramount and well-founded — is ",
          link("What is a well-founded objection", OBJECTION_PATH),
          ". ",
          link("Circles, policy, and domains", CIRCLES_PATH),
          " is the sibling for where policy is decided and execution is delegated.",
        ],
      },
      {
        kind: "p",
        body: [
          "The house distinction is already in ",
          link("ACT is not a vote", BLOG_ACT),
          ": ACT means Advice, Consent, and Test; it is not a popularity vote and not a share of ownership. The essay's warnings — silence is not consent, and a 60 percent tally is not a mandate — are the essay's warnings, not new research findings, and no percentages are added here as research. ",
          link("How NEOS governs", GOVERNANCE),
          " is the product page for the house model.",
        ],
      },
      { kind: "h2", text: "An illustrative scenario" },
      {
        kind: "p",
        body: "This is a worked example, not a council and not a customer. A group is told it “decides by consent,” and the facilitator treats a round of nods as everyone agreeing. TSG's sentence is already the correction: consent is not consensus, and it does not mean that everyone agrees.",
      },
      { kind: "h2", text: "Sources" },
      { kind: "p", body: "Every stat on this page is cited." },
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
        body: "W3C WebAuthn Level 2 defines an API for creating and using strong, attested, scoped, public-key credentials in the browser. FIDO describes a passkey as a FIDO credential stored on a device, unlocked the way the device is unlocked, designed so there are no shared secrets. The credential is a scoped public key, held by an authenticator, not a shared secret the site stores as a typed password.",
      },
      {
        kind: "p",
        body: [
          "This is a standards page, not a rewrite of ",
          link("Keys in the browser", KEYS_PATH),
          ", and not a password-manager review. The live practice page, and the essay ",
          link("The key stays in the browser", BLOG_KEY),
          ", are the house siblings. This page does not claim a NEOS certification, a particular authenticator, or a token. “Passkey” is not a house product name. There is no blockchain and no token.",
        ],
      },
      { kind: "h2", text: "Hero figures" },
      {
        kind: "ul",
        items: [
          {
            strongLead: [
              "W3C, ",
              { em: "Web Authentication: An API for accessing Public Key Credentials Level 2," },
              " W3C Recommendation, 8 April 2021.",
            ],
            rest: [
              " “This specification defines an API enabling the creation and use of strong, attested, scoped, public key-based credentials by web applications, for the purpose of strongly authenticating users. Conceptually, one or more public key credentials, each scoped to a given WebAuthn Relying Party, are created by and bound to authenticators as requested by the web application.”",
            ],
          },
          {
            strongLead: ["FIDO Alliance, “Passkeys.”"],
            rest: [
              " “A passkey is an authentication credential based on FIDO standards, that can be stored on your phone or computer, or in a hardware security key allowing a user to sign in to apps and websites with the same process that they use to unlock their device (biometrics, PIN, or pattern).” “Passkeys are FIDO cryptographic credentials that are tied to a user's account on a website or application.”",
            ],
          },
          {
            strongLead: ["The same FIDO page, on passwords and on the word itself:"],
            rest: [
              " “A password is something that can be remembered and typed, and a passkey is a secret stored on one's devices, unlocked by the user the same way they unlock their device (biometrics, security key, PIN, pattern, etc.).” “Unlike passwords, passkeys are phishing-resistant, are always strong, and are designed so that there are no shared secrets.” “The word 'passkey' is a common noun; think of it the way you would refer to 'password'. It should be written in lowercase except when beginning a sentence.” “From a technical standpoint, passkeys are FIDO credentials for passwordless authentication.” “The same standards, commonly known as FIDO2 (WebAuthn and CTAP), are leveraged to deploy FIDO with passkeys for sign-in. The WebAuthn standard covers the browser API that manages passkeys.”",
            ],
          },
        ],
      },
      { kind: "h2", text: "W3C and FIDO, in their own words" },
      {
        kind: "p",
        body: "Level 2, 8 April 2021; strong, attested, scoped; created by and bound to authenticators. This page does not invent WebAuthn Level 3, or later, behavior; only Level 2 was opened. FIDO2 is WebAuthn plus CTAP; WebAuthn is the browser API. A passkey is a common noun.",
      },
      {
        kind: "p",
        body: [
          "The two storage modes — synced across a user's devices, or bound to a particular device — are the subject of ",
          link("Synced and device-bound passkeys", SYNCED_PATH),
          ". This page does not use third-party percentage claims that appear on the FIDO page (Yubico, Amazon, Google, SlashNext, IBM). Those primary sources were not opened, and the figures are not used here.",
        ],
      },
      { kind: "h2", text: "An illustrative scenario" },
      {
        kind: "p",
        body: "This is a worked example, not a customer and not a certification. A site is described as “using passkeys,” and the only credential it stores is still a typed password, with a public-key option mentioned in a backlog. W3C's and FIDO's sentences are already the reason that description does not yet fit.",
      },
      { kind: "h2", text: "Sources" },
      { kind: "p", body: "Every stat on this page is cited." },
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
        body: "The Sociocracy Group describes a circle as a semi-autonomous team with a common aim, which decides policy by the sociocratic method and delegates execution — “clear domains with freedom to decide” — and which may, by consent, choose to use other decision-making methods. Policy is decided in the circle; execution is delegated into a clear domain, with freedom to decide inside that domain.",
      },
      {
        kind: "p",
        body: "This is a field note about circles and domains, not a claim that NEOS has implemented TSG's full method, and not an invented org chart. NEOS is not a certified implementation of The Sociocracy Group's method. This page does not invent a double-link, a TSG election, or a training badge. The opened About and governance-model pages do not claim a TSG double-link or a TSG election, and none is invented here. There is no blockchain and no token.",
      },
      { kind: "h2", text: "Hero figures" },
      {
        kind: "ul",
        items: [
          {
            strongLead: ["The Sociocracy Group, “4 principles.”"],
            rest: [
              " “The circle decides about policy and delegates the execution to the members. This means delegates clear domains with freedom to decide.”",
            ],
          },
          {
            strongLead: ["The same page, on what a circle is:"],
            rest: [
              " “A circle is a semi autonomous team of individuals who determine policy according to the Sociocratic method for the realization of a common aim.” “Each circle defines its policy and decides by consent to use other decision-making methods.”",
            ],
          },
        ],
      },
      { kind: "h2", text: "TSG's words" },
      {
        kind: "p",
        body: [
          "Semi-autonomous team; common aim; policy by the sociocratic method; delegation of execution; consent to use another method. ",
          link("Consent is not consensus", CONSENT_PATH),
          " is the definition of that decision rule. ",
          link("What is a well-founded objection", OBJECTION_PATH),
          " is the test for an objection.",
        ],
      },
      {
        kind: "p",
        body: [
          "If live NEOS pages already describe roles created by consent and explicit domains, they may be pointed at as house wording, not as TSG certification. ",
          link("How NEOS governs", GOVERNANCE),
          " and ",
          link("ACT is not a vote", BLOG_ACT),
          " are those house pages.",
        ],
      },
      { kind: "h2", text: "An illustrative scenario" },
      {
        kind: "p",
        body: "This is a worked example, not a council and not a customer. A group is called a circle, policy and execution are discussed in the same undifferentiated pile, and no one can say which domain a person is free to decide in. TSG's “clear domains with freedom to decide” sentence is already the missing piece.",
      },
      { kind: "h2", text: "Sources" },
      { kind: "p", body: "Every stat on this page is cited." },
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
        body: "In The Sociocracy Group's statement of consent, the decision stands when none of the members has a paramount and well-founded objection — which they gloss as nobody being aware of a risk that the group cannot afford to take. An objection, in this method, has to be paramount and well-founded: a risk the group cannot afford, not a preference that was not met.",
      },
      {
        kind: "p",
        body: [
          "This is a field note about the test for an objection, not a veto manifesto, and not a second copy of the ",
          link("consent is not consensus", CONSENT_PATH),
          " lede. That page is the definition sibling; this one is the operational sibling. NEOS is not a certified implementation of The Sociocracy Group's method. This page does not invent a formal objection template, a time limit, or a “paramount means X.” It does not call an objection a veto, or consent a unanimous vote. There is no blockchain and no token.",
        ],
      },
      { kind: "h2", text: "Hero figures" },
      {
        kind: "ul",
        items: [
          {
            strongLead: ["The Sociocracy Group, “4 principles.”"],
            rest: [
              " Consent is “expressed by the fact that none of the members has a paramount and well-founded objection against that decision.”",
            ],
          },
          {
            strongLead: ["The same page:"],
            rest: [
              " “Consent is not consensus — it does not mean that everyone agrees. It means that nobody is aware of a risk that we cannot afford to take.”",
            ],
          },
        ],
      },
      { kind: "h2", text: "TSG's words, again, because they are the test" },
      {
        kind: "p",
        body: "Paramount and well-founded; not “everyone agrees”; a risk we cannot afford to take. Those are the public words of the test. They are also the reason a preference that was not selected is not, on this method, already an objection.",
      },
      {
        kind: "p",
        body: [
          "The live essay ",
          link("ACT is not a vote", BLOG_ACT),
          " already warns against treating silence as consent, or a tally as a mandate. That distinction is reused here; no percentages are added as research findings. ",
          link("Circles, policy, and domains", CIRCLES_PATH),
          " is the sibling for where policy is decided. ",
          link("How NEOS governs", GOVERNANCE),
          " is the product page.",
        ],
      },
      { kind: "h2", text: "An illustrative scenario" },
      {
        kind: "p",
        body: "This is a worked example, not a council and not a customer. A member is asked to “object or let it through,” and objects because a different option would have been nicer, without naming a risk the group cannot afford. TSG's gloss is already the reason that is not yet a well-founded objection, in this method's public words.",
      },
      { kind: "h2", text: "Sources" },
      { kind: "p", body: "Every stat on this page is cited." },
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
        body: "FIDO is explicit that passkeys “can be securely synced across a user's devices, or bound to a particular device (device-bound passkeys).” Those are not the same arrangement, and a record of a credential should say which one it is. Say whether the passkey is synced or device-bound. Those are both FIDO arrangements; they are not interchangeable without saying so.",
      },
      {
        kind: "p",
        body: [
          "This is a field distinction about where a credential lives, not a rewrite of ",
          link("WebAuthn and passkeys", WEBAUTHN_PATH),
          ", and not a claim that NEOS syncs keys. “The key stays in the browser” remains house practice for what NEOS already describes on ",
          link("Keys in the browser", KEYS_PATH),
          "; this page does not quietly extend it into a sync product. There is no blockchain and no token. This page does not invent recovery or escrow procedures, and it does not use FIDO's third-party percentage claims.",
        ],
      },
      { kind: "h2", text: "Hero figures" },
      {
        kind: "ul",
        items: [
          {
            strongLead: ["FIDO Alliance, “Passkeys.”"],
            rest: [
              " “Passkeys can be securely synced across a user's devices, or bound to a particular device (device-bound passkeys).” “The cryptographic keys are used from end-user devices (computers, phones, or security keys) for user authentication.”",
            ],
          },
          {
            strongLead: ["The same page, on a capability that should not flatten the distinction:"],
            rest: [
              " “Passkeys simplify account registration for apps and websites, are easy to use, work across all of a user's devices, and even other devices within physical proximity.” That line describes a capability FIDO states. It does not flatten into “every passkey always syncs,” because the same page also names device-bound passkeys. “Since all passkeys are FIDO credentials, a web service implementing support for FIDO will be able to support all passkey implementations.”",
            ],
          },
          {
            strongLead: ["W3C WebAuthn Level 2"],
            rest: [
              " (opened, 8 April 2021) remains the browser API for public-key credentials scoped to a relying party. This page points at the ",
              link("WebAuthn guide", WEBAUTHN_PATH),
              " for that API. It does not invent Level-2 language about sync that the opened abstract did not state.",
            ],
          },
        ],
      },
      { kind: "h2", text: "FIDO's two modes, in FIDO's words" },
      {
        kind: "p",
        body: "Synced across a user's devices, or bound to a particular device. Keys used from computers, phones, or security keys. Proximity is a capability FIDO names; it does not erase the device-bound case. A record that only says “passkey” has not yet said which arrangement it is.",
      },
      { kind: "h2", text: "An illustrative scenario" },
      {
        kind: "p",
        body: "This is a worked example, not a customer and not a NEOS feature. A practice note says “the key stays on the device,” and the actual credential is a synced passkey that also lives on a second phone. FIDO already names both arrangements. The useful record would have said which one it was.",
      },
      { kind: "h2", text: "Sources" },
      { kind: "p", body: "Every stat on this page is cited." },
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
        body: "TSG's election principle is that almost any decision can be delegated to operational roles or processes by a policy decision made with consent, but “the one sort of decision we cannot delegate is the election of an important role — particularly the representative.” NEOS is not a certified implementation of The Sociocracy Group's method. This page says so when TSG is cited. It does not invent a double-link, or a TSG election, that live NEOS pages do not claim. This is a field note about a decision that, in this method, is not handed off, not a NEOS certification page.",
      },
      { kind: "h2", text: "Hero figures" },
      {
        kind: "ul",
        items: [
          {
            strongLead: ["The Sociocracy Group, “4 principles,” under Election:"],
            rest: [
              " “The Principle of Election by consent provides an important counter-balance. While we can delegate almost any decision to operational roles or processes, using a policy decision made with consent, the one sort of decision we cannot delegate is the election of an important role — particularly the representative. Representatives must be chosen by consent of the circle which they represent. This ensures that the organization is woven together by a web of consent, and that power flows in circles through the entire organization.”",
            ],
          },
          {
            strongLead: ["The same page, under Double link,"],
            rest: [
              " also says a circle “has a link with the next higher circle in such a way that at least two persons, the functional leader and at least one elected representative from the circle, belong to the next higher circle and participate in the higher circle on an equivalent basis.” That paragraph is quoted only as TSG's description of its method. Live NEOS About and governance-model pages are not used here as evidence of a TSG double-link, and none is invented. A footnote on the page marks starred sentences as “TSG Standard: Patterns for application, Anchoring of SCM in legal terms.”",
            ],
          },
        ],
      },
      { kind: "h2", text: "What this page does not claim" },
      {
        kind: "p",
        body: [
          "TSG is not treated as a live NEOS rule or certification. No election process or role list is invented beyond what the opened page states and what live NEOS pages claim. ",
          link("Circles, policy, and domains", CIRCLES_PATH),
          " and ",
          link("Consent is not consensus", CONSENT_PATH),
          " are the method siblings. ",
          link("Agreements and decision records", AGREEMENTS_PATH),
          " is the already-briefed record sibling. ",
          link("What is a well-founded objection", OBJECTION_PATH),
          " is the objection companion. House siblings for already-public NEOS wording only, not as evidence of a TSG certification: ",
          link("How NEOS governs", GOVERNANCE),
          ", ",
          link("ACT is not a vote", BLOG_ACT),
          ".",
        ],
      },
      { kind: "h2", text: "An illustrative scenario" },
      {
        kind: "p",
        body: "This is a worked example, not a customer and not a certification. A representative is “just appointed” for a circle, without consent of the circle represented. TSG's election paragraph already says that particular decision cannot be delegated.",
      },
      { kind: "h2", text: "Sources" },
      { kind: "p", body: "Every stat on this page is cited." },
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
        body: "WebAuthn is the web API for public-key credentials. CTAP, in the opened FIDO document, is the application-layer protocol between a client or platform and a roaming authenticator, and is part of the FIDO2 project alongside WebAuthn. This is a short map of two related specifications, not a hardware-product page, not a protocol-attack discussion, and not a claim that NEOS implements CTAP or holds a FIDO certification.",
      },
      { kind: "h2", text: "Hero figures" },
      {
        kind: "ul",
        items: [
          {
            strongLead: ["Client to Authenticator Protocol (CTAP), FIDO Alliance Proposed Standard, 21 June 2022"],
            rest: [
              " (this version: fido-v2.1-ps-20210615, errata of 21 June 2022). Abstract: “This specification describes an application layer protocol for communication between a roaming authenticator and another client/platform, as well as bindings of this application protocol to a variety of transport protocols using different physical media.” Status: “This document was published by the FIDO Alliance as a Proposed Standard Specification.” “Other documents may supersede this document.” The FIDO Alliance specifications index, also opened, still listed this same CTAP URL. This page does not claim that no later CTAP revision exists beyond what that index and this document showed, and it does not treat “Proposed Standard, 21 June 2022” as a later final edition.",
            ],
          },
          {
            strongLead: ["The same document, §1 Introduction (non-normative) and §1.1 Relationship to Other Specifications."],
            rest: [
              " “This protocol is intended to be used in scenarios where a user interacts with a Relying Party (a website or native app) on some platform (e.g., a PC) which prompts the user to interact with a roaming authenticator (e.g., a smartphone).” “This specification is part of the FIDO2 project, which includes this specification and is related to the W3C [WebAuthn] specification.” It refers to two CTAP protocol versions: CTAP1/U2F, “defined by the U2F Raw Messages specification,” and CTAP2, “whose messages are encoded in the CTAP2 canonical CBOR encoding form.” “Authenticators implementing CTAP2 are referred to as CTAP2 authenticators, FIDO2 authenticators, or WebAuthn authenticators.” “Both CTAP1 and CTAP2 share the same underlying transports: USB Human Interface Device (USB HID), Near Field Communication (NFC), and Bluetooth Smart / Bluetooth Low Energy Technology (BLE).” “Occasionally, the term ‘CTAP’ may be used without clarifying whether it is referring to CTAP1 or CTAP2. In such cases, it should be understood to be referring to the entirety of this specification or portions of this specification that are not specific to either CTAP1 or CTAP2.” The same section notes that “for certifications, other requirements than those specified in this specification may apply” and points readers toward the certifying organization. That is not a claim about NEOS.",
            ],
          },
        ],
      },
      {
        kind: "p",
        body: "This page names CTAP1/U2F and CTAP2 only as the document names them, and names the three shared transports. It does not write command lists, PIN flows, or interop recipes. It uses no third-party percentage claims from FIDO marketing pages.",
      },
      { kind: "h2", text: "Related pages" },
      {
        kind: "p",
        body: [
          link("WebAuthn and passkeys", WEBAUTHN_PATH),
          " and ",
          link("Synced and device-bound passkeys", SYNCED_PATH),
          " are the batch-1 siblings. ",
          link("WebAuthn Level 2 and Level 3", LEVELS_PATH),
          " is the status companion in this batch. ",
          link("Keys in the browser", KEYS_PATH),
          " is the house practice sibling.",
        ],
      },
      { kind: "h2", text: "An illustrative scenario" },
      {
        kind: "p",
        body: "This is a worked example, not a customer and not a certification. A site is described as “FIDO2 certified” because it mentions WebAuthn, with no account of a client-to-authenticator protocol and no certification. The opened CTAP document already distinguishes the companion protocol, and already says that certifications may have other requirements.",
      },
      { kind: "h2", text: "Sources" },
      { kind: "p", body: "Every stat on this page is cited." },
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
        body: [
          "WebAuthn Level 3 is a W3C Recommendation dated 25 August 2026. Level 2, dated 8 April 2021, is still a Recommendation. The later document still describes scoped public-key credentials, created subject to user consent, and usable only by origins of that relying party. This is a short status note about two Recommendations, not a “what's new in the API” marketing page, and not a claim that NEOS implements either level. The batch-1 ",
          link("WebAuthn and passkeys", WEBAUTHN_PATH),
          " page cited Level 2; this child records the later level and does not replace that brief.",
        ],
      },
      { kind: "h2", text: "Hero figures" },
      {
        kind: "ul",
        items: [
          {
            strongLead: [
              { em: "Web Authentication: An API for accessing Public Key Credentials Level 3," },
              " W3C Recommendation, 25 August 2026.",
            ],
            rest: [
              " This version: ",
              link("https://www.w3.org/TR/2026/REC-webauthn-3-20260825/", "https://www.w3.org/TR/2026/REC-webauthn-3-20260825/"),
              ". Latest published version: ",
              link("https://www.w3.org/TR/webauthn-3/", "https://www.w3.org/TR/webauthn-3/"),
              ". Previous versions listed in the document head include the Candidate Recommendation Snapshot of 26 May 2026, the Level 2 Recommendation of 8 April 2021, and the Level 1 Recommendation of 4 March 2019. Abstract: “This specification defines an API enabling the creation and use of strong, attested, scoped, public key-based credentials by web applications, for the purpose of strongly authenticating users. Conceptually, one or more public key credentials, each scoped to a given WebAuthn Relying Party, are created by and bound to authenticators as requested by the web application. The user agent mediates access to authenticators and their public key credentials in order to preserve user privacy. Authenticators are responsible for ensuring that no operation is performed without user consent.”",
            ],
          },
          {
            strongLead: ["The same Recommendation, §1 Introduction (non-normative)."],
            rest: [
              " “A public key credential is created and stored by a WebAuthn Authenticator at the behest of a WebAuthn Relying Party, subject to user consent. Subsequently, the public key credential can only be accessed by origins belonging to that Relying Party. This scoping is enforced jointly by conforming User Agents and authenticators. Additionally, privacy across Relying Parties is maintained; Relying Parties are not able to detect any properties, or even the existence, of credentials scoped to other Relying Parties.” Registration and Authentication remain the two ceremonies. This page does not write an implementation walk-through of `create()` and `get()`.",
            ],
          },
          {
            strongLead: ["The same Recommendation, §18.1 Changes since Web Authentication Level 2 [webauthn-2-20210408]."],
            rest: [
              " This section is the official change list. Editorial changes include: “Introduced credential record concept to formalize what data Relying Parties need to store and how it relates between registration and authentication ceremonies.” Substantive “new features” named in the opened list include JSON (de)serialization methods, create operations in cross-origin iframes, conditional mediation for create and for get, a new `hybrid` transport enumeration value, signal methods for credential changes, a `topOrigin` client-data attribute, user-agent hints, using Web Authentication across related origins, backup-state flags, a compound attestation statement format, a pseudo-random function extension, and a registration parameter `attestationFormats`. Those features are named as the specification names them. The list is not turned into a how-to, and no NEOS support matrix is invented. Other substantive headings in the same section cover updated timeout guidance and several deprecations and removals; they are not paraphrased from memory here.",
            ],
          },
          {
            strongLead: ["Level 2,"],
            rest: [
              " already opened for batch 1, remains a Recommendation dated 8 April 2021. A later-than-Level-3 Editor's Draft URL is listed in the document; it is not this Recommendation and is not described here.",
            ],
          },
        ],
      },
      { kind: "h2", text: "What this page does not claim" },
      {
        kind: "p",
        body: [
          "NEOS is not described as implementing Level 2 or Level 3. ",
          link("CTAP and FIDO2", CTAP_PATH),
          " is the companion-protocol sibling. ",
          link("Synced and device-bound passkeys", SYNCED_PATH),
          " and ",
          link("Keys in the browser", KEYS_PATH),
          " are the practice siblings. No tokens, no third-party percentages, and no exploit steps.",
        ],
      },
      { kind: "h2", text: "An illustrative scenario" },
      {
        kind: "p",
        body: "This is a worked example, not a customer and not a certification. A note says “we follow WebAuthn” without saying which Recommendation, and treats Level 2 as if Level 3 had not been published. Both dates are already official, and this page exists to keep them distinct.",
      },
      { kind: "h2", text: "Sources" },
      { kind: "p", body: "Every stat on this page is cited." },
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
