import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useEcosystemFilterParams } from './use-ecosystem-filter';
import { usePageContext } from '@/contexts/PageContext';

export interface FilterDef {
  key: string;
  label: string;
  type: 'select' | 'text';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

export interface UseGovernanceListOptions {
  /** Entity name for this list (e.g. "agreements", "proposals") — exposed to AI assistant */
  entity: string;
  /** Filter definitions for this list page */
  filters: FilterDef[];
  /** Items per page (default 20) */
  perPage?: number;
  /** Custom param key mappings — e.g. { phase: 'status' } to send filters under different API param names */
  paramKeys?: Record<string, string>;
}

export interface GovernanceListState {
  /** Current filter values keyed by filter key */
  filterValues: Record<string, string>;
  /** Set a single filter value (resets page to 1) */
  setFilter: (key: string, value: string) => void;
  /** Current search query */
  search: string;
  /** Set search query (resets page to 1) */
  setSearch: (value: string) => void;
  /** Current page number */
  page: number;
  /** Set page number */
  setPage: (page: number | ((p: number) => number)) => void;
  /** Computed query params ready to pass to a fetch hook */
  params: Record<string, string>;
  /** Filter definitions (pass-through for FilterBar) */
  filters: FilterDef[];
  /** Summary of active filters for AI context */
  activeFilterSummary: string;
}

/**
 * Shared hook for governance list pages.
 * Manages filter state, search, pagination, and ecosystem integration.
 * Resets page to 1 whenever any filter or search changes.
 */
export function useGovernanceList(options: UseGovernanceListOptions): GovernanceListState {
  const { entity, filters, perPage = 20, paramKeys = {} } = options;
  const ecosystemParams = useEcosystemFilterParams();
  const { setPageContext } = usePageContext();

  // Initialize all select filters to 'all', text filters to ''
  const [filterValues, setFilterValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of filters) {
      initial[f.key] = f.type === 'select' ? 'all' : '';
    }
    return initial;
  });

  const [search, setSearchRaw] = useState('');
  const [page, setPage] = useState(1);

  const setFilter = useCallback((key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
    setPage(1);
  }, []);

  const setSearch = useCallback((value: string) => {
    setSearchRaw(value);
    setPage(1);
  }, []);

  // Reset page when ecosystem changes
  const prevEcoRef = useRef(ecosystemParams);
  useEffect(() => {
    const prev = prevEcoRef.current;
    if (prev.ecosystem_ids !== ecosystemParams.ecosystem_ids) {
      setPage(1);
    }
    prevEcoRef.current = ecosystemParams;
  }, [ecosystemParams]);

  const params = useMemo(() => {
    const p: Record<string, string> = {
      page: String(page),
      per_page: String(perPage),
      ...ecosystemParams,
    };

    for (const f of filters) {
      const value = filterValues[f.key];
      if (!value || value === 'all') continue;
      const paramKey = paramKeys[f.key] || f.key;
      p[paramKey] = value;
    }

    if (search) p.q = search;
    return p;
  }, [filterValues, search, page, perPage, ecosystemParams, filters, paramKeys]);

  const activeFilterSummary = useMemo(() => {
    const parts: string[] = [];
    for (const f of filters) {
      const value = filterValues[f.key];
      if (value && value !== 'all') {
        const opt = f.options?.find(o => o.value === value);
        parts.push(`${f.label}: ${opt?.label || value}`);
      }
    }
    if (search) parts.push(`Search: "${search}"`);
    if (ecosystemParams.ecosystem_ids) {
      parts.push(`Ecosystems: filtered`);
    }
    return parts.length > 0 ? parts.join(', ') : 'No filters applied';
  }, [filterValues, search, ecosystemParams, filters]);

  // Expose current list context for AI assistant
  useEffect(() => {
    setPageContext({ entity, activeFilters: activeFilterSummary });
    return () => setPageContext({});
  }, [entity, activeFilterSummary, setPageContext]);

  return {
    filterValues,
    setFilter,
    search,
    setSearch,
    page,
    setPage,
    params,
    filters,
    activeFilterSummary,
  };
}
