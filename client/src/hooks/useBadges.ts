import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BadgeDefinition, UserBadge, CreateBadgeDefinitionRequest } from '@/types/badges';

/**
 * Hook to fetch badge definitions
 * NOTE: Edge Functions must be deployed. Set enabled: true when ready.
 */
export function useBadgeDefinitions(options?: {
  category?: string;
  featured?: boolean;
  includeInactive?: boolean;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ['badge-definitions', options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options?.category) params.set('category', options.category);
      if (options?.featured) params.set('featured', 'true');
      if (options?.includeInactive) params.set('include_inactive', 'true');

      const { data, error } = await supabase.functions.invoke(
        `badges/list-badges${params.toString() ? `?${params.toString()}` : ''}`
      );
      if (error) throw error;
      return data.data as {
        badges: BadgeDefinition[];
        categories: string[];
        total: number;
      };
    },
    enabled: options?.enabled ?? false, // Disabled until Edge Functions deployed
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook to fetch user badges
 * NOTE: Edge Functions must be deployed. Set enabled: true when ready.
 */
export function useUserBadges(userId?: string, enabled = false) {
  return useQuery({
    queryKey: ['user-badges', userId || 'me'],
    queryFn: async () => {
      const endpoint = userId
        ? `badges/get-user-badges/${userId}`
        : 'badges/get-user-badges';
      
      const { data, error } = await supabase.functions.invoke(endpoint);
      if (error) throw error;
      return data.data as {
        badges: (UserBadge & { badge_definitions?: BadgeDefinition })[];
        total: number;
        by_category: Record<string, number>;
      };
    },
    enabled, // Disabled until Edge Functions deployed
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

/**
 * Hook for badge management (admin/facilitator only)
 */
export function useBadgeManagement() {
  const queryClient = useQueryClient();

  // Create badge
  const createBadge = useMutation({
    mutationFn: async (badge: CreateBadgeDefinitionRequest) => {
      const { data, error } = await supabase.functions.invoke(
        'badges/create-badge',
        { body: badge }
      );
      if (error) throw error;
      return data.data as BadgeDefinition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badge-definitions'] });
    },
  });

  // Update badge
  const updateBadge = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CreateBadgeDefinitionRequest> }) => {
      const { data, error } = await supabase.functions.invoke(
        `badges/update-badge/${id}`,
        { body: updates }
      );
      if (error) throw error;
      return data.data as BadgeDefinition;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['badge-definitions'] });
    },
  });

  // Delete badge
  const deleteBadge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.functions.invoke(
        `badges/delete-badge/${id}`,
        { method: 'DELETE' }
      );
      if (error) throw error;
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

