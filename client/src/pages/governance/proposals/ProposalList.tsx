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
import { useProposals } from '@/hooks/use-governance';
import { Plus } from 'lucide-react';

const FILTERS: FilterDef[] = [
  {
    key: 'phase',
    label: 'Phase',
    type: 'select',
    options: [
      { value: 'all', label: 'All Phases' },
      { value: 'draft', label: 'Draft' },
      { value: 'advice', label: 'Advice' },
      { value: 'consent', label: 'Consent' },
      { value: 'test', label: 'Test' },
      { value: 'ratified', label: 'Ratified' },
      { value: 'withdrawn', label: 'Withdrawn' },
    ],
  },
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { value: 'all', label: 'All Types' },
      { value: 'policy', label: 'Policy' },
      { value: 'operational', label: 'Operational' },
      { value: 'structural', label: 'Structural' },
      { value: 'resource', label: 'Resource' },
    ],
  },
  {
    key: 'urgency',
    label: 'Urgency',
    type: 'select',
    options: [
      { value: 'all', label: 'All Urgency' },
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'critical', label: 'Critical' },
    ],
  },
];

const statusVariant = (status: string) => {
  switch (status) {
    case 'ratified': return 'default' as const;
    case 'draft': return 'secondary' as const;
    case 'withdrawn': return 'outline' as const;
    case 'advice': return 'default' as const;
    case 'consent': return 'default' as const;
    case 'test': return 'secondary' as const;
    default: return 'secondary' as const;
  }
};

const urgencyVariant = (urgency: string | null) => {
  switch (urgency) {
    case 'critical': return 'destructive' as const;
    case 'high': return 'destructive' as const;
    case 'medium': return 'default' as const;
    default: return 'secondary' as const;
  }
};

export default function ProposalList() {
  const [, navigate] = useLocation();
  const list = useGovernanceList({ entity: 'proposals', filters: FILTERS });
  const getEcosystemName = useEcosystemName();

  const { data, isLoading, error } = useProposals(list.params);

  if (isLoading) return <LoadingState message="Loading proposals..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load proposals</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Proposals</h1>
        <Button asChild>
          <Link href="/proposals/new">
            <Plus className="h-4 w-4 mr-2" />
            New Proposal
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
                <TableHead>Title</TableHead>
                <TableHead>Proposer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Ecosystem</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No proposals found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/proposals/${p.id}`)}
                  >
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{p.proposer || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {p.urgency ? <Badge variant={urgencyVariant(p.urgency)}>{p.urgency}</Badge> : '-'}
                    </TableCell>
                    <TableCell>{p.affected_domain || '-'}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{getEcosystemName(p.ecosystem_id) || '-'}</TableCell>
                    <TableCell>{new Date(p.created_at).toLocaleDateString()}</TableCell>
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
