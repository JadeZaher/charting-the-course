import { useState, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { EcosystemFilter } from '@/components/EcosystemFilter';
import { useAgreements } from '@/hooks/use-governance';
import { useEcosystemFilterParams, useEcosystemName } from '@/hooks/use-ecosystem-filter';
import { Plus } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'uaf', label: 'UAF' },
  { value: 'ecosystem', label: 'Ecosystem' },
  { value: 'access', label: 'Access' },
  { value: 'stewardship', label: 'Stewardship' },
  { value: 'ethos', label: 'Ethos' },
  { value: 'culture_code', label: 'Culture Code' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'ratified', label: 'Ratified' },
  { value: 'archived', label: 'Archived' },
];

const statusVariant = (status: string) => {
  switch (status) {
    case 'ratified': return 'default';
    case 'draft': return 'secondary';
    case 'archived': return 'outline';
    default: return 'secondary';
  }
};

export default function AgreementList() {
  const [, navigate] = useLocation();
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const [domain, setDomain] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const ecosystemParams = useEcosystemFilterParams();
  const getEcosystemName = useEcosystemName();

  const params = useMemo(() => {
    const p: Record<string, string> = { page: String(page), per_page: '20', ...ecosystemParams };
    if (type !== 'all') p.type = type;
    if (status !== 'all') p.status = status;
    if (domain) p.domain = domain;
    if (search) p.q = search;
    return p;
  }, [type, status, domain, search, page, ecosystemParams]);

  const { data, isLoading, error } = useAgreements(params);

  if (isLoading) return <LoadingState message="Loading agreements..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load agreements</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / data.per_page) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Agreements</h1>
        <Link href="/agreements/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Agreement
          </Button>
        </Link>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <Select value={type} onValueChange={(v) => { setType(v); setPage(1); }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

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

      {/* Data table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ecosystem</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No agreements found
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((a) => (
                  <TableRow
                    key={a.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/agreements/${a.id}`)}
                  >
                    <TableCell className="font-medium">{a.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{a.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {getEcosystemName(a.ecosystem_id) || '-'}
                    </TableCell>
                    <TableCell>{a.domain || '-'}</TableCell>
                    <TableCell>{a.version}</TableCell>
                    <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
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
