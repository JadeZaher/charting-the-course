import { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { EcosystemFilter } from '@/components/EcosystemFilter';
import { useEcosystemFilterParams, useEcosystemName } from '@/hooks/use-ecosystem-filter';
import { useDecisions } from '@/hooks/use-governance';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'recorded', label: 'Recorded' },
  { value: 'superseded', label: 'Superseded' },
  { value: 'archived', label: 'Archived' },
];

const SOURCE_LAYER_OPTIONS = [
  { value: 'all', label: 'All Layers' },
  { value: 'foundational', label: 'Foundational' },
  { value: 'operational', label: 'Operational' },
  { value: 'domain', label: 'Domain' },
  { value: 'local', label: 'Local' },
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
  const [status, setStatus] = useState('all');
  const [domain, setDomain] = useState('');
  const [sourceLayer, setSourceLayer] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const ecosystemParams = useEcosystemFilterParams();
  const getEcosystemName = useEcosystemName();

  const params = useMemo(() => {
    const p: Record<string, string> = { page: String(page), per_page: '20' };
    if (status !== 'all') p.status = status;
    if (domain) p.domain = domain;
    if (sourceLayer !== 'all') p.source_layer = sourceLayer;
    if (search) p.q = search;
    return { ...p, ...ecosystemParams };
  }, [status, domain, sourceLayer, search, page, ecosystemParams]);

  const { data, isLoading, error } = useDecisions(params);

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
              placeholder="Domain..."
              value={domain}
              onChange={(e) => { setDomain(e.target.value); setPage(1); }}
              className="w-[160px]"
            />

            <Select value={sourceLayer} onValueChange={(v) => { setSourceLayer(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Source Layer" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_LAYER_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <EcosystemFilter />

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
