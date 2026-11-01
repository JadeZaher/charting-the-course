// Onboarding hooks (G-Onboard): join, steward member moves, the newcomers list. See client/src/AGENTS.md "Onboarding (G-Onboard)".
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { fetchNewcomers, joinEcosystem, moveMember } from '@/lib/api-client';
import { joinEcosystemMutation, type JoinOptions } from '@/lib/ecosystem-join';
import { onboardingAffects, onboardingKeys } from '@/lib/query-keys';

/** Join (or rejoin) an ecosystem; `silent` when the page renders the failure inline (the joinThen pages). */
export function useJoinEcosystem(ecosystemId: string, options: JoinOptions = {}) {
  const { refreshSession } = useAuth();
  return useApiMutation(joinEcosystemMutation(() => joinEcosystem(ecosystemId), refreshSession, options));
}

/** A steward's move on a member (one of the profile's `caller_member_moves`); MemberDetail renders the failure inline. */
export function useMoveMember(memberId: string) {
  return useApiMutation({
    mutationFn: (move: { status: string; notes?: string }) => moveMember(memberId, move),
    invalidates: onboardingAffects.memberMove,
    silent: true,
  });
}

/** Newcomers waiting in the ecosystems the caller stewards (GET /onboarding/newcomers). */
export function useNewcomers() {
  return useQuery({ queryKey: onboardingKeys.newcomers(), queryFn: fetchNewcomers, staleTime: 30_000, retry: false });
}
