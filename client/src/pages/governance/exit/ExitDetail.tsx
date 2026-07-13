import { useState } from 'react';
import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useExit, useUpdateExitStatus } from '@/hooks/use-governance';
import { ArrowLeft } from 'lucide-react';

const statusVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'default' as const;
    case 'cancelled': return 'outline' as const;
    case 'in_progress': return 'secondary' as const;
    case 'initiated': return 'destructive' as const;
    default: return 'secondary' as const;
  }
};

const TRANSITIONS: Record<string, { label: string; status: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }[]> = {
  initiated: [
    { label: 'Begin Processing', status: 'in_progress', variant: 'secondary' },
    { label: 'Cancel', status: 'cancelled', variant: 'outline' },
  ],
  in_progress: [
    { label: 'Mark Completed', status: 'completed', variant: 'default' },
    { label: 'Cancel', status: 'cancelled', variant: 'outline' },
  ],
};

const TRANSITION_MESSAGES: Record<string, { title: string; description: string }> = {
  in_progress: {
    title: 'Begin processing this exit?',
    description: 'This will start the exit process including commitment unwinding and role reassignment. The member will be notified.',
  },
  cancelled: {
    title: 'Cancel this exit?',
    description: 'The exit process will be stopped and the member will retain their current status. This can be re-initiated later if needed.',
  },
  completed: {
    title: 'Complete this exit?',
    description: 'This will finalize the member\'s departure from the ecosystem. All roles and commitments should have been transferred before completing. This action is difficult to reverse.',
  },
};

export default function ExitDetail() {
  const [, params] = useRoute('/exit/:id');
  const id = params?.id ?? '';
  const { data, isLoading, error } = useExit(id);
  const updateStatusMutation = useUpdateExitStatus(id);
  const [pendingTransition, setPendingTransition] = useState<{ label: string; status: string } | null>(null);

  if (isLoading) return <LoadingState message="Loading exit..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load exit</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/exit">Back to Exits</Link>
        </Button>
      </div>
    );
  }

  const transitions = TRANSITIONS[data.status] || [];

  const handleConfirmTransition = async () => {
    if (!pendingTransition) return;
    try {
      await updateStatusMutation.mutateAsync({ status: pendingTransition.status });
    } catch {
      // Error handled by mutation state
    } finally {
      setPendingTransition(null);
    }
  };

  const transitionMsg = pendingTransition ? TRANSITION_MESSAGES[pendingTransition.status] : null;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/exit">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Exits
        </Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Exit: {data.member_name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
            <span className="text-sm text-muted-foreground">{data.exit_type}</span>
          </div>
        </div>

        {transitions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {transitions.map((t) => (
              <Button
                key={t.status}
                variant={t.variant}
                size="sm"
                onClick={() => setPendingTransition(t)}
                disabled={updateStatusMutation.isPending}
              >
                {t.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Transition confirmation dialog */}
      <AlertDialog open={!!pendingTransition} onOpenChange={(open) => { if (!open) setPendingTransition(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{transitionMsg?.title ?? 'Confirm action'}</AlertDialogTitle>
            <AlertDialogDescription>
              {transitionMsg?.description ?? 'Are you sure you want to proceed?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmTransition}
              className={pendingTransition?.status === 'completed' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {pendingTransition?.label ?? 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {updateStatusMutation.error && (
        <div className="rounded-none border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {(updateStatusMutation.error as Error).message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Member</dt>
              <dd className="font-medium">{data.member_name}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Exit Type</dt>
              <dd className="font-medium">{data.exit_type}</dd>
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
            <div>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="font-medium">{new Date(data.updated_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {data.reason && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reason</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.reason}</div>
          </CardContent>
        </Card>
      )}

      {data.unwinding_tracker && Object.keys(data.unwinding_tracker).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Unwinding Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {Object.entries(data.unwinding_tracker).map(([key, value]) => (
                <div key={key}>
                  <dt className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</dt>
                  <dd className="font-medium">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
