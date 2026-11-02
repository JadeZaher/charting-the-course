import { useQuery } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { affects, keys } from '@/lib/query-keys';
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
  const { member } = useAuth();
  const profileId = identifier || member?.id;

  // Fetch profile (public or private based on identifier)
  const profileQuery = useQuery({
    queryKey: keys.members.detail(profileId),
    queryFn: () => fetchMember(profileId as string),
    // fetchMember returns MemberDetail which maps to the profile shape
    select: (data) => data as unknown as PrivateProfileResponse | PublicProfileResponse,
    enabled: enabled && (!!identifier || !!member?.id),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Update profile mutation
  const updateProfile = useApiMutation({
    invalidates: affects.profiles,
    error: 'Profile not saved',
    mutationFn: async (updates: UpdateEnhancedProfileRequest) => {
      const id = member?.id;
      if (!id) throw new Error('Not authenticated');
      const data = await updateMember(id, updates as Record<string, any>);
      return data as unknown as EnhancedProfile;
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
