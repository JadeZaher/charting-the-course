import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { CollectionCard, CollectionGrid } from '@/components/governance/shared/CollectionGrid';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useEcosystems, useRequestJoinEcosystem } from '@/hooks/use-governance';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useAuth } from '@/contexts/AuthContext';
import { fetchDiscover } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { ECOSYSTEM_STATUS_OPTIONS } from '@/lib/ecosystem-vocab';
import { Plus, Check, UserPlus } from 'lucide-react';
import type { EcosystemSummary } from '@/types/api';

const STATUS_OPTIONS = [{ value: 'all', label: 'All Statuses' }, ...ECOSYSTEM_STATUS_OPTIONS];

const statusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'forming': return 'secondary' as const;
    case 'inactive': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

function JoinButton({ ecosystemId, isMember }: { ecosystemId: string; isMember: boolean }) {
  const joinMutation = useRequestJoinEcosystem(ecosystemId);
  const { refreshSession } = useAuth();
  const { toast } = useToast();

  if (isMember) {
    return (
      <Button variant="outline" size="sm" disabled className="gap-1 opacity-50">
        <Check className="h-3 w-3" />
        Joined
      </Button>
    );
  }

  return (
    <Button
      variant="secondary"
      size="sm"
      className="gap-1"
      disabled={joinMutation.isPending || joinMutation.isSuccess}
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await joinMutation.mutateAsync();
          toast({ title: 'Orientation requested', description: 'Orientation requested — this does not make you a member yet.' });
          await refreshSession();
        } catch (err) {
          toast({ title: 'Orientation request failed', description: (err as Error).message, variant: 'destructive' });
        }
      }}
    >
      {joinMutation.isSuccess ? (
        <><Check className="h-3 w-3" /> Requested</>
      ) : joinMutation.isPending ? (
        'Requesting...'
      ) : (
        <><UserPlus className="h-3 w-3" /> Request to begin orientation</>
      )}
    </Button>
  );
}

export default function EcosystemList() {
  const [tab, setTab] = useState('mine');
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [page, setPage] = useState(1);

  const { ecosystems: memberEcosystems } = useEcosystem();
  const memberEcoIds = new Set(memberEcosystems.map(e => e.id));

  const params = useMemo(() => {
    const p: Record<string, string> = { page: String(page), per_page: '20' };
    if (status !== 'all') p.status = status;
    if (search) p.q = search;
    return p;
  }, [status, search, page]);

  const { data: rawData, isLoading, error } = useEcosystems(params);

  const { data: discoverData, isLoading: discoverLoading, error: discoverError } = useQuery({
    queryKey: ['discover', 'ecosystems', discoverSearch],
    queryFn: () => fetchDiscover({ tab: 'ecosystems', ...(discoverSearch ? { q: discoverSearch } : {}) }),
    enabled: tab === 'discover',
  });

  const discoverEcosystems = (discoverData?.ecosystems?.items ?? []);

  // Normalize API response
  const data: { items: EcosystemSummary[]; total: number; per_page: number } | undefined = rawData ? {
    items: rawData.ecosystems,
    total: rawData.total ?? 0,
    per_page: rawData.per_page ?? 20,
  } : undefined;
  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Ecosystems</h1>
        <Button asChild>
          <Link href="/ecosystems/new">
            <Plus className="h-4 w-4 mr-2" />
            New Ecosystem
          </Link>
        </Button>
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
              <CollectionGrid aria-label="Your ecosystems">
                {data?.items.length === 0 ? <div className="col-span-full border-2 border-dashed border-strong-border p-8 text-center text-muted-foreground">No ecosystems found</div> : data?.items.map((e) => (
                  <CollectionCard key={e.id} asChild>
                    <Link href={`/ecosystems/${e.id}`} aria-label={`View ecosystem: ${e.name}`}>
                      <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ecosystem</p><h2 className="mt-1 text-lg font-semibold">{e.name}</h2></div><Badge variant={statusVariant(e.status)}>{e.status}</Badge></div>
                      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm"><div><dt className="text-xs text-muted-foreground">Location</dt><dd className="mt-1 font-medium">{e.location || '-'}</dd></div><div><dt className="text-xs text-muted-foreground">Members</dt><dd className="mt-1 font-medium">{e.member_count ?? '-'}</dd></div></dl>
                    </Link>
                  </CollectionCard>
                ))}
              </CollectionGrid>

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

          {discoverLoading ? <LoadingState message="Discovering ecosystems..." /> : discoverError ? (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load public ecosystems</p>
              <p className="text-sm text-muted-foreground mt-1">{(discoverError as Error).message}</p>
            </div>
          ) : (
            <CollectionGrid aria-label="Public ecosystems">
              {discoverEcosystems.length === 0 ? <div className="col-span-full border-2 border-dashed border-strong-border p-8 text-center text-muted-foreground">{discoverSearch ? 'No ecosystems match your search' : 'No public ecosystems available'}</div> : discoverEcosystems.map((e: any) => (
                <CollectionCard key={e.id}>
                  <Link href={`/ecosystems/${e.id}`} className="block focus-visible:outline-none" aria-label={`View ecosystem: ${e.name}`}>
                    <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Public ecosystem</p><h2 className="mt-1 text-lg font-semibold">{e.name}</h2></div><Badge variant={statusVariant(e.status)}>{e.status}</Badge></div>
                    <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm"><div><dt className="text-xs text-muted-foreground">Location</dt><dd className="mt-1 font-medium">{e.location || '-'}</dd></div><div><dt className="text-xs text-muted-foreground">Members</dt><dd className="mt-1 font-medium">{e.member_count ?? '-'}</dd></div></dl>
                  </Link>
                  <div className="mt-5 border-t border-border pt-4"><JoinButton ecosystemId={e.id} isMember={memberEcoIds.has(e.id)} /></div>
                </CollectionCard>
              ))}
            </CollectionGrid>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
