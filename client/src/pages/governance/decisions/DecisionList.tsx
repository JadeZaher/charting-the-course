import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CollectionCard, CollectionGrid } from '@/components/governance/shared/CollectionGrid';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { FilterBar } from '@/components/governance/shared/FilterBar';
import { useGovernanceList, type FilterDef } from '@/hooks/use-governance-list';
import { useEcosystemName } from '@/hooks/use-ecosystem-filter';
import { useDecisions } from '@/hooks/use-governance';

const FILTERS: FilterDef[] = [
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'all', label: 'All Statuses' },
    { value: 'recorded', label: 'Recorded' },
    { value: 'superseded', label: 'Superseded' },
    { value: 'archived', label: 'Archived' },
  ]},
  { key: 'domain', label: 'Domain', type: 'text', placeholder: 'Domain...' },
  { key: 'source_layer', label: 'Source Layer', type: 'select', options: [
    { value: 'all', label: 'All Layers' },
    { value: 'foundational', label: 'Foundational' },
    { value: 'operational', label: 'Operational' },
    { value: 'domain', label: 'Domain' },
    { value: 'local', label: 'Local' },
  ]},
];

const statusVariant = (status: string) => {
  switch (status) {
    case 'recorded': return 'default' as const;
    case 'superseded': return 'secondary' as const;
    case 'archived': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

export default function DecisionList() {
  const list = useGovernanceList({ entity: 'decisions', filters: FILTERS });
  const getEcosystemName = useEcosystemName();

  const { data, isLoading, error } = useDecisions(list.params);

  if (isLoading) return <LoadingState message="Loading decisions..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load decisions</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Decisions</h1>
      </div>

      <FilterBar
        filters={list.filters}
        filterValues={list.filterValues}
        onFilterChange={list.setFilter}
        search={list.search}
        onSearchChange={list.setSearch}
      />

      <CollectionGrid aria-label="Decisions">
        {data?.items.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-strong-border p-8 text-center text-muted-foreground">No decisions found</div>
        ) : data?.items.map((d) => (
          <CollectionCard key={d.id} asChild>
            <Link href={`/decisions/${d.id}`} aria-label={`View decision: ${d.record_id}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Decision record</p><h2 className="mt-1 text-lg font-semibold">{d.record_id}</h2></div><Badge variant={statusVariant(d.status)}>{d.status}</Badge></div>
              <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{d.holding}</p>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm"><div><dt className="text-xs text-muted-foreground">Domain</dt><dd className="mt-1 font-medium">{d.domain || '-'}</dd></div><div><dt className="text-xs text-muted-foreground">Date</dt><dd className="mt-1 font-medium">{d.date ? new Date(d.date).toLocaleDateString() : '-'}</dd></div><div className="col-span-2"><dt className="text-xs text-muted-foreground">Ecosystem</dt><dd className="mt-1 font-medium">{getEcosystemName(d.ecosystem_id) || '-'}</dd></div></dl>
            </Link>
          </CollectionCard>
        ))}
      </CollectionGrid>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => list.setPage(p => Math.max(1, p - 1))}
                className={list.page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - list.page) <= 2)
              .map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === list.page}
                    onClick={() => list.setPage(p)}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => list.setPage(p => Math.min(totalPages, p + 1))}
                className={list.page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
