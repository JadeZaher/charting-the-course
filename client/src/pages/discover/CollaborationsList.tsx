import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryState } from '@/components/QueryState';
import { useCollaborations } from '@/hooks/use-discover';

/** Always sent: `all` asks for every status the caller may read (proposed ones only for members of either side). */
const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'dissolved', label: 'Dissolved' },
];

const TIER_OPTIONS = [
  { value: 'all', label: 'All tiers' },
  { value: 'observe', label: 'Observe' },
  { value: 'cooperate', label: 'Cooperate' },
  { value: 'federate', label: 'Federate' },
  { value: 'integrate', label: 'Integrate' },
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
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  const params = useMemo(() => {
    const next: Record<string, string> = { per_page: '24', status: statusFilter };
    if (tierFilter !== 'all') next.engagement_tier = tierFilter;
    if (searchProp.trim()) next.q = searchProp.trim();
    return next;
  }, [statusFilter, tierFilter, searchProp]);

  const query = useCollaborations(params);
  const total = query.data?.total ?? query.data?.items.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-5 border-b-2 border-strong-border pb-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-5">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Working relationships</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.035em]">
            {query.data ? `${total} ${total === 1 ? 'collaboration' : 'collaborations'}` : 'Collaborations'}
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-5">
          <div>
            <label className="mb-2 block text-[0.68rem] font-black uppercase tracking-[0.14em]" htmlFor="collaboration-status">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="collaboration-status" className="h-11 w-full rounded-none border-2"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-2 block text-[0.68rem] font-black uppercase tracking-[0.14em]" htmlFor="collaboration-tier">Engagement tier</label>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger id="collaboration-tier" className="h-11 w-full rounded-none border-2"><SelectValue placeholder="Tier" /></SelectTrigger>
              <SelectContent>
                {TIER_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button asChild className="min-h-11 rounded-none lg:col-span-2">
          <Link href="/discover/collaborations/new">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            Propose
          </Link>
        </Button>
      </div>

      <QueryState
        query={query}
        errorTitle="We couldn't load collaborations"
        loading={
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading collaborations">
            {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-64 rounded-none border-2 border-border" />)}
          </div>
        }
        isEmpty={(data) => data.items.length === 0}
        empty={
          <div className="border-2 border-dashed border-strong-border p-10 sm:p-16">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">No records</p>
            <h3 className="mt-3 text-3xl font-black tracking-tight">No matching collaborations.</h3>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
              Connect two domains around a concrete exchange, shared outcome, or long-term partnership.
            </p>
            <Button asChild className="mt-6 rounded-none" variant="outline">
              <Link href="/discover/collaborations/new">
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Propose collaboration
              </Link>
            </Button>
          </div>
        }
      >
        {(data) => (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((item, index) => (
              <article key={item.id} className="h-full border-2 border-strong-border bg-card">
                <Link
                  href={`/discover/collaborations/${item.id}`}
                  className="group flex h-full flex-col gap-5 p-5 hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground group-hover:text-background/75">
                        C-{String(index + 1).padStart(2, '0')}
                      </p>
                      <p className={`mt-2 text-xs font-black uppercase tracking-[0.14em] group-hover:text-background ${statusTone(item.status)}`}>
                        {item.status}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-none capitalize group-hover:border-background group-hover:text-background">
                      {item.engagement_tier}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-xl font-black tracking-tight [overflow-wrap:anywhere]">{item.title}</h3>
                    {item.description && (
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground group-hover:text-background/80">{item.description}</p>
                    )}
                  </div>

                  <div className="grid gap-4 border-t border-border pt-4 group-hover:border-background/40 sm:grid-cols-2">
                    <div>
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground group-hover:text-background/75">Source</p>
                      <p className="mt-1 font-black">{item.source_domain_name ?? 'Source domain'}</p>
                      {item.source_ecosystem_name && (
                        <p className="mt-1 text-xs text-muted-foreground group-hover:text-background/75">{item.source_ecosystem_name}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[0.65rem] font-bold uppercase tracking-[0.14em] text-muted-foreground group-hover:text-background/75">Target</p>
                      <p className="mt-1 font-black">{item.target_domain_name ?? 'Target domain'}</p>
                      {item.target_ecosystem_name && (
                        <p className="mt-1 text-xs text-muted-foreground group-hover:text-background/75">{item.target_ecosystem_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto flex items-center justify-end border-t border-border pt-4 group-hover:border-background/40">
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true" />
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}
