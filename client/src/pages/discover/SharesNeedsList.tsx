import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ArrowUpCircle, ArrowDownCircle, Package } from 'lucide-react';
import { useSharesNeeds } from '@/hooks/use-discover';

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'technology', label: 'Technology' },
  { value: 'resources', label: 'Resources' },
  { value: 'skills', label: 'Skills' },
  { value: 'knowledge', label: 'Knowledge' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'funding', label: 'Funding' },
  { value: 'other', label: 'Other' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'share', label: 'Shares' },
  { value: 'need', label: 'Needs' },
];

const typeBadgeVariant = (type: string) => type === 'share' ? 'default' as const : 'secondary' as const;

const statusBadgeVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'fulfilled': return 'outline' as const;
    case 'expired': return 'secondary' as const;
    default: return 'secondary' as const;
  }
};

interface Props {
  searchProp?: string;
}

export default function SharesNeedsList({ searchProp }: Props) {
  const [, navigate] = useLocation();
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState(searchProp ?? '');

  // Sync external search prop into local state when it changes
  useMemo(() => { setSearch(searchProp ?? ''); }, [searchProp]);

  const params = useMemo(() => {
    const p: Record<string, string> = { per_page: '24' };
    if (typeFilter !== 'all') p.type = typeFilter;
    if (categoryFilter !== 'all') p.category = categoryFilter;
    if (search) p.q = search;
    return p;
  }, [typeFilter, categoryFilter, search]);

  const { data, isLoading, error } = useSharesNeeds(params);

  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load shares & needs</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[200px]"
          />
        </div>

        <Button onClick={() => navigate('/discover/shares-needs/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Share / Need
        </Button>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="text-center py-16 rounded-lg border border-dashed">
          <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No shares or needs found</p>
          <p className="text-sm text-muted-foreground mt-1">Be the first to share a resource or post a need</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/discover/shares-needs/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Add Share / Need
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => (
            <Card key={item.id} className="flex flex-col hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/discover/shares-needs/${item.id}`)}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {item.type === 'share' ? (
                      <ArrowUpCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    ) : (
                      <ArrowDownCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                    )}
                    <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={typeBadgeVariant(item.type)} className="capitalize">{item.type}</Badge>
                    <Badge variant={statusBadgeVariant(item.status)} className="capitalize text-xs">{item.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col flex-1 gap-2">
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                )}
                {item.category && (
                  <Badge variant="outline" className="w-fit text-xs capitalize">{item.category}</Badge>
                )}
                {item.capacity && (
                  <p className="text-xs text-muted-foreground">Capacity: {item.capacity}</p>
                )}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                )}
                <div className="mt-auto pt-2 border-t text-xs text-muted-foreground">
                  {item.domain_name && <span>{item.domain_name}</span>}
                  {item.domain_name && item.ecosystem_name && <span className="mx-1">·</span>}
                  {item.ecosystem_name && <span>{item.ecosystem_name}</span>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
