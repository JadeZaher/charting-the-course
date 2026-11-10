import assert from "node:assert/strict";
import test from "node:test";
import {
  ABOUT_OMNI,
  IDAHO_VENUE,
  PRIVACY_PAGE,
  PUBLIC_PAGES,
  TERMS_PAGE,
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
  assert.match(home, /New Earth Operating System/);
  assert.match(home, /Advice, Consent, and Test/);
  assert.match(home, /<title>NEOS — Governance in Practice<\/title>/);
  assert.match(home, /rel="canonical" href="https:\/\/neos\.primusneo\.com\/"/);
  assert.match(home, /property="og:image" content="https:\/\/neos\.primusneo\.com\/og\/neos-og-1200x630\.png"/);
  assert.match(home, /name="twitter:card" content="summary_large_image"/);
  assert.match(home, /name="twitter:image" content="https:\/\/neos\.primusneo\.com\/og\/neos-og-1200x630\.png"/);
  assert.match(about, /property="og:image" content="https:\/\/neos\.primusneo\.com\/og\/neos-og-1200x630\.png"/);
  assert.match(about, /The New Earth Operating System\./);
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
});

test("sitemap and robots name the public URLs", () => {
  const xml = sitemapXml();
  for (const page of PUBLIC_PAGES) {
    assert.match(xml, new RegExp(page.canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(xml, /sitemap\/0\.9/);
});
