// SPECULATIVE: built from S2 patch in flight — verify payload shape at integration
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCompleteRecovery } from '@/hooks/use-governance';
import type { EmergencyStateDetail } from '@/types/api';
import { ShieldCheck, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface CompleteRecoveryDialogProps {
  emergency: EmergencyStateDetail;
  onSuccess?: (data: EmergencyStateDetail) => void;
}

export function CompleteRecoveryDialog({ emergency, onSuccess }: CompleteRecoveryDialogProps) {
  const [open, setOpen] = useState(false);
  const recoveryMutation = useCompleteRecovery();

  const canComplete = emergency.state === 'half_open' && emergency.post_review_status === 'complete';

  const handleComplete = async () => {
    try {
      const result = await recoveryMutation.mutateAsync(emergency.id);
      setOpen(false);
      onSuccess?.(result);
    } catch {
      // Error handled by mutation state
    }
  };

  // Only show when in half_open state
  if (emergency.state !== 'half_open') return null;

  if (!canComplete) {
    return (
      <div className="border border-yellow-300 bg-yellow-50 rounded-md px-4 py-3 text-sm text-yellow-800">
        <div className="flex items-center gap-2 font-semibold mb-1">
          <AlertTriangle className="h-4 w-4" />
          Recovery in Progress
        </div>
        <p>
          Emergency authority has ceased. The post-emergency review must be completed
          before recovery can be finalized. Current review status:{' '}
          <span className="font-medium">{emergency.post_review_status ?? 'not started'}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Recovery ready banner */}
      <div className="border border-green-300 bg-green-50 rounded-md px-4 py-3 text-sm text-green-800">
        <div className="flex items-center gap-2 font-semibold mb-1">
          <CheckCircle className="h-4 w-4" />
          Recovery Review Complete
        </div>
        <p>
          The post-emergency review is complete. You can now finalize the recovery
          to return the circuit breaker to closed state and restore normal governance.
        </p>
      </div>

      {/* Recovery summary card */}
      <div className="text-sm space-y-2 text-muted-foreground">
        <p>The following will happen upon finalization:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>The circuit breaker returns to <strong>closed</strong> state</li>
          <li>Normal governance processes resume fully</li>
          <li>Emergency declarations are archived for audit</li>
          <li>A closure audit note is recorded in the actions log</li>
        </ul>
      </div>

      {recoveryMutation.error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {(recoveryMutation.error as Error).message}
        </div>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="default" className="w-full">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Complete Recovery
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Emergency Recovery?</AlertDialogTitle>
            <AlertDialogDescription>
              This will finalize the recovery process, closing the circuit breaker
              and fully restoring normal governance. This action is permanent and
              will be recorded in the emergency actions log.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete} disabled={recoveryMutation.isPending}>
              {recoveryMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                'Yes, complete recovery'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
