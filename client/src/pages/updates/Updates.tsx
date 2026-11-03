import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ActivityCard } from '@/components/engagement/ActivityCard';
import { MutationFeedback, QueryFeedback } from '@/components/engagement/QueryFeedback';
import { engagementWrite, useEngagementMutation, useInbox } from '@/hooks/use-engagement';

export default function Updates() {
  const [unread, setUnread] = useState(false);
  const query = useInbox(unread);
  const read = useEngagementMutation((value: {id: string; read: boolean}) => engagementWrite(`/inbox/${encodeURIComponent(value.id)}`, 'PATCH', { read: value.read }));
  const items = query.data?.pages.flatMap(page => page.items) ?? [];
  const count = query.isError ? undefined : query.data?.pages[0]?.unread_count;
  const countLabel = count === undefined ? undefined : `${count}${query.data?.pages[0]?.unread_count_is_lower_bound ? '+' : ''}`;
  return <div className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5"><div><h1 className="text-4xl font-black">Your updates</h1><p className="mt-3 text-muted-foreground">{countLabel === undefined ? 'Community activity and conversations you follow.' : `${countLabel} unread update${count === 1 ? '' : 's'} across your communities.`}</p></div><Link className="inline-flex min-h-11 items-center text-link underline" href="/settings/notifications">Manage subscriptions</Link></header>
    <div className="flex flex-wrap gap-2" aria-label="Filter updates"><Button variant={unread ? 'outline' : 'default'} aria-pressed={!unread} onClick={() => setUnread(false)}>All updates</Button><Button variant={unread ? 'default' : 'outline'} aria-pressed={unread} onClick={() => setUnread(true)}>Unread</Button></div>
    <p className="text-sm text-muted-foreground">Reading an update does not complete a decision or task. <Link href="/dashboard" className="text-link underline">See what is waiting for you.</Link></p>
    <MutationFeedback error={read.error} />
    <QueryFeedback pending={query.isPending} error={query.error} retry={query.refetch} />
    {!query.isPending && !query.isError && items.length === 0 && <div className="space-y-3 border border-dashed border-border p-8"><h2 className="text-xl font-semibold">{unread ? "You’re caught up." : 'Your next connection starts here.'}</h2><p>Updates from your communities and conversations will appear here.</p><Link href="/communities" className="inline-flex min-h-11 items-center text-link underline">Find a community</Link></div>}
    {!query.isError && <div className="space-y-4">{items.map(item => <ActivityCard key={item.inbox_id} item={item}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"><details className="min-w-0 text-sm"><summary className="cursor-pointer py-3">Why you received this</summary><p className="max-w-prose break-words pb-3 text-muted-foreground">{item.reason.replace(/_/g, ' ')}</p></details><Button variant="outline" disabled={read.isPending} onClick={() => read.mutate({ id: item.inbox_id, read: !item.read_at })}>{item.read_at ? 'Mark unread' : 'Mark read'}</Button></div>
    </ActivityCard>)}</div>}
    {query.hasNextPage && <Button variant="outline" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading…' : 'Load more updates'}</Button>}
  </div>;
}
