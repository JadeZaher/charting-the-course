// Closes Recovery (half_open -> closed) once the review is complete; only a steward is offered it.
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useCloseRecovery } from '@/hooks/use-emergency';
import type { EmergencyRecord } from '@/types/api';
import { ShieldCheck } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api-error-message';

export function CompleteRecoveryDialog({ emergency }: { emergency: EmergencyRecord }) {
  const [open, setOpen] = useState(false);
  const closeRecovery = useCloseRecovery(emergency.id);

  if (emergency.phase !== 'recovery' || emergency.post_review_status !== 'complete') return null;
  if (!emergency.caller_can_complete_recovery) {
    return <p className="text-sm text-muted-foreground">The review is complete. A steward of this ecosystem closes Recovery.</p>;
  }

  const handleComplete = async (event: React.MouseEvent) => {
    event.preventDefault(); // keep the dialog open until the server answers
    try {
      await closeRecovery.mutateAsync();
      setOpen(false);
    } catch {
      // rendered below via closeRecovery.error
    }
  };

  return (
    <div className="space-y-3">
      {closeRecovery.error && (
        <p role="alert" className="border-2 border-destructive p-3 text-sm text-destructive">{apiErrorMessage(closeRecovery.error)}</p>
      )}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button>
            <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
            Close Recovery
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Recovery?</AlertDialogTitle>
            <AlertDialogDescription>
              The emergency ends for good and normal governance is fully restored. The declaration, the review and
              this step stay in the activity log. This cannot be undone; a new emergency needs a new declaration.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete} disabled={closeRecovery.isPending}>
              {closeRecovery.isPending ? 'Closing…' : 'Yes, close Recovery'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
