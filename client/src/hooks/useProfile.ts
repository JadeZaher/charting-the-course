import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchMember, updateMember } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';
import type {
  EnhancedProfile,
  PublicProfileResponse,
  PrivateProfileResponse,
  UpdateEnhancedProfileRequest
} from '@/types/profile';

/**
 * Hook to fetch and manage user profiles via Sanic BFF API.
 */
export function useProfile(identifier?: string, enabled = true) {
  const queryClient = useQueryClient();
  const { member } = useAuth();

  // Fetch profile (public or private based on identifier)
  const profileQuery = useQuery({
    queryKey: ['profile', identifier || 'me'],
    queryFn: async () => {
      const id = identifier || member?.id;
      if (!id) return null;
      // fetchMember returns MemberDetail which maps to the profile shape
      const data = await fetchMember(id);
      return data as unknown as PrivateProfileResponse | PublicProfileResponse;
    },
    enabled: enabled && (!!identifier || !!member?.id),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (updates: UpdateEnhancedProfileRequest) => {
      const id = member?.id;
      if (!id) throw new Error('Not authenticated');
      const data = await updateMember(id, updates as Record<string, any>);
      return data as unknown as EnhancedProfile;
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
 * Hook to manage profile share links.
 * TODO: Implement share link endpoints on the Sanic API when available.
 */
export function useShareLinks() {
  const createShareLink = useMutation({
    mutationFn: async (_options?: {
      expires_at?: string;
      show_badges?: boolean;
      show_achievements?: boolean;
      show_stats?: boolean;
      show_quiz_history?: boolean;
    }) => {
      // TODO: Replace with Sanic API endpoint when share link feature is implemented
      throw new Error('Share link creation not yet available on the Sanic API');
    },
  });

  return {
    createShareLink: createShareLink.mutate,
    createShareLinkAsync: createShareLink.mutateAsync,
    isCreating: createShareLink.isPending,
    error: createShareLink.error,
  };
}
