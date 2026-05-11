import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
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
    case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
    case 'mixed': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'degrading': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'critical': return 'bg-red-100 text-red-800 border-red-200';
    default: return '';
  }
};

export default function AuditList() {
  const [, navigate] = useLocation();
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
          <Link href="/safeguards">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Safeguards
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Audit History</h1>
        <Link href="/safeguards">
          <Button variant="outline" size="sm">Request New Audit</Button>
        </Link>
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
                <TableHead>Auditor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Ecosystem</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="space-y-2">
                      <p className="text-muted-foreground">No audits found</p>
                      <p className="text-xs text-muted-foreground">
                        Governance audits help track the health of your ecosystem's decision-making processes.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((audit) => (
                  <TableRow
                    key={audit.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/safeguards/audits/${audit.id}`)}
                  >
                    <TableCell className="font-medium">{audit.auditor}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(audit.status)}>{audit.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {audit.overall_health ? (
                        <Badge className={healthColorClass(audit.overall_health)}>
                          {audit.overall_health}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{audit.audit_scope || '—'}</TableCell>
                    <TableCell>
                      {audit.trigger_type ? (
                        <Badge variant="outline" className="text-xs">{audit.trigger_type}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{getEcosystemName(audit.ecosystem_id) || '-'}</TableCell>
                    <TableCell>{new Date(audit.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{audit.completed_at ? new Date(audit.completed_at).toLocaleDateString() : '-'}</TableCell>
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
