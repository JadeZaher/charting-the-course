import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CollectionCard, CollectionGrid } from '@/components/governance/shared/CollectionGrid';
import { QueryState } from '@/components/QueryState';
import { FilterBar } from '@/components/governance/shared/FilterBar';
import { useGovernanceList, type FilterDef } from '@/hooks/use-governance-list';
import { useEcosystemName } from '@/hooks/use-ecosystem-filter';
import { useDomains } from '@/hooks/use-governance';
import { domainCode, domainLabel } from '@/lib/domain-label';
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

  const query = useDomains(list.params);
  const data = query.data;

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Domains</h1>
        {/* Creating a domain needs an ecosystem steward (mod+); the server enforces it too. */}
        {data?.caller_can_create ? (
          <Button asChild>
            <Link href="/domains/new">
              <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
              New Domain
            </Link>
          </Button>
        ) : (
          <p className="max-w-xs text-right text-sm text-muted-foreground">Ecosystem stewards create domains.</p>
        )}
      </div>

      <FilterBar
        filters={list.filters}
        filterValues={list.filterValues}
        onFilterChange={list.setFilter}
        search={list.search}
        onSearchChange={list.setSearch}
      />

      <QueryState
        query={query}
        isEmpty={(page) => page.items.length === 0}
        empty={<div className="border-2 border-dashed border-strong-border p-8 text-center text-muted-foreground">No domains found</div>}
        errorTitle="We couldn't load domains"
      >
        {(page) => (
          <>
          <CollectionGrid aria-label="Domains">
            {page.items.map((d) => {
              const code = domainCode(d);
              return (
              <CollectionCard key={d.id} asChild>
                <Link href={`/domains/${d.id}`} aria-label={`View domain: ${domainLabel(d)}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Domain{code ? ` · ${code}` : ''}</p>
                      <h2 className="mt-1 text-lg font-semibold">{domainLabel(d)}</h2>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
                      {d.caller_is_steward && <Badge variant="outline">You steward</Badge>}
                      {d.caller_is_participant && <Badge variant="outline">You participate</Badge>}
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{d.purpose || 'No purpose recorded.'}</p>
                  <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm">
                    <div><dt className="text-xs text-muted-foreground">Steward</dt><dd className="mt-1 font-medium">{d.current_steward || '-'}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Version</dt><dd className="mt-1 font-medium">{d.version}</dd></div>
                    <div className="col-span-2"><dt className="text-xs text-muted-foreground">Ecosystem</dt><dd className="mt-1 font-medium">{getEcosystemName(d.ecosystem_id) || '-'}</dd></div>
                  </dl>
                </Link>
              </CollectionCard>
              );
            })}
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
          </>
        )}
      </QueryState>
    </div>
  );
}
