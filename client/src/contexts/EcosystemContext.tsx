import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { EcosystemSummary } from '@/types/api';

interface EcosystemContextType {
  ecosystems: EcosystemSummary[];
  selected: EcosystemSummary | null;
  selectedIds: string[];
  selectEcosystem: (id: string) => void;        // Single select (replaces all)
  toggleEcosystem: (id: string) => void;         // Single-select by default
  toggleMulti: (id: string) => void;             // Add/remove from multi-select
  selectMultiple: (ids: string[]) => void;       // Batch select
  isMulti: boolean;
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
  const { ecosystems } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Initialize from cookie or first ecosystem
  useEffect(() => {
    if (ecosystems.length === 0) return;

    const cookieIds = getSelectedFromCookie();
    const validIds = cookieIds.filter(id => ecosystems.some(e => e.id === id));

    if (validIds.length > 0) {
      setSelectedIds(validIds);
    } else {
      // Default to first ecosystem
      const defaultId = ecosystems[0].id;
      setSelectedIds([defaultId]);
      setSelectedCookie([defaultId]);
    }
  }, [ecosystems]);

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

  const selected = ecosystems.find(e => selectedIds.includes(e.id)) || null;

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
        isMulti: selectedIds.length > 1,
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
