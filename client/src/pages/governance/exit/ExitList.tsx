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
  const [, navigate] = useLocation();

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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Ecosystem</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No exits found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/exit/${item.id}`)}
                  >
                    <TableCell className="font-medium">{item.member_name}</TableCell>
                    <TableCell>{item.exit_type}</TableCell>
                    <TableCell>
                      <Badge variant={exitStatusVariant(item.status)}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{item.reason || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{getEcosystemName(item.ecosystem_id) || '-'}</TableCell>
                    <TableCell>{new Date(item.created_at).toLocaleDateString()}</TableCell>
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
