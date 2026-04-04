import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useConflict } from '@/hooks/use-governance';
import { Pencil, ArrowLeft, Plus } from 'lucide-react';

const statusVariant = (status: string) => {
  switch (status) {
    case 'resolved': return 'default' as const;
    case 'closed': return 'outline' as const;
    case 'in_progress': return 'secondary' as const;
    case 'reported': return 'destructive' as const;
    case 'triaged': return 'secondary' as const;
    default: return 'secondary' as const;
  }
};

const severityVariant = (severity: string) => {
  switch (severity) {
    case 'critical': return 'destructive' as const;
    case 'high': return 'destructive' as const;
    case 'medium': return 'secondary' as const;
    case 'low': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

export default function ConflictDetail() {
  const [, params] = useRoute('/conflicts/:id');
  const id = params?.id ?? '';
  const { data, isLoading, error } = useConflict(id);

  if (isLoading) return <LoadingState message="Loading conflict..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load conflict</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Link href="/conflicts">
          <Button variant="outline" className="mt-4">Back to Conflicts</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/conflicts">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Conflicts
        </Button>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{data.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
            <Badge variant={severityVariant(data.severity)}>{data.severity}</Badge>
            {data.case_id && <span className="text-sm text-muted-foreground">{data.case_id}</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/conflicts/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
          <Link href={`/conflicts/${id}/repair-agreements/new`}>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Create Repair Agreement
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.description}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Severity</dt>
              <dd>
                <Badge variant={severityVariant(data.severity)}>{data.severity}</Badge>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Urgency</dt>
              <dd className="font-medium">{data.urgency || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Domain</dt>
              <dd className="font-medium">{data.domain || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Scope</dt>
              <dd className="font-medium">{data.scope || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Facilitator</dt>
              <dd className="font-medium">{data.facilitator || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Safety Flag</dt>
              <dd className="font-medium">{data.safety_flag ? 'Yes' : 'No'}</dd>
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

      {data.parties && data.parties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Parties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.parties.map((party: any) => (
                <Badge key={party.id || party.name || party} variant="secondary">
                  {party.name || party}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.root_cause && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Root Cause</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.root_cause}</div>
          </CardContent>
        </Card>
      )}

      {data.repair_agreements && data.repair_agreements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Repair Agreements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.repair_agreements.map((ra: any) => (
                  <TableRow key={ra.id}>
                    <TableCell className="font-medium">{ra.title}</TableCell>
                    <TableCell>
                      <Badge variant={ra.status === 'fulfilled' ? 'default' : 'secondary'}>
                        {ra.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{ra.due_date ? new Date(ra.due_date).toLocaleDateString() : '-'}</TableCell>
                    <TableCell>{ra.assigned_to || '-'}</TableCell>
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
