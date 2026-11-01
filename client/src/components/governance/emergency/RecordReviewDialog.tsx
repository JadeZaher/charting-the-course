// Records the post-emergency review (scheduled or complete) during Recovery; the server excludes emergency actors.
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { FieldError } from '@/components/FieldError';
import { useEmergencyReview } from '@/hooks/use-emergency';
import { useRequiredFields } from '@/hooks/use-required-fields';
import { apiErrorMessage } from '@/lib/api-error-message';
import type { EmergencyRecord, EmergencyReview } from '@/types/api';
import { ClipboardCheck } from 'lucide-react';

export function RecordReviewDialog({ emergency }: { emergency: EmergencyRecord }) {
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] = useState<EmergencyReview['outcome']>(
    emergency.post_review_status === 'scheduled' ? 'complete' : 'scheduled',
  );
  const [summary, setSummary] = useState('');
  const review = useEmergencyReview(emergency.id);
  const fields = useRequiredFields({
    summary: outcome === 'complete' ? 'Say briefly what the review found.' : 'Say when and how the review takes place.',
  });

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fields.validate({ summary })) return;
    try {
      await review.mutateAsync({ outcome, summary: summary.trim() });
      setOpen(false);
      setSummary('');
    } catch {
      // rendered below via review.error
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) review.reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ClipboardCheck className="mr-2 h-4 w-4" aria-hidden="true" />
          Record the review
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Record the post-emergency review</DialogTitle>
            <DialogDescription>
              The review checks that the declaration and every decision made during the emergency stayed within scope.
              People who declared, co-signed or ended the emergency do not record it.
            </DialogDescription>
          </DialogHeader>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Where is the review?</legend>
            <RadioGroup value={outcome} onValueChange={(value) => setOutcome(value as EmergencyReview['outcome'])}>
              <div className="flex min-h-[44px] items-center gap-3">
                <RadioGroupItem id="review-scheduled" value="scheduled" disabled={emergency.post_review_status === 'scheduled'} />
                <Label htmlFor="review-scheduled">Scheduled: it has a date and a review group</Label>
              </div>
              <div className="flex min-h-[44px] items-center gap-3">
                <RadioGroupItem id="review-complete" value="complete" />
                <Label htmlFor="review-complete">Complete: it has happened and its findings are shared</Label>
              </div>
            </RadioGroup>
          </fieldset>
          <div className="space-y-2">
            <Label htmlFor="review-summary">{outcome === 'complete' ? 'What the review found' : 'When and how it takes place'}</Label>
            <Textarea
              id="review-summary"
              rows={4}
              value={summary}
              onChange={(event) => { setSummary(event.target.value); fields.settle('summary', event.target.value); }}
              {...fields.field('summary')}
            />
            <FieldError {...fields.error('summary')} />
          </div>
          {review.error && (
            <p role="alert" className="border-2 border-destructive p-3 text-sm text-destructive">{apiErrorMessage(review.error)}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={review.isPending}>
              {review.isPending ? 'Saving…' : outcome === 'complete' ? 'Record as complete' : 'Record as scheduled'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
