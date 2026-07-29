import { useState } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useAgreement, useAttestAgreementConsent, useUpdateAgreementStatus, useWithdrawAgreementConsent } from '@/hooks/use-governance';
import { formatDate } from '@/lib/utils';
import { agreementStatusLabel, agreementStatusVariant } from '@/lib/agreement-status';
import { agreementTypeLabel } from '@/lib/agreement-type';
import { Pencil, History, ArrowLeft, CircleAlert, CheckCircle2, Gavel } from 'lucide-react';

const CONSENT_OPEN_STATUSES = ['consent', 'test', 'active', 'under_review'];

export default function AgreementDetail() {
  const [, params] = useRoute('/agreements/:id');
  const id = params?.id ?? '';
  const [, navigate] = useLocation();
  const { data, isLoading, error } = useAgreement(id);
  const statusMutation = useUpdateAgreementStatus(id);
  const consentMutation = useAttestAgreementConsent(id);
  const withdrawalMutation = useWithdrawAgreementConsent(id);
  const [statusChanging, setStatusChanging] = useState(false);
  const [ceremonyEvidence, setCeremonyEvidence] = useState('');
  const [attestation, setAttestation] = useState('I have read and explicitly consent to this agreement.');
  const [withdrawalReason, setWithdrawalReason] = useState('');

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
      await statusMutation.mutateAsync({
        status: newStatus,
        evidence: ceremonyEvidence.trim() || undefined,
      });
    } finally {
      setStatusChanging(false);
    }
  };

  const currentConsent = data.current_member_consent;
  const hasCurrentConsent = !!currentConsent && !currentConsent.withdrawn_at;
  const consentSummary = data.consent_summary;
  const nextCeremony = ({ draft: 'advice', advice: 'consent', consent: 'test', test: 'active' } as Record<string, string>)[data.status];
  const canConduct = data.caller_can_conduct ?? false;
  const needsMyConsent =
    data.requires_explicit_consent && !hasCurrentConsent && CONSENT_OPEN_STATUSES.includes(data.status);
  const consentPending =
    data.requires_explicit_consent && !hasCurrentConsent && !CONSENT_OPEN_STATUSES.includes(data.status);

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
            <Badge variant={agreementStatusVariant(data.status)}>{agreementStatusLabel(data.status)}</Badge>
            <Badge variant="outline">{agreementTypeLabel(data.type)}</Badge>
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
          {canConduct && (
            <Select onValueChange={handleStatusChange} disabled={statusChanging}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                {data.status === 'draft' && <SelectItem value="advice">Advice</SelectItem>}
                {data.status === 'advice' && <SelectItem value="consent">Consent</SelectItem>}
                {data.status === 'consent' && (
                  <SelectItem value="test">Begin Test Ceremony</SelectItem>
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
          )}
        </div>
      </div>

      {statusMutation.error && (
        <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {(statusMutation.error as Error).message}
        </div>
      )}

      {/* Next action — the one thing this agreement needs from the caller right now */}
      {needsMyConsent && (
        <div className="border-2 border-warning bg-warning/10 p-5 space-y-3">
          <div className="flex items-center gap-2 text-warning">
            <CircleAlert className="h-5 w-5 shrink-0" />
            <p className="font-bold">Your consent is needed on this agreement</p>
          </div>
          <p className="text-sm">
            Read the agreement text below, then record your explicit attestation.
            {data.alignment_points > 0 && ` Consenting earns +${data.alignment_points} alignment.`}
          </p>
          <div className="space-y-2">
            <Label htmlFor="agreement-attestation">Your explicit consent</Label>
            <Textarea
              id="agreement-attestation"
              value={attestation}
              onChange={(event) => setAttestation(event.target.value)}
              rows={3}
            />
            <Button
              type="button"
              disabled={attestation.trim().length < 8 || consentMutation.isPending}
              onClick={() => consentMutation.mutate(attestation.trim())}
            >
              Record My Consent
            </Button>
          </div>
          {consentMutation.error && (
            <p className="text-sm text-destructive" role="alert">
              {(consentMutation.error as Error).message}
            </p>
          )}
        </div>
      )}

      {hasCurrentConsent && (
        <div className="flex items-center gap-3 border-2 border-success bg-success/10 p-4 text-success">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            You consented to v{currentConsent.agreement_version} on {formatDate(currentConsent.attested_at)}.
            {currentConsent.alignment_awarded > 0 && ` Alignment earned: +${currentConsent.alignment_awarded}.`}
          </p>
        </div>
      )}

      {consentPending && (
        <div className="flex items-center gap-3 border-2 border-strong-border bg-muted p-4">
          <CircleAlert className="h-5 w-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            This agreement will need your consent. Consent opens when the consent ceremony begins — the
            agreement is currently in {agreementStatusLabel(data.status)}.
          </p>
        </div>
      )}

      {nextCeremony && canConduct && (
        <div className="flex items-center gap-3 border-2 border-primary bg-primary/10 p-4">
          <Gavel className="h-5 w-5 shrink-0 text-primary" />
          <p className="text-sm font-medium">
            Next ceremony: {agreementStatusLabel(nextCeremony)}. Record documented evidence below, then advance
            the status.
          </p>
        </div>
      )}

      {nextCeremony && !canConduct && (
        <div className="flex items-center gap-3 border-2 border-strong-border bg-muted p-4">
          <Gavel className="h-5 w-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Awaiting an ecosystem steward to open the {agreementStatusLabel(nextCeremony)} ceremony. Lifecycle
            ceremonies are conducted by stewards (admin/owner).
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Full text — read before consent */}
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

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Consent & Participation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground">Consent required</p>
                  <p className="font-medium">{data.requires_explicit_consent ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Consent progress</p>
                  <p className="font-medium">
                    {consentSummary ? `${consentSummary.consented} of ${consentSummary.required}` : 'Not started'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Alignment earned</p>
                  <p className="font-medium">+{data.alignment_points} when you consent</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Participation gates</p>
                  <p className="font-medium capitalize">
                    {data.prerequisite_scopes.length ? data.prerequisite_scopes.join(', ') : 'None'}
                  </p>
                </div>
              </div>

              {nextCeremony && canConduct && (
                <div className="space-y-2 border-t border-border pt-4">
                  <Label htmlFor="ceremony-evidence">{agreementStatusLabel(nextCeremony)} ceremony evidence *</Label>
                  <Textarea
                    id="ceremony-evidence"
                    value={ceremonyEvidence}
                    onChange={(event) => setCeremonyEvidence(event.target.value)}
                    placeholder="Record the participants, evidence, and outcome for this governance ceremony."
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">This lifecycle transition is blocked until documented evidence is recorded.</p>
                </div>
              )}

              {hasCurrentConsent && (
                <div className="space-y-2 border-t border-border pt-4">
                  <Label htmlFor="withdrawal-reason">Withdraw consent</Label>
                  <Textarea
                    id="withdrawal-reason"
                    value={withdrawalReason}
                    onChange={(event) => setWithdrawalReason(event.target.value)}
                    placeholder="Explain your reasoned withdrawal (required)."
                    rows={2}
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={withdrawalReason.trim().length < 3 || withdrawalMutation.isPending}
                    onClick={() => withdrawalMutation.mutate(withdrawalReason.trim())}
                  >
                    Withdraw Consent
                  </Button>
                  {withdrawalMutation.error && (
                    <p className="text-sm text-destructive" role="alert">
                      {(withdrawalMutation.error as Error).message}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {data.ceremonies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Governance Ceremonies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {data.ceremonies.map((ceremony) => (
                    <div key={ceremony.id} className="border border-border p-3 text-sm">
                      <p className="font-medium capitalize">{ceremony.stage}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(ceremony.completed_at)}</p>
                      {ceremony.evidence && <p className="mt-2 text-muted-foreground">{ceremony.evidence}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Rail column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-4 text-sm">
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
                  <div>
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
      </div>
    </div>
  );
}
