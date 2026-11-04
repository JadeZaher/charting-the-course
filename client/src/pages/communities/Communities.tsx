import { useState } from 'react';
import { Link, useRoute } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useCommunities, useCommunity } from '@/hooks/use-engagement';
import { communityEntryPath, engagementPath } from '@/lib/engagement';
import { resolveMediaUrl } from '@/lib/media';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QueryFeedback } from '@/components/engagement/QueryFeedback';

function CommunityHeader() {
  const { isAuthenticated } = useAuth();
  return <nav aria-label="Community navigation" className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 border-b border-border pb-4">
    <Link href="/communities" className="inline-flex min-h-11 items-center font-black">NEOS / Communities</Link>
    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
      <Link href="/about" className="inline-flex min-h-11 items-center underline">About NEOS</Link>
      <Link href={isAuthenticated ? '/dashboard' : '/login'} className="inline-flex min-h-11 items-center underline">{isAuthenticated ? 'Your home' : 'Sign in'}</Link>
    </div>
  </nav>;
}
export default function Communities() {
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const query = useCommunities(appliedSearch);
  const items = query.data?.pages.flatMap(page => page.items) ?? [];
  return <div className="mx-auto w-full max-w-6xl space-y-8 p-5 sm:p-8">
    <CommunityHeader />
    <header>
      <p className="max-w-3xl text-lg leading-relaxed">NEOS (New Earth Operating System) is a platform for communities to make shared decisions, manage agreements, and coordinate projects and resources.</p>
      <h1 className="mt-8 text-4xl font-black tracking-tight sm:text-6xl">Find a community.</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Discover people and projects you can contribute to. Explore a community before deciding to join.</p>
    </header>
    <form onSubmit={event => { event.preventDefault(); setAppliedSearch(search.trim()); }} className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1"><label htmlFor="community-search" className="mb-2 block font-semibold">Search communities</label><Input id="community-search" value={search} onChange={event => setSearch(event.target.value)} placeholder="A name, interest or purpose" maxLength={160} className="min-h-11" /></div>
      <Button type="submit">Search</Button>{appliedSearch && <Button variant="outline" type="button" onClick={() => { setSearch(''); setAppliedSearch(''); }}>Clear search</Button>}
    </form>
    <QueryFeedback pending={query.isPending} error={query.error} retry={query.refetch} />
    {!query.isPending && !query.isError && !items.length && <p className="border border-dashed border-border p-8">No public communities {appliedSearch ? 'match this search' : 'are available yet'}.</p>}
    <div className="grid gap-5 md:grid-cols-2">{items.map(community => {
      const image = resolveMediaUrl(community.logo_url);
      return <article key={community.id} className="flex flex-col border-2 border-strong-border bg-card p-5">
        {image && <img src={image} alt="" loading="lazy" className="mb-4 h-40 w-full object-cover" />}
        <h2 className="text-2xl font-black">{community.name}</h2>{community.location && <p className="mt-1 text-sm text-muted-foreground">{community.location}</p>}
        <p className="my-4 whitespace-pre-line break-words">{community.description || 'Visit this community to learn more about participating.'}</p>
        {!!community.tags?.length && <p className="mb-4 text-sm text-muted-foreground">{community.tags.join(' · ')}</p>}
        <Link href={`/communities/${encodeURIComponent(community.id)}`} className="mt-auto inline-flex min-h-11 items-center font-semibold text-link underline">View {community.name}</Link>
      </article>;
    })}</div>
    {query.hasNextPage && <Button variant="outline" disabled={query.isFetchingNextPage} onClick={() => query.fetchNextPage()}>{query.isFetchingNextPage ? 'Loading…' : 'Load more communities'}</Button>}
  </div>;
}
export function CommunityPreviewPage() {
  const [, route] = useRoute('/communities/:id');
  const id = route?.id ?? '';
  const query = useCommunity(id);
  const { isAuthenticated, ecosystems, pendingConsents } = useAuth();
  const community = query.data;
  const membership = ecosystems.find(item => item.id === id);
  const pending = pendingConsents.some(item => item.ecosystem_id === id) || membership?.membership_status === 'pending_consent';
  const active = membership?.membership_status === 'active';
  return <div className="mx-auto w-full max-w-4xl space-y-8 p-5 sm:p-8">
    <CommunityHeader /><QueryFeedback pending={query.isPending} error={query.error} retry={query.refetch} />
    {community && !query.isError && <>
      <header><p className="text-sm font-semibold text-muted-foreground">Community preview</p><h1 className="mt-2 text-4xl font-black">{community.name}</h1>{community.location && <p className="mt-2 text-muted-foreground">{community.location}</p>}<p className="mt-5 whitespace-pre-line break-words leading-7">{community.description || 'Learn about this community and its expectations before participating.'}</p></header>
      <section className="space-y-4 border-2 border-strong-border bg-card p-5" aria-labelledby="community-join-title"><h2 id="community-join-title" className="text-2xl font-bold">Make your next connection</h2><p>Read the community’s expectations, then complete any configured agreements and onboarding questions. Following updates is separate from joining.</p><Link href={communityEntryPath(id, isAuthenticated)} className="inline-flex min-h-11 items-center bg-primary px-5 py-3 font-bold text-primary-foreground">{pending ? 'Continue joining' : active ? 'Open community' : 'Join this community'}</Link>{isAuthenticated && <Link className="ml-0 inline-flex min-h-11 items-center px-4 text-link underline" href={`/settings/notifications?scope=ecosystem&id=${encodeURIComponent(id)}`}>Manage community updates</Link>}</section>
      <section aria-labelledby="public-opportunities-title"><h2 id="public-opportunities-title" className="text-2xl font-bold">Community opportunities</h2>{community.opportunities_require_sign_in ? <Link href={communityEntryPath(id, false)} className="mt-3 inline-flex min-h-11 items-center text-link underline">Sign in to see community opportunities</Link> : community.opportunities?.length ? <ul className="mt-4 divide-y divide-border">{community.opportunities.map(item => <li key={item.id}><Link href={engagementPath(item.url, '/discover')} className="inline-flex min-h-11 items-center py-3 text-link underline">{item.title}</Link></li>)}</ul> : <p className="mt-3 text-muted-foreground">No opportunities are listed right now. Joining opens the participation paths available to members.</p>}</section>
    </>}
  </div>;
}
