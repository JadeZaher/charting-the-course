import { useMemo } from 'react';
import { useEcosystem } from '@/contexts/EcosystemContext';

/**
 * Returns ecosystem filter params ready to merge into any list query.
 * When all ecosystems are selected (or only one exists), returns empty object.
 * Otherwise returns { ecosystem_ids: "id1,id2" }.
 */
export function useEcosystemFilterParams(): Record<string, string> {
  const { selectedIds, isAll } = useEcosystem();

  return useMemo(() => {
    if (isAll || selectedIds.length === 0) return {} as Record<string, string>;
    return { ecosystem_ids: selectedIds.join(',') } as Record<string, string>;
  }, [selectedIds, isAll]);
}

/**
 * Looks up an ecosystem name by ID from the user's available ecosystems.
 * Returns undefined if not found.
 */
export function useEcosystemName() {
  const { ecosystems } = useEcosystem();

  return useMemo(() => {
    const map = new Map(ecosystems.map(e => [e.id, e.name]));
    return (id: string | undefined | null) => id ? map.get(id) : undefined;
  }, [ecosystems]);
}
