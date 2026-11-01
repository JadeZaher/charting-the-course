import { useRef, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AITextarea } from '@/components/ui/ai-textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import {
  useProposal,
  useRegisterProposalAgreement,
  useSubmitAdvice,
  useSubmitConsent,
  useSubmitTestReport,
  useUpdateProposalStatus,
  useWithdrawConsentPosition,
} from '@/hooks/use-governance';
import { useRequiredFields } from '@/hooks/use-required-fields';
import { FieldError } from '@/components/FieldError';
import { formatDate } from '@/lib/utils';
import { apiErrorMessage } from '@/lib/api-error-message';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ACTStepper } from '@/components/governance/ACTStepper';
import { StatusBanner } from '@/components/governance/StatusBanner';
import { ActGatesPanel } from '@/components/governance/ActGatesPanel';
import { RecordDecisionAction } from '@/components/governance/RecordDecisionDialog';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Pencil, ArrowLeft, Check, X, Award, Trash2, CircleAlert, Info, Clock } from 'lucide-react';
import { ApiFetchError } from '@/lib/api-client';
import {
  DECISION_TYPE_OPTIONS,
  PROPOSAL_TRANSITION_LABELS,
  adviceClosePrompt,
  groupProposalMoves,
  positionLabel,
  proposalEditLock,
  proposalPhaseLabel,
  quorumExplanation,
  ratifiedBanner,
} from '@/lib/proposal-vocab';
import type {
  ActAdviceGateDetail,
  ActConsentGateDetail,
  ActGates,
  AdviceLog,
  ConsentRecord,
  ProposalDetail as ProposalDetailData,
  TestReport,
} from '@/types/api';

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

const positionVariant = (position: string | null) =>
  position === 'consent' ? 'default' as const : position === 'object' ? 'destructive' as const : 'secondary' as const;

const reportVariant = (outcome: string | null) =>
  outcome === 'passed' ? 'default' as const : outcome === 'failed' ? 'destructive' as const : 'secondary' as const;

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

const ADVICE_REQUIRED_MESSAGE = 'Write your advice before submitting.';

function AdviceTab({ adviceLogs, proposalId, proposalStatus, isProposer, canParticipate, onAutoAdvance }: {
  adviceLogs: AdviceLog[];
  proposalId: string;
  proposalStatus: string;
  isProposer: boolean;
  canParticipate: boolean;
  /** Called after an advice entry auto-advanced the proposal (this form unmounts). */
  onAutoAdvance: () => void;
}) {
  const submitAdvice = useSubmitAdvice(proposalId);
  const { member } = useAuth();
  const [content, setContent] = useState('');
  const [concerns, setConcerns] = useState('');
  const [newRound, setNewRound] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setContentError(ADVICE_REQUIRED_MESSAGE);
      contentRef.current?.focus();
      return;
    }
    try {
      // The server records the advisor from the session; no advisor field is sent.
      const result = await submitAdvice.mutateAsync({ content: content.trim(), concerns: concerns.trim() || null, new_round: newRound });
      setContent('');
      setConcerns('');
      setNewRound(false);
      // The hook announces the outcome; an advance unmounts this form, so focus moves to the status.
      if (result.auto_transitions?.length) onAutoAdvance();
    } catch {
      // Rendered below from submitAdvice.error
    }
  };

  return (
    <div className="space-y-6">
      {/* The proposer gathers advice; the server refuses self-advice (409). */}
      {proposalStatus === 'advice' && isProposer && (
        <Card className="border-muted">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              You are the proposer: advice from others appears here. You decide when advice closes.
            </p>
          </CardContent>
        </Card>
      )}
      {/* Submit advice form — only during advice phase */}
      {proposalStatus === 'advice' && !isProposer && canParticipate && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Submit Advice</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div className="space-y-1">
                <Label>Submitting as:</Label>
                <p className="text-sm font-medium">{member?.display_name ?? 'Unknown'}</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="advice-content">Advice *</Label>
                <AITextarea
                  id="advice-content"
                  ref={contentRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (contentError && e.target.value.trim()) setContentError(null);
                  }}
                  placeholder="Your advice..."
                  rows={4}
                  aria-required="true"
                  aria-invalid={contentError ? true : undefined}
                  aria-describedby={contentError ? 'advice-content-error' : undefined}
                  fieldLabel="Advice"
                  fieldContext="Governance advice on a proposal being considered by the organization"
                />
                {contentError && (
                  <p id="advice-content-error" role="alert" className="text-sm text-destructive">{contentError}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="advice-concerns">Concerns</Label>
                <AITextarea id="advice-concerns" value={concerns} onChange={(e) => setConcerns(e.target.value)} placeholder="Any concerns..." rows={2} fieldLabel="Concerns" fieldContext="Concerns or potential issues with a governance proposal" />
              </div>
              {adviceLogs.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox id="advice-new-round" checked={newRound} onCheckedChange={(v) => setNewRound(v === true)} />
                  <Label htmlFor="advice-new-round" className="text-sm font-normal">
                    Open a new advice round with this entry (counts toward the declared minimum)
                  </Label>
                </div>
              )}
              <Button type="submit" disabled={submitAdvice.isPending}>
                {submitAdvice.isPending ? 'Submitting...' : 'Submit Advice'}
              </Button>
              {submitAdvice.error && (
                <p className="text-sm text-destructive" role="alert">{apiErrorMessage(submitAdvice.error)}</p>
              )}
            </form>
          </CardContent>
        </Card>
      )}
      {proposalStatus !== 'advice' && (
        <Card className="border-muted">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Advice can only be submitted during the advice phase. Current status: <Badge variant="secondary">{proposalPhaseLabel(proposalStatus)}</Badge>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Advice rounds, oldest first; a round opened by a send-back carries the proposer's revision note. */}
      {adviceLogs.map((log, index) => (
        <Card key={log.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {log.proposer_modifications ? 'Revision round' : `Advice round ${index + 1}`}
              </CardTitle>
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
                <p className="text-sm font-medium text-muted-foreground">What the proposer is changing</p>
                <p className="text-sm whitespace-pre-wrap">{log.proposer_modifications}</p>
              </div>
            )}
            {log.entries.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Entries ({log.entries.length})</p>
                {log.entries.map((entry) => (
                  <div key={entry.id} className="space-y-1 rounded-none border-2 border-strong-border p-3">
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
            {log.entries.length === 0 && (
              <p className="text-sm text-muted-foreground">No advice in this round yet.</p>
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

function ConsentTab({ consentRecords, proposalId, proposalStatus, callerPosition, canParticipate, consentGate, governingTitle, onAutoAdvance }: {
  consentRecords: ConsentRecord[];
  proposalId: string;
  proposalStatus: string;
  callerPosition: ProposalDetailData['caller_position'];
  canParticipate: boolean;
  consentGate: (ActGates['consent'] & ActConsentGateDetail) | null;
  governingTitle: string | null;
  /** Called after a position auto-advanced the proposal (this form unmounts). */
  onAutoAdvance: () => void;
}) {
  const submitConsent = useSubmitConsent(proposalId);
  const withdrawPosition = useWithdrawConsentPosition(proposalId);
  const { member } = useAuth();
  const consensus = consentGate?.mode === 'consensus';
  const current = callerPosition && callerPosition.position !== 'withdrawn' ? callerPosition : null;
  const [position, setPosition] = useState(current?.position ?? 'consent');
  const [objection, setObjection] = useState(current?.position === 'object' ? current.reason ?? '' : '');
  const fields = useRequiredFields({ objection: 'Say what your objection is, so the proposer can work with it.' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (position === 'object' && !fields.validate({ objection })) return;
    try {
      // The server records the caller; one position per member, so this replaces any earlier one.
      const result = await submitConsent.mutateAsync({
        position,
        objection_text: position === 'object' ? objection.trim() : null,
      });
      if (result.auto_transitions?.length) onAutoAdvance();
    } catch {
      // Rendered below from submitConsent.error
    }
  };

  const handleWithdraw = async () => {
    try {
      const result = await withdrawPosition.mutateAsync({});
      setPosition('consent');
      setObjection('');
      if (result.auto_transitions?.length) onAutoAdvance();
    } catch {
      // Rendered below from withdrawPosition.error
    }
  };

  const latest = consentRecords[consentRecords.length - 1];

  return (
    <div className="space-y-6">
      {proposalStatus === 'consent' && canParticipate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{current ? 'Your position' : 'Record your position'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {current && (
              <div className="flex flex-col gap-2 border-2 border-strong-border p-3 sm:flex-row sm:items-center">
                <p className="flex-1 text-sm">
                  You recorded <Badge variant={positionVariant(current.position)}>{positionLabel(current.position)}</Badge>
                  {current.reason && <span className="block mt-1 text-muted-foreground">“{current.reason}”</span>}
                  <span className="block mt-1 text-muted-foreground">Change it below, or withdraw it{current.position === 'object' ? ' to lift your objection' : ''}.</span>
                </p>
                <Button type="button" variant="outline" size="sm" onClick={handleWithdraw} disabled={withdrawPosition.isPending}>
                  {withdrawPosition.isPending ? 'Withdrawing...' : current.position === 'object' ? 'Withdraw my objection' : 'Withdraw my position'}
                </Button>
              </div>
            )}
            {withdrawPosition.error && (
              <p className="text-sm text-destructive" role="alert">{apiErrorMessage(withdrawPosition.error)}</p>
            )}
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div className="space-y-1">
                <Label>Recording as:</Label>
                <p className="text-sm font-medium">{member?.display_name ?? 'Unknown'}</p>
              </div>
              <div className="space-y-1">
                <Label htmlFor="consent-position">Position</Label>
                <Select value={position} onValueChange={setPosition}>
                  <SelectTrigger id="consent-position" aria-describedby="consent-position-hint">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consent">Consent</SelectItem>
                    <SelectItem value="object">Object</SelectItem>
                    {!consensus && <SelectItem value="stand_aside">Stand aside</SelectItem>}
                  </SelectContent>
                </Select>
                <p id="consent-position-hint" className="text-xs text-muted-foreground">
                  {consensus
                    ? 'This proposal decides by consensus: consent or object.'
                    : 'Stand aside: no objection, but you will not take part. Object: a reasoned concern the proposer must work with.'}
                </p>
              </div>
              {position === 'object' && (
                <div className="space-y-1">
                  <Label htmlFor="objection">Objection *</Label>
                  <AITextarea
                    id="objection"
                    {...fields.field('objection')}
                    value={objection}
                    onChange={(e) => { setObjection(e.target.value); fields.settle('objection', e.target.value); }}
                    placeholder="What harm do you see, and what would resolve it?"
                    rows={3}
                    fieldLabel="Objection"
                    fieldContext="An objection to a governance proposal explaining why it should not be adopted"
                  />
                  <FieldError {...fields.error('objection')} />
                </div>
              )}
              <Button type="submit" disabled={submitConsent.isPending}>
                {submitConsent.isPending ? 'Saving...' : current ? 'Change my position' : 'Record my position'}
              </Button>
              {submitConsent.error && (
                <p className="text-sm text-destructive" role="alert">{apiErrorMessage(submitConsent.error)}</p>
              )}
            </form>
          </CardContent>
        </Card>
      )}
      {proposalStatus !== 'consent' && (
        <Card className="border-muted">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Positions can only be recorded during the consent phase. Current status: <Badge variant="secondary">{proposalPhaseLabel(proposalStatus)}</Badge>
            </p>
          </CardContent>
        </Card>
      )}

      {/* Consent rounds, newest first; only the newest counts, earlier ones are kept as history. */}
      {[...consentRecords].reverse().map((record) => {
        const isCurrent = record === latest;
        return (
          <Card key={record.id} className={isCurrent ? undefined : 'border-muted'}>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-lg">{isCurrent ? 'Current consent round' : 'Earlier round (before a revision)'}</CardTitle>
                {!isCurrent && <Badge variant="outline">History</Badge>}
              </div>
              {isCurrent && consentGate && (
                <p className="text-xs text-muted-foreground">{quorumExplanation(consentGate, governingTitle)}</p>
              )}
              {record.date && <p className="text-xs text-muted-foreground">Opened {formatDate(record.date)}</p>}
            </CardHeader>
            <CardContent className="p-0">
              {record.participants.length === 0 ? (
                <p className="px-6 pb-6 text-sm text-muted-foreground">No positions yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {record.participants.map((p) => (
                      <TableRow key={p.id} className={p.position === 'withdrawn' ? 'text-muted-foreground' : undefined}>
                        <TableCell className="font-medium">{p.member_name}</TableCell>
                        <TableCell>
                          <Badge variant={positionVariant(p.position)}>{positionLabel(p.position)}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">{p.objection_text || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        );
      })}

      {consentRecords.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No consent records yet</p>
      )}
    </div>
  );
}

type CriterionDraft = { criterion: string; metric: string; target: string; actual: string; met: boolean; evidence: string };

const emptyCriterion = (criterion = ''): CriterionDraft => ({ criterion, metric: '', target: '', actual: '', met: false, evidence: '' });

function TestReportCard({ report }: { report: TestReport }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Test Report</CardTitle>
          {report.outcome && <Badge variant={reportVariant(report.outcome)}>{report.outcome}</Badge>}
        </div>
        <div className="text-xs text-muted-foreground space-x-3">
          {report.reporter_name && <span>Reported by {report.reporter_name}</span>}
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
                          <Check className="h-4 w-4 text-success" aria-label="Met" />
                        ) : (
                          <X className="h-4 w-4 text-destructive" aria-label="Not met" />
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
  );
}

function TestTab({ testReports, proposalId, proposalStatus, declaredCases, canParticipate, onAutoAdvance }: {
  testReports: TestReport[];
  proposalId: string;
  proposalStatus: string;
  /** The declared test cases; criteria must use these names to evidence them. */
  declaredCases: string[];
  canParticipate: boolean;
  /** Called after a report auto-advanced the proposal (this form unmounts). */
  onAutoAdvance: () => void;
}) {
  const submitTest = useSubmitTestReport(proposalId);
  const [observations, setObservations] = useState('');
  const [outcome, setOutcome] = useState('');
  // Start from the declared cases, so a report evidences them by the names the gate checks.
  const [criteria, setCriteria] = useState<CriterionDraft[]>(() => declaredCases.map((c) => emptyCriterion(c)));
  const fields = useRequiredFields({
    observations: 'Describe what you observed.',
    outcome: 'Choose an outcome.',
  });

  const addCriterion = () => setCriteria([...criteria, emptyCriterion()]);
  const removeCriterion = (index: number) => setCriteria(criteria.filter((_, i) => i !== index));
  const updateCriterion = (index: number, field: keyof CriterionDraft, value: string | boolean) => {
    setCriteria(criteria.map((c, i) => i === index ? { ...c, [field]: value } : c));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.validate({ observations, outcome })) return;
    try {
      const result = await submitTest.mutateAsync({
        observations: observations.trim(),
        outcome,
        success_criteria: criteria.filter((c) => c.criterion.trim()),
      });
      setObservations('');
      setOutcome('');
      setCriteria(declaredCases.map((c) => emptyCriterion(c)));
      if (result.auto_transitions?.length) onAutoAdvance();
    } catch {
      // Rendered below from submitTest.error
    }
  };

  return (
    <div className="space-y-6">
      {/* Submit test report form — only during test phase */}
      {proposalStatus === 'test' && canParticipate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Submit Test Report</CardTitle>
            <p className="text-sm text-muted-foreground">
              Reports are evidence for a steward, who confirms the outcome. Your name is recorded with the report.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              <div className="space-y-1">
                <Label htmlFor="test-observations">Observations *</Label>
                <AITextarea
                  id="test-observations"
                  {...fields.field('observations')}
                  value={observations}
                  onChange={(e) => { setObservations(e.target.value); fields.settle('observations', e.target.value); }}
                  placeholder="Describe what was observed during testing..."
                  rows={4}
                  fieldLabel="Observations"
                  fieldContext="Observations from testing a governance proposal in practice"
                />
                <FieldError {...fields.error('observations')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="test-outcome">Outcome *</Label>
                <Select value={outcome} onValueChange={(value) => { setOutcome(value); fields.settle('outcome', value); }}>
                  <SelectTrigger id="test-outcome" {...fields.field('outcome')}>
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="modified">Modified</SelectItem>
                  </SelectContent>
                </Select>
                <FieldError {...fields.error('outcome')} />
              </div>
              {criteria.length > 0 && (
                <div className="space-y-2">
                  <Label>Success Criteria</Label>
                  {declaredCases.length > 0 && (
                    <p className="text-xs text-muted-foreground">The declared test cases are listed; tick the ones this report shows were met.</p>
                  )}
                  {criteria.map((c, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto_1fr_auto] gap-2 items-center">
                      <Input aria-label={`Criterion ${idx + 1}`} placeholder="Criterion" value={c.criterion} onChange={(e) => updateCriterion(idx, 'criterion', e.target.value)} />
                      <Input aria-label={`Criterion ${idx + 1} metric`} placeholder="Metric" value={c.metric} onChange={(e) => updateCriterion(idx, 'metric', e.target.value)} />
                      <Input aria-label={`Criterion ${idx + 1} target`} placeholder="Target" value={c.target} onChange={(e) => updateCriterion(idx, 'target', e.target.value)} />
                      <Input aria-label={`Criterion ${idx + 1} actual`} placeholder="Actual" value={c.actual} onChange={(e) => updateCriterion(idx, 'actual', e.target.value)} />
                      <Checkbox aria-label={`Criterion ${idx + 1} met`} checked={c.met} onCheckedChange={(checked) => updateCriterion(idx, 'met', !!checked)} />
                      <Input aria-label={`Criterion ${idx + 1} evidence`} placeholder="Evidence" value={c.evidence} onChange={(e) => updateCriterion(idx, 'evidence', e.target.value)} />
                      <Button type="button" variant="ghost" size="icon" aria-label={`Remove criterion ${idx + 1}`} onClick={() => removeCriterion(idx)}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
                Add Success Criterion
              </Button>
              <div>
                <Button type="submit" disabled={submitTest.isPending}>
                  {submitTest.isPending ? 'Submitting...' : 'Submit Test Report'}
                </Button>
              </div>
              {submitTest.error && (
                <p className="text-sm text-destructive" role="alert">{apiErrorMessage(submitTest.error)}</p>
              )}
            </form>
          </CardContent>
        </Card>
      )}
      {proposalStatus !== 'test' && (
        <Card className="border-muted">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              Test reports can only be submitted during the test phase. Current status: <Badge variant="secondary">{proposalPhaseLabel(proposalStatus)}</Badge>
            </p>
          </CardContent>
        </Card>
      )}

      {testReports.map((report) => <TestReportCard key={report.id} report={report} />)}

      {testReports.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No test reports yet</p>
      )}
    </div>
  );
}

const NOTE_REQUIRED_MESSAGE = 'Say what will change, so advisors and objectors know what to look at.';

/** Send back for revision: a required note, then a new version opens for advice. */
function SendBackDialog({ open, onOpenChange, from, onConfirm, pending }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  from: string;
  onConfirm: (note: string) => Promise<void>;
  pending: boolean;
}) {
  const [note, setNote] = useState('');
  const fields = useRequiredFields({ note: NOTE_REQUIRED_MESSAGE });
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fields.validate({ note })) return;
    await onConfirm(note.trim());
    setNote('');
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Send back for revision?</DialogTitle>
            <DialogDescription>
              The proposal leaves {proposalPhaseLabel(from)} and opens a new version for advice. Every position and
              report so far stays in the record as history; members record new positions on the revised version.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="revision-note">What will change *</Label>
            <AITextarea
              id="revision-note"
              {...fields.field('note')}
              value={note}
              onChange={(e) => { setNote(e.target.value); fields.settle('note', e.target.value); }}
              rows={3}
              placeholder="e.g. Closing at eight instead of nine, as Ben's objection asked."
              fieldLabel="Revision note"
              fieldContext="Why a governance proposal is being sent back for revision and what will change"
            />
            <FieldError {...fields.error('note')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Sending back...' : 'Send back for revision'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Main component ---

export default function ProposalDetail() {
  const [, params] = useRoute('/proposals/:id');
  const id = params?.id ?? '';
  const { data, isLoading, error } = useProposal(id);
  const statusMutation = useUpdateProposalStatus(id);
  const registerMutation = useRegisterProposalAgreement(id);
  const [statusChanging, setStatusChanging] = useState(false);
  const [dialog, setDialog] = useState<'withdraw' | 'revise' | 'ratify' | 'register' | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  // Focus target after a lifecycle change unmounts the control that was used.
  const statusRegionRef = useRef<HTMLDivElement>(null);
  const focusStatusRegion = () => window.requestAnimationFrame(() => statusRegionRef.current?.focus());

  if (isLoading) return <LoadingState message="Loading proposal..." />;

  if (error || !data) {
    // 404 is deliberate ecosystem scoping: never confirm that a foreign proposal exists.
    const notFound = !data && (!error || (error instanceof ApiFetchError && error.status === 404));
    return (
      <div className="text-center py-12 space-y-2">
        <h1 className="text-2xl font-bold">{notFound ? 'Proposal not available' : 'Failed to load proposal'}</h1>
        <p className="text-sm text-muted-foreground">
          {notFound
            ? "This proposal doesn't exist or belongs to an ecosystem you haven't joined."
            : apiErrorMessage(error)}
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          <Button asChild variant="outline">
            <Link href="/proposals">Back to Proposals</Link>
          </Button>
          {notFound && (
            <Button asChild variant="outline">
              <Link href="/discover">Discover ecosystems to join</Link>
            </Button>
          )}
        </div>
      </div>
    );
  }

  const canConduct = data.caller_can_conduct ?? false;
  const canManage = data.caller_can_manage ?? false;
  // The server's lifecycle table decides which moves this caller has (allowed_next); the page only draws them.
  const moves = groupProposalMoves(data.allowed_next);
  const canCloseAdvice = moves.forward.some((move) => move.to === 'consent');
  const adviceGate: (ActGates['advice'] & ActAdviceGateDetail) | undefined = data.gates?.advice;
  const advicePrompt = adviceClosePrompt({ status: data.status, adviceGate, canClose: canCloseAdvice });
  const proposerGathersAdvice = data.status === 'advice' && data.caller_is_proposer;
  const governingTitle = data.governing_agreement?.title ?? null;
  const banner = data.status === 'ratified' ? ratifiedBanner(data.registered_agreement, data.amends_agreement?.title) : null;
  const decisionTypeLabel = DECISION_TYPE_OPTIONS.find((o) => o.value === data.decision_type)?.label ?? 'Consent';
  const callerPosition = data.caller_position && data.caller_position.position !== 'withdrawn' ? data.caller_position : null;

  // The single participation action this phase asks of the caller, if any.
  const phaseAction = !canConduct ? undefined : ({
    advice: { tab: 'advice', cta: 'Share Advice', text: 'This proposal is gathering advice. Your perspective shapes the final decision.' },
    consent: callerPosition
      ? { tab: 'consent', cta: 'Change your position', text: `Your position: ${positionLabel(callerPosition.position)}. You can change it or withdraw it while consent is open.` }
      : { tab: 'consent', cta: 'Record Your Position', text: 'Record whether you consent, stand aside, or object — every position is kept distinct in the record.' },
    test: { tab: 'test', cta: 'Submit a Test Report', text: 'The proposal is being tried in practice. Report observations against the success criteria; a steward confirms the outcome.' },
  } as Record<string, { tab: string; cta: string; text: string }>)[data.status];

  const runTransition = async (target: string, note?: string) => {
    setStatusChanging(true);
    try {
      // The hook toasts the phase the proposal landed in (gates may auto-advance further), or the failure.
      await statusMutation.mutateAsync({ status: target, note, from: data.status });
      setDialog(null);
      focusStatusRegion();
    } catch {
      // Toasted by useUpdateProposalStatus; the dialog stays open to try again.
    } finally {
      setStatusChanging(false);
    }
  };

  const runRegister = async () => {
    try {
      await registerMutation.mutateAsync(undefined);
      setDialog(null);
      focusStatusRegion();
    } catch {
      // Rendered in the dialog from registerMutation.error
    }
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button asChild variant="ghost" size="sm">
        <Link href="/proposals">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Proposals
        </Link>
      </Button>

      {/* Ratified banner: says registered only when it is (the registry is a separate step). */}
      {banner && (
        <div className="flex flex-col gap-3 border border-success bg-success/10 p-5 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3 flex-1 text-success">
            <Award className="h-5 w-5 shrink-0" aria-hidden="true" />
            <div>
              <p className="font-bold">{banner.title}</p>
              <p className="text-sm">
                {banner.body}
                {data.registered_agreement && (
                  <>
                    {' '}
                    <Link href={`/agreements/${data.registered_agreement.id}`} className="underline underline-offset-2">
                      Open the agreement
                    </Link>
                  </>
                )}
              </p>
            </div>
          </div>
          {data.caller_can_register && (
            <Button size="sm" onClick={() => { registerMutation.reset(); setDialog('register'); }}>
              Register as agreement…
            </Button>
          )}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{data.title}</h1>
          <div
            ref={statusRegionRef}
            tabIndex={-1}
            className="flex flex-wrap items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="sr-only">Status:</span>
            <Badge variant={statusVariant(data.status)}>{proposalPhaseLabel(data.status)}</Badge>
            <Badge variant="outline">{data.type}</Badge>
            {data.urgency && <Badge variant={urgencyVariant(data.urgency)}>{data.urgency}</Badge>}
            <span className="text-sm text-muted-foreground">v{data.version}</span>
          </div>
        </div>

        {/* Edit and manual moves: the proposer or an ecosystem steward; each move comes from allowed_next. */}
        {canManage && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Proposal lifecycle actions">
            {proposalEditLock(data.status) === null && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/proposals/${id}/edit`}>
                  <Pencil className="h-4 w-4 mr-1" aria-hidden="true" />
                  Edit
                </Link>
              </Button>
            )}
            {moves.forward.map((move) => (
              <Button key={move.to} size="sm" disabled={statusChanging} onClick={() => runTransition(move.to)}>
                {PROPOSAL_TRANSITION_LABELS[move.to] ?? proposalPhaseLabel(move.to)}
              </Button>
            ))}
            {moves.ratify && (
              <Button size="sm" disabled={statusChanging} onClick={() => setDialog('ratify')}>
                {PROPOSAL_TRANSITION_LABELS.ratified}
              </Button>
            )}
            {moves.revise && (
              <Button variant="outline" size="sm" disabled={statusChanging} onClick={() => setDialog('revise')}>
                {PROPOSAL_TRANSITION_LABELS.revise}
              </Button>
            )}
            {moves.withdraw && (
              <Button variant="outline" size="sm" disabled={statusChanging} onClick={() => setDialog('withdraw')}>
                {PROPOSAL_TRANSITION_LABELS.withdrawn}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Withdraw: irreversible, so it confirms. */}
      <AlertDialog open={dialog === 'withdraw'} onOpenChange={(open) => { if (!open) setDialog(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw this proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. All advice and consent collected stays in the record, but the proposal will no longer move.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => runTransition('withdrawn')} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SendBackDialog
        open={dialog === 'revise'}
        onOpenChange={(open) => setDialog(open ? 'revise' : null)}
        from={data.status}
        pending={statusChanging}
        onConfirm={(note) => runTransition('advice', note)}
      />

      {/* Steward confirmation: the reports are evidence, shown here before the decision. */}
      <Dialog open={dialog === 'ratify'} onOpenChange={(open) => setDialog(open ? 'ratify' : null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm ratification?</DialogTitle>
            <DialogDescription>
              You are confirming, as a steward, that the test shows this proposal works. Ratifying records the decision;
              it is not in the agreement registry until it is registered.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {data.gates && data.gates.test.declared_cases.length > 0 && (
              <p className="text-sm">
                Declared test cases evidenced: {(data.gates.test.cases_met ?? []).length} of {data.gates.test.declared_cases.length}.
              </p>
            )}
            {data.test_reports.length === 0 && <p className="text-sm text-muted-foreground">No test reports.</p>}
            {data.test_reports.map((report) => <TestReportCard key={report.id} report={report} />)}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="button" disabled={statusChanging} onClick={() => runTransition('ratified')}>
              {statusChanging ? 'Confirming...' : 'Confirm ratification'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register as agreement: writes the registry (a new agreement, or a new version of the amended one). */}
      <Dialog open={dialog === 'register'} onOpenChange={(open) => setDialog(open ? 'register' : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register as an agreement?</DialogTitle>
            <DialogDescription>
              {data.amends_agreement
                ? `This replaces the text of “${data.amends_agreement.title}” (v${data.amends_agreement.version ?? ''}) with the proposed change and starts its next version. Members will be asked to consent to the new version.`
                : 'This adds a new agreement in force, with the proposed change as its text. It cannot be undone from here.'}
            </DialogDescription>
          </DialogHeader>
          {registerMutation.error && (
            <p className="text-sm text-destructive" role="alert">{apiErrorMessage(registerMutation.error)}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="button" disabled={registerMutation.isPending} onClick={runRegister}>
              {registerMutation.isPending ? 'Registering...' : 'Register as agreement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Where it stands, in the same words as the assistant (GET /explain) */}
      <StatusBanner kind="proposal" id={data.id} />

      {/* ACT Process Stepper */}
      <ACTStepper currentStatus={data.status} />

      {/* A draft only moves when its manager opens it; say so explicitly. */}
      {data.status === 'draft' && canManage && (
        <div className="flex items-start gap-3 border-2 border-strong-border bg-muted p-4">
          <Info className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            This proposal is a draft. When it is ready, choose <strong className="text-foreground">{PROPOSAL_TRANSITION_LABELS.advice}</strong> so members can give advice.
          </p>
        </div>
      )}

      {/* Ratification is never self-certified: the author learns who decides instead of seeing a button. */}
      {moves.ratifyNeedsAnotherSteward && (
        <div role="note" className="flex items-start gap-3 border-2 border-strong-border bg-muted p-4">
          <Info className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Another steward needs to confirm this.</strong> The test gate is met, and
            ratification is confirmed by a steward who did not write the proposal.
          </p>
        </div>
      )}

      {/* The proposer closes advice: prompted once the gate is met, more firmly past the deadline. */}
      {advicePrompt && (
        <div className={`flex flex-col sm:flex-row sm:items-center gap-3 border-2 p-4 ${advicePrompt.tone === 'due' ? 'border-warning bg-warning/10' : 'border-strong-border bg-muted'}`}>
          <div className="flex items-start gap-3 flex-1">
            <Clock className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold text-sm">{advicePrompt.title}</p>
              <p className="text-sm text-muted-foreground">{advicePrompt.body}</p>
            </div>
          </div>
          <Button size="sm" disabled={statusChanging} onClick={() => runTransition('consent')}>
            {PROPOSAL_TRANSITION_LABELS.consent}
          </Button>
        </div>
      )}

      {/* The proposer gathers advice rather than giving it. */}
      {proposerGathersAdvice && !advicePrompt && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-2 border-strong-border bg-muted p-4">
          <div className="flex items-start gap-3 flex-1">
            <Info className="h-5 w-5 shrink-0 text-muted-foreground mt-0.5" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">
              You are the proposer: advice from others appears here. Once the advice gate is met, you decide when to move to consent.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => setActiveTab('advice')}>
            View advice
          </Button>
        </div>
      )}

      {/* Next action — what this phase asks of the caller */}
      {phaseAction && !proposerGathersAdvice && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-2 border-warning bg-warning/10 p-4">
          <div className="flex items-start gap-3 flex-1">
            <CircleAlert className="h-5 w-5 shrink-0 text-warning mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold text-sm">
                {callerPosition && data.status === 'consent' ? 'Your position is recorded' : `Your input is needed in the ${proposalPhaseLabel(data.status)} phase`}
              </p>
              <p className="text-sm text-muted-foreground">{phaseAction.text}</p>
            </div>
          </div>
          <Button size="sm" onClick={() => setActiveTab(phaseAction.tab)}>
            {phaseAction.cta}
          </Button>
        </div>
      )}

      {!canConduct && (
        <div className="flex items-center gap-3 border-2 border-strong-border bg-muted p-4">
          <CircleAlert className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            You are not a member of this proposal's ecosystem, so you can read it but not take part.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 min-w-0">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
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
              <p className="max-w-xs">Gather perspectives from people affected. The proposer decides when advice closes.</p>
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
              <p className="max-w-xs">The proposal is tried in practice with defined success criteria; a steward confirms the outcome.</p>
            </TooltipContent>
          </Tooltip>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab data={data} />
        </TabsContent>

        <TabsContent value="advice">
          <AdviceTab
            adviceLogs={data.advice_logs}
            proposalId={id}
            proposalStatus={data.status}
            isProposer={data.caller_is_proposer ?? false}
            canParticipate={canConduct}
            onAutoAdvance={focusStatusRegion}
          />
        </TabsContent>

        <TabsContent value="consent">
          <ConsentTab
            key={`${data.version}-${data.caller_position?.position ?? 'none'}`}
            consentRecords={data.consent_records}
            proposalId={id}
            proposalStatus={data.status}
            callerPosition={data.caller_position ?? null}
            canParticipate={canConduct}
            consentGate={data.gates?.consent ?? null}
            governingTitle={data.gates?.policy_source === 'agreement' ? governingTitle : null}
            onAutoAdvance={focusStatusRegion}
          />
        </TabsContent>

        <TabsContent value="test">
          <TestTab
            key={data.version}
            testReports={data.test_reports}
            proposalId={id}
            proposalStatus={data.status}
            declaredCases={data.gates?.test.declared_cases ?? []}
            canParticipate={canConduct}
            onAutoAdvance={focusStatusRegion}
          />
        </TabsContent>
          </Tabs>
        </div>

        {/* Rail column */}
        <div className="space-y-6">
          {data.gates && <ActGatesPanel gates={data.gates} status={data.status} kind="proposal" governingTitle={governingTitle} />}
          {data.status === 'ratified' && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Your own follow-up</CardTitle></CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">
                  A private note for you, separate from the ecosystem's decision record: what you will do about
                  this decision. It doubles as a follow-up task.
                </p>
                <RecordDecisionAction
                  subjectType="proposal"
                  subjectId={id}
                  subjectTitle={data.title}
                  actionLabel="Record your follow-up"
                />
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 text-sm">
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
                  <dd className="font-medium">{decisionTypeLabel}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Gates follow</dt>
                  <dd className="font-medium">
                    {data.governing_agreement ? (
                      <Link href={`/agreements/${data.governing_agreement.id}`} className="underline underline-offset-2 hover:text-primary">
                        {data.governing_agreement.title}
                      </Link>
                    ) : 'Default gates'}
                  </dd>
                </div>
                {data.amends_agreement && (
                  <div>
                    <dt className="text-muted-foreground">Changes agreement</dt>
                    <dd className="font-medium">
                      <Link href={`/agreements/${data.amends_agreement.id}`} className="underline underline-offset-2 hover:text-primary">
                        {data.amends_agreement.title}
                      </Link>
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-muted-foreground">Advice Deadline</dt>
                  <dd className="font-medium">
                    {formatDate(data.advice_deadline)}
                    {data.status === 'advice' && adviceGate?.deadline_passed ? ' (passed)' : ''}
                  </dd>
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
        </div>
      </div>
    </div>
  );
}
