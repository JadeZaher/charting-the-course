// TanStack Query hooks for orientation journey via Sanic BFF API

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api-client';
import type { OrientationPath, JourneyMap, UserJourneyProgress } from '@/types/orientation';

// ── detect path ──────────────────────────────────────────────────────────────

async function detectPath(ethos_id: string): Promise<OrientationPath> {
  // TODO: Replace with Sanic API endpoint when orientation-detect-path is implemented
  // Stub returns a default 'explorer' path
  return { path: 'explorer' } as unknown as OrientationPath;
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

async function recommendJourney(_ethos_id: string): Promise<RecommendJourneyResponse> {
  // TODO: Replace with Sanic API endpoint when orientation-recommend-journey is implemented
  return {
    recommended: {} as JourneyMap,
    alternatives: [],
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
  // TODO: Replace with Sanic API endpoint when member journey progress is implemented
  return null;
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
  // TODO: Replace with Sanic API endpoint when orientation-save-progress is implemented
  return { ...params } as unknown as UserJourneyProgress;
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
