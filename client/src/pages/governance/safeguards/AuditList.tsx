import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CollectionCard, CollectionGrid } from '@/components/governance/shared/CollectionGrid';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { FilterBar } from '@/components/governance/shared/FilterBar';
import { useGovernanceList, type FilterDef } from '@/hooks/use-governance-list';
import { useEcosystemName } from '@/hooks/use-ecosystem-filter';
import { useAudits } from '@/hooks/use-governance';
import { ArrowLeft } from 'lucide-react';

const FILTERS: FilterDef[] = [
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ]},
  { key: 'overall_health', label: 'Health', type: 'select', options: [
    { value: 'all', label: 'All Health' },
    { value: 'healthy', label: 'Healthy' },
    { value: 'mixed', label: 'Mixed' },
    { value: 'degrading', label: 'Degrading' },
    { value: 'critical', label: 'Critical' },
  ]},
];

const statusVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'default' as const;
    case 'in_progress': return 'secondary' as const;
    case 'pending': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

const healthColorClass = (health: string) => {
  switch (health) {
    case 'healthy': return 'border-success bg-success/10 text-success';
    case 'mixed': return 'border-warning bg-warning/10 text-warning';
    case 'degrading': return 'border-warning bg-warning/10 text-warning';
    case 'critical': return 'border-destructive bg-destructive/10 text-destructive';
    default: return '';
  }
};

export default function AuditList() {
  const list = useGovernanceList({ entity: 'audits', filters: FILTERS });
  const getEcosystemName = useEcosystemName();

  const { data, isLoading, error } = useAudits(list.params);

  if (isLoading) return <LoadingState message="Loading audits..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load audits</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/safeguards">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Safeguards
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Audit History</h1>
        <Button asChild variant="outline" size="sm">
          <Link href="/safeguards">Request New Audit</Link>
        </Button>
      </div>

      <FilterBar
        filters={list.filters}
        filterValues={list.filterValues}
        onFilterChange={list.setFilter}
        search={list.search}
        onSearchChange={list.setSearch}
      />

      <CollectionGrid aria-label="Audit history">
        {data?.items.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-strong-border p-8 text-center"><p className="text-muted-foreground">No audits found</p><p className="mt-2 text-xs text-muted-foreground">Governance audits help track the health of your ecosystem's decision-making processes.</p></div>
        ) : data?.items.map((audit) => (
          <CollectionCard key={audit.id} asChild>
            <Link href={`/safeguards/audits/${audit.id}`} aria-label={`View audit by ${audit.auditor}`}>
              <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Governance audit</p><h2 className="mt-1 text-lg font-semibold">{audit.auditor}</h2></div><Badge variant={statusVariant(audit.status)}>{audit.status}</Badge></div>
              <div className="mt-4 flex flex-wrap gap-2">{audit.overall_health && <Badge className={healthColorClass(audit.overall_health)}>{audit.overall_health}</Badge>}{audit.trigger_type && <Badge variant="outline">{audit.trigger_type}</Badge>}</div>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm"><div className="col-span-2"><dt className="text-xs text-muted-foreground">Scope</dt><dd className="mt-1 font-medium">{audit.audit_scope || '-'}</dd></div><div><dt className="text-xs text-muted-foreground">Created</dt><dd className="mt-1 font-medium">{new Date(audit.created_at).toLocaleDateString()}</dd></div><div><dt className="text-xs text-muted-foreground">Completed</dt><dd className="mt-1 font-medium">{audit.completed_at ? new Date(audit.completed_at).toLocaleDateString() : '-'}</dd></div><div className="col-span-2"><dt className="text-xs text-muted-foreground">Ecosystem</dt><dd className="mt-1 font-medium">{getEcosystemName(audit.ecosystem_id) || '-'}</dd></div></dl>
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
