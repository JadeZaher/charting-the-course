import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CollectionCard, CollectionGrid } from '@/components/governance/shared/CollectionGrid';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { FilterBar } from '@/components/governance/shared/FilterBar';
import { useGovernanceList, type FilterDef } from '@/hooks/use-governance-list';
import { useEcosystemName } from '@/hooks/use-ecosystem-filter';
import { useExits } from '@/hooks/use-governance';
import { EXIT_STATUS_OPTIONS, exitStatusVariant } from '@/lib/exit-status';
import { Plus } from 'lucide-react';

// Matches ExitRecord.exit_type: "standard" (30d cooling-off) or "urgent" (7d)
const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'standard', label: 'Standard' },
  { value: 'urgent', label: 'Urgent' },
];

const FILTERS: FilterDef[] = [
  {
    key: 'status', label: 'Status', type: 'select',
    options: [{ value: 'all', label: 'All Statuses' }, ...EXIT_STATUS_OPTIONS],
  },
  { key: 'exit_type', label: 'Type', type: 'select', options: TYPE_OPTIONS },
];

export default function ExitList() {
  const list = useGovernanceList({ entity: 'exits', filters: FILTERS });
  const getEcosystemName = useEcosystemName();

  const { data, isLoading, error } = useExits(list.params);

  if (isLoading) return <LoadingState message="Loading exits..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load exits</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Exits</h1>
        <Button asChild>
          <Link href="/exit/new">
            <Plus className="h-4 w-4 mr-2" />
            Initiate Exit
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

      <CollectionGrid aria-label="Exits">
        {data?.items.length === 0 ? <div className="col-span-full border-2 border-dashed border-strong-border p-8 text-center text-muted-foreground">No exits found</div> : data?.items.map((item) => (
          <CollectionCard key={item.id} asChild>
            <Link href={`/exit/${item.id}`} aria-label={`View exit for ${item.member_name}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.exit_type} exit</p><h2 className="mt-1 text-lg font-semibold">{item.member_name}</h2></div><Badge variant={exitStatusVariant(item.status)}>{item.status}</Badge></div>
              <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{item.reason || 'No reason recorded.'}</p>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm"><div><dt className="text-xs text-muted-foreground">Ecosystem</dt><dd className="mt-1 font-medium">{getEcosystemName(item.ecosystem_id) || '-'}</dd></div><div><dt className="text-xs text-muted-foreground">Created</dt><dd className="mt-1 font-medium">{new Date(item.created_at).toLocaleDateString()}</dd></div></dl>
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
