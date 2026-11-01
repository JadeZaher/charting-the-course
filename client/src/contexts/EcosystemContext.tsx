import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';
import { activeEcosystemIds, defaultEcosystemId } from '@/lib/consent-gate';
import { ecosystemScoped } from '@/lib/query-keys';
import type { EcosystemSummary } from '@/types/api';

interface EcosystemContextType {
  ecosystems: EcosystemSummary[];
  selected: EcosystemSummary | null;
  selectedIds: string[];
  selectEcosystem: (id: string) => void;        // Single select (replaces all)
  toggleEcosystem: (id: string) => void;         // Single-select by default
  toggleMulti: (id: string) => void;             // Add/remove from multi-select
  selectMultiple: (ids: string[]) => void;       // Batch select
  selectAll: () => void;                         // Select all ecosystems
  isMulti: boolean;
  isAll: boolean;                                // True when all ecosystems selected
  selectionRestored: boolean;                    // False until the selection is restored for the member's ecosystems
}

const COOKIE_KEY = 'neos_selected_ecosystems';

function getSelectedFromCookie(): string[] {
  const raw = document.cookie
    .split('; ')
    .find(c => c.startsWith(COOKIE_KEY + '='));
  if (!raw) return [];
  try {
    return JSON.parse(decodeURIComponent(raw.split('=')[1]));
  } catch {
    return [];
  }
}

function setSelectedCookie(ids: string[]) {
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(ids))}; path=/; max-age=31536000; SameSite=Lax`;
}

const EcosystemContext = createContext<EcosystemContextType | null>(null);

export function EcosystemProvider({ children }: { children: ReactNode }) {
  const { ecosystems, pendingConsents, member } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  // The selection starts empty and is restored in an effect; a gated route waits for it (lib/nav-access.ts routeAccess).
  const [restored, setRestored] = useState(false);
  const prevIdsRef = useRef<string[]>([]);

  // Refetch every read the server scopes to the selection (lib/query-keys.ts ecosystemScoped) when it changes.
  useEffect(() => {
    const prev = prevIdsRef.current;
    const changed = prev.length > 0 && (
      prev.length !== selectedIds.length ||
      prev.some((id, i) => id !== selectedIds[i])
    );
    prevIdsRef.current = selectedIds;

    if (changed) {
      for (const queryKey of ecosystemScoped) queryClient.invalidateQueries({ queryKey });
    }
  }, [selectedIds, queryClient]);

  // Initialize from the cookie's active ids, else the default active ecosystem: the server's rule (api/AGENTS.md "Handler contracts").
  useEffect(() => {
    if (ecosystems.length === 0) return;

    const membershipsInput = { pendingConsents, memberships: ecosystems, member };
    const active = new Set(activeEcosystemIds(membershipsInput));
    const validIds = getSelectedFromCookie().filter(id => active.has(id));

    setRestored(true);
    if (validIds.length > 0) {
      setSelectedIds(validIds);
      return;
    }
    // Active nowhere (held at the consent gate): select nothing rather than a scope the server refuses.
    const fallbackId = defaultEcosystemId(membershipsInput);
    setSelectedIds(fallbackId ? [fallbackId] : []);
    if (fallbackId) setSelectedCookie([fallbackId]);
  }, [ecosystems, pendingConsents, member]);

  const selectEcosystem = useCallback((id: string) => {
    setSelectedIds([id]);
    setSelectedCookie([id]);
  }, []);

  const toggleEcosystem = useCallback((id: string) => {
    // Single-select by default: clicking an ecosystem selects only that one
    setSelectedIds([id]);
    setSelectedCookie([id]);
  }, []);

  const toggleMulti = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id];
      const result = next.length > 0 ? next : prev;
      setSelectedCookie(result);
      return result;
    });
  }, []);

  const selectMultiple = useCallback((ids: string[]) => {
    const validIds = ids.filter(id => ecosystems.some(e => e.id === id));
    if (validIds.length > 0) {
      setSelectedIds(validIds);
      setSelectedCookie(validIds);
    }
  }, [ecosystems]);

  const selectAll = useCallback(() => {
    const allIds = ecosystems.map(e => e.id);
    setSelectedIds(allIds);
    setSelectedCookie(allIds);
  }, [ecosystems]);

  const selected = ecosystems.find(e => selectedIds.includes(e.id)) || null;
  const isAll = ecosystems.length > 0 && selectedIds.length === ecosystems.length;

  return (
    <EcosystemContext.Provider
      value={{
        ecosystems,
        selected,
        selectedIds,
        selectEcosystem,
        toggleEcosystem,
        toggleMulti,
        selectMultiple,
        selectAll,
        isMulti: selectedIds.length > 1,
        isAll,
        selectionRestored: restored || ecosystems.length === 0,
      }}
    >
      {children}
    </EcosystemContext.Provider>
  );
}

export function useEcosystem() {
  const ctx = useContext(EcosystemContext);
  if (!ctx) throw new Error('useEcosystem must be used within EcosystemProvider');
  return ctx;
}
