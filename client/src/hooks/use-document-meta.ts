import { useEffect } from "react";

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
      restore.push(setMeta("property", "og:url", url));
      canonical?.setAttribute("href", url);
    }
    return () => {
      document.title = previousTitle;
      for (const undo of restore) undo();
      if (path) canonical?.setAttribute("href", previousCanonical);
    };
  }, [title, description, path]);
}
