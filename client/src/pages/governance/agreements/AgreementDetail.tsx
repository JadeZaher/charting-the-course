import { useState } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useAgreement, useUpdateAgreementStatus } from '@/hooks/use-governance';
import { Pencil, History, ArrowLeft } from 'lucide-react';

const statusVariant = (status: string) => {
  switch (status) {
    case 'ratified': return 'default' as const;
    case 'draft': return 'secondary' as const;
    case 'archived': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

export default function AgreementDetail() {
  const [, params] = useRoute('/agreements/:id');
  const id = params?.id ?? '';
  const [, navigate] = useLocation();
  const { data, isLoading, error } = useAgreement(id);
  const statusMutation = useUpdateAgreementStatus(id);
  const [statusChanging, setStatusChanging] = useState(false);

  if (isLoading) return <LoadingState message="Loading agreement..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load agreement</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Link href="/agreements">
          <Button variant="outline" className="mt-4">Back to Agreements</Button>
        </Link>
      </div>
    );
  }

  const handleStatusChange = async (newStatus: string) => {
    setStatusChanging(true);
    try {
      await statusMutation.mutateAsync(newStatus);
    } finally {
      setStatusChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/agreements">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Agreements
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{data.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
            <Badge variant="outline">{data.type}</Badge>
            <span className="text-sm text-muted-foreground">v{data.version}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/agreements/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
          <Link href={`/agreements/${id}/history`}>
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
          </Link>
          <Select onValueChange={handleStatusChange} disabled={statusChanging}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="ratified">Ratified</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Proposer</dt>
              <dd className="font-medium">{data.proposer || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Domain</dt>
              <dd className="font-medium">{data.domain || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Hierarchy Level</dt>
              <dd className="font-medium">{data.hierarchy_level}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Ratification Date</dt>
              <dd className="font-medium">{data.ratification_date ? new Date(data.ratification_date).toLocaleDateString() : '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Review Date</dt>
              <dd className="font-medium">{data.review_date ? new Date(data.review_date).toLocaleDateString() : '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sunset Date</dt>
              <dd className="font-medium">{data.sunset_date ? new Date(data.sunset_date).toLocaleDateString() : '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{new Date(data.created_at).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="font-medium">{new Date(data.updated_at).toLocaleDateString()}</dd>
            </div>
            {data.affected_parties && data.affected_parties.length > 0 && (
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-muted-foreground">Affected Parties</dt>
                <dd className="flex flex-wrap gap-1 mt-1">
                  {data.affected_parties.map((party) => (
                    <Badge key={party} variant="secondary">{party}</Badge>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Full text */}
      {data.text && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Agreement Text</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.text}</div>
          </CardContent>
        </Card>
      )}

      {/* Ratification records */}
      {data.ratification_records.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ratification Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Participant</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.ratification_records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.participant}</TableCell>
                    <TableCell>{r.role || '-'}</TableCell>
                    <TableCell>{r.position || '-'}</TableCell>
                    <TableCell>{r.date ? new Date(r.date).toLocaleDateString() : '-'}</TableCell>
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
