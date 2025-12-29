import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { 
  UserAchievement, 
  UserXPLevel, 
  LevelDefinition,
  AchievementType 
} from '@/types/achievements';

/**
 * Hook to fetch user achievements
 * NOTE: Requires Edge Functions to be deployed. Set enabled: true when ready.
 */
export function useAchievements(userId?: string, options?: {
  type?: AchievementType;
  limit?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['achievements', userId || 'me', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.type) params.set('type', options.type);
      if (options?.limit) params.set('limit', options.limit.toString());

      const endpoint = userId
        ? `achievements/get-user-achievements/${userId}`
        : 'achievements/get-user-achievements';
      
      const { data, error } = await supabase.functions.invoke(
        `${endpoint}${params.toString() ? `?${params.toString()}` : ''}`
      );
      if (error) throw error;
      
      return data.data as {
        achievements: UserAchievement[];
        total: number;
        by_type: Record<string, UserAchievement[]>;
        total_xp_from_achievements: number;
        xp_level: UserXPLevel | null;
        level_info: LevelDefinition | null;
      };
    },
    enabled: options?.enabled ?? false, // Disabled until Edge Functions deployed
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook to fetch level definitions
 * NOTE: Requires Edge Functions to be deployed. Set enabled: true when ready.
 */
export function useLevels(enabled = false) {
  return useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        'achievements/get-levels'
      );
      if (error) throw error;
      return data.data as {
        levels: LevelDefinition[];
        total: number;
      };
    },
    enabled, // Disabled until Edge Functions deployed
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour (levels don't change often)
  });
}

/**
 * Hook to calculate achievements after quiz submission
 */
export function useCalculateAchievements() {
  return useMutation({
    mutationFn: async (params: {
      quiz_result_id: string;
      quiz_id: string;
      score: number;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        'achievements/calculate-achievements',
        { body: params }
      );
      if (error) throw error;
      
      return data.data as {
        badges_earned: string[];
        achievements_earned: string[];
        xp_awarded: number;
        leveled_up: boolean;
        new_level: number | null;
      };
    },
  });
}

/**
 * Combined hook for user progress (XP, level, achievements summary)
 * NOTE: Disabled by default until Edge Functions are deployed
 */
export function useUserProgress(userId?: string, enabled = false) {
  const achievementsQuery = useAchievements(userId, { limit: 5, enabled });
  const levelsQuery = useLevels(enabled);

  return {
    // XP and Level data
    xpLevel: achievementsQuery.data?.xp_level,
    currentLevel: achievementsQuery.data?.level_info,
    allLevels: levelsQuery.data?.levels || [],
    
    // Recent achievements
    recentAchievements: achievementsQuery.data?.achievements.slice(0, 5) || [],
    totalAchievements: achievementsQuery.data?.total || 0,
    
    // Loading states
    isLoading: enabled ? (achievementsQuery.isLoading || levelsQuery.isLoading) : false,
    error: achievementsQuery.error || levelsQuery.error,
  };
}

