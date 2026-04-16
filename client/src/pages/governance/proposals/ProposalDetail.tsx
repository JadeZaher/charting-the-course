import { useState } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useProposal, useUpdateProposalStatus, useSubmitAdvice, useSubmitConsent } from '@/hooks/use-governance';
import { Pencil, ArrowLeft, Check, X } from 'lucide-react';
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
        {data.co_sponsors && data.co_sponsors.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Co-Sponsors</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {data.co_sponsors.map((s: string) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        {data.impacted_parties && data.impacted_parties.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-lg">Impacted Parties</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {data.impacted_parties.map((p: string) => (
                  <Badge key={p} variant="outline">{p}</Badge>
                ))}
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
  const [advisor, setAdvisor] = useState('');
  const [content, setContent] = useState('');
  const [concerns, setConcerns] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!advisor.trim() || !content.trim()) return;
    await submitAdvice.mutateAsync({ advisor: advisor.trim(), content: content.trim(), concerns: concerns.trim() || null });
    setAdvisor('');
    setContent('');
    setConcerns('');
  };

  return (
    <div className="space-y-6">
      {/* Submit advice form */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Submit Advice</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="advisor">Advisor *</Label>
              <Input id="advisor" value={advisor} onChange={(e) => setAdvisor(e.target.value)} placeholder="Your name" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="advice-content">Advice *</Label>
              <Textarea id="advice-content" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Your advice..." rows={4} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="advice-concerns">Concerns</Label>
              <Textarea id="advice-concerns" value={concerns} onChange={(e) => setConcerns(e.target.value)} placeholder="Any concerns..." rows={2} />
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
                Window: {new Date(log.advice_window_start).toLocaleDateString()} - {new Date(log.advice_window_end).toLocaleDateString()}
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
                      {entry.date && <span className="text-xs text-muted-foreground ml-auto">{new Date(entry.date).toLocaleDateString()}</span>}
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
  const [memberName, setMemberName] = useState('');
  const [position, setPosition] = useState('consent');
  const [objection, setObjection] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim()) return;
    await submitConsent.mutateAsync({
      member_name: memberName.trim(),
      position,
      objection_text: position === 'object' ? objection.trim() || null : null,
    });
    setMemberName('');
    setPosition('consent');
    setObjection('');
  };

  return (
    <div className="space-y-6">
      {/* Submit consent form */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Submit Consent</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="member-name">Member Name *</Label>
              <Input id="member-name" value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Your name" />
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
                <Textarea id="objection" value={objection} onChange={(e) => setObjection(e.target.value)} placeholder="Explain your objection..." rows={3} />
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
              {record.date && <span>{new Date(record.date).toLocaleDateString()}</span>}
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
                    <TableCell className="text-sm">{p.date ? new Date(p.date).toLocaleDateString() : '-'}</TableCell>
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
              {report.test_start_date && <span>Start: {new Date(report.test_start_date).toLocaleDateString()}</span>}
              {report.test_end_date && <span>End: {new Date(report.test_end_date).toLocaleDateString()}</span>}
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
      <Link href="/proposals">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Proposals
        </Button>
      </Link>

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
              <dd className="font-medium">{data.advice_deadline ? new Date(data.advice_deadline).toLocaleDateString() : '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Consent Deadline</dt>
              <dd className="font-medium">{data.consent_deadline ? new Date(data.consent_deadline).toLocaleDateString() : '-'}</dd>
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
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="advice">
            Advice {data.advice_logs.length > 0 && `(${data.advice_logs.length})`}
          </TabsTrigger>
          <TabsTrigger value="consent">
            Consent {data.consent_records.length > 0 && `(${data.consent_records.length})`}
          </TabsTrigger>
          <TabsTrigger value="test">
            Test {data.test_reports.length > 0 && `(${data.test_reports.length})`}
          </TabsTrigger>
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
