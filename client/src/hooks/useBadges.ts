import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMemberBadges } from '@/lib/api-client';
import type { BadgeDefinition, UserBadge, CreateBadgeDefinitionRequest } from '@/types/badges';

/**
 * Hook to fetch badge definitions.
 * TODO: Add a /api/v1/badges endpoint to the Sanic API when badge catalog is implemented.
 */
export function useBadgeDefinitions(options?: {
  category?: string;
  featured?: boolean;
  includeInactive?: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['badge-definitions', options],
    queryFn: async (): Promise<{ badges: BadgeDefinition[]; categories: string[]; total: number }> => {
      // TODO: Replace with Sanic API endpoint when badge definitions endpoint is implemented
      return { badges: [], categories: [], total: 0 };
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
    queryKey: ['user-badges', userId || 'me'],
    queryFn: async () => {
      if (!userId) return { badges: [], total: 0, by_category: {} };
      const result = await fetchMemberBadges(userId);
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
  const queryClient = useQueryClient();

  const createBadge = useMutation({
    mutationFn: async (_badge: CreateBadgeDefinitionRequest): Promise<BadgeDefinition> => {
      // TODO: Replace with Sanic API endpoint when badge management is implemented
      throw new Error('Badge management not yet available on the Sanic API');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badge-definitions'] });
    },
  });

  const updateBadge = useMutation({
    mutationFn: async (_params: { id: string; updates: Partial<CreateBadgeDefinitionRequest> }): Promise<BadgeDefinition> => {
      // TODO: Replace with Sanic API endpoint when badge management is implemented
      throw new Error('Badge management not yet available on the Sanic API');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badge-definitions'] });
    },
  });

  const deleteBadge = useMutation({
    mutationFn: async (_id: string): Promise<void> => {
      // TODO: Replace with Sanic API endpoint when badge management is implemented
      throw new Error('Badge management not yet available on the Sanic API');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badge-definitions'] });
    },
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
