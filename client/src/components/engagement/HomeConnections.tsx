import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunityActivity } from '@/hooks/use-engagement';
import { ActivityCard } from './ActivityCard';
import { QueryFeedback } from './QueryFeedback';

export function YourCommunities() {
  const { ecosystems, pendingConsents } = useAuth();
  const currentCommunities = ecosystems.filter(item => !item.membership_status || ['active', 'pending_consent'].includes(item.membership_status));
  return <section className="space-y-4" aria-labelledby="your-communities-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="your-communities-title" className="text-3xl font-black">Your communities</h2><Link href="/communities" className="inline-flex min-h-11 items-center text-link underline">Find a community</Link></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{currentCommunities.map(community => {
      const pending = pendingConsents.some(item => item.ecosystem_id === community.id) || community.membership_status === 'pending_consent';
      return <article key={community.id} className="min-w-0 border border-border bg-card p-4"><h3 className="break-words text-lg font-bold">{community.name}</h3><Link className="mt-2 inline-flex min-h-11 items-center font-semibold text-link underline" href={`/ethos/${community.id}`}>{pending ? 'Continue joining' : 'Open community'}</Link><Link className="mt-1 flex min-h-11 items-center text-sm text-link underline" href={`/settings/notifications?scope=ecosystem&id=${community.id}`}>Choose updates</Link></article>;
    })}</div>
    {!currentCommunities.length && <p className="text-muted-foreground">Find a community to explore its purpose and choose how to participate.</p>}
  </section>;
}
export function RecentCommunityActivity() {
  const query = useCommunityActivity();
  const items = query.data?.pages.flatMap(page => page.items).slice(0, 6) ?? [];
  return <section className="space-y-4" aria-labelledby="community-activity-title">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="community-activity-title" className="text-3xl font-black">Recent community activity</h2><Link href="/updates" className="inline-flex min-h-11 items-center text-link underline">Your updates</Link></div>
    <QueryFeedback pending={query.isPending} error={query.error} retry={query.refetch} />
    {!query.isPending && !query.isError && !items.length && <p className="border border-dashed border-border p-6 text-muted-foreground">New community activity will appear here. You can explore opportunities or contribute a proposal when you’re ready.</p>}
    {!query.isError && <div className="grid gap-4 lg:grid-cols-2">{items.map(item => <ActivityCard key={item.id} item={item} />)}</div>}
  </section>;
}
