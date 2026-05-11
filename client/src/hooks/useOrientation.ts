// TanStack Query hooks for orientation journey via Sanic BFF API

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchEthosJourneyMaps,
  fetchOrientationProgress,
  saveOrientationProgress,
} from '@/lib/api-client';
import type { OrientationPath, JourneyMap, UserJourneyProgress } from '@/types/orientation';

// ── detect path ──────────────────────────────────────────────────────────────

async function detectPath(_ethos_id: string): Promise<OrientationPath> {
  return { path: 'explorer', confidence: 0, signals: [] } as OrientationPath;
}

export function useDetectPath(ethos_id: string) {
  return useQuery({
    queryKey: ['orientation-path', ethos_id],
    queryFn: () => detectPath(ethos_id),
    enabled: !!ethos_id,
  });
}

// ── recommend journey ─────────────────────────────────────────────────────────

interface RecommendJourneyResponse {
  recommended: JourneyMap;
  alternatives: JourneyMap[];
  misalignment_flags: string[];
  score: number;
}

async function recommendJourney(ethos_id: string): Promise<RecommendJourneyResponse> {
  let maps: any[] = [];
  try {
    maps = await fetchEthosJourneyMaps(ethos_id);
  } catch {
    // API may 404 if no journey maps exist yet
    maps = [];
  }
  if (!Array.isArray(maps) || maps.length === 0) {
    return {
      recommended: {} as JourneyMap,
      alternatives: [],
      misalignment_flags: [],
      score: 0,
    };
  }
  const [recommended, ...alternatives] = maps;
  return {
    recommended: recommended as JourneyMap,
    alternatives: alternatives as JourneyMap[],
    misalignment_flags: [],
    score: 0,
  };
}

export function useRecommendJourney(ethos_id: string) {
  return useQuery({
    queryKey: ['journey-recommendation', ethos_id],
    queryFn: () => recommendJourney(ethos_id),
    enabled: !!ethos_id,
  });
}

// ── user progress ─────────────────────────────────────────────────────────────

async function fetchUserProgress(ethos_id: string): Promise<UserJourneyProgress | null> {
  try {
    const result = await fetchOrientationProgress(ethos_id);
    if (!result || Object.keys(result).length === 0) return null;
    return result as UserJourneyProgress;
  } catch {
    // API may 404 if no progress exists yet
    return null;
  }
}

export function useUserProgress(ethos_id: string) {
  return useQuery({
    queryKey: ['journey-progress', ethos_id],
    queryFn: () => fetchUserProgress(ethos_id),
    enabled: !!ethos_id,
  });
}

// ── save progress ─────────────────────────────────────────────────────────────

interface SaveProgressParams {
  ethos_id: string;
  journey_map_id: string;
  current_step: number;
  step_key?: string;
  step_response?: unknown;
  status?: 'not_started' | 'in_progress' | 'complete' | 'opted_out';
  orientation_path?: 'ready' | 'explorer';
  was_recommended?: boolean;
}

async function saveProgress(params: SaveProgressParams): Promise<UserJourneyProgress> {
  const { ethos_id, ...data } = params;
  return saveOrientationProgress(ethos_id, data) as Promise<UserJourneyProgress>;
}

export function useSaveProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveProgress,
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['journey-progress', vars.ethos_id] });
    },
  });
}
