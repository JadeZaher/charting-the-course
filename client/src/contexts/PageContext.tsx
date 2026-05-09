import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

export interface PageContextData {
  /** Current page entity type (e.g. "agreements", "proposals") */
  entity?: string;
  /** Summary of active filters on the current list page */
  activeFilters?: string;
  /** Current item being viewed (for detail pages) */
  currentItemId?: string;
  /** Any additional context the page wants to expose */
  extra?: Record<string, string>;
}

interface PageContextType {
  pageContext: PageContextData;
  setPageContext: (ctx: PageContextData) => void;
  /** Build a summary string for the AI assistant */
  getAISummary: () => string;
}

const PageCtx = createContext<PageContextType | null>(null);

export function PageContextProvider({ children }: { children: ReactNode }) {
  const [pageContext, setPageContext] = useState<PageContextData>({});

  const getAISummary = useCallback(() => {
    const parts: string[] = [];
    if (pageContext.entity) parts.push(`Viewing: ${pageContext.entity}`);
    if (pageContext.activeFilters) parts.push(`Filters: ${pageContext.activeFilters}`);
    if (pageContext.currentItemId) parts.push(`Item: ${pageContext.currentItemId}`);
    if (pageContext.extra) {
      for (const [k, v] of Object.entries(pageContext.extra)) {
        parts.push(`${k}: ${v}`);
      }
    }
    return parts.join(' | ');
  }, [pageContext]);

  return (
    <PageCtx.Provider value={{ pageContext, setPageContext, getAISummary }}>
      {children}
    </PageCtx.Provider>
  );
}

export function usePageContext() {
  const ctx = useContext(PageCtx);
  if (!ctx) throw new Error('usePageContext must be used within PageContextProvider');
  return ctx;
}
