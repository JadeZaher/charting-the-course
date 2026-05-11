import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useSafeguards, useRequestAudit } from '@/hooks/use-governance';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { ShieldCheck, ClipboardList, TrendingUp, TrendingDown, ArrowRight, AlertTriangle } from 'lucide-react';
import type { IndicatorScore } from '@/types/api';

// ---------------------------------------------------------------------------
// GHI indicator definitions
// ---------------------------------------------------------------------------
const GHI_INDICATORS = [
  { id: 'GHI-01', name: 'Proposal Authorship Diversity', healthy: '\u2265 60%', warning: '40\u201359%', critical: '< 40%' },
  { id: 'GHI-02', name: 'Approval Rate by Role', healthy: '\u2265 0.80', warning: '0.50\u20130.79', critical: '< 0.50' },
  { id: 'GHI-03', name: 'Resource Concentration', healthy: '< 30%', warning: '30\u201349%', critical: '\u2265 50%' },
  { id: 'GHI-04', name: 'Participation Trend', healthy: '\u2265 -5%', warning: '-5% to -20%', critical: '< -20%' },
  { id: 'GHI-05', name: 'Leadership Tenure', healthy: '\u2264 2 cycles', warning: '3 cycles', critical: '\u2265 4 cycles' },
  { id: 'GHI-06', name: 'Objection Integration', healthy: '\u2265 70%', warning: '40\u201369%', critical: '< 40%' },
  { id: 'GHI-07', name: 'Review Compliance', healthy: '\u2265 85%', warning: '60\u201384%', critical: '< 60%' },
  { id: 'GHI-08', name: 'Cross-Unit Engagement', healthy: '\u2265 4/qtr', warning: '2\u20133/qtr', critical: '\u2264 1/qtr' },
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
  healthy: 'bg-green-100 text-green-800 border-green-200',
  mixed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  degrading: 'bg-orange-100 text-orange-800 border-orange-200',
  critical: 'bg-red-100 text-red-800 border-red-200',
};

// ---------------------------------------------------------------------------
// IndicatorCard
// ---------------------------------------------------------------------------
function IndicatorCard({ indicator, score }: { indicator: typeof GHI_INDICATORS[number]; score?: IndicatorScore }) {
  const statusColor: Record<string, string> = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  };

  const trendIcon: Record<string, { icon: React.ElementType; color: string }> = {
    improving: { icon: TrendingUp, color: 'text-green-600' },
    stable: { icon: ArrowRight, color: 'text-muted-foreground' },
    degrading: { icon: TrendingDown, color: 'text-red-600' },
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
              <span className="text-2xl font-bold">{score.measured_value ?? '\u2014'}</span>
              {score.trend && trendIcon[score.trend] && (
                <span className={trendIcon[score.trend].color}>
                  {React.createElement(trendIcon[score.trend].icon, { className: 'h-4 w-4' })}
                </span>
              )}
            </div>
            {score.prior_value != null && (
              <p className="text-xs text-muted-foreground">Prior: {score.prior_value}</p>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">No data</p>
        )}
        <div className="mt-2 flex gap-2 text-[10px]">
          <span className="text-green-600">{'\u2713'} {indicator.healthy}</span>
          <span className="text-yellow-600">{'\u26A0'} {indicator.warning}</span>
          <span className="text-red-600">{'\u2717'} {indicator.critical}</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// SafeguardsDashboard
// ---------------------------------------------------------------------------
export default function SafeguardsDashboard() {
  const { data, isLoading, error } = useSafeguards();
  const { selected: selectedEcosystem } = useEcosystem();
  const requestMutation = useRequestAudit();

  const handleRequestAudit = async () => {
    const payload: Record<string, any> = {};
    if (selectedEcosystem) {
      payload.ecosystem_id = selectedEcosystem.id;
    }
    try {
      await requestMutation.mutateAsync(payload);
    } catch {
      // Error handled by mutation state
    }
  };

  if (isLoading) return <LoadingState message="Loading safeguards..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load safeguards</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  const healthScore = data?.health_score ?? 0;
  const latestAudit = data?.latest_audit;
  const recentAudits = data?.recent_audits ?? [];
  const indicatorScores = data?.indicator_scores ?? latestAudit?.indicator_scores ?? [];
  const triggeredSafeguards = data?.triggered_safeguards ?? latestAudit?.triggered_safeguards ?? [];

  // Build a lookup map for indicator scores by id
  const scoreMap = new Map<string, IndicatorScore>();
  if (indicatorScores) {
    for (const s of indicatorScores) {
      scoreMap.set(s.indicator_id, s);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Governance Safeguards</h1>
        <div className="flex gap-2">
          <Link href="/safeguards/audits">
            <Button variant="outline">
              <ClipboardList className="h-4 w-4 mr-2" />
              All Audits
            </Button>
          </Link>
          <Button onClick={handleRequestAudit} disabled={requestMutation.isPending}>
            {requestMutation.isPending ? 'Requesting...' : 'Request Audit'}
          </Button>
        </div>
      </div>

      {requestMutation.error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {(requestMutation.error as Error).message}
        </div>
      )}

      {/* Overall Health Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-4xl font-bold">
                {healthScore}
                <span className="text-lg text-muted-foreground font-normal"> / 100</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden w-48">
                <div
                  className={`h-full rounded-full transition-all ${
                    healthScore >= 80 ? 'bg-green-500' : healthScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${healthScore}%` }}
                />
              </div>
            </div>
            {latestAudit?.overall_health && (
              <Badge className={overallHealthStyle[latestAudit.overall_health] ?? ''} variant="outline">
                {latestAudit.overall_health}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* GHI Indicator Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Governance Health Indicators</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {GHI_INDICATORS.map((indicator) => (
            <IndicatorCard
              key={indicator.id}
              indicator={indicator}
              score={scoreMap.get(indicator.id)}
            />
          ))}
        </div>
      </div>

      {/* Triggered Safeguards Alert */}
      {triggeredSafeguards && triggeredSafeguards.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
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
                    <p className="font-semibold text-yellow-900">
                      {matchedIndicator?.name ?? ts.indicator_id}: {ts.threshold_crossed}
                    </p>
                    <p className="text-yellow-800">{ts.recommended_action}</p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Latest Audit Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Latest Audit</CardTitle>
        </CardHeader>
        <CardContent>
          {latestAudit ? (
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Auditor</dt>
                <dd className="font-medium">{latestAudit.auditor}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Status</dt>
                <dd><Badge variant={statusVariant(latestAudit.status)}>{latestAudit.status}</Badge></dd>
              </div>
              {latestAudit.overall_health && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Overall Health</dt>
                  <dd>
                    <Badge className={overallHealthStyle[latestAudit.overall_health] ?? ''} variant="outline">
                      {latestAudit.overall_health}
                    </Badge>
                  </dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="font-medium">{new Date(latestAudit.created_at).toLocaleDateString()}</dd>
              </div>
              {latestAudit.next_audit_due && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Next Audit Due</dt>
                  <dd className="font-medium">{new Date(latestAudit.next_audit_due).toLocaleDateString()}</dd>
                </div>
              )}
              <Link href={`/safeguards/audits/${latestAudit.id}`}>
                <Button variant="outline" size="sm" className="mt-2 w-full">View Details</Button>
              </Link>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No audits found.</p>
          )}
        </CardContent>
      </Card>

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
                      <Badge variant={statusVariant(audit.status)}>{audit.status}</Badge>
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
                    <TableCell>{new Date(audit.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>{audit.completed_at ? new Date(audit.completed_at).toLocaleDateString() : '-'}</TableCell>
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
