import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useUpdateRepairAgreement } from '@/hooks/use-governance';
import type { RepairAgreement } from '@/types/api';
import { CalendarCheck, CheckCircle2, Loader2, Clock } from 'lucide-react';

type CheckinMilestone = '30' | '60' | '90';

interface RepairCheckinModalProps {
  repairAgreement: RepairAgreement;
  conflictId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (data: RepairAgreement) => void;
}

const MILESTONE_DATES: Record<CheckinMilestone, { key: keyof RepairAgreement; notesKey: keyof RepairAgreement; label: string }> = {
  '30': { key: 'checkin_30_date', notesKey: 'checkin_30_notes', label: '30-Day Check-in' },
  '60': { key: 'checkin_60_date', notesKey: 'checkin_60_notes', label: '60-Day Check-in' },
  '90': { key: 'checkin_90_date', notesKey: 'checkin_90_notes', label: '90-Day Check-in' },
};

export function RepairCheckinModal({ repairAgreement, conflictId, open, onOpenChange, onSuccess }: RepairCheckinModalProps) {
  const updateMutation = useUpdateRepairAgreement(conflictId);

  const [notes30, setNotes30] = useState(repairAgreement.checkin_30_notes ?? '');
  const [notes60, setNotes60] = useState(repairAgreement.checkin_60_notes ?? '');
  const [notes90, setNotes90] = useState(repairAgreement.checkin_90_notes ?? '');
  const [markComplete, setMarkComplete] = useState(false);

  const getDateDisplay = (dateKey: keyof RepairAgreement): string => {
    const val = repairAgreement[dateKey];
    if (!val) return 'Not scheduled';
    return new Date(val).toLocaleDateString();
  };

  const isComplete = repairAgreement.status === 'fulfilled' || repairAgreement.status === 'completed';

  const hasChanges =
    notes30 !== (repairAgreement.checkin_30_notes ?? '') ||
    notes60 !== (repairAgreement.checkin_60_notes ?? '') ||
    notes90 !== (repairAgreement.checkin_90_notes ?? '') ||
    markComplete;

  const handleSubmit = async () => {
    const data: Record<string, any> = {};
    if (notes30 !== (repairAgreement.checkin_30_notes ?? '')) data.checkin_30_notes = notes30;
    if (notes60 !== (repairAgreement.checkin_60_notes ?? '')) data.checkin_60_notes = notes60;
    if (notes90 !== (repairAgreement.checkin_90_notes ?? '')) data.checkin_90_notes = notes90;
    if (markComplete) {
      data.status = 'fulfilled';
      data.completed_date = new Date().toISOString().split('T')[0];
    }

    try {
      const result = await updateMutation.mutateAsync({
        repairId: repairAgreement.id,
        data,
      });
      onSuccess?.(result);
      onOpenChange(false);
    } catch {
      // Error handled by mutation state
    }
  };

  const checkinFields: Array<{ milestone: CheckinMilestone; notes: string; setNotes: (v: string) => void }> = [
    { milestone: '30', notes: notes30, setNotes: setNotes30 },
    { milestone: '60', notes: notes60, setNotes: setNotes60 },
    { milestone: '90', notes: notes90, setNotes: setNotes90 },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" />
            Repair Check-in
          </DialogTitle>
          <DialogDescription>
            Record progress notes for the {repairAgreement.title} repair agreement.
            Track the 30/60/90-day check-in milestones.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Status banner */}
          {isComplete ? (
            <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 border border-green-200 text-green-800 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Completed {repairAgreement.completed_date ? new Date(repairAgreement.completed_date).toLocaleDateString() : ''}
            </div>
          ) : null}

          {/* Check-in milestone fields */}
          {checkinFields.map(({ milestone, notes, setNotes }) => {
            const info = MILESTONE_DATES[milestone];
            const dateDisplay = getDateDisplay(info.key);
            const hasDate = !!repairAgreement[info.key];

            return (
              <div key={milestone} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">{info.label}</Label>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {dateDisplay}
                  </span>
                </div>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={`Notes for ${info.label.toLowerCase()}...`}
                  rows={2}
                  disabled={isComplete}
                  className="text-sm"
                />
              </div>
            );
          })}

          {/* Mark as complete */}
          {!isComplete && (
            <div className="flex items-center gap-3 pt-2 border-t">
              <Checkbox
                id="mark-complete"
                checked={markComplete}
                onCheckedChange={(c) => setMarkComplete(!!c)}
              />
              <Label htmlFor="mark-complete" className="text-sm">
                Mark repair agreement as fulfilled
              </Label>
            </div>
          )}
        </div>

        {updateMutation.error && (
          <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
            {(updateMutation.error as Error).message}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updateMutation.isPending || (!hasChanges && !markComplete) || isComplete}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Check-in'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
