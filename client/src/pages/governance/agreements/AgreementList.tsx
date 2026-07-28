import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CollectionCard, CollectionGrid } from '@/components/governance/shared/CollectionGrid';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { FilterBar } from '@/components/governance/shared/FilterBar';
import { useAgreements } from '@/hooks/use-governance';
import { useGovernanceList, type FilterDef } from '@/hooks/use-governance-list';
import { useEcosystemName } from '@/hooks/use-ecosystem-filter';
import { AGREEMENT_STATUS_OPTIONS, agreementStatusLabel, agreementStatusVariant } from '@/lib/agreement-status';
import { AGREEMENT_TYPE_OPTIONS, agreementTypeLabel } from '@/lib/agreement-type';
import { Plus } from 'lucide-react';

const FILTERS: FilterDef[] = [
  {
    key: 'type', label: 'Type', type: 'select',
    options: [{ value: 'all', label: 'All Types' }, ...AGREEMENT_TYPE_OPTIONS],
  },
  {
    key: 'status', label: 'Status', type: 'select',
    options: [{ value: 'all', label: 'All Statuses' }, ...AGREEMENT_STATUS_OPTIONS],
  },
  { key: 'domain', label: 'Domain', type: 'text', placeholder: 'Domain...' },
];

export default function AgreementList() {
  const list = useGovernanceList({ entity: 'agreements', filters: FILTERS });
  const getEcosystemName = useEcosystemName();
  const { data, isLoading, error } = useAgreements(list.params);

  if (isLoading) return <LoadingState message="Loading agreements..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load agreements</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agreements</h1>
        <Button asChild>
          <Link href="/agreements/new">
            <Plus className="h-4 w-4 mr-2" />
            New Agreement
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

      <CollectionGrid aria-label="Agreements">
        {data?.items.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-strong-border p-8 text-center text-muted-foreground">
            No agreements found
          </div>
        ) : (
          data?.items.map((a) => (
            <CollectionCard key={a.id} asChild>
              <Link href={`/agreements/${a.id}`} aria-label={`View agreement: ${a.title}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Agreement</p>
                    <h2 className="mt-1 text-lg font-semibold leading-tight">{a.title}</h2>
                  </div>
                  <Badge variant={agreementStatusVariant(a.status)}>{agreementStatusLabel(a.status)}</Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge variant="outline">{agreementTypeLabel(a.type)}</Badge>
                  <Badge variant="outline">Version {a.version}</Badge>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm">
                  <div><dt className="text-xs text-muted-foreground">Ecosystem</dt><dd className="mt-1 font-medium">{getEcosystemName(a.ecosystem_id) || '-'}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Domain</dt><dd className="mt-1 font-medium">{a.domain || '-'}</dd></div>
                  <div className="col-span-2"><dt className="text-xs text-muted-foreground">Created</dt><dd className="mt-1 font-medium">{new Date(a.created_at).toLocaleDateString()}</dd></div>
                </dl>
              </Link>
            </CollectionCard>
          ))
        )}
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
