import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useSafeguards, useRequestAudit } from '@/hooks/use-governance';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { ShieldCheck, ClipboardList } from 'lucide-react';

const statusVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'default' as const;
    case 'in_progress': return 'secondary' as const;
    case 'pending': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Safeguards</h1>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {healthScore}
              <span className="text-lg text-muted-foreground font-normal"> / 100</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  healthScore >= 80 ? 'bg-green-500' : healthScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

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
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Date</dt>
                  <dd className="font-medium">{new Date(latestAudit.created_at).toLocaleDateString()}</dd>
                </div>
                <Link href={`/safeguards/audits/${latestAudit.id}`}>
                  <Button variant="outline" size="sm" className="mt-2 w-full">View Details</Button>
                </Link>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No audits found.</p>
            )}
          </CardContent>
        </Card>
      </div>

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
                <TableHead>Created</TableHead>
                <TableHead>Completed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAudits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
