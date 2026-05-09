import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
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
  const [, navigate] = useLocation();
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record ID</TableHead>
                <TableHead>Holding</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ecosystem</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No decisions found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((d) => (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/decisions/${d.id}`)}
                  >
                    <TableCell className="font-medium">{d.record_id}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{d.holding}</TableCell>
                    <TableCell>{d.domain || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(d.status)}>{d.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{getEcosystemName(d.ecosystem_id) || '-'}</TableCell>
                    <TableCell>{d.date ? new Date(d.date).toLocaleDateString() : '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
