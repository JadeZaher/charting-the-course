import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { LIVE_ACT_SENTENCE } from "./practices";
import {
  ABOUT_OMNI,
  ACT_SENTENCE,
  ESCHERBRIDGE_SITES,
  IDAHO_VENUE,
  OPERATOR,
  PRIVACY_PAGE,
  PUBLIC_PAGES,
  TERMS_PAGE,
  feedXml,
  organizationJsonLd,
  renderShell,
  sitemapXml,
} from "./public-documents";

const shell = `<!DOCTYPE html><html><head><title>Old</title><meta name="description" content="old" /><meta property="og:image" content="https://neos.primusneo.com/og/neos-og-1200x630.png" /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:image" content="https://neos.primusneo.com/og/neos-og-1200x630.png" /></head><body><div id="crawlable"><!--crawlable-->old<!--/crawlable--></div><div id="root"></div></body></html>`;

test("public HTML carries the intro, About, terms, and privacy text", () => {
  const byPath = new Map(PUBLIC_PAGES.map((page) => [page.path, page]));
  const home = renderShell(shell, byPath.get("/")!);
  const about = renderShell(shell, byPath.get("/about")!);
  const terms = renderShell(shell, byPath.get("/terms")!);
  const privacy = renderShell(shell, byPath.get("/privacy")!);

  assert.match(home, /Find a community\./);
  assert.match(home, /NEOS is a workspace for communities to make shared decisions/);
  assert.equal(home.includes("New Earth Operating System"), false);
  assert.match(home, /Advice, Consent, and Test/);
  assert.match(home, /There is no blockchain and no token/);
  assert.match(home, /<a href="https:\/\/primusneo\.com">PrimusNeo, the lab whose stack this product belongs to<\/a>/);
  assert.equal(home.includes("nofollow"), false);
  assert.match(home, /<title>NEOS — Governance in Practice<\/title>/);
  assert.match(home, /rel="canonical" href="https:\/\/neos\.primusneo\.com\/"/);
  assert.match(home, /property="og:url" content="https:\/\/neos\.primusneo\.com\/"/);
  assert.match(home, /property="og:title" content="NEOS — Governance in Practice"/);
  assert.match(home, /name="twitter:title" content="NEOS — Governance in Practice"/);
  assert.match(home, /application\/ld\+json/);
  assert.match(home, /"@type":"WebSite"/);
  assert.match(home, /property="og:image" content="https:\/\/neos\.primusneo\.com\/og\/neos-og-1200x630\.png"/);
  assert.match(home, /name="twitter:card" content="summary_large_image"/);
  assert.match(home, /name="twitter:image" content="https:\/\/neos\.primusneo\.com\/og\/neos-og-1200x630\.png"/);
  assert.match(about, /property="og:image" content="https:\/\/neos\.primusneo\.com\/og\/neos-og-1200x630\.png"/);
  assert.match(about, /The New Earth Operating System\./);
  assert.match(about, /It is part of the <a href="https:\/\/primusneo\.com">PrimusNeo<\/a> stack/);
  assert.match(about, /rel="canonical" href="https:\/\/neos\.primusneo\.com\/about"/);
  assert.match(about, /property="og:url" content="https:\/\/neos\.primusneo\.com\/about"/);
  assert.match(about, /name="twitter:title" content="About NEOS — Governance in Practice"/);
  assert.match(about, /"@type":"WebSite"/);
  assert.equal(about.includes("at any scale"), false);
  assert.equal(about.includes("dignity, sovereignty, and collective intelligence"), false);
  assert.equal(about.includes("A complete governance stack"), false);
  assert.equal(about.includes("practical governance infrastructure"), false);
  assert.match(about, /A finished government in a box\./);
  assert.match(about, /Treat those as part of the skill set, not as a claim that every community already runs them\./);
  assert.match(about, /Decisions, experiments, and conflict records are supposed to remain findable/);
  assert.equal(about.includes("governance wisdom compounds"), false);
  assert.match(about, /OmniOne is a name carried in the NEOS operating-system notes\. This site does not state a location, a steward, or whether a deployment is live\./);
  assert.equal(about.includes("nofollow"), false);
  assert.match(about, /OmniOne/);
  assert.equal(about.includes("Bali"), false);
  assert.equal(about.includes("Green Earth"), false);
  assert.equal(ABOUT_OMNI.paragraphs.join(" ").includes("Bali"), false);
  assert.match(terms, new RegExp(IDAHO_VENUE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(terms, /Escherbridge, LLC/);
  assert.match(terms, /contact@escherbridge\.com/);
  assert.match(privacy, /username and password/);
  assert.match(privacy, /does not set a retention schedule/);
  assert.equal(/retain for|years of age|must be \d+|under \d+/i.test(privacy), false);
  assert.equal(PRIVACY_PAGE.sections.some((section) => /retain for|years of age/i.test(section.paragraphs.join(" "))), false);
  assert.equal(TERMS_PAGE.sections.at(-1)?.paragraphs[0], IDAHO_VENUE);

  const governance = renderShell(shell, byPath.get("/governance-model")!);
  assert.match(governance, /It is a governance operating system:/);
  assert.equal(governance.includes("complete governance"), false);
  assert.match(governance, /NEOS is part of <a href="https:\/\/primusneo\.com">PrimusNeo<\/a>/);
  assert.match(governance, /rel="canonical" href="https:\/\/neos\.primusneo\.com\/governance-model"/);

  const vote = renderShell(shell, byPath.get("/blog/act-is-not-a-vote")!);
  const key = renderShell(shell, byPath.get("/blog/the-key-stays-in-the-browser")!);
  assert.match(vote, /<h1>ACT is not a vote<\/h1>/);
  assert.match(vote, /A vote is a very efficient machine for producing a number\./);
  assert.match(vote, /NEOS is part of <a href="https:\/\/primusneo\.com">PrimusNeo<\/a>/);
  assert.match(key, /<h1>The key stays in the browser<\/h1>/);
  assert.match(key, /Most accounts are a loan\./);
  assert.match(key, /The operator software's public health check reports version 0\.1\.0, and its login page shows the same version\./);
  assert.equal(key.includes("the login chrome describe version"), false);
  assert.match(key, /NEOS is part of <a href="https:\/\/primusneo\.com">PrimusNeo<\/a>/);
  assert.match(vote, /<a href="https:\/\/neos-operating-system-production\.up\.railway\.app\/api\/v1\/health">NEOS operator health \(version 0\.1\.0, 54 skills loaded\)<\/a>/);
  assert.match(key, /<a href="https:\/\/neos-operating-system-production\.up\.railway\.app\/auth\/login">NEOS operator login chrome \(NEOS v0\.1\.0\)<\/a>/);
  const blog = renderShell(shell, byPath.get("/blog")!);
  assert.match(blog, /<h1>Blog<\/h1>/);
  assert.match(blog, /<a href="\/blog\/act-is-not-a-vote">ACT is not a vote<\/a>/);
  assert.match(blog, /<a href="\/blog\/the-key-stays-in-the-browser">The key stays in the browser<\/a>/);
  const news = renderShell(shell, byPath.get("/news")!);
  assert.match(news, /<h1>News<\/h1>/);
  assert.match(news, /Nothing has been announced here yet/);
  assert.match(news, /name="robots" content="noindex, follow"/);
  const practices = renderShell(shell, byPath.get("/practices")!);
  assert.match(practices, /<h1>What the workspace already names\.<\/h1>/);
  assert.match(practices, /The figures and standards are other people’s/);
  assert.match(practices, /<a href="\/practices\/act-is-not-a-vote">/);
  assert.match(practices, /<a href="\/practices\/agreements-decision-records">/);
  assert.match(practices, /<a href="\/practices\/keys-in-the-browser">/);
  assert.match(practices, /<a href="\/practices\/consent-is-not-consensus">Consent is not consensus<\/a>/);
  assert.match(practices, /<a href="\/practices\/webauthn-and-passkeys">WebAuthn and passkeys<\/a>/);
  assert.match(practices, /<a href="\/practices\/circles-and-domains">Circles, policy, and domains<\/a>/);
  assert.match(practices, /<a href="\/practices\/well-founded-objection">What is a well-founded objection<\/a>/);
  assert.match(practices, /<a href="\/practices\/synced-vs-device-bound-passkeys">Synced and device-bound passkeys<\/a>/);
  assert.match(practices, /<a href="\/practices\/roles-that-cannot-be-delegated">Roles that cannot be delegated<\/a>/);
  assert.match(practices, /<a href="\/practices\/fido2-ctap">CTAP and FIDO2<\/a>/);
  assert.match(practices, /<a href="\/practices\/webauthn-level-versions">WebAuthn Level 2 and Level 3<\/a>/);
  assert.match(practices, /"@type":"CollectionPage"/);
  assert.match(practices, /"@type":"ItemList"/);
  assert.match(practices, /"@type":"BreadcrumbList"/);
  const act = renderShell(shell, byPath.get("/practices/act-is-not-a-vote")!);
  assert.match(act, /<h1>A tally can be a mood that learned how to count\. ACT is slower on purpose\.<\/h1>/);
  assert.match(act, /<a href="\/governance-model">How NEOS governs<\/a>/);
  assert.match(act, /ACT means Advice, Consent, and Test: advice from the people affected, consent as a check for a reasoned objection, and a test of the proposal in practice\. It is not a popularity vote and not a share of ownership\./);
  assert.equal(act.includes("railway.app"), false);
  assert.match(act, /property="og:url" content="https:\/\/neos\.primusneo\.com\/practices\/act-is-not-a-vote"/);
  assert.equal(byPath.get("/practices/act"), undefined);
  assert.equal(byPath.get("/practices/learning-and-discovery"), undefined);
});

test("every public page carries the Escherbridge footer as follow links", () => {
  for (const publicPage of PUBLIC_PAGES) {
    const html = renderShell(shell, publicPage);
    assert.ok(html.includes("<p>An Escherbridge project</p>"), publicPage.path);
    assert.equal(html.includes("nofollow"), false, publicPage.path);
    for (const site of ESCHERBRIDGE_SITES) {
      assert.ok(html.includes(`<a href="${site.href}">${site.label}</a>`), `${publicPage.path} ${site.label}`);
    }
  }
  const ld = JSON.parse(organizationJsonLd()) as { "@graph": { "@type": string; name?: string; sameAs?: string[]; url?: string }[] };
  const org = ld["@graph"].find((node) => node["@type"] === "Organization" && node.name === "NEOS");
  const site = ld["@graph"].find((node) => node["@type"] === "WebSite");
  assert.ok(org);
  assert.ok(site);
  assert.deepEqual(org.sameAs, ESCHERBRIDGE_SITES.map((item) => item.href));
  assert.equal(org.url, "https://neos.primusneo.com/");
  const indexHtml = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../index.html"), "utf8");
  assert.match(indexHtml, /rel="canonical" href="https:\/\/neos\.primusneo\.com\/"/);
  assert.match(indexHtml, /property="og:url" content="https:\/\/neos\.primusneo\.com\/"/);
  assert.match(indexHtml, /name="twitter:title"/);
  assert.match(indexHtml, /id="crawlable"/);
  const embedded = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  assert.ok(embedded);
  const parsed = JSON.parse(embedded[1]) as { "@graph": { "@type": string; name?: string; sameAs?: string[] }[] };
  const embeddedOrg = parsed["@graph"].find((node) => node["@type"] === "Organization" && node.name === "NEOS");
  assert.ok(embeddedOrg);
  assert.deepEqual(embeddedOrg.sameAs, ESCHERBRIDGE_SITES.map((item) => item.href));
  assert.ok(parsed["@graph"].some((node) => node["@type"] === "WebSite"));
});

test("sitemap and robots name the public URLs", () => {
  const xml = sitemapXml();
  for (const page of PUBLIC_PAGES.filter((item) => item.indexable)) {
    assert.match(xml, new RegExp(page.canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.equal(xml.includes("https://neos.primusneo.com/news"), false);
  assert.match(xml, /<loc>https:\/\/neos\.primusneo\.com\/practices\/act-is-not-a-vote<\/loc>/);
  assert.match(xml, /<loc>https:\/\/neos\.primusneo\.com\/practices\/agreements-decision-records<\/loc>/);
  assert.match(xml, /<loc>https:\/\/neos\.primusneo\.com\/practices\/keys-in-the-browser<\/loc>/);
  assert.match(xml, /<loc>https:\/\/neos\.primusneo\.com\/practices\/consent-is-not-consensus<\/loc>/);
  assert.match(xml, /<loc>https:\/\/neos\.primusneo\.com\/practices\/webauthn-and-passkeys<\/loc>/);
  assert.match(xml, /<loc>https:\/\/neos\.primusneo\.com\/practices\/circles-and-domains<\/loc>/);
  assert.match(xml, /<loc>https:\/\/neos\.primusneo\.com\/practices\/well-founded-objection<\/loc>/);
  assert.match(xml, /<loc>https:\/\/neos\.primusneo\.com\/practices\/synced-vs-device-bound-passkeys<\/loc>/);
  assert.match(xml, /<loc>https:\/\/neos\.primusneo\.com\/practices\/roles-that-cannot-be-delegated<\/loc>/);
  assert.match(xml, /<loc>https:\/\/neos\.primusneo\.com\/practices\/fido2-ctap<\/loc>/);
  assert.match(xml, /<loc>https:\/\/neos\.primusneo\.com\/practices\/webauthn-level-versions<\/loc>/);
  assert.equal(xml.includes("/practices/learning-and-discovery"), false);
  assert.equal(xml.includes("/practices/agreements-and-decision-records"), false);
  assert.equal(xml.includes("https://neos.primusneo.com/practices/act<"), false);
  assert.match(xml, /sitemap\/0\.9/);
  const feed = feedXml();
  assert.match(feed, /<rss version="2.0">/);
  assert.match(feed, /https:\/\/neos\.primusneo\.com\/blog\/act-is-not-a-vote/);
  assert.match(feed, /https:\/\/neos\.primusneo\.com\/practices\/act-is-not-a-vote/);
  assert.match(feed, /https:\/\/neos\.primusneo\.com\/practices\/agreements-decision-records/);
  assert.match(feed, /https:\/\/neos\.primusneo\.com\/practices\/keys-in-the-browser/);
  assert.match(feed, /https:\/\/neos\.primusneo\.com\/practices\/consent-is-not-consensus/);
  assert.match(feed, /https:\/\/neos\.primusneo\.com\/practices\/webauthn-and-passkeys/);
  assert.match(feed, /https:\/\/neos\.primusneo\.com\/practices\/circles-and-domains/);
  assert.match(feed, /https:\/\/neos\.primusneo\.com\/practices\/well-founded-objection/);
  assert.match(feed, /https:\/\/neos\.primusneo\.com\/practices\/synced-vs-device-bound-passkeys/);
  assert.match(feed, /https:\/\/neos\.primusneo\.com\/practices\/roles-that-cannot-be-delegated/);
  assert.match(feed, /https:\/\/neos\.primusneo\.com\/practices\/fido2-ctap/);
  assert.match(feed, /https:\/\/neos\.primusneo\.com\/practices\/webauthn-level-versions/);
  assert.equal(feed.includes("/practices/act<"), false);
  assert.equal(feed.includes("/practices/learning-and-discovery"), false);
  assert.equal(feed.includes("/news<"), false);
  for (const page of PUBLIC_PAGES) {
    assert.ok(page.title.length <= 70, page.title);
    assert.equal(page.canonical.startsWith("https://neos.primusneo.com"), true, page.path);
  }
});

test("the three practices children are in the first HTML", () => {
  assert.equal(LIVE_ACT_SENTENCE, ACT_SENTENCE);
  const byPath = new Map(PUBLIC_PAGES.map((page) => [page.path, page]));
  const children = [
    "/practices/act-is-not-a-vote",
    "/practices/agreements-decision-records",
    "/practices/keys-in-the-browser",
  ];
  const urls = [
    "https://thesociocracygroup.com/4-principles/",
    "https://www.gov.uk/government/publications/records-and-information-created-by-hmrc/hmrc-records-and-information-collection-policy",
    "https://www.gov.uk/government/publications/guidance-management-of-private-office-information-and-records/guidance-for-the-management-of-private-office-information-and-records-html",
    "https://www.legislation.gov.uk/ukpga/2006/46/section/248",
    "https://www.legislation.gov.uk/ukpga/2006/46/section/249",
    "https://www.legislation.gov.uk/ukpga/2006/46/section/355",
    "https://ica.coop/en/cooperatives/cooperative-identity",
    "https://www.w3.org/TR/webauthn-2/",
    "https://www.w3.org/TR/2021/REC-webauthn-2-20210408/",
    "https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf",
    "https://ardanova.com/notes/a-record-is-not-a-right",
    "https://primusneo.com/industries/governance",
  ];
  const combined = children.map((path) => renderShell(shell, byPath.get(path)!)).join("\n");
  for (const url of urls) assert.ok(combined.includes(url), url);
  assert.equal(combined.includes("Live in Bali"), false);
  assert.equal(combined.includes("railway.app"), false);
  for (const path of children) {
    const html = renderShell(shell, byPath.get(path)!);
    assert.match(html, /<h1>[^<]+<\/h1>/);
    assert.match(html, /<h2>Sources<\/h2>/);
    assert.match(html, /<h2>A situation like this<\/h2>/);
    assert.equal(html.includes("Hero points"), false, path);
    assert.equal(html.includes("Every stat on this page is cited"), false, path);
    assert.equal(html.includes("An illustrative scenario"), false, path);
    assert.match(html, /"@type":"Article"/);
    assert.match(html, /"@type":"BreadcrumbList"/);
    assert.match(html, /"citation"/);
    const embedded = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(embedded);
    const parsed = JSON.parse(embedded[1]) as {
      "@graph": { "@type": string; citation?: { url?: string | string[]; datePublished?: string }[] }[];
    };
    const article = parsed["@graph"].find((node) => node["@type"] === "Article");
    assert.ok(article?.citation && article.citation.length >= 8, path);
    assert.equal(article.citation.some((item) => item.datePublished === "2026-11-10"), false, path);
  }
  assert.match(combined, /NEOS is not TSG-certified/);
  assert.match(combined, /Password sign-in is still offered/);
  assert.match(combined, /does not claim that NEOS implements WebAuthn/);
  assert.match(combined, /not a wallet/);
  assert.match(combined, /at least ten years/);
});

test("public operator contact is the city and email", () => {
  const operatorLine = `Contact ${OPERATOR.contact} at contact@escherbridge.com, ${OPERATOR.phone}, Boise, Idaho.`;
  assert.equal(OPERATOR.email, "contact@escherbridge.com");
  assert.equal(OPERATOR.address, "Boise, Idaho");
  assert.equal(
    `Contact ${OPERATOR.contact} at ${OPERATOR.email}, ${OPERATOR.phone}, ${OPERATOR.address}.`,
    operatorLine,
  );
  assert.equal(TERMS_PAGE.sections[0].paragraphs[1], operatorLine);
  assert.equal(PRIVACY_PAGE.intro[1], operatorLine);

  const street = /\b\d{2,6}\s+(?:[A-Z]\.?\s+)?[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:St|Street|Ln|Lane|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Way|Ct|Court)\b/;
  const zipNearIdaho = /\b\d{5}(?:-\d{4})?\b.{0,80}(?:\bIdaho\b|\bID\b)|(?:\bIdaho\b|\bID\b).{0,80}\b\d{5}(?:-\d{4})?\b/;
  const poBox = /\bP\.?\s*O\.?\s*Box\b/i;
  const allowedAddressKeys = ["addressCountry", "addressLocality", "addressRegion"];

  for (const page of PUBLIC_PAGES) {
    const html = renderShell(shell, page);
    assert.equal(street.test(html), false, page.path);
    assert.equal(zipNearIdaho.test(html), false, page.path);
    assert.equal(poBox.test(html), false, page.path);
    if (page.path === "/terms" || page.path === "/privacy") {
      assert.ok(html.includes(operatorLine), page.path);
      assert.ok(html.includes("Escherbridge, LLC"), page.path);
    }
    if (page.path === "/terms") {
      assert.ok(html.includes(IDAHO_VENUE), page.path);
    }
    const parsed = JSON.parse(page.jsonLd) as { "@graph": { address?: Record<string, unknown> }[] };
    for (const node of parsed["@graph"]) {
      if (node.address == null) continue;
      assert.equal(node.address.addressLocality, "Boise");
      assert.equal(node.address.addressRegion, "ID");
      assert.equal(node.address.addressCountry, "US");
      assert.deepEqual(
        Object.keys(node.address).filter((key) => key !== "@type").sort(),
        allowedAddressKeys,
      );
    }
  }
});

test("the five field guides are in the first HTML", () => {
  const byPath = new Map(PUBLIC_PAGES.map((page) => [page.path, page]));
  const guides = [
    {
      path: "/practices/consent-is-not-consensus",
      h1: "Consent is not consensus",
      standfirst: "The Sociocracy Group states the consent principle as a way of deciding",
      official: "The consent principle is the way of decision-making in which the arguments for taking a decision are central, which is expressed by the fact that none of the members has a paramount and well-founded objection against that decision.",
      tsg: true,
    },
    {
      path: "/practices/webauthn-and-passkeys",
      h1: "WebAuthn and passkeys",
      standfirst: "W3C WebAuthn Level 2 defines an API",
      official: "This specification defines an API enabling the creation and use of strong, attested, scoped, public key-based credentials by web applications",
      tsg: false,
    },
    {
      path: "/practices/circles-and-domains",
      h1: "Circles, policy, and domains",
      standfirst: "The Sociocracy Group describes a circle as a semi-autonomous team",
      official: "The circle decides about policy and delegates the execution to the members. This means delegates clear domains with freedom to decide.",
      tsg: true,
    },
    {
      path: "/practices/well-founded-objection",
      h1: "What is a well-founded objection",
      standfirst: "In The Sociocracy Group's statement of consent",
      official: "Consent is not consensus — it does not mean that everyone agrees. It means that nobody is aware of a risk that we cannot afford to take.",
      tsg: true,
    },
    {
      path: "/practices/synced-vs-device-bound-passkeys",
      h1: "Synced and device-bound passkeys",
      standfirst: "FIDO is explicit that passkeys",
      official: "Passkeys can be securely synced across a user's devices, or bound to a particular device (device-bound passkeys).",
      tsg: false,
    },
  ] as const;
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  const canonicals = new Set<string>();
  for (const page of PUBLIC_PAGES) {
    assert.equal(titles.has(page.title), false, page.title);
    assert.equal(descriptions.has(page.description), false, page.description);
    assert.equal(canonicals.has(page.canonical), false, page.canonical);
    titles.add(page.title);
    descriptions.add(page.description);
    canonicals.add(page.canonical);
  }
  const urls = [
    "https://thesociocracygroup.com/4-principles/",
    "https://www.w3.org/TR/webauthn-2/",
    "https://www.w3.org/TR/2021/REC-webauthn-2-20210408/",
    "https://fidoalliance.org/passkeys/",
  ];
  const combined = guides.map((guide) => renderShell(shell, byPath.get(guide.path)!)).join("\n");
  for (const url of urls) assert.ok(combined.includes(url), url);
  assert.equal(combined.includes("%"), false);
  assert.equal(combined.includes("wallet"), false);
  assert.equal(combined.includes("OmniOne"), false);
  assert.equal(combined.includes("Bali"), false);
  assert.equal(combined.includes("webauthn-3"), false);
  assert.equal(combined.includes("NEOS implements WebAuthn"), false);
  assert.equal(combined.includes("NEOS implements passkey"), false);
  const tokenRemainder = combined
    .replaceAll("There is no blockchain and no token.", "")
    .replaceAll("or a token.", "");
  assert.equal(tokenRemainder.toLowerCase().includes("token"), false);
  for (const guide of guides) {
    const html = renderShell(shell, byPath.get(guide.path)!);
    assert.match(html, new RegExp(`<h1>${guide.h1.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}</h1>`));
    assert.ok(html.includes(guide.standfirst), guide.path);
    assert.ok(html.includes(guide.official), guide.path);
    assert.match(html, /<h2>Sources<\/h2>/);
    assert.match(html, /<ol>/);
    assert.match(html, /<h2>A situation like this<\/h2>/);
    assert.equal(html.includes("Hero figures"), false, guide.path);
    assert.equal(html.includes("Every stat on this page is cited"), false, guide.path);
    assert.equal(html.includes("An illustrative scenario"), false, guide.path);
    assert.match(html, new RegExp(`rel="canonical" href="https://neos\\.primusneo\\.com${guide.path.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}"`));
    assert.match(html, /property="og:url"/);
    const embedded = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(embedded, guide.path);
    const parsed = JSON.parse(embedded[1]) as {
      "@graph": { "@type": string; headline?: string; citation?: { url?: string | string[]; datePublished?: string }[]; itemListElement?: { name?: string }[] }[];
    };
    const article = parsed["@graph"].find((node) => node["@type"] === "Article");
    const crumbs = parsed["@graph"].find((node) => node["@type"] === "BreadcrumbList");
    assert.equal(article?.headline, guide.h1, guide.path);
    assert.ok(article?.citation && article.citation.length >= 2, guide.path);
    assert.equal(article.citation.some((item) => item.datePublished === "2026-11-10"), false, guide.path);
    const crumbNames = crumbs?.itemListElement?.map((item) => item.name);
    assert.deepEqual(crumbNames, ["Home", "Practices", byPath.get(guide.path) ? PUBLIC_PAGES.find((page) => page.path === guide.path)?.title.replace(/ — Practices \| NEOS$/, "") : ""], guide.path);
    if (guide.tsg) {
      assert.match(html, /NEOS is not a certified implementation of The Sociocracy Group's method\./);
    }
  }
  const webauthn = renderShell(shell, byPath.get("/practices/webauthn-and-passkeys")!);
  const synced = renderShell(shell, byPath.get("/practices/synced-vs-device-bound-passkeys")!);
  assert.match(webauthn, /This page does not claim a NEOS certification, a particular authenticator, or a token\./);
  assert.match(webauthn, /only Level 2 was opened/);
  assert.match(synced, /not a claim that NEOS syncs keys/);
  assert.match(synced, /does not quietly extend it into a sync product/);
  assert.equal(synced.includes("https://www.w3.org/TR/2021/REC-webauthn-2-20210408/"), false);
});

test("the three batch-2 field guides are in the first HTML", () => {
  const byPath = new Map(PUBLIC_PAGES.map((page) => [page.path, page]));
  const guides = [
    {
      path: "/practices/roles-that-cannot-be-delegated",
      h1: "Roles that cannot be delegated: electing a representative",
      standfirst: "TSG's election principle is that almost any decision can be delegated",
      official: "the one sort of decision we cannot delegate is the election of an important role — particularly the representative",
      crumb: "Roles that cannot be delegated",
    },
    {
      path: "/practices/fido2-ctap",
      h1: "CTAP and FIDO2: how a client talks to an authenticator",
      standfirst: "CTAP, in the opened FIDO document, is the application-layer protocol",
      official: "This specification describes an application layer protocol for communication between a roaming authenticator and another client/platform",
      crumb: "CTAP and FIDO2",
    },
    {
      path: "/practices/webauthn-level-versions",
      h1: "WebAuthn Level 2 and Level 3",
      standfirst: "WebAuthn Level 3 is a W3C Recommendation dated 25 August 2026",
      official: "Authenticators are responsible for ensuring that no operation is performed without user consent.",
      crumb: "WebAuthn Level 2 and Level 3",
    },
  ] as const;
  const urls = [
    "https://thesociocracygroup.com/4-principles/",
    "https://fidoalliance.org/specs/fido-v2.1-ps-20210615/fido-client-to-authenticator-protocol-v2.1-ps-errata-20220621.html",
    "https://www.w3.org/TR/2026/REC-webauthn-3-20260825/",
    "https://www.w3.org/TR/webauthn-3/",
    "https://www.w3.org/TR/webauthn-2/",
  ];
  const combined = guides.map((guide) => renderShell(shell, byPath.get(guide.path)!)).join("\n");
  for (const url of urls) assert.ok(combined.includes(url), url);
  assert.match(combined, /Proposed Standard, 21 June 2022/);
  assert.match(combined, /fido-v2\.1-ps-20210615/);
  assert.match(combined, /does not treat “Proposed Standard, 21 June 2022” as a later final edition/);
  assert.match(combined, /25 August 2026/);
  assert.match(combined, /8 April 2021/);
  assert.match(combined, /26 May 2026/);
  assert.match(combined, /4 March 2019/);
  assert.equal(combined.includes("%"), false);
  assert.equal(combined.includes("wallet"), false);
  assert.equal(combined.includes("OmniOne"), false);
  assert.equal(combined.includes("Bali"), false);
  assert.equal(combined.includes("NEOS implements WebAuthn"), false);
  assert.match(combined, /not a claim that NEOS implements CTAP/);
  assert.match(combined, /not a claim that NEOS implements either level/);
  assert.match(combined, /NEOS is not described as implementing Level 2 or Level 3/);
  assert.match(combined, /NEOS is not a certified implementation of The Sociocracy Group's method/);
  assert.match(combined, /quoted only as TSG's description of its method/);
  assert.match(combined, /no NEOS support matrix is invented/);
  assert.match(combined, /does not write command lists, PIN flows, or interop recipes/);
  const roles = renderShell(shell, byPath.get("/practices/roles-that-cannot-be-delegated")!);
  const ctap = renderShell(shell, byPath.get("/practices/fido2-ctap")!);
  const levels = renderShell(shell, byPath.get("/practices/webauthn-level-versions")!);
  assert.match(roles, /<a href="\/practices\/circles-and-domains">/);
  assert.match(roles, /<a href="\/practices\/consent-is-not-consensus">/);
  assert.match(roles, /<a href="\/practices\/agreements-decision-records">/);
  assert.match(roles, /<a href="\/practices\/well-founded-objection">/);
  assert.match(ctap, /<a href="\/practices\/webauthn-and-passkeys">/);
  assert.match(ctap, /<a href="\/practices\/webauthn-level-versions">/);
  assert.match(ctap, /<a href="\/practices\/synced-vs-device-bound-passkeys">/);
  assert.match(ctap, /<a href="\/practices\/keys-in-the-browser">/);
  assert.match(levels, /<a href="\/practices\/fido2-ctap">/);
  assert.match(renderShell(shell, byPath.get("/practices/circles-and-domains")!), /<a href="\/practices\/roles-that-cannot-be-delegated">/);
  assert.match(renderShell(shell, byPath.get("/practices/consent-is-not-consensus")!), /<a href="\/practices\/roles-that-cannot-be-delegated">/);
  assert.match(renderShell(shell, byPath.get("/practices/well-founded-objection")!), /<a href="\/practices\/roles-that-cannot-be-delegated">/);
  assert.match(renderShell(shell, byPath.get("/practices/agreements-decision-records")!), /<a href="\/practices\/roles-that-cannot-be-delegated">/);
  assert.match(renderShell(shell, byPath.get("/practices/webauthn-and-passkeys")!), /<a href="\/practices\/fido2-ctap">/);
  assert.match(renderShell(shell, byPath.get("/practices/webauthn-and-passkeys")!), /<a href="\/practices\/webauthn-level-versions">/);
  assert.match(renderShell(shell, byPath.get("/practices/synced-vs-device-bound-passkeys")!), /<a href="\/practices\/fido2-ctap">/);
  assert.match(renderShell(shell, byPath.get("/practices/keys-in-the-browser")!), /<a href="\/practices\/webauthn-level-versions">/);
  for (const guide of guides) {
    const html = renderShell(shell, byPath.get(guide.path)!);
    assert.ok(html.includes(`<h1>${guide.h1}</h1>`), guide.path);
    assert.ok(html.includes(guide.standfirst), guide.path);
    assert.ok(html.includes(guide.official), guide.path);
    assert.match(html, /<h2>Sources<\/h2>/);
    assert.match(html, /<ol>/);
    assert.match(html, /<h2>A situation like this<\/h2>/);
    assert.equal(html.includes("Hero figures"), false, guide.path);
    assert.equal(html.includes("Every stat on this page is cited"), false, guide.path);
    assert.equal(html.includes("An illustrative scenario"), false, guide.path);
    assert.match(html, new RegExp(`rel="canonical" href="https://neos\\.primusneo\\.com${guide.path}"`));
    assert.match(html, /property="og:url" content="https:\/\/neos\.primusneo\.com/);
    const embedded = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    assert.ok(embedded, guide.path);
    const parsed = JSON.parse(embedded[1]) as {
      "@graph": { "@type": string; headline?: string; citation?: { datePublished?: string }[]; itemListElement?: { name?: string }[] }[];
    };
    const article = parsed["@graph"].find((node) => node["@type"] === "Article");
    const crumbs = parsed["@graph"].find((node) => node["@type"] === "BreadcrumbList");
    assert.equal(article?.headline, guide.h1, guide.path);
    assert.ok(article?.citation && article.citation.length >= 1, guide.path);
    assert.equal(article.citation.some((item) => item.datePublished === "2026-11-10"), false, guide.path);
    assert.deepEqual(crumbs?.itemListElement?.map((item) => item.name), ["Home", "Practices", guide.crumb], guide.path);
  }
});
