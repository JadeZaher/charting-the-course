import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useEmergency, useResolveEmergency } from '@/hooks/use-governance';
import { ArrowLeft } from 'lucide-react';

export default function EmergencyDetail() {
  const [, params] = useRoute('/emergency/:id');
  const id = params?.id ?? '';
  const { data, isLoading, error } = useEmergency(id);
  const resolveMutation = useResolveEmergency();

  if (isLoading) return <LoadingState message="Loading emergency..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load emergency</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Link href="/emergency">
          <Button variant="outline" className="mt-4">Back to Emergency</Button>
        </Link>
      </div>
    );
  }

  const handleResolve = async () => {
    try {
      await resolveMutation.mutateAsync(id);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/emergency">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Emergency
        </Button>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Emergency Declaration</h1>
          <Badge variant={data.state === 'open' ? 'destructive' : 'default'}>
            {data.state === 'open' ? 'Active' : 'Resolved'}
          </Badge>
        </div>

        {data.state === 'open' && (
          <Button
            variant="default"
            onClick={handleResolve}
            disabled={resolveMutation.isPending}
          >
            {resolveMutation.isPending ? 'Resolving...' : 'Resolve Emergency'}
          </Button>
        )}
      </div>

      {resolveMutation.error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {(resolveMutation.error as Error).message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Declared By</dt>
              <dd className="font-medium">{data.declared_by ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Declared At</dt>
              <dd className="font-medium">{data.declared_at ? new Date(data.declared_at).toLocaleString() : 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Auto-Revert At</dt>
              <dd className="font-medium">{data.auto_revert_at ? new Date(data.auto_revert_at).toLocaleString() : 'N/A'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                <Badge variant={data.state === 'open' ? 'destructive' : 'default'}>
                  {data.state === 'open' ? 'Active' : 'Resolved'}
                </Badge>
              </dd>
            </div>
            {data.closed_at && (
              <div>
                <dt className="text-muted-foreground">Closed At</dt>
                <dd className="font-medium">{new Date(data.closed_at).toLocaleString()}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Reason</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.notes ?? 'No reason provided'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
