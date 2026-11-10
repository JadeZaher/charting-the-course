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
    "Practices the workspace already names: ACT is not a vote, agreements as findable records, and keys that stay in the browser. No token and no share-vote.",
  eyebrow: "Three practices · no token, no share-vote",
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
];

export const NEWS = {
  path: "/news",
  title: "News — NEOS",
  description: "Nothing has been announced here yet.",
  heading: "News",
  body: "Nothing has been announced here yet. This page will list a public, dated fact when one exists. It does not repeat the blog.",
} as const;
