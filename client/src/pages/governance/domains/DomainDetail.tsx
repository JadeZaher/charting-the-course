import { Link, useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useDomain } from '@/hooks/use-governance';
import { Pencil, ArrowLeft } from 'lucide-react';

const statusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'draft': return 'secondary' as const;
    case 'archived': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

export default function DomainDetail() {
  const [, params] = useRoute('/domains/:id');
  const id = params?.id ?? '';
  const [, navigate] = useLocation();
  const { data, isLoading, error } = useDomain(id);

  if (isLoading) return <LoadingState message="Loading domain..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load domain</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Link href="/domains">
          <Button variant="outline" className="mt-4">Back to Domains</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/domains">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Domains
        </Button>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{data.domain_id}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
            <span className="text-sm text-muted-foreground">v{data.version}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/domains/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Purpose</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.purpose}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Steward Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Current Steward</dt>
              <dd className="font-medium">{data.current_steward || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{new Date(data.created_at).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="font-medium">{new Date(data.updated_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {data.elements && data.elements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Domain Elements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.elements.map((el: any) => (
                  <TableRow key={el.id || el.name}>
                    <TableCell className="font-medium">{el.name}</TableCell>
                    <TableCell>{el.type || '-'}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{el.description || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data.metrics && data.metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Domain Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.metrics.map((m: any) => (
                  <TableRow key={m.id || m.name}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.target ?? '-'}</TableCell>
                    <TableCell>{m.current ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant={m.status === 'on_track' ? 'default' : 'secondary'}>
                        {m.status || '-'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
