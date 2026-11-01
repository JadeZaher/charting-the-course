import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateConflict } from '@/hooks/use-care';
import { useToast } from '@/hooks/use-toast';
import type { ConflictDetail } from '@/types/api';
import { Loader2 } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api-error-message';

type Move = 'in_progress' | 'resolved' | 'closed';

// What each move is called and what it means; "triaged" is done by the triage dialog.
const MOVE_COPY: Record<Move, { label: string; title: string; body: string; confirm: string }> = {
  in_progress: { label: 'Start work', title: 'Start work on this case?', body: 'The case moves to in progress. Use this once the facilitator has begun the process.', confirm: 'Start work' },
  resolved: { label: 'Mark resolved', title: 'Mark this case resolved', body: 'Say how the case ended. The people involved can read this.', confirm: 'Mark resolved' },
  closed: { label: 'Close case', title: 'Close this case?', body: 'A closed case cannot be reopened. Close it only when nothing more is needed, including repair check-ins.', confirm: 'Close case' },
};
const WITHDRAW_COPY = { label: 'Withdraw my report', title: 'Withdraw your report?', body: 'The case is closed and cannot be reopened. Stewards and the people you named can still read it.', confirm: 'Withdraw report' };

interface ConflictStatusActionsProps {
  conflict: ConflictDetail;
}

/** Buttons for the moves the server says the caller may make, each behind a confirmation. */
export function ConflictStatusActions({ conflict }: ConflictStatusActionsProps) {
  const mutation = useUpdateConflict();
  const { toast } = useToast();
  const [pending, setPending] = useState<Move | null>(null);
  const [summary, setSummary] = useState('');

  const moves = conflict.allowed_next.filter((status): status is Move => status !== 'triaged' && status in MOVE_COPY);
  const reporterMayWithdraw = conflict.caller_is_reporter && !conflict.caller_can_triage
    && ['reported', 'triaged', 'in_progress'].includes(conflict.status);
  if (moves.length === 0 && !reporterMayWithdraw) return null;

  const copy = pending ? (reporterMayWithdraw ? WITHDRAW_COPY : MOVE_COPY[pending]) : null;

  const close = () => { setPending(null); setSummary(''); mutation.reset(); };
  const confirm = async () => {
    if (!pending) return;
    const data: Record<string, unknown> = { status: pending };
    if (pending === 'resolved') data.resolution_summary = summary.trim();
    try {
      await mutation.mutateAsync({ id: conflict.id, data });
      toast({ title: pending === 'resolved' ? 'Case marked resolved' : pending === 'closed' ? 'Case closed' : 'Case in progress' });
      close();
    } catch {
      // Shown in the dialog from mutation.error
    }
  };

  return (
    <>
      {reporterMayWithdraw ? (
        <Button variant="outline" size="sm" onClick={() => setPending('closed')}>{WITHDRAW_COPY.label}</Button>
      ) : (
        moves.map((move) => (
          <Button key={move} variant="outline" size="sm" onClick={() => setPending(move)}>{MOVE_COPY[move].label}</Button>
        ))
      )}

      <Dialog open={pending !== null} onOpenChange={(open) => { if (!open) close(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{copy?.title}</DialogTitle>
            <DialogDescription>{copy?.body}</DialogDescription>
          </DialogHeader>
          {pending === 'resolved' && (
            <div className="space-y-2">
              <Label htmlFor="resolution-summary">How was it resolved?</Label>
              <Textarea id="resolution-summary" rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} />
            </div>
          )}
          {mutation.error && (
            <div className="rounded-none border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              {apiErrorMessage(mutation.error)}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={mutation.isPending}>Cancel</Button>
            <Button onClick={confirm} disabled={mutation.isPending || (pending === 'resolved' && !summary.trim())}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {copy?.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
