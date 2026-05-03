import { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useEcosystems } from '@/hooks/use-governance';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { fetchDiscover } from '@/lib/api-client';
import { Plus, Check } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'forming', label: 'Forming' },
  { value: 'inactive', label: 'Inactive' },
];

const VISIBILITY_OPTIONS = [
  { value: 'all', label: 'All Visibility' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'unlisted', label: 'Unlisted' },
];

const statusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'forming': return 'secondary' as const;
    case 'inactive': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

export default function EcosystemList() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState('mine');
  const [status, setStatus] = useState('all');
  const [visibility, setVisibility] = useState('all');
  const [search, setSearch] = useState('');
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [page, setPage] = useState(1);

  const { ecosystems: memberEcosystems } = useEcosystem();
  const memberEcoIds = new Set(memberEcosystems.map(e => e.id));

  const params = useMemo(() => {
    const p: Record<string, string> = { page: String(page), per_page: '20' };
    if (status !== 'all') p.status = status;
    if (visibility !== 'all') p.visibility = visibility;
    if (search) p.q = search;
    return p;
  }, [status, visibility, search, page]);

  const { data: rawData, isLoading, error } = useEcosystems(params);

  const { data: discoverData, isLoading: discoverLoading } = useQuery({
    queryKey: ['discover', 'ecosystems', discoverSearch],
    queryFn: () => fetchDiscover({ tab: 'ecosystems', ...(discoverSearch ? { q: discoverSearch } : {}) }),
    enabled: tab === 'discover',
  });

  const discoverEcosystems = (discoverData?.ecosystems?.items ?? []);

  // Normalize API response
  const data = rawData ? {
    items: (rawData as any).items ?? (rawData as any).ecosystems ?? [],
    total: rawData.total ?? 0,
    per_page: (rawData as any).per_page ?? 20,
  } : undefined;
  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ecosystems</h1>
        <Link href="/ecosystems/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Ecosystem
          </Button>
        </Link>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v); setPage(1); }}>
        <TabsList>
          <TabsTrigger value="mine">Your Ecosystems</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>

        <TabsContent value="mine" className="space-y-4">
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

                <Select value={visibility} onValueChange={(v) => { setVisibility(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map(o => (
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

          {isLoading ? <LoadingState message="Loading ecosystems..." /> : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load ecosystems</p>
              <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
            </div>
          ) : (
            <>
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Members</TableHead>
                        <TableHead>Visibility</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No ecosystems found
                          </TableCell>
                        </TableRow>
                      ) : (
                        data?.items.map((e) => (
                          <TableRow
                            key={e.id}
                            className="cursor-pointer"
                            onClick={() => navigate(`/ecosystems/${e.id}`)}
                          >
                            <TableCell className="font-medium">{e.name}</TableCell>
                            <TableCell>{e.location || '-'}</TableCell>
                            <TableCell>
                              <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                            </TableCell>
                            <TableCell>{e.member_count ?? '-'}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{e.visibility}</Badge>
                            </TableCell>
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
            </>
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Input
                placeholder="Search public ecosystems..."
                value={discoverSearch}
                onChange={(e) => setDiscoverSearch(e.target.value)}
                className="w-[300px]"
              />
            </CardContent>
          </Card>

          {discoverLoading ? <LoadingState message="Discovering ecosystems..." /> : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Membership</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discoverEcosystems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          {discoverSearch ? 'No ecosystems match your search' : 'No public ecosystems available'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      discoverEcosystems.map((e: any) => (
                        <TableRow
                          key={e.id}
                          className="cursor-pointer"
                          onClick={() => navigate(`/ecosystems/${e.id}`)}
                        >
                          <TableCell className="font-medium">{e.name}</TableCell>
                          <TableCell>{e.location || '-'}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(e.status)}>{e.status}</Badge>
                          </TableCell>
                          <TableCell>{e.member_count ?? '-'}</TableCell>
                          <TableCell>
                            {memberEcoIds.has(e.id) ? (
                              <Badge variant="default" className="gap-1">
                                <Check className="h-3 w-3" />
                                Member
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Open</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
