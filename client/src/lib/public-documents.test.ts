import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ABOUT_OMNI,
  ESCHERBRIDGE_SITES,
  IDAHO_VENUE,
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
  assert.match(practices, /These pages do not add figures/);
  const act = renderShell(shell, byPath.get("/practices/act")!);
  assert.match(act, /<h1>ACT is not a vote\.<\/h1>/);
  assert.match(act, /<a href="\/governance-model">How NEOS governs\.<\/a>/);
  assert.equal(act.includes("railway.app"), false);
  assert.match(act, /property="og:url" content="https:\/\/neos\.primusneo\.com\/practices\/act"/);
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
  assert.match(xml, /sitemap\/0\.9/);
  const feed = feedXml();
  assert.match(feed, /<rss version="2.0">/);
  assert.match(feed, /https:\/\/neos\.primusneo\.com\/blog\/act-is-not-a-vote/);
  assert.match(feed, /https:\/\/neos\.primusneo\.com\/practices\/act/);
  assert.equal(feed.includes("/news<"), false);
  for (const page of PUBLIC_PAGES) {
    assert.ok(page.title.length <= 70, page.title);
    assert.equal(page.canonical.startsWith("https://neos.primusneo.com"), true, page.path);
  }
});
