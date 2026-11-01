import { keepPreviousData, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useApiMutation } from '@/hooks/use-api-mutation';
import * as api from '@/lib/api-client';
import { postMoveToast, waitingOnText } from '@/lib/exchange';
import { affects, keys } from '@/lib/query-keys';
import type {
  CollaborationDetailView,
  CollaborationEndOutcome,
  CollaborationReview,
  SharesNeedsDraft,
  SharesNeedsPost,
  SharesNeedsStatusChange,
} from '@/types/api';

// Exchange writes are silent: every screen that offers one renders its failure inline (client/src/AGENTS.md "Exchange (G-Exchange)").

/** A write's full post payload lands in its detail cache before the prefix refetch. */
function rememberPost(queryClient: QueryClient, post: SharesNeedsPost | undefined) {
  if (post?.id) queryClient.setQueryData(keys.sharesNeeds.detail(post.id), post);
}

/** Merges a collaboration write into its detail cache (D17: never blank fields the write did not send). */
function rememberCollaboration(queryClient: QueryClient, id: string, data: CollaborationDetailView) {
  queryClient.setQueryData<CollaborationDetailView>(keys.collaborations.detail(id), (current) => (current ? { ...current, ...data } : data));
}

// Shares & Needs reads
export function useSharesNeeds(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.sharesNeeds.list(params), queryFn: () => api.fetchSharesNeedsPage(params), placeholderData: keepPreviousData });
}
export function useSharesNeedsPost(id: string | null | undefined) {
  return useQuery({ queryKey: keys.sharesNeeds.detail(id ?? undefined), queryFn: () => api.fetchSharesNeedsPost(id as string), enabled: !!id });
}
export function useSharesNeedsAdmin(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.sharesNeeds.moderation(params), queryFn: () => api.fetchSharesNeedsModeration(params), placeholderData: keepPreviousData });
}
/** Posts in one domain, with the same visibility rule; hidden ones only for their author and stewards. */
export function useDomainPosts(domainId: string) {
  return useQuery({ queryKey: keys.sharesNeeds.forDomain(domainId), queryFn: () => api.fetchDomainPosts(domainId), enabled: !!domainId });
}

// Shares & Needs writes
export function useCreateSharesNeeds() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: api.publishSharesNeeds,
    onSuccess: (post) => rememberPost(queryClient, post),
    invalidates: affects.exchangePosts,
    silent: true,
  });
}
export function useUpdateSharesNeeds() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<SharesNeedsDraft> }) => api.editSharesNeeds(id, data),
    onSuccess: (post) => rememberPost(queryClient, post),
    invalidates: affects.exchangePosts,
    success: 'Changes saved',
    silent: true,
  });
}
export function useUpdateSharesNeedsStatus() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: ({ id, ...change }: { id: string } & SharesNeedsStatusChange) => api.moveSharesNeeds(id, change),
    onSuccess: (post) => rememberPost(queryClient, post),
    invalidates: affects.exchangePosts,
    success: (post) => postMoveToast(post),
    silent: true,
  });
}
export function useDeleteSharesNeeds() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (id: string) => api.removeSharesNeeds(id),
    // Drop the detail first so the refetch below does not ask for a post that is gone.
    onSuccess: (_result, id) => queryClient.removeQueries({ queryKey: keys.sharesNeeds.detail(id) }),
    invalidates: affects.exchangePosts,
    success: 'Post deleted',
    silent: true,
  });
}
export function useHideSharesNeeds() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => api.hideSharesNeeds(id, reason),
    onSuccess: (post) => rememberPost(queryClient, post),
    invalidates: affects.exchangePosts,
    success: { title: 'Post hidden', description: 'Its author and the stewards still see it, with your reason.' },
    silent: true,
  });
}
export function useRestoreSharesNeeds() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (id: string) => api.restoreSharesNeeds(id),
    onSuccess: (post) => rememberPost(queryClient, post),
    invalidates: affects.exchangePosts,
    success: 'Post restored',
    silent: true,
  });
}
/** Sends the first message of (or adds to) the caller's conversation with the author; the dialog shows the outcome. */
export function useRespondToSharesNeeds() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => api.respondToSharesNeeds(id, message),
    onSuccess: (result) => rememberPost(queryClient, result.post),
    invalidates: affects.exchangePosts,
    silent: true,
  });
}

// Collaboration hooks
export function useCollaborations(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.collaborations.list(params), queryFn: () => api.fetchCollaborations(params) });
}
export function useCollaboration(id: string) {
  return useQuery({ queryKey: keys.collaborations.detail(id), queryFn: () => api.fetchCollaborationDetail(id), enabled: !!id });
}
export function useCreateCollaboration() {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: api.proposeCollaboration,
    onSuccess: (detail) => rememberCollaboration(queryClient, detail.id, detail),
    invalidates: affects.exchangeCollaborations,
    silent: true,
  });
}
/** Approves for one side (`ecosystem_id`); activation happens when every side has approved. */
export function useApproveCollaboration(id: string) {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (ecosystemId: string) => api.approveCollaboration(id, ecosystemId),
    onSuccess: (detail) => rememberCollaboration(queryClient, id, detail),
    invalidates: affects.exchangeCollaborations,
    success: (detail) =>
      detail.status === 'active'
        ? { title: 'Collaboration active', description: 'Every side has approved it.' }
        : { title: 'Approval recorded', description: waitingOnText(detail.awaiting ?? []) ?? undefined },
    silent: true,
  });
}
export function useEndCollaboration(id: string) {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (data: { outcome: CollaborationEndOutcome; reason: string }) => api.endCollaboration(id, data),
    onSuccess: (detail) => rememberCollaboration(queryClient, id, detail),
    invalidates: affects.exchangeCollaborations,
    success: (detail) => (detail.status === 'completed' ? 'Collaboration completed' : 'Collaboration dissolved'),
    silent: true,
  });
}

// FX-Exchange
/** Records a review (what it found, the next review date); the "Review or end" queue item clears for both sides. */
export function useReviewCollaboration(id: string) {
  const queryClient = useQueryClient();
  return useApiMutation({
    mutationFn: (data: CollaborationReview) => api.reviewCollaboration(id, data),
    onSuccess: (detail) => rememberCollaboration(queryClient, id, detail),
    invalidates: affects.exchangeCollaborations,
    success: (detail) => ({ title: 'Review recorded', description: detail.review_date ? `Next review on ${detail.review_date}.` : undefined }),
    silent: true,
  });
}
/** An ecosystem page's posts, under the one visibility rule (ACTIVE members there only). */
export function useEcosystemPosts(ecosystemId: string, enabled = true) {
  return useQuery({ queryKey: keys.sharesNeeds.forEcosystem(ecosystemId), queryFn: () => api.fetchEcosystemPosts(ecosystemId), enabled: enabled && !!ecosystemId });
}
/** The ecosystems where the caller is an exchange steward (the server's own list from the moderation route). */
export function useModeratedEcosystems() {
  const params = { per_page: '1' };
  return useQuery({
    queryKey: keys.sharesNeeds.moderation(params),
    queryFn: () => api.fetchSharesNeedsModeration(params),
    select: (page) => page.moderated_ecosystems,
    staleTime: 60_000,
  });
}

// Compliance hooks
export function useComplianceLatest(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.compliance.latest(params), queryFn: () => api.fetchComplianceLatest(params) });
}
export function useComplianceHistory(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.compliance.history(params), queryFn: () => api.fetchComplianceHistory(params) });
}
export function useGenerateCompliance() {
  return useApiMutation({ mutationFn: api.generateCompliance, invalidates: affects.compliance, error: 'Could not generate the report' });
}
