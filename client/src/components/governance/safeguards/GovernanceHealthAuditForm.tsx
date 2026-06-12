import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useSafeguards, useRequestAudit } from '@/hooks/use-governance';
import { useEcosystem } from '@/contexts/EcosystemContext';
import type { IndicatorScore, TriggeredSafeguard } from '@/types/api';
import { ShieldCheck, AlertTriangle, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';

// GHI indicator definitions (same as SafeguardsDashboard)
const GHI_INDICATORS = [
  { id: 'GHI-01', name: 'Proposal Authorship Diversity' },
  { id: 'GHI-02', name: 'Approval Rate by Role' },
  { id: 'GHI-03', name: 'Resource Concentration' },
  { id: 'GHI-04', name: 'Participation Trend' },
  { id: 'GHI-05', name: 'Leadership Tenure' },
  { id: 'GHI-06', name: 'Objection Integration' },
  { id: 'GHI-07', name: 'Review Compliance' },
  { id: 'GHI-08', name: 'Cross-Unit Engagement' },
] as const;

interface GovernanceHealthAuditFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GovernanceHealthAuditForm({ open, onOpenChange }: GovernanceHealthAuditFormProps) {
  const { data: safeguards, isLoading: safeguardsLoading } = useSafeguards();
  const { selected: selectedEcosystem } = useEcosystem();
  const requestMutation = useRequestAudit();
  const [auditScope, setAuditScope] = useState('full');

  const indicatorScores = safeguards?.indicator_scores ?? safeguards?.latest_audit?.indicator_scores ?? [];
  const triggeredSafeguards = safeguards?.triggered_safeguards ?? safeguards?.latest_audit?.triggered_safeguards ?? [];
  const latestAudit = safeguards?.latest_audit;

  // Build a lookup map
  const scoreMap = new Map<string, IndicatorScore>();
  if (indicatorScores) {
    for (const s of indicatorScores) {
      scoreMap.set(s.indicator_id, s);
    }
  }

  const handleSubmit = async () => {
    // Note: audit_scope is not yet accepted by AuditCreateRequest backend schema (S2 backlog).
    // Only ecosystem_id is required; auditor defaults to 'AI Governance Agent' server-side.
    const payload: Record<string, any> = {};
    if (selectedEcosystem) {
      payload.ecosystem_id = selectedEcosystem.id;
    }
    try {
      await requestMutation.mutateAsync(payload);
      onOpenChange(false);
    } catch {
      // Error handled by mutation state
    }
  };

    if (safeguardsLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Request Governance Health Audit
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Request Governance Health Audit
          </DialogTitle>
          <DialogDescription>
            AI-powered audit of governance health indicators, capture risk detection,
            and safeguard compliance across your ecosystem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Current health snapshot */}
          {latestAudit && (
            <div className="border rounded-md p-3 bg-muted/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Current Health Score</span>
                <span className="text-lg font-bold">{(safeguards?.health_score ?? 0)} / 100</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Last audit: {latestAudit.created_at ? new Date(latestAudit.created_at).toLocaleDateString() : 'N/A'}
                {latestAudit.next_audit_due && (
                  <> · Next due: {new Date(latestAudit.next_audit_due).toLocaleDateString()}</>
                )}
              </p>
            </div>
          )}

          {/* Indicator preview */}
          {indicatorScores && indicatorScores.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Current Health Indicators</Label>
              <div className="grid grid-cols-2 gap-2">
                {GHI_INDICATORS.map((indicator) => {
                  const score = scoreMap.get(indicator.id);
                  const statusColor = score?.status === 'critical' ? 'text-red-600' :
                    score?.status === 'warning' ? 'text-yellow-600' : 'text-green-600';
                  return (
                    <div key={indicator.id} className="flex items-center justify-between text-xs border rounded px-2 py-1.5">
                      <span className="truncate mr-2">{indicator.name}</span>
                      <span className={`font-mono ${statusColor}`}>
                        {score?.measured_value ?? '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Triggered safeguards alert */}
          {triggeredSafeguards && triggeredSafeguards.length > 0 && (
            <div className="border border-yellow-300 bg-yellow-50 rounded-md px-3 py-2 text-sm">
              <div className="flex items-center gap-2 font-semibold text-yellow-800 mb-1">
                <AlertTriangle className="h-4 w-4" />
                {triggeredSafeguards.length} Safeguard{triggeredSafeguards.length > 1 ? 's' : ''} Triggered
              </div>
              <ul className="list-disc pl-5 text-yellow-700 text-xs space-y-0.5">
                {triggeredSafeguards.map((ts: TriggeredSafeguard) => (
                  <li key={ts.trigger_id}>
                    {GHI_INDICATORS.find(i => i.id === ts.indicator_id)?.name ?? ts.indicator_id}: {ts.threshold_crossed}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Audit scope */}
          <div className="space-y-2">
            <Label htmlFor="audit-scope">Audit Scope</Label>
            <Select value={auditScope} onValueChange={setAuditScope}>
              <SelectTrigger id="audit-scope">
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full — All 8 GHI indicators + capture risk analysis</SelectItem>
                <SelectItem value="indicators">Indicators Only — GHI measurement</SelectItem>
                <SelectItem value="capture_risk">Capture Risk — Focused capture detection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* No data state */}
          {!latestAudit && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No previous audit data exists. A new baseline audit will be created.
              </p>
            </div>
          )}
        </div>

        {requestMutation.error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {(requestMutation.error as Error).message}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={requestMutation.isPending}>
            {requestMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Requesting...
              </>
            ) : (
              'Submit Audit Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
