import { useEffect } from "react";

/** Keep the document title and description aligned after a client-side navigation. */
export function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") ?? "";
    meta?.setAttribute("content", description);
    return () => {
      document.title = previousTitle;
      meta?.setAttribute("content", previousDescription);
    };
  }, [title, description]);
}
