import { useLocation } from 'wouter';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { FilterBar } from '@/components/governance/shared/FilterBar';
import { useMembers } from '@/hooks/use-governance';
import { useGovernanceList, type FilterDef } from '@/hooks/use-governance-list';
import { useEcosystemName } from '@/hooks/use-ecosystem-filter';
import { Plus } from 'lucide-react';

const FILTERS: FilterDef[] = [
  { key: 'status', label: 'Status', type: 'select', options: [
    { value: 'all', label: 'All Statuses' },
    { value: 'prospective', label: 'Prospective' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]},
  { key: 'profile', label: 'Profile', type: 'select', options: [
    { value: 'all', label: 'All Profiles' },
    { value: 'co_creator', label: 'Co-Creator' },
    { value: 'builder', label: 'Builder' },
    { value: 'collaborator', label: 'Collaborator' },
    { value: 'townhall', label: 'Townhall' },
  ]},
];

const statusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'prospective': return 'secondary' as const;
    case 'inactive': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

export default function MemberList() {
  const [, navigate] = useLocation();
  const list = useGovernanceList({ entity: 'members', filters: FILTERS });
  const getEcosystemName = useEcosystemName();

  const { data, isLoading, error } = useMembers(list.params);

  if (isLoading) return <LoadingState message="Loading members..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load members</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Members</h1>
        <Button asChild>
          <Link href="/members/new">
            <Plus className="h-4 w-4 mr-2" />
            New Member
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
                <TableHead>Display Name</TableHead>
                <TableHead>Member ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead>Ecosystem</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No members found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((m) => (
                  <TableRow
                    key={m.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/members/${m.id}`)}
                  >
                    <TableCell className="font-medium">{m.display_name}</TableCell>
                    <TableCell>{m.member_id}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(m.current_status)}>{m.current_status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.profile || '-'}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{getEcosystemName(m.ecosystem_id) || '-'}</TableCell>
                    <TableCell>{new Date(m.created_at).toLocaleDateString()}</TableCell>
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
