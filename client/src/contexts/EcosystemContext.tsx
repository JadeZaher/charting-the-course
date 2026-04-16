import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { EcosystemSummary } from '@/types/api';

interface EcosystemContextType {
  ecosystems: EcosystemSummary[];
  selected: EcosystemSummary | null;
  selectedIds: string[];
  selectEcosystem: (id: string) => void;
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

  const selected = ecosystems.find(e => selectedIds.includes(e.id)) || null;

  return (
    <EcosystemContext.Provider
      value={{
        ecosystems,
        selected,
        selectedIds,
        selectEcosystem,
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
