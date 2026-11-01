// One button per in-force move (start a review, keep it in force, start its sunset, archive) with the dialog that records it.
// See client/src/AGENTS.md "Maintenance and health (G-Maint)" for the findings and confirmation rules.
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FieldError } from '@/components/FieldError';
import { useChangeAgreementStatus } from '@/hooks/use-health';
import { useRequiredFields } from '@/hooks/use-required-fields';
import { apiErrorMessage } from '@/lib/api-error-message';
import { formatDate } from '@/lib/utils';
import type { AgreementDetail, StatusMove } from '@/types/api';

const MIN_FINDINGS_LENGTH = 8;

/** What the dialog says and asks for, by the status the move lands in. */
function copyFor(move: StatusMove, agreement: AgreementDetail) {
  switch (move.move) {
    case 'under_review':
      return { title: 'Start a review?', body: 'The agreement stays in force while it is reviewed. You will record the findings when you finish.', confirm: 'Start the review', needsFindings: false };
    case 'active':
      return { title: 'Keep this agreement in force', body: 'Write what the review found. It is recorded in the agreement history and sets the next review date.', confirm: 'Keep it in force', needsFindings: true };
    case 'sunset':
      return {
        title: 'Start this agreement’s sunset',
        body: `Write what the review found. ${agreement.sunset_ends_on ? `The agreement ends on ${formatDate(agreement.sunset_ends_on)}.` : 'The agreement ends at the close of the notice period.'}`,
        confirm: 'Start the sunset',
        needsFindings: true,
      };
    case 'archived':
    default: // AgreementDetail only passes REVIEW_MOVES (lib/agreement-moves.ts), so this is the archive move
      return { title: 'Archive this agreement?', body: 'Its sunset has ended. It leaves the active registry and stays readable in the archive.', confirm: 'Archive it', needsFindings: false };
  }
}

export function AgreementReviewDialog({ agreement, move }: { agreement: AgreementDetail; move: StatusMove }) {
  const [open, setOpen] = useState(false);
  const [findings, setFindings] = useState('');
  const [nextReviewDate, setNextReviewDate] = useState(agreement.default_next_review_date ?? '');
  const [understood, setUnderstood] = useState(false);
  const [sunsetUnconfirmed, setSunsetUnconfirmed] = useState(false);
  const mutation = useChangeAgreementStatus(agreement.id);
  const fields = useRequiredFields({ findings: 'Write what the review found (at least a sentence).' });
  const copy = copyFor(move, agreement);
  const isSunset = move.move === 'sunset';
  const isRenew = move.move === 'active';
  const findingsTooShort = copy.needsFindings && findings.trim().length > 0 && findings.trim().length < MIN_FINDINGS_LENGTH;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      mutation.reset();
      setFindings('');
      setNextReviewDate(agreement.default_next_review_date ?? '');
      setUnderstood(false);
      setSunsetUnconfirmed(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (copy.needsFindings && !fields.validate({ findings })) return;
    if (findingsTooShort) return;
    if (isSunset && !understood) {
      setSunsetUnconfirmed(true);
      return;
    }
    try {
      await mutation.mutateAsync({
        status: move.move,
        ...(copy.needsFindings ? { evidence: findings.trim() } : {}),
        ...(isRenew && nextReviewDate ? { next_review_date: nextReviewDate } : {}),
      });
      setOpen(false);
    } catch {
      // rendered below from mutation.error
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={isSunset ? 'destructive' : 'outline'}
        className="min-h-11"
        disabled={!move.ready}
        title={move.blocked ?? undefined}
        onClick={() => handleOpenChange(true)}
      >
        {move.label}
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <DialogHeader>
              <DialogTitle>{copy.title}</DialogTitle>
              <DialogDescription>{copy.body}</DialogDescription>
            </DialogHeader>

            {copy.needsFindings && (
              <div className="space-y-2">
                <Label htmlFor={`findings-${agreement.id}`}>What did the review find? *</Label>
                <Textarea
                  id={`findings-${agreement.id}`}
                  rows={4}
                  value={findings}
                  onChange={(event) => { setFindings(event.target.value); fields.settle('findings', event.target.value); }}
                  {...fields.field('findings')}
                />
                <FieldError {...fields.error('findings')} />
                {findingsTooShort && <p role="alert" className="text-sm text-destructive">Findings need at least {MIN_FINDINGS_LENGTH} characters.</p>}
              </div>
            )}

            {isRenew && (
              <div className="space-y-2">
                <Label htmlFor={`next-review-${agreement.id}`}>Next review date</Label>
                <Input
                  id={`next-review-${agreement.id}`}
                  type="date"
                  value={nextReviewDate}
                  onChange={(event) => setNextReviewDate(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">Prefilled with the usual interval for this kind of agreement. It must be a future date.</p>
              </div>
            )}

            {isSunset && (
              <div className="space-y-2 border-2 border-destructive p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id={`sunset-understood-${agreement.id}`}
                    checked={understood}
                    onCheckedChange={(checked) => { setUnderstood(checked === true); setSunsetUnconfirmed(false); }}
                    className="mt-0.5"
                  />
                  <Label htmlFor={`sunset-understood-${agreement.id}`} className="leading-snug">
                    Sunset is final: it ends on {agreement.sunset_ends_on ? formatDate(agreement.sunset_ends_on) : 'the date shown above'} and cannot be put back in force.
                  </Label>
                </div>
                {sunsetUnconfirmed && <p role="alert" className="text-sm text-destructive">Tick the box to confirm the sunset.</p>}
              </div>
            )}

            {mutation.error && (
              <p role="alert" className="border-2 border-destructive p-3 text-sm text-destructive">{apiErrorMessage(mutation.error)}</p>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" className="min-h-11" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="min-h-11" variant={isSunset ? 'destructive' : 'default'} disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : copy.confirm}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
