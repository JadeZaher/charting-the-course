import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CollectionCard, CollectionGrid } from '@/components/governance/shared/CollectionGrid';
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

      <CollectionGrid aria-label="Members">
        {data?.items.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-strong-border p-8 text-center text-muted-foreground">No members found</div>
        ) : data?.items.map((m) => (
          <CollectionCard key={m.id} asChild>
            <Link href={`/members/${m.id}`} aria-label={`View member: ${m.display_name}`}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Member</p><h2 className="mt-1 text-lg font-semibold">{m.display_name}</h2></div>
                <Badge variant={statusVariant(m.current_status)}>{m.current_status}</Badge>
              </div>
              <div className="mt-4"><Badge variant="outline">{m.profile || 'No profile'}</Badge></div>
              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm">
                <div><dt className="text-xs text-muted-foreground">Member ID</dt><dd className="mt-1 font-medium">{m.member_id}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Created</dt><dd className="mt-1 font-medium">{new Date(m.created_at).toLocaleDateString()}</dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Ecosystem</dt><dd className="mt-1 font-medium">{getEcosystemName(m.ecosystem_id) || '-'}</dd></div>
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
