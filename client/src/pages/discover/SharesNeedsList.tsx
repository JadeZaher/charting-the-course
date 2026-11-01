import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryState } from '@/components/QueryState';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useSharesNeeds } from '@/hooks/use-discover';
import { postHref, proposeFromPostHref } from '@/lib/exchange';
import { SHARESNEEDS_CATEGORY_OPTIONS, sharesNeedsCategoryLabel } from '@/lib/sharesneeds-vocab';
import type { SharesNeedsPost } from '@/types/api';
import { PostBadges, PostByline } from './PostParts';
import { RespondAction } from './RespondDialog';

const PER_PAGE = 24;

const CATEGORY_OPTIONS = [{ value: 'all', label: 'All categories' }, ...SHARESNEEDS_CATEGORY_OPTIONS];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All exchanges' },
  { value: 'share', label: 'Shares' },
  { value: 'need', label: 'Needs' },
  { value: 'solution', label: 'Solutions' },
];

/** `open` sends nothing (the server's default is open posts only); `all` asks for every status the caller may see. */
const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'all', label: 'All statuses' },
];

function typeLabel(type: SharesNeedsPost['type']) {
  if (type === 'share') return 'Offers';
  if (type === 'need') return 'Seeks';
  return 'Solution';
}

function PostCard({ post }: { post: SharesNeedsPost }) {
  const titleId = `post-${post.id}-title`;
  const open = post.status === 'active' && !post.hidden;
  return (
    <article aria-labelledby={titleId} className="flex min-h-64 flex-col border-2 border-strong-border bg-card p-5 sm:p-6">
      <div className="space-y-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={`text-xs font-black uppercase tracking-[0.18em] ${post.type === 'share' ? 'text-success' : post.type === 'need' ? 'text-link' : 'text-warning'}`}>
            {typeLabel(post.type)}
          </p>
          <PostBadges post={post} />
        </div>
        <h3 id={titleId} className="text-xl font-black leading-tight tracking-[-0.025em] [overflow-wrap:anywhere]">{post.title}</h3>
        <PostByline post={post} />
      </div>

      {post.description && <p className="mt-4 line-clamp-4 text-sm leading-6 text-muted-foreground">{post.description}</p>}

      {(post.category || post.tags.length > 0) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.category && <Badge variant="outline" className="rounded-none">{sharesNeedsCategoryLabel(post.category)}</Badge>}
          {post.tags.slice(0, 3).map((tag) => <Badge key={tag} variant="secondary" className="rounded-none">{tag}</Badge>)}
        </div>
      )}

      {post.capacity && (
        <p className="mt-4 text-xs">
          <span className="font-bold uppercase tracking-[0.12em] text-muted-foreground">Capacity</span>{' '}
          <span className="font-semibold">{post.capacity}</span>
        </p>
      )}

      <div className="mt-auto space-y-3 border-t border-border pt-4">
        <RespondAction post={post} />
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href={postHref(post.id)} aria-label={`Details: ${post.title}`}>Details</Link>
          </Button>
          {open && (
            <Button asChild size="sm" variant="ghost">
              <Link href={proposeFromPostHref(post.id)} aria-label={`Propose collaboration: ${post.title}`}>Propose collaboration</Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

interface Props {
  searchProp?: string;
}

export default function SharesNeedsList({ searchProp = '' }: Props) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('open');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, categoryFilter, statusFilter, searchProp]);

  const params = useMemo(() => {
    const next: Record<string, string> = { page: String(page), per_page: String(PER_PAGE) };
    if (typeFilter !== 'all') next.type = typeFilter;
    if (categoryFilter !== 'all') next.category = categoryFilter;
    if (statusFilter !== 'open') next.status = statusFilter;
    if (searchProp.trim()) next.q = searchProp.trim();
    return next;
  }, [typeFilter, categoryFilter, statusFilter, page, searchProp]);

  const query = useSharesNeeds(params);
  const total = query.data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));
  const filtered = typeFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'open' || searchProp.trim() !== '';

  return (
    <div className="space-y-6" aria-busy={query.isFetching}>
      <div className="grid gap-5 border-b-2 border-strong-border pb-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-3">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Capacity exchange</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.035em]">
            {query.data ? `${total} ${total === 1 ? 'post' : 'posts'}` : 'Shares + needs'}
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3 lg:col-span-7">
          <div>
            <label className="mb-2 block text-[0.68rem] font-black uppercase tracking-[0.14em]" htmlFor="exchange-type">Exchange type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger id="exchange-type" className="h-11 w-full rounded-none border-2"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-[0.68rem] font-black uppercase tracking-[0.14em]" htmlFor="exchange-category">Category</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="exchange-category" className="h-11 w-full rounded-none border-2"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-[0.68rem] font-black uppercase tracking-[0.14em]" htmlFor="exchange-status">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="exchange-status" className="h-11 w-full rounded-none border-2"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button asChild className="min-h-11 rounded-none lg:col-span-2">
          <Link href="/discover/shares-needs/new">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Post a share or need
          </Link>
        </Button>
      </div>

      <QueryState
        query={query}
        errorTitle="We couldn't load shares and needs"
        loading={
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading shares and needs">
            {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-none border-2 border-border" />)}
          </div>
        }
        isEmpty={(data) => data.items.length === 0}
        empty={
          <div className="border-2 border-dashed border-strong-border p-10 sm:p-16">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Open capacity</p>
            <h3 className="mt-3 text-3xl font-black tracking-tight">{filtered ? 'Nothing matches these filters.' : 'No shares or needs yet.'}</h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Publish something you can share, name a need, or offer a solution others can use.
            </p>
            <Button asChild className="mt-6 rounded-none" variant="outline">
              <Link href="/discover/shares-needs/new">
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Post a share, need or solution
              </Link>
            </Button>
          </div>
        }
      >
        {(data) => (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        )}
      </QueryState>

      {total > PER_PAGE && (
        <nav className="flex items-center justify-between gap-3 border-t-2 border-strong-border pt-5" aria-label="Pages of shares and needs">
          <Button type="button" variant="outline" className="rounded-none" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Previous
          </Button>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-muted-foreground" aria-live="polite">
            Page {page} of {lastPage}
          </p>
          <Button type="button" variant="outline" className="rounded-none" disabled={page >= lastPage} onClick={() => setPage((current) => Math.min(lastPage, current + 1))}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  );
}
