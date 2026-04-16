import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useAudit } from '@/hooks/use-governance';
import { ArrowLeft } from 'lucide-react';

const statusVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'default' as const;
    case 'in_progress': return 'secondary' as const;
    case 'pending': return 'outline' as const;
    default: return 'secondary' as const;
  }
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
        <Link href="/safeguards/audits">
          <Button variant="outline" className="mt-4">Back to Audits</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/safeguards/audits">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Audits
        </Button>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Governance Audit</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
            <span className="text-sm text-muted-foreground">by {data.auditor}</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Auditor</dt>
              <dd className="font-medium">{data.auditor}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
              </dd>
            </div>
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
          </dl>
        </CardContent>
      </Card>

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

      {data.recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.recommendations}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
