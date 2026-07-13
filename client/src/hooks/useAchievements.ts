import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchMemberBadges } from '@/lib/api-client';
import type {
  UserAchievement,
  UserXPLevel,
  LevelDefinition,
  AchievementType
} from '@/types/achievements';
import type { UserBadgeItem } from '@/types/api';

/**
 * Hook to fetch user achievements via Sanic BFF API.
 * Uses earned member badges as the available source for achievement data.
 * TODO: Add a dedicated achievements endpoint to the Sanic API when available.
 */
export function useAchievements(userId?: string, options?: {
  type?: AchievementType;
  limit?: number;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['achievements', userId || 'me', options],
    queryFn: async () => {
      if (!userId) {
        return {
          achievements: [] as UserAchievement[],
          total: 0,
          by_type: {} as Record<string, UserAchievement[]>,
          total_xp_from_achievements: 0,
          xp_level: null as UserXPLevel | null,
          level_info: null as LevelDefinition | null,
        };
      }

      // Derive achievements from earned badges until a dedicated endpoint exists.
      // Profile tags have no earned timestamp and are not an AchievementType.
      const badgesResult = await fetchMemberBadges(userId);
      const badges = badgesResult.badges || [];

      const achievements: UserAchievement[] = badges
        .filter((badge): badge is UserBadgeItem & { earned_at: string } => Boolean(badge.earned_at))
        .map((badge): UserAchievement => ({
          id: badge.id,
          user_id: userId,
          achievement_type: 'badge_earned',
          achievement_key: badge.badge_key,
          achievement_name: badge.badge_name,
          achievement_description: badge.badge_description,
          achievement_icon: badge.badge_icon,
          related_quiz_id: null,
          related_badge_id: badge.id,
          achievement_data: {
            badge_category: badge.badge_category,
            strength: badge.strength,
          },
          xp_awarded: 0,
          earned_at: badge.earned_at,
        }))
        .filter((achievement) => !options?.type || achievement.achievement_type === options.type)
        .slice(0, options?.limit);

      const by_type: Record<string, UserAchievement[]> = {};
      achievements.forEach((a) => {
        if (!by_type[a.achievement_type]) by_type[a.achievement_type] = [];
        by_type[a.achievement_type].push(a);
      });

      const total_xp = achievements.reduce((sum, a) => sum + a.xp_awarded, 0);

      return {
        achievements,
        total: achievements.length,
        by_type,
        total_xp_from_achievements: total_xp,
        xp_level: null as UserXPLevel | null,
        level_info: null as LevelDefinition | null,
      };
    },
    enabled: (options?.enabled ?? false) && !!userId,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook to fetch level definitions.
 * TODO: Add a /api/v1/levels endpoint to the Sanic API when levels are implemented.
 */
export function useLevels(enabled = false) {
  return useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      // TODO: Replace with Sanic API endpoint when levels endpoint is implemented
      return { levels: [] as LevelDefinition[], total: 0 };
    },
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * Hook to calculate achievements after quiz submission.
 * TODO: Add achievement calculation endpoint to the Sanic API.
 */
export function useCalculateAchievements() {
  return useMutation({
    mutationFn: async (_params: {
      quiz_result_id: string;
      quiz_id: string;
      score: number;
    }) => {
      // TODO: Replace with Sanic API endpoint when achievement calculation is implemented
      return {
        badges_earned: [] as string[],
        achievements_earned: [] as string[],
        xp_awarded: 0,
        leveled_up: false,
        new_level: null as number | null,
      };
    },
  });
}

/**
 * Combined hook for user progress (XP, level, achievements summary).
 */
export function useUserProgress(userId?: string, enabled = false) {
  const achievementsQuery = useAchievements(userId, { limit: 5, enabled });
  const levelsQuery = useLevels(enabled);

  return {
    xpLevel: achievementsQuery.data?.xp_level,
    currentLevel: achievementsQuery.data?.level_info,
    allLevels: levelsQuery.data?.levels || [],
    recentAchievements: achievementsQuery.data?.achievements.slice(0, 5) || [],
    totalAchievements: achievementsQuery.data?.total || 0,
    isLoading: enabled ? (achievementsQuery.isLoading || levelsQuery.isLoading) : false,
    error: achievementsQuery.error || levelsQuery.error,
  };
}
