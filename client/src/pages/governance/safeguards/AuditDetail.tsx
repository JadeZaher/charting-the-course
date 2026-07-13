import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useAudit } from '@/hooks/use-governance';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import type { IndicatorScore, TriggeredSafeguard } from '@/types/api';

const statusVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'default' as const;
    case 'in_progress': return 'secondary' as const;
    case 'pending': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

const statusColorClass = (status: string | null) => {
  switch (status) {
    case 'healthy': return 'border-success bg-success/10 text-success';
    case 'warning': return 'border-warning bg-warning/10 text-warning';
    case 'critical': return 'border-destructive bg-destructive/10 text-destructive';
    default: return '';
  }
};

const trendColor = (trend: string) => {
  switch (trend) {
    case 'improving': return 'text-success';
    case 'degrading': return 'text-destructive';
    default: return 'text-muted-foreground';
  }
};

const overallHealthVariant = (health: string | null | undefined) => {
  switch (health) {
    case 'healthy': return 'default' as const;
    case 'mixed': return 'secondary' as const;
    case 'degrading': return 'destructive' as const;
    case 'critical': return 'destructive' as const;
    default: return 'outline' as const;
  }
};

const TRIGGER_TYPE_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  threshold_breach: 'Threshold Breach',
  participant_request: 'Participant Request',
  post_emergency: 'Post-Emergency',
  mass_exit: 'Mass Exit',
};

export default function AuditDetail() {
  const [, params] = useRoute('/safeguards/audits/:id');
  const id = params?.id ?? '';
  const { data, isLoading, error } = useAudit(id);

  if (isLoading) return <LoadingState message="Loading audit..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load audit</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/safeguards/audits">Back to Audits</Link>
        </Button>
      </div>
    );
  }

  const triggerLabel = data.trigger_type
    ? (TRIGGER_TYPE_LABELS[data.trigger_type] ?? data.trigger_type)
    : null;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/safeguards/audits">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Audits
        </Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Governance Audit</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
            {data.overall_health && (
              <Badge variant={overallHealthVariant(data.overall_health)}>
                {data.overall_health}
              </Badge>
            )}
            {triggerLabel && (
              <Badge variant="outline">{triggerLabel}</Badge>
            )}
            {!data.auditor_ids?.length && (
              <span className="text-sm text-muted-foreground">by {data.auditor}</span>
            )}
          </div>
        </div>
      </div>

      {/* Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">
                {data.auditor_ids && data.auditor_ids.length > 1 ? 'Audit Team' : 'Auditor'}
              </dt>
              <dd className="font-medium">
                {data.auditor_ids && data.auditor_ids.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {data.auditor_ids.map((auditorId) => (
                      <Badge key={auditorId} variant="outline" className="text-xs">
                        {auditorId}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  data.auditor
                )}
              </dd>
            </div>

            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="mt-1">
                <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
              </dd>
            </div>

            {data.audit_scope && (
              <div>
                <dt className="text-muted-foreground">Audit Scope</dt>
                <dd className="font-medium">{data.audit_scope}</dd>
              </div>
            )}

            {(data.audit_period_start || data.audit_period_end) && (
              <div>
                <dt className="text-muted-foreground">Audit Period</dt>
                <dd className="font-medium">
                  {data.audit_period_start
                    ? new Date(data.audit_period_start).toLocaleDateString()
                    : '—'}
                  {' – '}
                  {data.audit_period_end
                    ? new Date(data.audit_period_end).toLocaleDateString()
                    : '—'}
                </dd>
              </div>
            )}

            {triggerLabel && (
              <div>
                <dt className="text-muted-foreground">Trigger Type</dt>
                <dd className="font-medium">{triggerLabel}</dd>
              </div>
            )}

            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{new Date(data.created_at).toLocaleDateString()}</dd>
            </div>

            {data.completed_at && (
              <div>
                <dt className="text-muted-foreground">Completed</dt>
                <dd className="font-medium">{new Date(data.completed_at).toLocaleDateString()}</dd>
              </div>
            )}

            {data.next_audit_due && (
              <div>
                <dt className="text-muted-foreground">Next Audit Due</dt>
                <dd className="font-medium">{new Date(data.next_audit_due).toLocaleDateString()}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Indicator Scores */}
      {data.indicator_scores && data.indicator_scores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Governance Health Indicators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.indicator_scores.map((score: IndicatorScore) => (
                <div key={score.indicator_id} className="space-y-2 border border-strong-border p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{score.indicator_id}</span>
                    <Badge className={statusColorClass(score.status)}>{score.status ?? 'N/A'}</Badge>
                  </div>
                  <p className="text-sm font-semibold">{score.indicator_name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold">{score.measured_value ?? '—'}</span>
                    {score.trend && (
                      <span className={trendColor(score.trend)}>
                        {score.trend === 'improving' ? '↑' : score.trend === 'degrading' ? '↓' : '→'}
                      </span>
                    )}
                  </div>
                  {score.prior_value != null && (
                    <p className="text-xs text-muted-foreground">Prior: {score.prior_value}</p>
                  )}
                  {score.notes && (
                    <p className="text-xs text-muted-foreground italic">{score.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Triggered Safeguards */}
      {data.triggered_safeguards && data.triggered_safeguards.length > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Triggered Safeguards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.triggered_safeguards.map((sg: TriggeredSafeguard, i: number) => (
                <div key={i} className="space-y-1 rounded-none border-2 border-strong-border bg-background p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{sg.indicator_id}</Badge>
                    <span className="font-medium">Threshold: {sg.threshold_crossed}</span>
                  </div>
                  <p className="text-sm">{sg.recommended_action}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Findings */}
      {data.findings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Findings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.findings}</div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations — structured list takes priority over raw text */}
      {data.structured_recommendations && data.structured_recommendations.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              {data.structured_recommendations.map((rec: string, i: number) => (
                <li key={i} className="leading-relaxed">{rec}</li>
              ))}
            </ol>
          </CardContent>
        </Card>
      ) : data.recommendations ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.recommendations}</div>
          </CardContent>
        </Card>
      ) : null}

      {/* Next Audit Due banner */}
      {data.next_audit_due && (
        <div className="flex items-center gap-3 border border-info bg-info/10 px-4 py-3 text-sm text-info">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            Next audit due:{' '}
            <strong>{new Date(data.next_audit_due).toLocaleDateString()}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
