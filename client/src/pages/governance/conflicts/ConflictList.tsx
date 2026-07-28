import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CollectionCard, CollectionGrid } from '@/components/governance/shared/CollectionGrid';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { FilterBar } from '@/components/governance/shared/FilterBar';
import { useGovernanceList, type FilterDef } from '@/hooks/use-governance-list';
import { useEcosystemName } from '@/hooks/use-ecosystem-filter';
import { useConflicts } from '@/hooks/use-governance';
import { URGENCY_OPTIONS } from '@/lib/urgency';
import { Plus } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'reported', label: 'Reported' },
  { value: 'triaged', label: 'Triaged' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severities' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const FILTERS: FilterDef[] = [
  { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
  { key: 'severity', label: 'Severity', type: 'select', options: SEVERITY_OPTIONS },
  {
    key: 'urgency', label: 'Urgency', type: 'select',
    options: [{ value: 'all', label: 'All Urgencies' }, ...URGENCY_OPTIONS],
  },
];

const statusVariant = (status: string) => {
  switch (status) {
    case 'resolved': return 'default' as const;
    case 'closed': return 'outline' as const;
    case 'in_progress': return 'secondary' as const;
    case 'reported': return 'destructive' as const;
    case 'triaged': return 'secondary' as const;
    default: return 'secondary' as const;
  }
};

const severityVariant = (severity: string) => {
  switch (severity) {
    case 'critical': return 'destructive' as const;
    case 'high': return 'destructive' as const;
    case 'medium': return 'secondary' as const;
    case 'low': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

export default function ConflictList() {
  const list = useGovernanceList({ entity: 'conflicts', filters: FILTERS });
  const getEcosystemName = useEcosystemName();

  const { data, isLoading, error } = useConflicts(list.params);

  if (isLoading) return <LoadingState message="Loading conflicts..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load conflicts</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Conflicts</h1>
        <Button asChild>
          <Link href="/conflicts/new">
            <Plus className="h-4 w-4 mr-2" />
            Report Conflict
          </Link>
        </Button>
      </div>

      <FilterBar
        filters={list.filters}
        filterValues={list.filterValues}
        onFilterChange={list.setFilter}
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search..."
      />

      <CollectionGrid aria-label="Conflicts">
        {data?.items.length === 0 ? <div className="col-span-full border-2 border-dashed border-strong-border p-8 text-center text-muted-foreground">No conflicts found</div> : data?.items.map((c) => (
          <CollectionCard key={c.id} asChild>
            <Link href={`/conflicts/${c.id}`} aria-label={`View conflict: ${c.title}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.case_id}</p><h2 className="mt-1 text-lg font-semibold">{c.title}</h2></div><Badge variant={statusVariant(c.status)}>{c.status}</Badge></div>
              <div className="mt-4 flex flex-wrap gap-2">{c.severity && <Badge variant={severityVariant(c.severity)}>{c.severity}</Badge>}<Badge variant="outline">{c.urgency}</Badge></div>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm"><div><dt className="text-xs text-muted-foreground">Ecosystem</dt><dd className="mt-1 font-medium">{getEcosystemName(c.ecosystem_id) || '-'}</dd></div><div><dt className="text-xs text-muted-foreground">Created</dt><dd className="mt-1 font-medium">{new Date(c.created_at).toLocaleDateString()}</dd></div></dl>
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
