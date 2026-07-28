import { useMemo } from 'react';
import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useDecision, useDomains } from '@/hooks/use-governance';
import { ArrowLeft } from 'lucide-react';

const statusVariant = (status: string) => {
  switch (status) {
    case 'recorded': return 'default' as const;
    case 'superseded': return 'secondary' as const;
    case 'archived': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

const humanize = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// related_records keys naming known governance entities get an outline chip (no href — untyped data)
const ENTITY_KEY = /proposal|agreement|share|need|domain|ecosystem/i;

/** Structured renderer for untyped related_records values — never raw JSON. */
function RecordValue({ value, depth = 0 }: { value: unknown; depth?: number }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>;
  if (typeof value === 'string' || typeof value === 'number') return <span>{String(value)}</span>;
  if (typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>;
  if (depth >= 2) return <span className="text-muted-foreground">…</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">None</span>;
    return (
      <ul className="list-disc space-y-1 pl-5">
        {value.map((item, i) => (
          <li key={i}><RecordValue value={item} depth={depth + 1} /></li>
        ))}
      </ul>
    );
  }
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return <span className="text-muted-foreground">-</span>;
  return (
    <dl className="space-y-1">
      {entries.map(([k, v]) => (
        <div key={k} className="flex flex-wrap gap-x-2">
          <dt className="text-muted-foreground">{humanize(k)}:</dt>
          <dd><RecordValue value={v} depth={depth + 1} /></dd>
        </div>
      ))}
    </dl>
  );
}

export default function DecisionDetail() {
  const [, params] = useRoute('/decisions/:id');
  const id = params?.id ?? '';
  const { data, isLoading, error } = useDecision(id);
  const { data: domainsData } = useDomains({ per_page: '100' });

  // Resolve the free-text domain string to a typed domain record (domain_id, case-insensitive).
  // Prefer a same-ecosystem match; fall back to a globally unique match only.
  const domainMatch = useMemo(() => {
    if (!data?.domain) return null;
    const needle = data.domain.trim().toLowerCase();
    const candidates = (domainsData?.items ?? []).filter((d) => d.domain_id.toLowerCase() === needle);
    return candidates.find((d) => d.ecosystem_id === data.ecosystem_id) ?? (candidates.length === 1 ? candidates[0] : null);
  }, [data?.domain, data?.ecosystem_id, domainsData]);

  if (isLoading) return <LoadingState message="Loading decision..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load decision</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/decisions">Back to Decisions</Link>
        </Button>
      </div>
    );
  }

  const relatedRecords = Object.entries(data.related_records ?? {});
  const hasLinkedContext = Boolean(data.domain) || Boolean(data.artifact_reference) || relatedRecords.length > 0;

  // Plain metadata line, e.g. "Layer 2 · Domain precedent"
  const metaParts: string[] = [];
  if (data.source_layer !== null && data.source_layer !== undefined) metaParts.push(`Layer ${data.source_layer}`);
  if (data.precedent_level) metaParts.push(humanize(data.precedent_level));
  const metaLine = metaParts.join(' · ');

  const chipClass = 'inline-flex min-h-11 items-center border-2 border-control-border px-3 text-sm font-medium';
  const chipLinkClass = `${chipClass} transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none`;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/decisions">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Decisions
        </Link>
      </Button>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{data.record_id}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
          <span className="text-sm text-muted-foreground">
            {data.date ? `Decided ${new Date(data.date).toLocaleDateString()}` : 'Date not recorded'}
          </span>
        </div>
        {metaLine && <p className="text-sm text-muted-foreground">{metaLine}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Decision</CardTitle>
          <p className="text-xs text-muted-foreground">what was decided</p>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.holding}</div>
        </CardContent>
      </Card>

      {data.ratio_decidendi && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reasoning</CardTitle>
            <p className="text-xs text-muted-foreground">why it was decided</p>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.ratio_decidendi}</div>
          </CardContent>
        </Card>
      )}

      {data.obiter_dicta && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional context</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.obiter_dicta}</div>
          </CardContent>
        </Card>
      )}

      {data.deliberation_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deliberation summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.deliberation_summary}</div>
          </CardContent>
        </Card>
      )}

      {hasLinkedContext && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Linked context</CardTitle>
            <p className="text-xs text-muted-foreground">what this receipt is tied to</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.domain && (
              <div>
                <p className="text-xs text-muted-foreground">Domain</p>
                <div className="mt-1">
                  {domainMatch ? (
                    <Link href={`/domains/${domainMatch.id}`} className={chipLinkClass} aria-label={`View domain: ${data.domain}`}>
                      {data.domain}
                    </Link>
                  ) : (
                    <span className={chipClass}>{data.domain}</span>
                  )}
                </div>
              </div>
            )}

            {data.artifact_reference && (
              <div>
                <p className="text-xs text-muted-foreground">Artifact</p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm font-medium">
                  {data.artifact_reference}
                  {data.artifact_type && <Badge variant="outline">{humanize(data.artifact_type)}</Badge>}
                </p>
              </div>
            )}

            {relatedRecords.length > 0 && (
              <dl className="space-y-3 border-t border-border pt-4">
                {relatedRecords.map(([key, value]) => (
                  <div key={key}>
                    <dt>
                      {ENTITY_KEY.test(key) ? (
                        <Badge variant="outline">{humanize(key)}</Badge>
                      ) : (
                        <span className="text-sm font-medium">{humanize(key)}</span>
                      )}
                    </dt>
                    <dd className="mt-1 text-sm"><RecordValue value={value} /></dd>
                  </div>
                ))}
              </dl>
            )}

            <p className="border-t border-border pt-3 text-xs text-muted-foreground">
              Direct links to source proposals and resulting agreements, shares, and needs arrive with the receipt schema (H1).
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Record details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Date decided</dt>
              <dd className="font-medium">{data.date ? new Date(data.date).toLocaleDateString() : '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Domain</dt>
              <dd className="font-medium">{data.domain || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Source layer</dt>
              <dd className="font-medium">{data.source_layer ?? '-'}</dd>
            </div>
            {data.precedent_level && (
              <div>
                <dt className="text-muted-foreground">Precedent level</dt>
                <dd className="font-medium">{humanize(data.precedent_level)}</dd>
              </div>
            )}
            {data.recorder && (
              <div>
                <dt className="text-muted-foreground">Recorded by</dt>
                <dd className="font-medium">{data.recorder}{data.recorder_role ? ` (${data.recorder_role})` : ''}</dd>
              </div>
            )}
            {data.review_date && (
              <div>
                <dt className="text-muted-foreground">Review date</dt>
                <dd className="font-medium">{new Date(data.review_date).toLocaleDateString()}</dd>
              </div>
            )}
            {data.superseded_by && (
              <div>
                <dt className="text-muted-foreground">Superseded by</dt>
                <dd className="font-medium">{data.superseded_by}</dd>
              </div>
            )}
            {data.overruled_by && (
              <div>
                <dt className="text-muted-foreground">Overruled by</dt>
                <dd className="font-medium">{data.overruled_by}</dd>
              </div>
            )}
            {data.verification_by && (
              <div>
                <dt className="text-muted-foreground">Verified by</dt>
                <dd className="font-medium">
                  {data.verification_by}
                  {data.verification_date ? ` on ${new Date(data.verification_date).toLocaleDateString()}` : ''}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-muted-foreground">Record created</dt>
              <dd className="font-medium">{new Date(data.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
