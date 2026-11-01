import { useQuery } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { fetchBadgeDefinitions, fetchMemberBadges } from '@/lib/api-client';
import { affects, keys } from '@/lib/query-keys';
import type { BadgeDefinition, UserBadge, CreateBadgeDefinitionRequest } from '@/types/badges';

/** Hook to fetch badge definitions; shares keys.badges.list() with the admin panel and filters in `select`. */
export function useBadgeDefinitions(options?: {
  category?: string;
  featured?: boolean;
  includeInactive?: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: keys.badges.list(),
    queryFn: fetchBadgeDefinitions,
    select: (response): { badges: BadgeDefinition[]; categories: string[]; total: number } => {
      const all = response.items as unknown as BadgeDefinition[];
      const badges = all.filter((badge) => (
        (options?.includeInactive || badge.is_active !== false)
        && (!options?.category || badge.badge_category === options.category)
        && (!options?.featured || badge.is_featured)
      ));
      const categories = Array.from(new Set(all.map((badge) => badge.badge_category).filter((c): c is string => Boolean(c))));
      return { badges, categories, total: badges.length };
    },
    enabled: options?.enabled ?? false,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook to fetch user badges via Sanic BFF API.
 */
export function useUserBadges(userId?: string, enabled = false) {
  return useQuery({
    queryKey: keys.members.badges(userId),
    queryFn: () => fetchMemberBadges(userId as string),
    select: (result) => {
      const badges = (result.badges || []) as unknown as (UserBadge & { badge_definitions?: BadgeDefinition })[];
      const by_category: Record<string, number> = {};
      badges.forEach((b: any) => {
        const cat = b.badge_category || b.category || 'general';
        by_category[cat] = (by_category[cat] || 0) + 1;
      });
      return { badges, total: badges.length, by_category };
    },
    enabled: enabled && !!userId,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook for badge management (admin/facilitator only).
 * TODO: Add badge management endpoints to the Sanic API.
 */
export function useBadgeManagement() {
  const notAvailable = (): never => {
    // TODO: Replace with Sanic API endpoint when badge management is implemented
    throw new Error('Badge management not yet available on the Sanic API');
  };

  const createBadge = useApiMutation({
    mutationFn: async (_badge: CreateBadgeDefinitionRequest): Promise<BadgeDefinition> => notAvailable(),
    invalidates: affects.badges,
    error: 'Badge not created',
  });

  const updateBadge = useApiMutation({
    mutationFn: async (_params: { id: string; updates: Partial<CreateBadgeDefinitionRequest> }): Promise<BadgeDefinition> => notAvailable(),
    invalidates: affects.badges,
    error: 'Badge not updated',
  });

  const deleteBadge = useApiMutation({
    mutationFn: async (_id: string): Promise<void> => notAvailable(),
    invalidates: affects.badges,
    error: 'Badge not deleted',
  });

  return {
    createBadge: createBadge.mutate,
    createBadgeAsync: createBadge.mutateAsync,
    updateBadge: updateBadge.mutate,
    updateBadgeAsync: updateBadge.mutateAsync,
    deleteBadge: deleteBadge.mutate,
    deleteBadgeAsync: deleteBadge.mutateAsync,
    isCreating: createBadge.isPending,
    isUpdating: updateBadge.isPending,
    isDeleting: deleteBadge.isPending,
  };
}
