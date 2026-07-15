import { useState } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useAgreement, useUpdateAgreementStatus } from '@/hooks/use-governance';
import { formatDate } from '@/lib/utils';
import { agreementStatusVariant } from '@/lib/agreement-status';
import { Pencil, History, ArrowLeft } from 'lucide-react';

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
        <Button asChild variant="outline" className="mt-4">
          <Link href="/agreements">Back to Agreements</Link>
        </Button>
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
      <Button asChild variant="ghost" size="sm">
        <Link href="/agreements">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Agreements
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{data.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={agreementStatusVariant(data.status)}>{data.status}</Badge>
            <Badge variant="outline">{data.type}</Badge>
            <span className="text-sm text-muted-foreground">v{data.version}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/agreements/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/agreements/${id}/history`}>
              <History className="h-4 w-4 mr-1" />
              History
            </Link>
          </Button>
          <Select onValueChange={handleStatusChange} disabled={statusChanging}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Change Status" />
            </SelectTrigger>
            <SelectContent>
              {data.status === 'draft' && <SelectItem value="advice">Advice</SelectItem>}
              {data.status === 'advice' && <SelectItem value="consent">Consent</SelectItem>}
              {data.status === 'consent' && (
                <>
                  <SelectItem value="test">Test</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </>
              )}
              {data.status === 'test' && <SelectItem value="active">Active</SelectItem>}
              {data.status === 'active' && <SelectItem value="under_review">Under Review</SelectItem>}
              {data.status === 'under_review' && (
                <>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="sunset">Sunset</SelectItem>
                </>
              )}
              {data.status === 'sunset' && <SelectItem value="archived">Archived</SelectItem>}
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
              <dd className="font-medium">{formatDate(data.ratification_date)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Review Date</dt>
              <dd className="font-medium">{formatDate(data.review_date)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Sunset Date</dt>
              <dd className="font-medium">{formatDate(data.sunset_date)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{new Date(data.created_at).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="font-medium">{new Date(data.updated_at).toLocaleDateString()}</dd>
            </div>
            {data.affected_parties && (
              <div className="sm:col-span-2 lg:col-span-3">
                <dt className="text-muted-foreground">Affected Parties</dt>
                <dd className="flex flex-wrap gap-1 mt-1">
                  {Array.isArray(data.affected_parties)
                    ? data.affected_parties.map((party) => (
                        <Badge key={party} variant="secondary">{party}</Badge>
                      ))
                    : Object.entries(data.affected_parties).map(([key, val]) => (
                        <Badge key={key} variant="secondary">
                          {Array.isArray(val) ? val.join(', ') : key}
                        </Badge>
                      ))
                  }
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
                    <TableCell>{formatDate(r.date)}</TableCell>
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
