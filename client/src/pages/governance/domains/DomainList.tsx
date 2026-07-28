import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CollectionCard, CollectionGrid } from '@/components/governance/shared/CollectionGrid';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { FilterBar } from '@/components/governance/shared/FilterBar';
import { useGovernanceList, type FilterDef } from '@/hooks/use-governance-list';
import { useEcosystemName } from '@/hooks/use-ecosystem-filter';
import { useDomains } from '@/hooks/use-governance';
import { Plus } from 'lucide-react';

const FILTERS: FilterDef[] = [
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'all', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' },
  ]},
];

const statusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'draft': return 'secondary' as const;
    case 'archived': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

export default function DomainList() {
  const list = useGovernanceList({ entity: 'domains', filters: FILTERS });
  const getEcosystemName = useEcosystemName();

  const { data, isLoading, error } = useDomains(list.params);

  if (isLoading) return <LoadingState message="Loading domains..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load domains</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Domains</h1>
        <Button asChild>
          <Link href="/domains/new">
            <Plus className="h-4 w-4 mr-2" />
            New Domain
          </Link>
        </Button>
      </div>

      <FilterBar
        filters={list.filters}
        filterValues={list.filterValues}
        onFilterChange={list.setFilter}
        search={list.search}
        onSearchChange={list.setSearch}
      />

      <CollectionGrid aria-label="Domains">
        {data?.items.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-strong-border p-8 text-center text-muted-foreground">No domains found</div>
        ) : data?.items.map((d) => (
          <CollectionCard key={d.id} asChild>
            <Link href={`/domains/${d.id}`} aria-label={`View domain: ${d.domain_id}`}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Domain</p><h2 className="mt-1 text-lg font-semibold">{d.domain_id}</h2></div>
                <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
              </div>
              <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{d.purpose || 'No purpose recorded.'}</p>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm">
                <div><dt className="text-xs text-muted-foreground">Steward</dt><dd className="mt-1 font-medium">{d.current_steward || '-'}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Version</dt><dd className="mt-1 font-medium">{d.version}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Ecosystem</dt><dd className="mt-1 font-medium">{getEcosystemName(d.ecosystem_id) || '-'}</dd></div>
              </dl>
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
