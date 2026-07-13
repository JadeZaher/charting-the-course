import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { useSharesNeeds } from '@/hooks/use-discover';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All categories' },
  { value: 'technology', label: 'Technology' },
  { value: 'resources', label: 'Resources' },
  { value: 'skills', label: 'Skills' },
  { value: 'knowledge', label: 'Knowledge' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'funding', label: 'Funding' },
  { value: 'other', label: 'Other' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All exchanges' },
  { value: 'share', label: 'Shares' },
  { value: 'need', label: 'Needs' },
];

function statusTone(status: string) {
  if (status === 'active') return 'text-success';
  if (status === 'expired') return 'text-destructive';
  return 'text-muted-foreground';
}

interface Props {
  searchProp?: string;
}

export default function SharesNeedsList({ searchProp = '' }: Props) {
  const [, navigate] = useLocation();
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const params = useMemo(() => {
    const next: Record<string, string> = { per_page: '24' };
    if (typeFilter !== 'all') next.type = typeFilter;
    if (categoryFilter !== 'all') next.category = categoryFilter;
    if (searchProp.trim()) next.q = searchProp.trim();
    return next;
  }, [typeFilter, categoryFilter, searchProp]);

  const { data, isLoading, error } = useSharesNeeds(params);
  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-5" aria-label="Loading shares and needs">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-none border-2 border-border" />
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-64 rounded-none border-2 border-border" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-2 border-destructive p-8" role="alert">
        <p className="font-black uppercase tracking-wide text-destructive">Exchange index unavailable</p>
        <p className="mt-2 text-sm text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 border-b-2 border-strong-border pb-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Capacity exchange</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.035em]">{items.length} live signals</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-5">
          <div>
            <label className="mb-2 block text-[0.68rem] font-black uppercase tracking-[0.14em]" htmlFor="exchange-type">
              Exchange type
            </label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger id="exchange-type" className="h-11 w-full rounded-none border-2">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-[0.68rem] font-black uppercase tracking-[0.14em]" htmlFor="exchange-category">
              Category
            </label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="exchange-category" className="h-11 w-full rounded-none border-2">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="min-h-11 rounded-none lg:col-span-2" onClick={() => navigate('/discover/shares-needs/new')}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Add signal
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="border-2 border-dashed border-strong-border p-10 sm:p-16">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Open capacity</p>
          <h3 className="mt-3 text-3xl font-black tracking-tight">No matching signals yet.</h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Publish a resource you can share or name a need the wider network could meet.
          </p>
          <Button className="mt-6 rounded-none" variant="outline" onClick={() => navigate('/discover/shares-needs/new')}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Add share or need
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <article key={item.id} className="flex min-h-64 flex-col border-2 border-strong-border bg-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
                <div>
                  <p className={`text-xs font-black uppercase tracking-[0.18em] ${item.type === 'share' ? 'text-success' : 'text-link'}`}>
                    {item.type === 'share' ? 'Offers' : 'Seeks'} / {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-3 text-xl font-black leading-tight tracking-[-0.025em]">{item.title}</h3>
                </div>
                <span className={`text-[0.65rem] font-black uppercase tracking-[0.14em] ${statusTone(item.status)}`}>
                  {item.status}
                </span>
              </div>

              {item.description && (
                <p className="mt-4 line-clamp-4 text-sm leading-6 text-muted-foreground">{item.description}</p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {item.category && (
                  <Badge variant="outline" className="rounded-none capitalize">{item.category}</Badge>
                )}
                {item.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="rounded-none">{tag}</Badge>
                ))}
              </div>

              <dl className="mt-auto grid grid-cols-2 gap-3 border-t border-border pt-5 text-xs">
                <div>
                  <dt className="font-bold uppercase tracking-[0.12em] text-muted-foreground">Ecosystem</dt>
                  <dd className="mt-1 font-semibold">{item.ecosystem_name ?? 'Network-wide'}</dd>
                </div>
                <div>
                  <dt className="font-bold uppercase tracking-[0.12em] text-muted-foreground">Capacity</dt>
                  <dd className="mt-1 font-semibold">{item.capacity ?? 'Open'}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
