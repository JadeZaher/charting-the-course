import { useState } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AITextarea } from '@/components/ui/ai-textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useProposal, useUpdateProposalStatus, useSubmitAdvice, useSubmitConsent } from '@/hooks/use-governance';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/lib/utils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ACTStepper } from '@/components/governance/ACTStepper';
import { useAuth } from '@/contexts/AuthContext';
import { Pencil, ArrowLeft, Check, X, Award } from 'lucide-react';
import type { AdviceLog, ConsentRecord, TestReport } from '@/types/api';

const statusVariant = (status: string) => {
  switch (status) {
    case 'ratified': return 'default' as const;
    case 'draft': return 'secondary' as const;
    case 'withdrawn': return 'outline' as const;
    case 'advice': return 'default' as const;
    case 'consent': return 'default' as const;
    case 'test': return 'secondary' as const;
    default: return 'secondary' as const;
  }
};

const urgencyVariant = (urgency: string | null) => {
  switch (urgency) {
    case 'critical': return 'destructive' as const;
    case 'high': return 'destructive' as const;
    case 'medium': return 'default' as const;
    default: return 'secondary' as const;
  }
};

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['advice', 'withdrawn'],
  advice: ['consent', 'withdrawn'],
  consent: ['test', 'ratified', 'withdrawn'],
  test: ['ratified', 'withdrawn'],
  ratified: ['archived'],
  withdrawn: [],
};

// --- Sub-components ---

function OverviewTab({ data }: { data: any }) {
  return (
    <div className="space-y-6">
      {data.proposed_change && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Proposed Change</CardTitle></CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.proposed_change}</div>
          </CardContent>
        </Card>
      )}

      {data.rationale && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Rationale</CardTitle></CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.rationale}</div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.co_sponsors && (Array.isArray(data.co_sponsors) ? data.co_sponsors.length > 0 : true) && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Co-Sponsors</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {Array.isArray(data.co_sponsors)
                  ? data.co_sponsors.map((s: string) => (
                      <Badge key={s} variant="secondary">{s}</Badge>
                    ))
                  : Object.keys(data.co_sponsors).map((k) => (
                      <Badge key={k} variant="secondary">{k}</Badge>
                    ))
                }
              </div>
            </CardContent>
          </Card>
        )}
        {data.impacted_parties && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Impacted Parties</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {Array.isArray(data.impacted_parties)
                  ? data.impacted_parties.map((p: string) => (
                      <Badge key={p} variant="outline">{p}</Badge>
                    ))
                  : Object.entries(data.impacted_parties).map(([key, val]) => (
                      <Badge key={key} variant="outline">
                        {Array.isArray(val) ? (val as string[]).join(', ') : String(key)}
                      </Badge>
                    ))
                }
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function AdviceTab({ adviceLogs, proposalId }: { adviceLogs: AdviceLog[]; proposalId: string }) {
  const submitAdvice = useSubmitAdvice(proposalId);
  const { toast } = useToast();
  const { member } = useAuth();
  const [content, setContent] = useState('');
  const [concerns, setConcerns] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = member?.display_name ?? 'Unknown';
    if (!content.trim()) return;
    try {
      await submitAdvice.mutateAsync({ advisor: displayName, content: content.trim(), concerns: concerns.trim() || null });
      setContent('');
      setConcerns('');
      toast({ title: 'Advice submitted', description: 'Your advice has been recorded.' });
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="space-y-6">
      {/* Submit advice form */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Submit Advice</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Submitting as:</Label>
              <p className="text-sm font-medium">{member?.display_name ?? 'Unknown'}</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="advice-content">Advice *</Label>
              <AITextarea id="advice-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Your advice..." rows={4} fieldLabel="Advice" fieldContext="Governance advice on a proposal being considered by the organization" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="advice-concerns">Concerns</Label>
              <AITextarea id="advice-concerns" value={concerns} onChange={(e) => setConcerns(e.target.value)} placeholder="Any concerns..." rows={2} fieldLabel="Concerns" fieldContext="Concerns or potential issues with a governance proposal" />
            </div>
            <Button type="submit" disabled={submitAdvice.isPending}>
              {submitAdvice.isPending ? 'Submitting...' : 'Submit Advice'}
            </Button>
            {submitAdvice.error && (
              <p className="text-sm text-destructive">{(submitAdvice.error as Error).message}</p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Advice logs */}
      {adviceLogs.map((log) => (
        <Card key={log.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Advice Log</CardTitle>
              {log.urgency && <Badge variant="secondary">{log.urgency}</Badge>}
            </div>
            {log.advice_window_start && log.advice_window_end && (
              <p className="text-xs text-muted-foreground">
                Window: {formatDate(log.advice_window_start)} - {formatDate(log.advice_window_end)}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {log.summary && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Summary</p>
                <p className="text-sm">{log.summary}</p>
              </div>
            )}
            {log.proposer_modifications && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Proposer Modifications</p>
                <p className="text-sm">{log.proposer_modifications}</p>
              </div>
            )}
            {log.entries.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Entries ({log.entries.length})</p>
                {log.entries.map((entry) => (
                  <div key={entry.id} className="border rounded-md p-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{entry.advisor}</span>
                      {entry.role && <Badge variant="outline" className="text-xs">{entry.role}</Badge>}
                      {entry.advice_type && <Badge variant="secondary" className="text-xs">{entry.advice_type}</Badge>}
                      {entry.date && <span className="text-xs text-muted-foreground ml-auto">{formatDate(entry.date)}</span>}
                    </div>
                    {entry.content && <p className="text-sm">{entry.content}</p>}
                    {entry.concerns && <p className="text-sm text-muted-foreground">Concerns: {entry.concerns}</p>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {adviceLogs.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No advice logs yet</p>
      )}
    </div>
  );
}

function ConsentTab({ consentRecords, proposalId }: { consentRecords: ConsentRecord[]; proposalId: string }) {
  const submitConsent = useSubmitConsent(proposalId);
  const { toast } = useToast();
  const { member } = useAuth();
  const [position, setPosition] = useState('consent');
  const [objection, setObjection] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const displayName = member?.display_name ?? 'Unknown';
    try {
      await submitConsent.mutateAsync({
        member_name: displayName,
        position,
        objection_text: position === 'object' ? objection.trim() || null : null,
      });
      setPosition('consent');
      setObjection('');
      toast({ title: 'Consent submitted', description: 'Your consent response has been recorded.' });
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="space-y-6">
      {/* Submit consent form */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Submit Consent</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label>Submitting as:</Label>
              <p className="text-sm font-medium">{member?.display_name ?? 'Unknown'}</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="consent-position">Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consent">Consent</SelectItem>
                  <SelectItem value="object">Object</SelectItem>
                  <SelectItem value="stand_aside">Stand Aside</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {position === 'object' && (
              <div className="space-y-1">
                <Label htmlFor="objection">Objection</Label>
                <AITextarea id="objection" value={objection} onChange={(e) => setObjection(e.target.value)} placeholder="Explain your objection..." rows={3} fieldLabel="Objection" fieldContext="An objection to a governance proposal explaining why it should not be adopted" />
              </div>
            )}
            <Button type="submit" disabled={submitConsent.isPending}>
              {submitConsent.isPending ? 'Submitting...' : 'Submit'}
            </Button>
            {submitConsent.error && (
              <p className="text-sm text-destructive">{(submitConsent.error as Error).message}</p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Consent records */}
      {consentRecords.map((record) => (
        <Card key={record.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Consent Round</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={record.quorum_met ? 'default' : 'destructive'}>
                  {record.quorum_met ? 'Quorum Met' : 'No Quorum'}
                </Badge>
                {record.outcome && <Badge variant="secondary">{record.outcome}</Badge>}
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-x-3">
              {record.consent_mode && <span>Mode: {record.consent_mode}</span>}
              {record.facilitator && <span>Facilitator: {record.facilitator}</span>}
              {record.date && <span>{formatDate(record.date)}</span>}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Objection</TableHead>
                  <TableHead>Integration</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {record.participants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.member_name}</TableCell>
                    <TableCell>
                      <Badge variant={p.position === 'consent' ? 'default' : p.position === 'object' ? 'destructive' : 'secondary'}>
                        {p.position || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{p.objection_text || '-'}</TableCell>
                    <TableCell>
                      {p.integration_attempted != null && (
                        <div className="text-sm">
                          {p.integration_attempted ? 'Attempted' : 'Not attempted'}
                          {p.integration_outcome && <span className="block text-muted-foreground">{p.integration_outcome}</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(p.date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      {consentRecords.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No consent records yet</p>
      )}
    </div>
  );
}

function TestTab({ testReports }: { testReports: TestReport[] }) {
  return (
    <div className="space-y-6">
      {testReports.map((report) => (
        <Card key={report.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Test Report</CardTitle>
              {report.outcome && <Badge variant={report.outcome === 'pass' ? 'default' : 'destructive'}>{report.outcome}</Badge>}
            </div>
            <div className="text-xs text-muted-foreground space-x-3">
              {report.test_start_date && <span>Start: {formatDate(report.test_start_date)}</span>}
              {report.test_end_date && <span>End: {formatDate(report.test_end_date)}</span>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.observations && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Observations</p>
                <p className="text-sm whitespace-pre-wrap">{report.observations}</p>
              </div>
            )}

            {report.success_criteria.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Success Criteria</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Criterion</TableHead>
                      <TableHead>Metric</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Actual</TableHead>
                      <TableHead className="w-[60px]">Met</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.success_criteria.map((sc) => (
                      <TableRow key={sc.id}>
                        <TableCell className="text-sm">{sc.criterion || '-'}</TableCell>
                        <TableCell className="text-sm">{sc.metric || '-'}</TableCell>
                        <TableCell className="text-sm">{sc.target || '-'}</TableCell>
                        <TableCell className="text-sm">{sc.actual || '-'}</TableCell>
                        <TableCell>
                          {sc.met != null ? (
                            sc.met ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" />
                            )
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {testReports.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No test reports yet</p>
      )}
    </div>
  );
}

// --- Main component ---

export default function ProposalDetail() {
  const [, params] = useRoute('/proposals/:id');
  const id = params?.id ?? '';
  const [, navigate] = useLocation();
  const { data, isLoading, error } = useProposal(id);
  const statusMutation = useUpdateProposalStatus(id);
  const [statusChanging, setStatusChanging] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  if (isLoading) return <LoadingState message="Loading proposal..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load proposal</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Link href="/proposals">
          <Button variant="outline" className="mt-4">Back to Proposals</Button>
        </Link>
      </div>
    );
  }

  const validNextStatuses = VALID_TRANSITIONS[data.status] ?? [];

  const handleStatusChange = async (newStatus: string) => {
    if (['withdrawn', 'archived'].includes(newStatus)) {
      setPendingStatus(newStatus);
      return;
    }
    setStatusChanging(true);
    try {
      await statusMutation.mutateAsync(newStatus);
    } finally {
      setStatusChanging(false);
    }
  };

  const confirmStatusChange = async () => {
    if (!pendingStatus) return;
    setStatusChanging(true);
    try {
      await statusMutation.mutateAsync(pendingStatus);
    } finally {
      setStatusChanging(false);
      setPendingStatus(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/proposals">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Proposals
        </Button>
      </Link>

      {/* Ratification banner */}
      {data.status === 'ratified' && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 flex items-center gap-3">
          <Award className="h-5 w-5 text-emerald-600" />
          <div>
            <p className="font-medium text-emerald-800 dark:text-emerald-200">This proposal has been ratified</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400">It passed through the full Advice-Consent-Test process and is now active.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{data.title}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
            <Badge variant="outline">{data.type}</Badge>
            {data.urgency && <Badge variant={urgencyVariant(data.urgency)}>{data.urgency}</Badge>}
            <span className="text-sm text-muted-foreground">v{data.version}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/proposals/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
          {validNextStatuses.length > 0 && (
            <Select onValueChange={handleStatusChange} disabled={statusChanging}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                {validNextStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Confirmation dialog for destructive status changes */}
      <AlertDialog open={!!pendingStatus} onOpenChange={(open) => { if (!open) setPendingStatus(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus === 'withdrawn' ? 'Withdraw this proposal?' : 'Archive this proposal?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingStatus === 'withdrawn'
                ? 'This action cannot be undone. All advice and consent collected will be preserved in the record, but the proposal will no longer be active.'
                : 'This will archive the proposal. It will remain accessible for reference but will no longer be active.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStatusChange} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {pendingStatus === 'withdrawn' ? 'Yes, withdraw' : 'Yes, archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ACT Process Stepper */}
      <ACTStepper currentStatus={data.status} />

      {/* Metadata */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Proposer</dt>
              <dd className="font-medium">{data.proposer || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Affected Domain</dt>
              <dd className="font-medium">{data.affected_domain || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Decision Type</dt>
              <dd className="font-medium">{data.decision_type || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Advice Deadline</dt>
              <dd className="font-medium">{formatDate(data.advice_deadline)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Consent Deadline</dt>
              <dd className="font-medium">{formatDate(data.consent_deadline)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Test Duration</dt>
              <dd className="font-medium">{data.test_duration || '-'}</dd>
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

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="overview">Overview</TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">Full proposal details including rationale, co-sponsors, and affected domains.</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="advice">
                Advice {data.advice_logs.length > 0 && `(${data.advice_logs.length})`}
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">Gather perspectives from people affected. All input shapes the final decision.</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="consent">
                Consent {data.consent_records.length > 0 && `(${data.consent_records.length})`}
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">Members indicate if they can live with this proposal. 'Stand Aside' means no objection but not participating. 'Object' means a paramount concern must be addressed.</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <TabsTrigger value="test">
                Test {data.test_reports.length > 0 && `(${data.test_reports.length})`}
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">The proposal is tried in practice with defined success criteria and a review date.</p>
            </TooltipContent>
          </Tooltip>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab data={data} />
        </TabsContent>

        <TabsContent value="advice">
          <AdviceTab adviceLogs={data.advice_logs} proposalId={id} />
        </TabsContent>

        <TabsContent value="consent">
          <ConsentTab consentRecords={data.consent_records} proposalId={id} />
        </TabsContent>

        <TabsContent value="test">
          <TestTab testReports={data.test_reports} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
