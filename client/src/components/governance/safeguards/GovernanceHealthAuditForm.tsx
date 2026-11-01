import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useStartAudit, useSaveAuditDraft, usePublishAudit } from '@/hooks/use-care';
import { useHealthSnapshot } from '@/hooks/use-health';
import { useEcosystem } from '@/contexts/EcosystemContext';
import {
  AUDIT_SCOPE_OPTIONS, auditPeriodError, auditPublishBlocker, bandLabel, formatMeasured, ratingsNeeded,
} from '@/lib/health';
import type { AuditDraftFields, GovernanceAudit, HealthSnapshot, RatedIndicator } from '@/types/api';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api-error-message';

// What each rating means, in plain words (thresholds per indicator are on the Safeguards page).
export const GHI_INDICATORS = [
  { id: 'GHI-01', name: 'Proposal Authorship Diversity', hint: 'Do proposals come from many members, or a few?' },
  { id: 'GHI-02', name: 'Approval Rate by Role', hint: 'Are proposals approved at similar rates whoever proposes them?' },
  { id: 'GHI-03', name: 'Resource Concentration', hint: 'Is funding or access held by a few people?' },
  { id: 'GHI-04', name: 'Participation Trend', hint: 'Is participation growing, steady or falling?' },
  { id: 'GHI-05', name: 'Leadership Tenure', hint: 'Do the same people hold roles for too long?' },
  { id: 'GHI-06', name: 'Objection Integration', hint: 'Are objections heard and worked into the outcome?' },
  { id: 'GHI-07', name: 'Review Compliance', hint: 'Are agreements reviewed when they are due?' },
  { id: 'GHI-08', name: 'Cross-Unit Engagement', hint: 'Do domains and circles work with each other?' },
] as const;

const NOT_RATED = 'none';
const RATINGS = [
  { value: 'healthy', label: 'Healthy' },
  { value: 'warning', label: 'Warning' },
  { value: 'critical', label: 'Critical' },
] as const;

interface GovernanceHealthAuditFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** A draft the caller is recording; without it the form starts a new audit. */
  audit?: GovernanceAudit;
  /** The ecosystem to audit when starting a new audit; defaults to the selected one. */
  ecosystemId?: string;
  /** Nobody outside the stewards can record this audit: say so before it is saved. */
  selfAssessment?: boolean;
  /** The audited ecosystem's name for the title; else the draft's own, else the caller's membership list. */
  ecosystemName?: string | null;
  /** Where focus goes when the dialog closes (it has no trigger for Radix to return to). */
  onCloseAutoFocus?: (event: Event) => void;
  /** Called with the published audit, before the dialog closes. */
  onPublished?: (audit: GovernanceAudit) => void;
}

/** Record a governance health audit by hand: rate indicators, write findings, save a draft, publish. */
export function GovernanceHealthAuditForm({
  open, onOpenChange, audit, ecosystemId, selfAssessment, ecosystemName, onCloseAutoFocus, onPublished,
}: GovernanceHealthAuditFormProps) {
  const { selected: selectedEcosystem, ecosystems } = useEcosystem();
  const startMutation = useStartAudit();
  const saveMutation = useSaveAuditDraft();
  const publishMutation = usePublishAudit();
  const auditedEcosystemId = audit?.ecosystem_id ?? ecosystemId ?? selectedEcosystem?.id;
  const auditedName = ecosystemName ?? audit?.ecosystem_name ?? ecosystems.find((ecosystem) => ecosystem.id === auditedEcosystemId)?.name;
  // A draft created by this dialog is kept, so a failed publish retries on it instead of starting another.
  const [draftId, setDraftId] = useState<string | undefined>(audit?.id);

  const [scope, setScope] = useState('full');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [findings, setFindings] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [confirmingPublish, setConfirmingPublish] = useState(false);

  useEffect(() => {
    if (!open) return;
    setDraftId(audit?.id);
    setScope(audit?.audit_scope ?? 'full');
    setPeriodStart(audit?.audit_period_start ?? '');
    setPeriodEnd(audit?.audit_period_end ?? '');
    setRatings(Object.fromEntries((audit?.indicator_scores ?? []).flatMap((row) => (row.status ? [[row.indicator_id, row.status]] : []))));
    setFindings(audit?.findings ?? '');
    setRecommendations((audit?.structured_recommendations ?? []).join('\n'));
    setConfirmingPublish(false);
  }, [open, audit]);

  // A reversed period is a field error, never a snapshot request: values and required markers stay those of the last
  // valid period, and the last values loaded stay up while another period loads (p3-health-audit-and-review-4).
  const periodError = auditPeriodError(periodStart, periodEnd);
  const lastValidPeriod = useRef({ from: '', to: '' });
  if (!periodError) lastValidPeriod.current = { from: periodStart, to: periodEnd };
  const snapshot = useHealthSnapshot({
    ecosystem_id: open ? auditedEcosystemId : undefined,
    from: lastValidPeriod.current.from || undefined,
    to: lastValidPeriod.current.to || undefined,
  });
  const lastSnapshot = useRef<{ ecosystemId?: string; data: HealthSnapshot } | null>(null);
  if (snapshot.data) lastSnapshot.current = { ecosystemId: auditedEcosystemId, data: snapshot.data };
  const kept = lastSnapshot.current;
  const snapshotData = snapshot.data ?? (kept && kept.ecosystemId === auditedEcosystemId ? kept.data : undefined);
  const liveValues = new Map((snapshotData?.indicators ?? []).map((value) => [value.indicator_id, value]));
  const requiredIds = new Set(ratingsNeeded(snapshotData?.indicators ?? []));
  const missingRequired = Array.from(requiredIds).filter((id) => !ratings[id] || ratings[id] === NOT_RATED);
  const ratedCount = Object.values(ratings).filter((value) => value !== NOT_RATED).length;
  // Publishing needs every indicator with data rated (the server's RATINGS_MISSING), named as the form names them.
  const publishBlocker = auditPublishBlocker({
    periodError,
    missingNames: missingRequired.map((id) => GHI_INDICATORS.find((indicator) => indicator.id === id)?.name ?? id),
    ratedCount,
  });
  const busy = startMutation.isPending || saveMutation.isPending || publishMutation.isPending;
  const failure = startMutation.error ?? saveMutation.error ?? publishMutation.error;

  const fields = (): AuditDraftFields => {
    const indicator_scores: RatedIndicator[] = GHI_INDICATORS.flatMap((indicator) => {
      const status = ratings[indicator.id];
      return status && status !== NOT_RATED
        ? [{ indicator_id: indicator.id, indicator_name: indicator.name, status: status as RatedIndicator['status'] }]
        : [];
    });
    const lines = recommendations.split('\n').map((line) => line.trim()).filter(Boolean);
    return {
      audit_scope: scope,
      ...(periodStart ? { audit_period_start: periodStart } : {}),
      ...(periodEnd ? { audit_period_end: periodEnd } : {}),
      ...(indicator_scores.length ? { indicator_scores } : {}),
      ...(findings.trim() ? { findings: findings.trim() } : {}),
      ...(lines.length ? { structured_recommendations: lines } : {}),
    };
  };

  /** Saves the draft (creating it first when new) and returns its id. */
  const saveDraft = async (): Promise<string> => {
    if (draftId) {
      await saveMutation.mutateAsync({ id: draftId, data: fields() });
      return draftId;
    }
    if (!auditedEcosystemId) throw new Error('Choose an ecosystem first');
    const created = await startMutation.mutateAsync({ ecosystem_id: auditedEcosystemId, ...fields() });
    setDraftId(created.id);
    return created.id;
  };

  const handleSave = async () => {
    try {
      await saveDraft();
      onOpenChange(false);
    } catch {
      // Error shown by the mutation state below
    }
  };

  const handlePublish = async () => {
    if (publishBlocker) return;
    try {
      const published = await publishMutation.mutateAsync(await saveDraft());
      onPublished?.(published);
      onOpenChange(false);
    } catch {
      // Error shown by the mutation state below
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto" onCloseAutoFocus={onCloseAutoFocus}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>
              {audit ? 'Continue the governance health audit' : 'Record a governance health audit'}
              {auditedName ? ` of ${auditedName}` : ''}
            </span>
          </DialogTitle>
          <DialogDescription>
            You are the auditor. Rate each indicator you have looked at, write what you found, and publish when you are done.
            The values beside each indicator are worked out from the records; the rating is your call.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {selfAssessment && (
            <p className="border-2 border-warning bg-warning/10 p-3 text-sm">
              This will be a self-assessment: nobody outside the stewards can record it.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="audit-scope">Scope</Label>
              <Select value={scope} onValueChange={setScope}>
                <SelectTrigger id="audit-scope"><SelectValue placeholder="Select scope" /></SelectTrigger>
                <SelectContent>
                  {AUDIT_SCOPE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-period-start">Period from</Label>
              <Input id="audit-period-start" type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="audit-period-end">Period to</Label>
              <Input
                id="audit-period-end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                aria-invalid={periodError ? true : undefined}
                aria-describedby={periodError ? 'audit-period-error' : undefined}
              />
            </div>
          </div>
          {periodError && (
            <p id="audit-period-error" role="alert" className="text-sm font-semibold text-destructive">
              {periodError} The values below are for the last valid period.
            </p>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Indicators</legend>
            {snapshot.isError && !snapshotData && <p className="text-xs text-muted-foreground">The live values could not be loaded. You can still rate.</p>}
            {GHI_INDICATORS.map((indicator) => {
              const live = liveValues.get(indicator.id);
              const needed = requiredIds.has(indicator.id);
              return (
                <div key={indicator.id} className="flex flex-col gap-2 border-2 border-strong-border px-2 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <div className="min-w-0">
                    <Label htmlFor={`rating-${indicator.id}`} className="text-sm">
                      {indicator.name}{needed ? ' (required to publish)' : ''}
                    </Label>
                    <p className="text-xs text-muted-foreground">{indicator.hint}</p>
                    {live && (
                      <p className="text-xs">
                        {live.computable
                          ? <><span className="font-semibold">{formatMeasured(live.measured_value, live.unit)}</span> · {bandLabel(live.band)} by the framework · {live.basis}</>
                          : <span className="text-muted-foreground">Not computable yet</span>}
                      </p>
                    )}
                  </div>
                  <Select value={ratings[indicator.id] ?? NOT_RATED} onValueChange={(value) => setRatings((previous) => ({ ...previous, [indicator.id]: value }))}>
                    <SelectTrigger id={`rating-${indicator.id}`} className="min-h-11 w-full shrink-0 sm:w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NOT_RATED}>Not rated</SelectItem>
                      {RATINGS.map((rating) => <SelectItem key={rating.value} value={rating.value}>{rating.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="audit-findings">Findings</Label>
            <Textarea id="audit-findings" rows={4} value={findings} onChange={(e) => setFindings(e.target.value)} placeholder="What you looked at and what you found" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="audit-recommendations">Recommendations (one per line)</Label>
            <Textarea id="audit-recommendations" rows={3} value={recommendations} onChange={(e) => setRecommendations(e.target.value)} />
          </div>

          {publishBlocker ? (
            <p id="audit-publish-blocker" className="border-2 border-strong-border p-3 text-sm">{publishBlocker}</p>
          ) : confirmingPublish && (
            <div className="border-2 border-warning bg-warning/10 p-3 text-sm" role="alert">
              Publishing freezes the measured values with your {ratedCount} rating{ratedCount === 1 ? '' : 's'} and locks the audit. You can't edit it afterwards.
            </div>
          )}
        </div>

        {failure && (
          <div role="alert" className="rounded-none border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
            {apiErrorMessage(failure)}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" className="min-h-11" onClick={() => onOpenChange(false)} disabled={busy}>Cancel</Button>
          <Button variant="secondary" className="min-h-11" onClick={handleSave} disabled={busy}>
            {busy && !confirmingPublish ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save draft
          </Button>
          {confirmingPublish && !publishBlocker ? (
            <Button onClick={handlePublish} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Yes, publish
            </Button>
          ) : (
            <Button
              onClick={() => setConfirmingPublish(true)}
              disabled={busy || publishBlocker !== null}
              title={publishBlocker ?? undefined}
              aria-describedby={publishBlocker ? 'audit-publish-blocker' : undefined}
            >
              Publish audit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
