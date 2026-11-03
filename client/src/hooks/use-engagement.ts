import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-client';
import type { EngagementScope } from '@/lib/engagement';
import type { Activity, Capabilities, CommunityPreview, EngagementPreferences, EngagementSubscription, InboxPage, Page, ScopeOptions, SubscriptionInput } from '@/types/engagement';

export const engagementKeys = {
  owner: (id?: string) => ['engagement', id ?? 'signed-out'] as const,
};
export function engagementWrite<T>(path: string, method: string, body: unknown = {}) {
  return apiFetch<T>(`/api/v1/engagement${path}`, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
function params(values: Record<string, string | undefined>) {
  return new URLSearchParams(Object.entries(values).filter((entry): entry is [string, string] => entry[1] !== undefined)).toString();
}
export function useCommunities(search = '') {
  return useInfiniteQuery({
    queryKey: ['public-communities', search], initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => apiFetch<Page<CommunityPreview>>(`/api/v1/communities?${params({ q: search, cursor: pageParam })}`, { signal }),
    getNextPageParam: page => page.next_cursor ?? undefined,
  });
}
export function useCommunity(id: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: [...engagementKeys.owner(user?.id), 'community-preview', id], queryFn: ({ signal }) => apiFetch<CommunityPreview>(`/api/v1/communities/${encodeURIComponent(id)}`, { signal }), enabled: !!id });
}
export function useEngagementPreferences() {
  const { user } = useAuth();
  return useQuery({ queryKey: [...engagementKeys.owner(user?.id), 'preferences'], queryFn: ({ signal }) => apiFetch<EngagementPreferences>('/api/v1/engagement/preferences', { signal }), enabled: !!user?.id });
}
export function useEngagementCapabilities() {
  const { user } = useAuth();
  return useQuery({ queryKey: [...engagementKeys.owner(user?.id), 'capabilities'], queryFn: ({ signal }) => apiFetch<Capabilities>('/api/v1/engagement/capabilities', { signal }), enabled: !!user?.id, staleTime: 10000 });
}
export function useEngagementSubscriptions() {
  const { user } = useAuth();
  return useQuery({ queryKey: [...engagementKeys.owner(user?.id), 'subscriptions'], queryFn: ({ signal }) => apiFetch<{items: EngagementSubscription[]}>('/api/v1/engagement/subscriptions', { signal }), enabled: !!user?.id });
}
export function useEngagementScopes(kind: EngagementScope, search: string, id?: string) {
  const { user } = useAuth();
  return useQuery({ queryKey: [...engagementKeys.owner(user?.id), 'scopes', kind, search, id], queryFn: ({ signal }) => apiFetch<ScopeOptions>(`/api/v1/engagement/scope-options?${params({ kind, q: search, id: id || undefined })}`, { signal }), enabled: !!user?.id });
}
export function useEngagementMutation<T, V>(action: (value: V) => Promise<T>) {
  const { user } = useAuth();
  const client = useQueryClient();
  return useMutation({ mutationFn: action, onSuccess: () => client.invalidateQueries({ queryKey: engagementKeys.owner(user?.id) }) });
}
export function useSaveSubscription() {
  return useEngagementMutation<EngagementSubscription, SubscriptionInput>(value => engagementWrite('/subscriptions', 'POST', value));
}
export function useInbox(unreadOnly = false) {
  const { user } = useAuth();
  return useInfiniteQuery({
    queryKey: [...engagementKeys.owner(user?.id), 'inbox', unreadOnly], enabled: !!user?.id,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => apiFetch<InboxPage>(`/api/v1/engagement/inbox?${params({ unread: unreadOnly ? 'true' : undefined, cursor: pageParam })}`, { signal }),
    getNextPageParam: page => page.next_cursor ?? undefined, refetchInterval: 30000,
  });
}
export function useCommunityActivity(ecosystemId?: string) {
  const { user } = useAuth();
  return useInfiniteQuery({
    queryKey: [...engagementKeys.owner(user?.id), 'activity', ecosystemId ?? 'all'], enabled: !!user?.id,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) => apiFetch<Page<Activity>>(`/api/v1/engagement/activity?${params({ ecosystem_id: ecosystemId, cursor: pageParam })}`, { signal }),
    getNextPageParam: page => page.next_cursor ?? undefined, refetchInterval: 30000,
  });
}
