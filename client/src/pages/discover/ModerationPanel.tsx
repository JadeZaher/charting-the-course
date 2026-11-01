// The "Moderation" list (AdminPanel tab and /discover/moderation): posts in the ecosystems the caller stewards; Hide (with a reason) and Restore only.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QueryState } from '@/components/QueryState';
import { useSharesNeedsAdmin } from '@/hooks/use-discover';
import { joinNames, POST_TYPE_LABELS, postHref } from '@/lib/exchange';
import { SHARESNEEDS_CATEGORY_OPTIONS } from '@/lib/sharesneeds-vocab';
import type { SharesNeedsModerationPage, SharesNeedsPost } from '@/types/api';
import { PostBadges, PostByline, PostStateNotes } from './PostParts';
import { PostManageActions } from './PostManageActions';

const PER_PAGE = 50;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Open' },
  { value: 'fulfilled', label: 'Fulfilled' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const HIDDEN_OPTIONS = [
  { value: 'any', label: 'Hidden or not' },
  { value: 'true', label: 'Hidden only' },
  { value: 'false', label: 'Not hidden' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All types' },
  { value: 'share', label: 'Shares' },
  { value: 'need', label: 'Needs' },
  { value: 'solution', label: 'Solutions' },
];

function FilterSelect({ id, label, value, onChange, options }: {
  id: string; label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function Stats({ stats }: { stats: SharesNeedsModerationPage['stats'] }) {
  const cells: Array<[string, number]> = [
    ['Total', stats.total], ['Shares', stats.shares], ['Needs', stats.needs], ['Solutions', stats.solutions],
    ['Open', stats.active], ['Fulfilled', stats.fulfilled], ['Withdrawn', stats.withdrawn], ['Hidden', stats.hidden],
  ];
  return (
    <dl className="grid grid-cols-2 gap-px border-2 border-strong-border bg-border sm:grid-cols-4 lg:grid-cols-8">
      {cells.map(([label, value]) => (
        <div key={label} className="bg-card p-3">
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="text-xl font-bold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ModerationRow({ post }: { post: SharesNeedsPost }) {
  return (
    <li className="space-y-2 border border-strong-border p-4" aria-labelledby={`moderation-${post.id}-title`}>
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="rounded-none">{POST_TYPE_LABELS[post.type] ?? post.type}</Badge>
        <h3 id={`moderation-${post.id}-title`} className="font-bold [overflow-wrap:anywhere]">{post.title}</h3>
        <PostBadges post={post} />
      </div>
      <PostByline post={post} />
      {post.description && <p className="line-clamp-2 text-sm text-muted-foreground">{post.description}</p>}
      <PostStateNotes post={post} />
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link href={postHref(post.id)} aria-label={`Details: ${post.title}`}>Details</Link>
        </Button>
        <PostManageActions post={post} include="moderation" />
      </div>
    </li>
  );
}

/** Scoped moderation list; a caller who stewards nothing is told so plainly (not an error). */
export function ModerationPanel() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [hidden, setHidden] = useState('any');
  const [ecosystemId, setEcosystemId] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [search, type, category, status, hidden, ecosystemId]);

  const params = useMemo(() => {
    const next: Record<string, string> = { page: String(page), per_page: String(PER_PAGE) };
    if (search.trim()) next.q = search.trim();
    if (type !== 'all') next.type = type;
    if (category !== 'all') next.category = category;
    if (status !== 'all') next.status = status;
    if (hidden !== 'any') next.hidden = hidden;
    if (ecosystemId !== 'all') next.ecosystem_id = ecosystemId;
    return next;
  }, [search, type, category, status, hidden, ecosystemId, page]);

  const query = useSharesNeedsAdmin(params);
  const moderated = query.data?.moderated_ecosystems ?? [];
  const total = query.data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PER_PAGE));

  if (query.data && moderated.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>Moderation</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm">You are not a steward of any ecosystem, so there is nothing for you to moderate.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Moderation</CardTitle>
          <CardDescription>
            {moderated.length > 0
              ? `Shares, needs and solutions in ${joinNames(moderated.map((ecosystem) => ecosystem.name))}, where you are a steward. Hide a post with a reason its author will read; restore it when it is fine again. Authors edit, close and delete their own posts.`
              : 'Shares, needs and solutions in the ecosystems you steward.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {query.data && <Stats stats={query.data.stats} />}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1">
              <Label htmlFor="moderation-search" className="text-xs">Search</Label>
              <Input id="moderation-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <FilterSelect id="moderation-type" label="Type" value={type} onChange={setType} options={TYPE_OPTIONS} />
            <FilterSelect
              id="moderation-category"
              label="Category"
              value={category}
              onChange={setCategory}
              options={[{ value: 'all', label: 'All categories' }, ...SHARESNEEDS_CATEGORY_OPTIONS]}
            />
            <FilterSelect id="moderation-status" label="Status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
            <FilterSelect id="moderation-hidden" label="Hidden" value={hidden} onChange={setHidden} options={HIDDEN_OPTIONS} />
            {moderated.length > 1 && (
              <FilterSelect
                id="moderation-ecosystem"
                label="Ecosystem"
                value={ecosystemId}
                onChange={setEcosystemId}
                options={[{ value: 'all', label: 'All my ecosystems' }, ...moderated.map((ecosystem) => ({ value: ecosystem.id, label: ecosystem.name }))]}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <QueryState
        query={query}
        errorTitle="We couldn't load the moderation list"
        isEmpty={(data) => data.items.length === 0}
        empty={<p className="py-8 text-center text-sm text-muted-foreground">No posts match these filters.</p>}
      >
        {(data) => (
          <ul className="space-y-3" aria-label="Posts you moderate" aria-busy={query.isFetching}>
            {data.items.map((post) => <ModerationRow key={post.id} post={post} />)}
          </ul>
        )}
      </QueryState>

      {total > PER_PAGE && (
        <nav className="flex items-center justify-between gap-3" aria-label="Pages of posts you moderate">
          <Button type="button" variant="outline" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
            <ChevronLeft className="mr-2 h-4 w-4" aria-hidden="true" />Previous
          </Button>
          <p className="text-xs font-bold text-muted-foreground" aria-live="polite">Page {page} of {lastPage}</p>
          <Button type="button" variant="outline" disabled={page >= lastPage} onClick={() => setPage((current) => Math.min(lastPage, current + 1))}>
            Next<ChevronRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Button>
        </nav>
      )}
    </div>
  );
}

/** `/discover/moderation` (FX-Exchange): the same list for every exchange steward, not only platform admins. */
export default function ModerationPage() {
  return (
    <div className="max-w-5xl space-y-6">
      <h1 className="text-3xl font-bold">Moderate shares and needs</h1>
      <ModerationPanel />
    </div>
  );
}
