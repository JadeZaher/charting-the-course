// Two public notes. The sentences are the drafts in site-content/neos/blog.

export interface FollowLink {
  text: string;
  href: string;
}

export type Inline = string | FollowLink;
export type Paragraph = string | readonly Inline[];

export function plainParagraph(paragraph: Paragraph): string {
  if (typeof paragraph === "string") return paragraph;
  return paragraph.map((part) => (typeof part === "string" ? part : part.text)).join("");
}

export interface EssaySource {
  label: string;
  href: string;
}

export interface Essay {
  slug: string;
  path: string;
  title: string;
  date: string;
  summary: string;
  sources: readonly EssaySource[];
  paragraphs: readonly Paragraph[];
}

const PRIMUS_NEO = "https://primusneo.com";

export const WRITING = {
  path: "/writing",
  title: "Writing — NEOS",
  description: "ACT is not a vote. The key stays in the browser.",
  heading: "Writing",
} as const;

export const ESSAYS: readonly Essay[] = [
  {
    slug: "act-is-not-a-vote",
    path: "/writing/act-is-not-a-vote",
    title: "ACT is not a vote",
    date: "9 November 2026",
    summary:
      "A vote counts hands. ACT, as NEOS uses it, does something slower and more useful: it takes advice from the people affected, treats consent as a check for a reasoned objection, and then asks whether the proposal survives contact with practice. It is not a popularity contest, and it is not a share of ownership.",
    sources: [
      { label: "NEOS — Governance in Practice", href: "https://neos.primusneo.com" },
      { label: "About NEOS", href: "https://neos.primusneo.com/about" },
      { label: "How NEOS governs", href: "https://neos.primusneo.com/governance-model" },
      { label: "PrimusNeo", href: PRIMUS_NEO },
    ],
    paragraphs: [
      "A vote is a very efficient machine for producing a number. Hands go up, or a button is pressed, or a token is weighted, and at the end there is a tally, which can be written down and later pointed to as \"what we decided.\" The efficiency is the trap. A tally can be produced in a room that did not hear from the people who will have to live with the result, and it can be produced without anyone writing down the objection that should have stopped the work, and it can be produced without anyone checking, later, whether the thing that won still works. The number looks like a decision. Often it is only a mood that learned how to count.",
      "NEOS uses a slower protocol, and the public site already defines it in a sentence that should not be improved: ACT means Advice, Consent, and Test. Advice from the people affected. Consent as a check for a reasoned objection. A test of the proposal in practice. It is not a popularity vote and not a share of ownership.",
      "Advice is the part most \"voting apps\" skip because it cannot be scored on a dashboard. The people who will have to live with a rule are asked to speak before the rule is adopted, not after they have been outvoted. This is not a courtesy. It is how a later member, who was not in the room, can tell whether the decision was informed or merely quick.",
      "Consent, here, is not a synonym for a majority, and it is not a synonym for enthusiasm. It is a check for a reasoned objection: is there a concrete reason this proposal would harm the work, the people, or the agreements already in force? A group that treats silence as consent, or treats a 60 percent tally as a mandate, has gone back to running a vote under a friendlier name. The About page is already plain: consent is not majority rule, and NEOS is not a voting platform.",
      "Test is the part that keeps the protocol from becoming a seminar. A proposal that cannot be tried, in some bounded way, is a statement of values. A test is a way of finding out whether the proposal survives contact with the work it was supposed to improve. If it does not, the record should say so, and the group should be able to find that record later. A decision that cannot be found is a decision that cannot be taught, checked, or handed to the next circle.",
      "None of this requires a belief that every community should run on software. It requires a belief that a decision is more than a tally. NEOS is a visual workspace for that kind of record: agreements, roles, a journal of what was decided and under what rule. It is not a blockchain, and it is not a token. It does not sell a share, move money, or run a funding pool; economic coordination, in the skill stack, is a recorded practice, not a payment rail. A browser sign-in can use a key generated on the device, and the private key stays in that browser. The operator software describes itself as version 0.1.0, which is a good reason not to talk about it as a finished government in a box.",
      [
        "NEOS is part of ",
        { text: "PrimusNeo", href: PRIMUS_NEO },
        ", and it is offered here as its own product. The lab's habit is to write the test first. ACT is that habit, applied to a group that has to decide things: take advice, check for a reason to stop, then see whether the proposal works. A tally can still be useful, later, as one input. It is a poor substitute for the three steps, and it is a dangerous thing to sell under their name.",
      ],
    ],
  },
  {
    slug: "the-key-stays-in-the-browser",
    path: "/writing/the-key-stays-in-the-browser",
    title: "The key stays in the browser",
    date: "9 November 2026",
    summary:
      "An identity that lives in someone else's building can be revoked from someone else's building. NEOS can sign you in with a key generated on the device; the private key stays in that browser. There is no blockchain and no token, and that fact is the point, not a missing feature.",
    sources: [
      { label: "NEOS — Governance in Practice", href: "https://neos.primusneo.com" },
      { label: "About NEOS", href: "https://neos.primusneo.com/about" },
      { label: "PrimusNeo", href: PRIMUS_NEO },
    ],
    paragraphs: [
      "Most accounts are a loan. You are issued a row in someone else's table, you are asked to prove you still know a secret that the table also, in some hashed form, knows, and if the table is withdrawn, or sold, or simply having a day, the identity goes with it. This is so ordinary that it is described as \"your account,\" which is a generous pronoun. It is their account, with your name on it, for as long as they keep the lights on.",
      "NEOS offers a narrower arrangement, and the public homepage already states it without decoration: there is no blockchain and no token. A browser sign-in can use a key generated on the device; the private key stays in that browser. The point of that sentence is not fashion. It is a claim about where the thing that makes you you on this workspace actually lives. If it lives only in a vendor's building, then membership, a vote, a journal entry, and an exit are all, in the end, requests. If the key stays on the device, the workspace can still refuse a request — fail closed is sometimes the right answer — but it cannot quietly become the owner of the identity it is supposed to recognise.",
      "\"No blockchain and no token\" belongs in the same sentence, because the usual alternative to a rented account is a rented coin. A token is very good at looking like ownership. It can be counted, transferred, and mistaken for a vote, or for a share, or for a membership that will still be there when the platform is not. NEOS is explicit about the refusal: ACT is not a share of ownership, economic coordination is not a payment rail, and this workspace does not move money, issue a token, sell a share, or run a funding pool. The key is not a wallet. It is a way of signing a decision without first buying a representation of one.",
      "This is early software. The operator health check and the login chrome describe version 0.1.0. Fifty-four skills across ten layers are listed on the public About page; that is a description of the stack, not a maturity badge, and not a claim that a particular council is already running on it. OmniOne is a name carried in the operating-system notes. This site does not state a location, a steward, or whether a deployment is live, and this essay will not invent those details to make the key sound more travelled than it is.",
      "Exit, in that light, is not a flourish. The About page says a person can leave a circle, an ecosystem, or the platform, and can download the portable governance record the workspace already offers. Exit is not a payment and not a transfer of ownership. A portable record is only portable if the identity it is attached to is not trapped in a password-reset queue. The key in the browser is what makes that sentence more than a policy.",
      [
        "NEOS is part of ",
        { text: "PrimusNeo", href: PRIMUS_NEO },
        ", and it is offered here as its own product. The lab's prejudice is that a record should outlive a thread, and that a right should not be confused with a row. A key that stays on the device is a small, unglamorous version of that prejudice. It will not, by itself, make a group wise. It will make it harder to pretend that an identity was yours when it was only borrowed.",
      ],
    ],
  },
];
