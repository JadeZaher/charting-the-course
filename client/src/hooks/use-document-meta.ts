import { useEffect } from "react";
import { publicHead } from "@/lib/public-documents";

const ORIGIN = "https://neos.primusneo.com";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let meta = document.querySelector(`meta[${attr}="${key}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attr, key);
    document.head.appendChild(meta);
  }
  const previous = meta.getAttribute("content") ?? "";
  meta.setAttribute("content", content);
  return () => meta?.setAttribute("content", previous);
}

function setOrDrop(attr: "name" | "property", key: string, content: string | undefined) {
  if (content) return setMeta(attr, key, content);
  const existing = document.querySelector(`meta[${attr}="${key}"]`);
  if (!existing) return () => {};
  const previous = existing.getAttribute("content") ?? "";
  existing.remove();
  return () => {
    const meta = document.createElement("meta");
    meta.setAttribute(attr, key);
    meta.setAttribute("content", previous);
    document.head.appendChild(meta);
  };
}

/** Keep the document title, description, and social tags aligned after a client-side navigation. */
export function useDocumentMeta(title: string, description: string, path?: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const restore = [
      setMeta("name", "description", description),
      setMeta("property", "og:title", title),
      setMeta("property", "og:description", description),
      setMeta("name", "twitter:title", title),
      setMeta("name", "twitter:description", description),
    ];
    const canonical = document.querySelector('link[rel="canonical"]');
    const previousCanonical = canonical?.getAttribute("href") ?? "";
    if (path) {
      const url = path === "/" ? `${ORIGIN}/` : `${ORIGIN}${path}`;
      const head = publicHead(path);
      restore.push(setMeta("property", "og:url", url));
      restore.push(setMeta("name", "robots", head.robots));
      restore.push(setMeta("property", "og:type", head.ogType));
      const published = head.ogType === "article" ? head.published : undefined;
      restore.push(setOrDrop("property", "article:published_time", published));
      restore.push(setOrDrop("property", "article:modified_time", published ? head.modified ?? published : undefined));
      canonical?.setAttribute("href", url);
    }
    return () => {
      document.title = previousTitle;
      for (const undo of restore) undo();
      if (path) canonical?.setAttribute("href", previousCanonical);
    };
  }, [title, description, path]);
}
