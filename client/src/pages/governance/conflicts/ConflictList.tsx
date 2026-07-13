import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { FilterBar } from '@/components/governance/shared/FilterBar';
import { useGovernanceList, type FilterDef } from '@/hooks/use-governance-list';
import { useEcosystemName } from '@/hooks/use-ecosystem-filter';
import { useConflicts } from '@/hooks/use-governance';
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

const URGENCY_OPTIONS = [
  { value: 'all', label: 'All Urgencies' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'immediate', label: 'Immediate' },
];

const FILTERS: FilterDef[] = [
  { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
  { key: 'severity', label: 'Severity', type: 'select', options: SEVERITY_OPTIONS },
  { key: 'urgency', label: 'Urgency', type: 'select', options: URGENCY_OPTIONS },
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
  const [, navigate] = useLocation();

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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case ID</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Ecosystem</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No conflicts found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((c) => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/conflicts/${c.id}`)}
                  >
                    <TableCell className="font-medium">{c.case_id}</TableCell>
                    <TableCell>{c.title}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(c.status)}>{c.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {c.severity ? <Badge variant={severityVariant(c.severity)}>{c.severity}</Badge> : '-'}
                    </TableCell>
                    <TableCell>{c.urgency}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{getEcosystemName(c.ecosystem_id) || '-'}</TableCell>
                    <TableCell>{new Date(c.created_at).toLocaleDateString()}</TableCell>
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
