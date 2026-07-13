import { useMemo, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Plus } from 'lucide-react';
import { useCollaborations } from '@/hooks/use-discover';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'dissolved', label: 'Dissolved' },
];

const TIER_OPTIONS = [
  { value: 'all', label: 'All tiers' },
  { value: 'exploratory', label: 'Exploratory' },
  { value: 'formal', label: 'Formal' },
  { value: 'deep', label: 'Deep' },
];

function statusTone(status: string) {
  if (status === 'active' || status === 'completed') return 'text-success';
  if (status === 'dissolved') return 'text-destructive';
  return 'text-warning';
}

interface Props {
  searchProp?: string;
}

export default function CollaborationsList({ searchProp = '' }: Props) {
  const [, navigate] = useLocation();
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  const params = useMemo(() => {
    const next: Record<string, string> = { per_page: '24' };
    if (statusFilter !== 'all') next.status = statusFilter;
    if (tierFilter !== 'all') next.engagement_tier = tierFilter;
    if (searchProp.trim()) next.q = searchProp.trim();
    return next;
  }, [statusFilter, tierFilter, searchProp]);

  const { data, isLoading, error } = useCollaborations(params);
  const items = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="space-y-5" aria-label="Loading collaborations">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-14 rounded-none border-2 border-border" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-none border-2 border-border" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-2 border-destructive p-8" role="alert">
        <p className="font-black uppercase tracking-wide text-destructive">Collaboration index unavailable</p>
        <p className="mt-2 text-sm text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-5 border-b-2 border-strong-border pb-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Working relationships</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.035em]">{items.length} collaborations</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-5">
          <div>
            <label className="mb-2 block text-[0.68rem] font-black uppercase tracking-[0.14em]" htmlFor="collaboration-status">
              Status
            </label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="collaboration-status" className="h-11 w-full rounded-none border-2">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-[0.68rem] font-black uppercase tracking-[0.14em]" htmlFor="collaboration-tier">
              Engagement tier
            </label>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger id="collaboration-tier" className="h-11 w-full rounded-none border-2">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                {TIER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button className="min-h-11 rounded-none lg:col-span-2" onClick={() => navigate('/discover/collaborations/new')}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Propose
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="border-2 border-dashed border-strong-border p-10 sm:p-16">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">No records</p>
          <h3 className="mt-3 text-3xl font-black tracking-tight">No matching collaborations.</h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            Connect two domains around a concrete exchange, shared outcome, or long-term partnership.
          </p>
          <Button className="mt-6 rounded-none" variant="outline" onClick={() => navigate('/discover/collaborations/new')}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Propose collaboration
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <article key={item.id} className="border-2 border-strong-border bg-card">
              <Link
                href={`/discover/collaborations/${item.id}`}
                className="group grid gap-5 p-5 hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-6 lg:grid-cols-12 lg:items-center"
              >
                <div className="lg:col-span-2">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground group-hover:text-background/75">
                    C-{String(index + 1).padStart(2, '0')}
                  </p>
                  <p className={`mt-2 text-xs font-black uppercase tracking-[0.14em] group-hover:text-background ${statusTone(item.status)}`}>
                    {item.status}
                  </p>
                </div>

                <div className="lg:col-span-4">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground group-hover:text-background/75">Source</p>
                  <p className="mt-1 font-black">{item.source_domain_name ?? item.source_domain_id}</p>
                  {item.source_ecosystem_name && (
                    <p className="mt-1 text-xs text-muted-foreground group-hover:text-background/75">{item.source_ecosystem_name}</p>
                  )}
                </div>

                <div className="lg:col-span-4">
                  <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground group-hover:text-background/75">Target</p>
                  <p className="mt-1 font-black">{item.target_domain_name ?? item.target_domain_id}</p>
                  {item.target_ecosystem_name && (
                    <p className="mt-1 text-xs text-muted-foreground group-hover:text-background/75">{item.target_ecosystem_name}</p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-4 lg:col-span-2 lg:justify-end">
                  <Badge variant="outline" className="rounded-none capitalize group-hover:border-background group-hover:text-background">
                    {item.engagement_tier}
                  </Badge>
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                </div>

                <div className="border-t border-border pt-4 group-hover:border-background/40 lg:col-span-12">
                  <h3 className="text-lg font-black tracking-tight">{item.title}</h3>
                  {item.description && (
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground group-hover:text-background/80">{item.description}</p>
                  )}
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
