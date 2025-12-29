import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { 
  EnhancedProfile, 
  PublicProfileResponse, 
  PrivateProfileResponse,
  UpdateEnhancedProfileRequest 
} from '@/types/profile';

/**
 * Hook to fetch and manage user profiles
 * NOTE: Edge Functions must be deployed. Set enabled: true when ready.
 */
export function useProfile(identifier?: string, enabled = false) {
  const queryClient = useQueryClient();

  // Fetch profile (public or private based on identifier)
  const profileQuery = useQuery({
    queryKey: ['profile', identifier || 'me'],
    queryFn: async () => {
      if (identifier) {
        // Fetch public profile by username/slug
        const { data, error } = await supabase.functions.invoke(
          `profile/get-public-profile/${identifier}`
        );
        if (error) throw error;
        return data.data as PublicProfileResponse;
      }
      
      // Fetch own private profile
      const { data, error } = await supabase.functions.invoke(
        'profile/get-private-profile'
      );
      if (error) throw error;
      return data.data as PrivateProfileResponse;
    },
    enabled, // Disabled until Edge Functions deployed
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (updates: UpdateEnhancedProfileRequest) => {
      const { data, error } = await supabase.functions.invoke(
        'profile/update-enhanced-profile',
        { body: updates }
      );
      if (error) throw error;
      return data.data as EnhancedProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    refetch: profileQuery.refetch,
    updateProfile: updateProfile.mutate,
    updateProfileAsync: updateProfile.mutateAsync,
    isUpdating: updateProfile.isPending,
    updateError: updateProfile.error,
  };
}

/**
 * Hook to manage profile share links
 */
export function useShareLinks() {
  const queryClient = useQueryClient();

  // Create share link
  const createShareLink = useMutation({
    mutationFn: async (options?: {
      expires_at?: string;
      show_badges?: boolean;
      show_achievements?: boolean;
      show_stats?: boolean;
      show_quiz_history?: boolean;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        'profile/create-share-link',
        { body: options || {} }
      );
      if (error) throw error;
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] });
    },
  });

  return {
    createShareLink: createShareLink.mutate,
    createShareLinkAsync: createShareLink.mutateAsync,
    isCreating: createShareLink.isPending,
    error: createShareLink.error,
  };
}

