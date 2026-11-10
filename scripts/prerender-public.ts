// After vite build, write per-route HTML so the first response contains the public text.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PUBLIC_PAGES, ROBOTS_TXT, outputFile, renderShell, sitemapXml } from "../client/src/lib/public-documents.ts";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist/public");
const shell = readFileSync(path.join(dist, "index.html"), "utf8");

for (const page of PUBLIC_PAGES) {
  const relative = outputFile(page.path);
  const target = path.join(dist, relative);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, renderShell(shell, page));
}

writeFileSync(path.join(dist, "sitemap.xml"), sitemapXml());
writeFileSync(path.join(dist, "robots.txt"), ROBOTS_TXT);
console.log(`Prerendered ${PUBLIC_PAGES.length} public pages into ${dist}`);
