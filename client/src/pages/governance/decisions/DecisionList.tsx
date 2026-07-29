import { useMemo } from 'react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CollectionCard, CollectionGrid } from '@/components/governance/shared/CollectionGrid';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { FilterBar } from '@/components/governance/shared/FilterBar';
import { useGovernanceList, type FilterDef } from '@/hooks/use-governance-list';
import { useEcosystemName } from '@/hooks/use-ecosystem-filter';
import { useDecisions, useDomains } from '@/hooks/use-governance';

const STATUS_FILTER: FilterDef = { key: 'status', label: 'Status', type: 'select', options: [
  { value: 'all', label: 'All Statuses' },
  { value: 'recorded', label: 'Recorded' },
  { value: 'superseded', label: 'Superseded' },
  { value: 'archived', label: 'Archived' },
]};

const SOURCE_LAYER_FILTER: FilterDef = { key: 'source_layer', label: 'Source Layer', type: 'select', options: [
  { value: 'all', label: 'All Layers' },
  { value: 'foundational', label: 'Foundational' },
  { value: 'operational', label: 'Operational' },
  { value: 'domain', label: 'Domain' },
  { value: 'local', label: 'Local' },
]};

const ARTIFACT_TYPE_FILTER: FilterDef = { key: 'artifact_type', label: 'Artifact', type: 'select', options: [
  { value: 'all', label: 'All Artifacts' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'commitment', label: 'Commitment' },
  { value: 'agreement', label: 'Agreement' },
  { value: 'decision', label: 'Decision' },
]};

const statusVariant = (status: string) => {
  switch (status) {
    case 'recorded': return 'default' as const;
    case 'superseded': return 'secondary' as const;
    case 'archived': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

const humanize = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function DecisionList() {
  const { data: domainsData } = useDomains({ per_page: '100' });

  // Domain select options come from live domains; decision.domain is a free-text
  // string, so options use domain_id as the value (matches prior text-filter semantics).
  const filters = useMemo<FilterDef[]>(() => {
    const seen = new Set<string>();
    const domainOptions: { value: string; label: string }[] = [{ value: 'all', label: 'All Domains' }];
    for (const d of domainsData?.items ?? []) {
      if (seen.has(d.domain_id)) continue;
      seen.add(d.domain_id);
      domainOptions.push({ value: d.domain_id, label: d.domain_id });
    }
    return [
      STATUS_FILTER,
      { key: 'domain', label: 'Domain', type: 'select', options: domainOptions },
      SOURCE_LAYER_FILTER,
      ARTIFACT_TYPE_FILTER,
    ];
  }, [domainsData]);

  const list = useGovernanceList({ entity: 'decisions', filters });
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
      <div className="space-y-1">
        <h1 className="text-3xl font-bold">Decisions</h1>
        <p className="text-sm text-muted-foreground">Receipts of governed action — what was decided, where it applies, and under which precedent.</p>
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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Decision record</p>
                  <h2 className="mt-1 text-lg font-semibold">{d.record_id}</h2>
                </div>
                <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
              </div>
              <p className="mt-4 line-clamp-3 text-sm text-muted-foreground">{d.holding}</p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {d.domain && <Badge variant="outline">{d.domain}</Badge>}
                {d.precedent_level && <Badge variant="secondary">{humanize(d.precedent_level)}</Badge>}
                {d.artifact_type && (
                  <Badge variant={d.artifact_type === 'commitment' ? 'default' : 'outline'}>
                    {humanize(d.artifact_type)}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {d.date ? `Decided ${new Date(d.date).toLocaleDateString()}` : 'Date not recorded'}
                </span>
              </div>
              <dl className="mt-4 border-t border-border pt-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Ecosystem</dt>
                  <dd className="mt-1 font-medium">{getEcosystemName(d.ecosystem_id) || '-'}</dd>
                </div>
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
