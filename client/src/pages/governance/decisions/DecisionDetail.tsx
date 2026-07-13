import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useDecision } from '@/hooks/use-governance';
import { ArrowLeft } from 'lucide-react';

const statusVariant = (status: string) => {
  switch (status) {
    case 'recorded': return 'default' as const;
    case 'superseded': return 'secondary' as const;
    case 'archived': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

export default function DecisionDetail() {
  const [, params] = useRoute('/decisions/:id');
  const id = params?.id ?? '';
  const { data, isLoading, error } = useDecision(id);

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
          {data.domain && <Badge variant="outline">{data.domain}</Badge>}
          {data.source_layer && <span className="text-sm text-muted-foreground">Layer: {data.source_layer}</span>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Holding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.holding}</div>
        </CardContent>
      </Card>

      {data.ratio_decidendi && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ratio Decidendi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.ratio_decidendi}</div>
          </CardContent>
        </Card>
      )}

      {data.obiter_dicta && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Obiter Dicta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.obiter_dicta}</div>
          </CardContent>
        </Card>
      )}

      {data.deliberation_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Deliberation Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.deliberation_summary}</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Date</dt>
              <dd className="font-medium">{data.date ? new Date(data.date).toLocaleDateString() : '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Domain</dt>
              <dd className="font-medium">{data.domain || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Source Layer</dt>
              <dd className="font-medium">{data.source_layer || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{new Date(data.created_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {relatedRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Related Records</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {relatedRecords.map(([label, value]) => (
                <li key={label} className="text-sm border-l-2 border-muted pl-3">
                  <span className="font-medium">{label}</span>
                  <p className="text-muted-foreground mt-1">
                    {typeof value === 'string' ? value : JSON.stringify(value)}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data.artifact_reference && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Artifact Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-l-2 border-muted pl-3 text-sm">
              <span className="font-medium">{data.artifact_reference}</span>
              {data.artifact_type && <Badge variant="outline" className="ml-2">{data.artifact_type}</Badge>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
