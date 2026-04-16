import { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useMembers } from '@/hooks/use-governance';
import { Plus } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'prospective', label: 'Prospective' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const PROFILE_OPTIONS = [
  { value: 'all', label: 'All Profiles' },
  { value: 'co_creator', label: 'Co-Creator' },
  { value: 'builder', label: 'Builder' },
  { value: 'collaborator', label: 'Collaborator' },
  { value: 'townhall', label: 'Townhall' },
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
  const [status, setStatus] = useState('all');
  const [profile, setProfile] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const p: Record<string, string> = { page: String(page), per_page: '20' };
    if (status !== 'all') p.status = status;
    if (profile !== 'all') p.profile = profile;
    if (search) p.search = search;
    return p;
  }, [status, profile, search, page]);

  const { data, isLoading, error } = useMembers(params);

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
        <Link href="/members/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Member
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={profile} onValueChange={(v) => { setProfile(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Profile" />
              </SelectTrigger>
              <SelectContent>
                {PROFILE_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-[200px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Display Name</TableHead>
                <TableHead>Member ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Profile</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
                      <Badge variant={statusVariant(m.status)}>{m.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.profile}</Badge>
                    </TableCell>
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
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p) => (
                <PaginationItem key={p}>
                  <PaginationLink
                    isActive={p === page}
                    onClick={() => setPage(p)}
                    className="cursor-pointer"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
