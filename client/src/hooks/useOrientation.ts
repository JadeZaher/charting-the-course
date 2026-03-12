// TanStack Query hooks for orientation journey

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { OrientationPath, JourneyMap, UserJourneyProgress } from '@/types/orientation';

// ── detect path ──────────────────────────────────────────────────────────────

async function detectPath(ethos_id: string): Promise<OrientationPath> {
  const { data, error } = await supabase.functions.invoke('orientation-detect-path', {
    body: { ethos_id },
  });
  if (error) throw new Error(error.message);
  // Edge Functions wrap responses in { data: T } via successResponse()
  return (data as { data: OrientationPath }).data;
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
  const { data, error } = await supabase.functions.invoke('orientation-recommend-journey', {
    body: { ethos_id },
  });
  if (error) throw new Error(error.message);
  // Edge Functions wrap responses in { data: T } via successResponse()
  return (data as { data: RecommendJourneyResponse }).data;
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
  // Use getSession() (local storage read) instead of getUser() (network call)
  // to avoid ERR_CONNECTION_CLOSED failures during auth state transitions
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;
  const user = session.user;

  const { data, error } = await supabase
    .from('user_journey_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('ethos_id', ethos_id)
    .maybeSingle();

  if (error) throw error;
  return data as UserJourneyProgress | null;
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
  const { data, error } = await supabase.functions.invoke('orientation-save-progress', {
    body: params,
  });
  if (error) throw new Error(error.message);
  // Edge Functions wrap responses in { data: T } via successResponse()
  return (data as { data: UserJourneyProgress }).data;
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
