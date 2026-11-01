import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useSafeguards } from '@/hooks/use-care';
import { useHealthSnapshot } from '@/hooks/use-health';
import { GovernanceHealthAuditForm } from '@/components/governance/safeguards/GovernanceHealthAuditForm';
import { ShieldCheck, ClipboardList, TrendingUp, TrendingDown, ArrowRight, AlertTriangle } from 'lucide-react';
import type { EcosystemHealth, IndicatorScore } from '@/types/api';
import { apiErrorMessage } from '@/lib/api-error-message';
import { auditDueText, bandLabel, formatMeasured, scoreText, trendLabel } from '@/lib/health';
import { formatDate } from '@/lib/utils';

// ---------------------------------------------------------------------------
// GHI indicator definitions
// ---------------------------------------------------------------------------
const GHI_INDICATORS = [
  { id: 'GHI-01', name: 'Proposal Authorship Diversity', healthy: '≥ 60%', warning: '40–59%', critical: '< 40%' },
  { id: 'GHI-02', name: 'Approval Rate by Role', healthy: '≥ 0.80', warning: '0.50–0.79', critical: '< 0.50' },
  { id: 'GHI-03', name: 'Resource Concentration', healthy: '< 30%', warning: '30–49%', critical: '≥ 50%' },
  { id: 'GHI-04', name: 'Participation Trend', healthy: '≥ -5%', warning: '-5% to -20%', critical: '< -20%' },
  { id: 'GHI-05', name: 'Leadership Tenure', healthy: '≤ 2 cycles', warning: '3 cycles', critical: '≥ 4 cycles' },
  { id: 'GHI-06', name: 'Objection Integration', healthy: '≥ 70%', warning: '40–69%', critical: '< 40%' },
  { id: 'GHI-07', name: 'Review Compliance', healthy: '≥ 85%', warning: '60–84%', critical: '< 60%' },
  { id: 'GHI-08', name: 'Cross-Unit Engagement', healthy: '≥ 4/qtr', warning: '2–3/qtr', critical: '≤ 1/qtr' },
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const statusVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'default' as const;
    case 'in_progress': return 'secondary' as const;
    case 'pending': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

const overallHealthStyle: Record<string, string> = {
  healthy: 'border-success bg-success/10 text-success',
  mixed: 'border-warning bg-warning/10 text-warning',
  degrading: 'border-warning bg-warning/10 text-warning',
  critical: 'border-destructive bg-destructive/10 text-destructive',
};

// ---------------------------------------------------------------------------
// IndicatorCard: the last published value of one indicator
// ---------------------------------------------------------------------------
function IndicatorCard({ indicator, score }: { indicator: typeof GHI_INDICATORS[number]; score?: IndicatorScore }) {
  const statusColor: Record<string, string> = {
    healthy: 'border-success bg-success/10 text-success',
    warning: 'border-warning bg-warning/10 text-warning',
    critical: 'border-destructive bg-destructive/10 text-destructive',
  };

  const trendIcon: Record<string, { icon: React.ElementType; color: string }> = {
    improving: { icon: TrendingUp, color: 'text-success' },
    stable: { icon: ArrowRight, color: 'text-muted-foreground' },
    degrading: { icon: TrendingDown, color: 'text-destructive' },
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{indicator.id}</p>
            <p className="text-sm font-semibold">{indicator.name}</p>
          </div>
          {score?.status && (
            <Badge className={statusColor[score.status] ?? ''} variant="outline">
              {score.status}
            </Badge>
          )}
        </div>
        {score ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{formatMeasured(score.measured_value, score.unit)}</span>
              {score.trend && trendIcon[score.trend] && (
                <span className={trendIcon[score.trend].color} title={trendLabel(score.trend)}>
                  {React.createElement(trendIcon[score.trend].icon, { className: 'h-4 w-4', 'aria-label': trendLabel(score.trend) })}
                </span>
              )}
            </div>
            {score.prior_value != null && (
              <p className="text-xs text-muted-foreground">Prior: {formatMeasured(score.prior_value, score.unit)}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">No data</p>
        )}
        <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
          <span className="text-success">{'✓'} {indicator.healthy}</span>
          <span className="text-warning">{'⚠'} {indicator.warning}</span>
          <span className="text-destructive">{'✗'} {indicator.critical}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// EcosystemHealthCard: one ecosystem's published score, due date and critical count
// ---------------------------------------------------------------------------
function EcosystemHealthCard({ health, onRecord }: { health: EcosystemHealth; onRecord: () => void }) {
  const score = health.latest_audit?.overall_health_score ?? null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          {health.ecosystem}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {health.latest_audit && health.published_on ? (
          <div>
            <p className="text-4xl font-bold">
              {scoreText(score)}
              {score != null && <span className="text-lg text-muted-foreground font-normal"> / 100</span>}
            </p>
            <p className="text-muted-foreground">as of {formatDate(health.published_on)}</p>
            {health.latest_audit.self_assessment && <Badge variant="outline" className="mt-1">Self-assessment</Badge>}
          </div>
        ) : (
          <p className="text-muted-foreground">No published audit yet.</p>
        )}
        <p className={health.audit_overdue ? 'font-semibold text-destructive' : 'text-muted-foreground'}>
          {auditDueText(health.audit_due, health.audit_overdue, formatDate)}
        </p>
        {health.critical_count > 0 && (
          <p className="flex items-center gap-2 font-medium text-destructive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            {health.critical_count} critical indicator{health.critical_count === 1 ? '' : 's'}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {health.latest_audit && (
            <Button asChild variant="outline" size="sm" className="min-h-11">
              <Link href={`/safeguards/audits/${health.latest_audit.id}`}>View the latest audit</Link>
            </Button>
          )}
          {health.caller_can_record_audit && (
            <Button size="sm" className="min-h-11" onClick={onRecord}>Record an audit</Button>
          )}
        </div>
        {health.caller_can_record_audit && health.caller_records_self_assessment && (
          <p className="text-xs text-muted-foreground">This will be a self-assessment: nobody outside the stewards can record it.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// ComputedValues: indicator values worked out from the records, plus what needs attention
// ---------------------------------------------------------------------------
function ComputedValues({ ecosystemId }: { ecosystemId: string }) {
  const snapshot = useHealthSnapshot({ ecosystem_id: ecosystemId });
  if (snapshot.isLoading) return <p className="text-sm text-muted-foreground">Working out the current values{'…'}</p>;
  if (snapshot.isError || !snapshot.data) {
    return <p role="alert" className="text-sm text-destructive">We couldn{'’'}t work out the current values. {apiErrorMessage(snapshot.error)}</p>;
  }
  const { indicators, attention, period } = snapshot.data;
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Worked out from the records for {formatDate(period.start)} to {formatDate(period.end)}. The framework band is a reference: whoever audits still rates each indicator.
      </p>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {indicators.map((indicator) => (
          <li key={indicator.indicator_id} className="border-2 border-strong-border p-3 text-sm">
            <p className="text-xs font-medium text-muted-foreground">{indicator.indicator_id}</p>
            <p className="font-semibold">{indicator.name}</p>
            {indicator.computable ? (
              <>
                <p className="mt-1 text-xl font-bold">
                  {formatMeasured(indicator.measured_value, indicator.unit)}
                  {indicator.band && <span className="ml-2 text-sm font-medium">{bandLabel(indicator.band)}</span>}
                </p>
                <p className="text-xs text-muted-foreground">{indicator.basis}</p>
                {indicator.detail && <p className="text-xs text-muted-foreground">{indicator.detail}</p>}
              </>
            ) : (
              <p className="mt-1 text-muted-foreground">Not computable yet</p>
            )}
          </li>
        ))}
      </ul>
      {attention.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">Needs attention</h3>
          <ul className="mt-2 space-y-1 text-sm">
            {attention.map((item) => (
              <li key={item.key}>
                <Link href={item.link} className="inline-flex min-h-11 items-center underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {item.count} {item.label}
                </Link>
                {item.detail && <span className="text-muted-foreground"> {'—'} {item.detail}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SafeguardsDashboard
// ---------------------------------------------------------------------------
export default function SafeguardsDashboard() {
  const { data, isLoading, error } = useSafeguards();
  const [recordingFor, setRecordingFor] = useState<EcosystemHealth | null>(null);
  const [chosenId, setChosenId] = useState<string | null>(null);

  if (isLoading) return <LoadingState message="Loading safeguards..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load safeguards</p>
        <p className="text-sm text-muted-foreground mt-1">{apiErrorMessage(error)}</p>
      </div>
    );
  }

  const ecosystems = data?.ecosystems ?? [];
  const chosen = ecosystems.find((eco) => eco.ecosystem_id === chosenId) ?? ecosystems[0];
  const recentAudits = data?.recent_audits ?? [];
  const latestAudit = chosen?.latest_audit ?? null;
  const triggeredSafeguards = latestAudit?.triggered_safeguards ?? [];
  const scoreMap = new Map<string, IndicatorScore>((latestAudit?.indicator_scores ?? []).map((score) => [score.indicator_id, score]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">Governance Safeguards</h1>
        <Button asChild variant="outline" className="min-h-11">
          <Link href="/safeguards/audits">
            <ClipboardList className="h-4 w-4 mr-2" />
            All Audits
          </Link>
        </Button>
      </div>

      <GovernanceHealthAuditForm
        open={recordingFor !== null}
        onOpenChange={(open) => { if (!open) setRecordingFor(null); }}
        ecosystemId={recordingFor?.ecosystem_id}
        selfAssessment={recordingFor?.caller_records_self_assessment}
      />

      {ecosystems.length === 0 ? (
        <p className="text-sm text-muted-foreground">You are not an active member of an ecosystem yet, so there is no health result to show.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {ecosystems.map((health) => (
            <EcosystemHealthCard key={health.ecosystem_id} health={health} onRecord={() => setRecordingFor(health)} />
          ))}
        </div>
      )}

      {chosen && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Current values{ecosystems.length === 1 ? ` in ${chosen.ecosystem}` : ''}</CardTitle>
            {ecosystems.length > 1 && (
              <div className="max-w-xs space-y-1">
                <Label htmlFor="snapshot-ecosystem" className="text-sm">Ecosystem</Label>
                <Select value={chosen.ecosystem_id} onValueChange={setChosenId}>
                  <SelectTrigger id="snapshot-ecosystem" className="min-h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ecosystems.map((eco) => <SelectItem key={eco.ecosystem_id} value={eco.ecosystem_id}>{eco.ecosystem}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <ComputedValues ecosystemId={chosen.ecosystem_id} />
          </CardContent>
        </Card>
      )}

      {/* GHI Indicator Cards: last published values */}
      {chosen && (
        <div>
          <h2 className="text-lg font-semibold">Last published indicators</h2>
          <p className="text-sm text-muted-foreground mb-3">
            {latestAudit && chosen.published_on
              ? `${chosen.ecosystem}, as published on ${formatDate(chosen.published_on)}. Values are frozen at publishing.`
              : `${chosen.ecosystem} has no published audit yet.`}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GHI_INDICATORS.map((indicator) => (
              <IndicatorCard key={indicator.id} indicator={indicator} score={scoreMap.get(indicator.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Triggered Safeguards Alert */}
      {triggeredSafeguards.length > 0 && (
        <Card className="border-warning bg-warning/10 text-warning">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5" />
              Triggered Safeguards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {triggeredSafeguards.map((ts) => {
                const matchedIndicator = GHI_INDICATORS.find((i) => i.id === ts.indicator_id);
                return (
                  <li key={ts.trigger_id} className="text-sm">
                    <p className="font-semibold">
                      {matchedIndicator?.name ?? ts.indicator_id}: {ts.threshold_crossed}
                    </p>
                    <p>{ts.recommended_action}</p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Recent Audits Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Audits</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Auditor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAudits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No recent audits
                  </TableCell>
                </TableRow>
              ) : (
                recentAudits.map((audit) => (
                  <TableRow key={audit.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link href={`/safeguards/audits/${audit.id}`} className="hover:underline">
                        {audit.auditor}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(audit.status)}>{audit.status === 'draft' ? 'draft (not published)' : audit.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {audit.overall_health ? (
                        <Badge className={overallHealthStyle[audit.overall_health] ?? ''} variant="outline">
                          {audit.overall_health}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(audit.created_at)}</TableCell>
                    <TableCell>{audit.completed_at ? formatDate(audit.completed_at) : '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
