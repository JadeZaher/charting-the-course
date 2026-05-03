import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Handshake, ArrowRight } from 'lucide-react';
import { useCollaborations } from '@/hooks/use-discover';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'dissolved', label: 'Dissolved' },
];

const TIER_OPTIONS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'exploratory', label: 'Exploratory' },
  { value: 'formal', label: 'Formal' },
  { value: 'deep', label: 'Deep' },
];

const statusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'proposed': return 'secondary' as const;
    case 'completed': return 'outline' as const;
    case 'dissolved': return 'destructive' as const;
    default: return 'secondary' as const;
  }
};

const tierVariant = (tier: string) => {
  switch (tier) {
    case 'deep': return 'default' as const;
    case 'formal': return 'secondary' as const;
    default: return 'outline' as const;
  }
};

interface Props {
  searchProp?: string;
}

export default function CollaborationsList({ searchProp }: Props) {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [search, setSearch] = useState(searchProp ?? '');

  useMemo(() => { setSearch(searchProp ?? ''); }, [searchProp]);

  const params = useMemo(() => {
    const p: Record<string, string> = { per_page: '24' };
    if (statusFilter !== 'all') p.status = statusFilter;
    if (tierFilter !== 'all') p.engagement_tier = tierFilter;
    if (search) p.q = search;
    return p;
  }, [statusFilter, tierFilter, search]);

  const { data, isLoading, error } = useCollaborations(params);

  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load collaborations</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Engagement Tier" />
            </SelectTrigger>
            <SelectContent>
              {TIER_OPTIONS.map(o => (
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

        <Button onClick={() => navigate('/discover/collaborations/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Propose Collaboration
        </Button>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="text-center py-16 rounded-lg border border-dashed">
          <Handshake className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">No collaborations found</p>
          <p className="text-sm text-muted-foreground mt-1">Start by proposing a collaboration between domains</p>
          <Button className="mt-4" variant="outline" onClick={() => navigate('/discover/collaborations/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Propose Collaboration
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <Card
              key={item.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/discover/collaborations/${item.id}`)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  {/* Domain path */}
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{item.source_domain_name ?? item.source_domain_id}</span>
                      {item.source_ecosystem_name && (
                        <span className="text-xs text-muted-foreground truncate">{item.source_ecosystem_name}</span>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium truncate">{item.target_domain_name ?? item.target_domain_id}</span>
                      {item.target_ecosystem_name && (
                        <span className="text-xs text-muted-foreground truncate">{item.target_ecosystem_name}</span>
                      )}
                    </div>
                  </div>

                  {/* Title and meta */}
                  <div className="flex flex-col flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">{item.title}</CardTitle>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{item.description}</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={tierVariant(item.engagement_tier)} className="capitalize text-xs">
                      {item.engagement_tier}
                    </Badge>
                    <Badge variant={statusVariant(item.status)} className="capitalize text-xs">
                      {item.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
