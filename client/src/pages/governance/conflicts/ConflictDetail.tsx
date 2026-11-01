import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useState } from 'react';
import { useConflict } from '@/hooks/use-care';
import { ConflictTriageModal } from '@/components/governance/conflicts/ConflictTriageModal';
import { ConflictStatusActions } from '@/components/governance/conflicts/ConflictStatusActions';
import { RepairCheckinModal } from '@/components/governance/conflicts/RepairCheckinModal';
import type { RepairAgreement } from '@/types/api';
import { ClipboardCheck, ArrowLeft, Plus } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api-error-message';

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

const severityVariant = (severity: string | null) => {
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
  const [triaging, setTriaging] = useState(false);
  const [checkingIn, setCheckingIn] = useState<RepairAgreement | null>(null);

  if (isLoading) return <LoadingState message="Loading conflict..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load conflict</p>
        <p className="text-sm text-muted-foreground mt-1">{error ? apiErrorMessage(error) : 'Not found'}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/conflicts">Back to Conflicts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/conflicts">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Conflicts
        </Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{data.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>{data.stage}</Badge>
            {data.severity && <Badge variant={severityVariant(data.severity)}>{data.severity}</Badge>}
            {data.case_id && <span className="text-sm text-muted-foreground">{data.case_id}</span>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {data.caller_can_triage && (
            <Button size="sm" onClick={() => setTriaging(true)}>
              <ClipboardCheck className="h-4 w-4 mr-1" />
              {data.status === 'reported' ? 'Triage this case' : 'Update triage'}
            </Button>
          )}
          <ConflictStatusActions conflict={data} />
          {data.caller_can_triage && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/conflicts/${id}/repair-agreements/new`}>
                <Plus className="h-4 w-4 mr-1" />
                Create Repair Agreement
              </Link>
            </Button>
          )}
        </div>
      </div>

      <Card className="border-strong-border">
        <CardContent className="pt-4 space-y-1 text-sm">
          <p><span className="font-semibold">What happens next:</span> {data.next_step}</p>
          <p className="text-muted-foreground">Who decides: {data.decided_by}</p>
        </CardContent>
      </Card>

      {data.caller_can_triage && (
        <ConflictTriageModal conflict={data} open={triaging} onOpenChange={setTriaging} />
      )}
      {checkingIn && (
        <RepairCheckinModal
          key={checkingIn.id}
          repairAgreement={checkingIn}
          conflictId={data.id}
          open
          onOpenChange={(open) => { if (!open) setCheckingIn(null); }}
        />
      )}

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
                <Badge variant={severityVariant(data.severity)}>{data.severity || 'Unclassified'}</Badge>
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
              <dd className="font-medium">{data.facilitator_name || 'Not assigned yet'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Reported by</dt>
              <dd className="font-medium">{data.reporter_name || '-'}</dd>
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

      {data.party_names.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Parties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.party_names.map((name, index) => (
                <Badge key={index} variant="secondary">{name}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.root_cause_category && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Root Cause</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.root_cause_category}</div>
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
                  <TableHead>Next Check-in</TableHead>
                  <TableHead>Responsible Party</TableHead>
                  {data.caller_can_triage && <TableHead><span className="sr-only">Actions</span></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.repair_agreements.map((ra) => (
                  <TableRow key={ra.id}>
                    <TableCell className="font-medium">{ra.title}</TableCell>
                    <TableCell>
                      <Badge variant={ra.status === 'fulfilled' ? 'default' : 'secondary'}>
                        {ra.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ra.next_checkin_date ? (
                        <span className={ra.next_checkin_overdue ? 'font-medium text-destructive' : undefined}>
                          {new Date(ra.next_checkin_date).toLocaleDateString()}
                          {ra.next_checkin_overdue ? ' (overdue)' : ''}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{ra.responsible_party || '-'}</TableCell>
                    {data.caller_can_triage && (
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => setCheckingIn(ra)}>
                          {ra.status === 'fulfilled' ? 'View' : 'Check in'}
                        </Button>
                      </TableCell>
                    )}
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
