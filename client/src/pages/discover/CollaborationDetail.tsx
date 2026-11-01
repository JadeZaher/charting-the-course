import { useRef, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { ArrowLeft, ArrowRight, Calendar, Clock, FileText, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { FieldError } from '@/components/FieldError';
import { QueryState } from '@/components/QueryState';
import { useApproveCollaboration, useCollaboration, useEndCollaboration, useReviewCollaboration } from '@/hooks/use-discover';
import { useRequiredFields } from '@/hooks/use-required-fields';
import { apiErrorMessage } from '@/lib/api-error-message';
import { END_OUTCOME_LABELS, formErrorView, POST_TYPE_LABELS, postHref, postStatusLabel, waitingOnText } from '@/lib/exchange';
import type { CollaborationDetailView, CollaborationEndOutcome } from '@/types/api';

const statusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'proposed': return 'secondary' as const;
    case 'completed': return 'outline' as const;
    case 'dissolved': return 'destructive' as const;
    default: return 'secondary' as const;
  }
};

function formatDate(value: string | null): string {
  if (!value) return 'Not set';
  // A date-only value is a calendar day: read at local noon so time zones west of UTC do not show the day before.
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** One button per side the caller may approve for; each failure shows once, under the buttons. */
function ApproveButtons({ collab, onDone }: { collab: CollaborationDetailView; onDone: () => void }) {
  const approve = useApproveCollaboration(collab.id);
  if (collab.status !== 'proposed' || collab.caller_can_approve_for.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {collab.caller_can_approve_for.map((side) => {
          const pending = approve.isPending && approve.variables === side.ecosystem_id;
          return (
            <Button
              key={side.ecosystem_id}
              type="button"
              size="sm"
              disabled={approve.isPending}
              onClick={() => approve.mutate(side.ecosystem_id, { onSuccess: onDone })}
            >
              {pending ? 'Approving…' : `Approve for ${side.ecosystem_name ?? 'your ecosystem'}`}
            </Button>
          );
        })}
      </div>
      {approve.error && (
        <p role="alert" className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{apiErrorMessage(approve.error)}</p>
      )}
    </div>
  );
}

/** Ending (or, while proposed, withdrawing/declining) with a required reason; the outcome list is the server's. */
function EndDialog({ collab, onDone }: { collab: CollaborationDetailView; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const outcomes = collab.end_outcomes.filter((outcome) => Object.prototype.hasOwnProperty.call(END_OUTCOME_LABELS, outcome));
  const [outcome, setOutcome] = useState<CollaborationEndOutcome | ''>('');
  const [reason, setReason] = useState('');
  const end = useEndCollaboration(collab.id);
  const fields = useRequiredFields({ outcome: 'Choose how it ends.', reason: 'Give a reason. Both ecosystems will read it.' });
  const proposed = collab.status === 'proposed';
  if (!collab.caller_can_end || outcomes.length === 0) return null;

  const changeOpen = (next: boolean) => {
    if (end.isPending) return;
    setOpen(next);
    if (next) {
      setOutcome(outcomes.length === 1 ? outcomes[0] : '');
      setReason('');
      end.reset();
    }
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!fields.validate({ outcome, reason })) return;
    if (!outcome) return;
    end.mutate({ outcome, reason: reason.trim() }, { onSuccess: () => { setOpen(false); onDone(); } });
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline">{proposed ? 'Withdraw or decline' : 'End collaboration'}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>{proposed ? `Withdraw or decline “${collab.title}”?` : `End “${collab.title}”?`}</DialogTitle>
            <DialogDescription>
              This cannot be undone. Both ecosystems see who ended it and why. To work together again, propose a new collaboration.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="end-outcome">How does it end?</Label>
            <Select
              value={outcome}
              onValueChange={(value) => { setOutcome(value as CollaborationEndOutcome); fields.settle('outcome', value); }}
            >
              <SelectTrigger id="end-outcome" {...fields.field('outcome')}><SelectValue placeholder="Choose an outcome" /></SelectTrigger>
              <SelectContent>
                {outcomes.map((value) => <SelectItem key={value} value={value}>{END_OUTCOME_LABELS[value]}</SelectItem>)}
              </SelectContent>
            </Select>
            <FieldError {...fields.error('outcome')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-reason">Reason</Label>
            <Textarea
              id="end-reason"
              {...fields.field('reason')}
              value={reason}
              rows={3}
              maxLength={2_000}
              onChange={(event) => { setReason(event.target.value); fields.settle('reason', event.target.value); }}
            />
            <FieldError {...fields.error('reason')} />
          </div>
          {end.error && (
            <p role="alert" className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{apiErrorMessage(end.error)}</p>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => changeOpen(false)} disabled={end.isPending}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={end.isPending}>
              {end.isPending ? 'Ending…' : proposed ? 'Withdraw or decline' : 'End collaboration'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const REVIEW_FIELDS = { note: 'note', next_review_date: 'next' } as const;

/** FX-Exchange F3: a steward of either side records what the review found and the next review date (default a year out). */
function ReviewDialog({ collab, onDone }: { collab: CollaborationDetailView; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [nextDate, setNextDate] = useState('');
  const review = useReviewCollaboration(collab.id);
  const fields = useRequiredFields({ note: 'Say what the review found. Both ecosystems will read it.' });
  if (!collab.caller_can_review || collab.status !== 'active') return null;
  const server = formErrorView(review.error, REVIEW_FIELDS);
  const noteId = `review-${collab.id}-note`;
  const dateId = `review-${collab.id}-next`;
  const dateErrorId = `${dateId}-error`;

  const changeOpen = (next: boolean) => {
    if (review.isPending) return;
    setOpen(next);
    if (next) {
      setNote('');
      setNextDate('');
      review.reset();
    }
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!fields.validate({ note })) return;
    review.mutate(
      { note: note.trim(), ...(nextDate ? { next_review_date: nextDate } : {}) },
      { onSuccess: () => { setOpen(false); onDone(); } },
    );
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant={collab.review_due ? 'default' : 'outline'}>Record a review</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Review “{collab.title}”</DialogTitle>
            <DialogDescription>
              Record what the review found and when to look again; the collaboration continues. Both ecosystems see who reviewed it,
              when and what they found. To stop it instead, end it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={noteId}>What did the review find?</Label>
            <Textarea
              id={noteId}
              {...fields.field('note')}
              value={note}
              rows={4}
              maxLength={2_000}
              onChange={(event) => { setNote(event.target.value); fields.settle('note', event.target.value); }}
            />
            <FieldError {...fields.error('note')} message={fields.error('note').message ?? server.fields.note} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={dateId}>Next review date (optional)</Label>
            <Input
              id={dateId}
              type="date"
              value={nextDate}
              aria-invalid={server.fields.next ? true : undefined}
              aria-describedby={`${dateId}-help${server.fields.next ? ` ${dateErrorId}` : ''}`}
              onChange={(event) => setNextDate(event.target.value)}
            />
            <p id={`${dateId}-help`} className="text-xs text-muted-foreground">Leave it empty for a year from today.</p>
            <FieldError id={dateErrorId} message={server.fields.next} />
          </div>
          {server.form && (
            <p role="alert" className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{server.form}</p>
          )}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => changeOpen(false)} disabled={review.isPending}>Cancel</Button>
            <Button type="submit" disabled={review.isPending}>{review.isPending ? 'Recording…' : 'Record review'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CollaborationBody({ collab }: { collab: CollaborationDetailView }) {
  // Approve and End buttons vanish once used; focus lands on the title, whose badges now say what changed.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const focusHeading = () => window.setTimeout(() => headingRef.current?.focus(), 0);
  const termsText = typeof collab.terms?.text === 'string' ? collab.terms.text : null;
  const waiting = collab.status === 'proposed' ? waitingOnText(collab.awaiting) : null;
  const ended = collab.status === 'completed' || collab.status === 'dissolved';
  // A review date means something only while the collaboration runs or waits to start (p3-collaboration-and-moderation-8).
  const hasReviewDate = collab.status === 'proposed' || collab.status === 'active';

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold [overflow-wrap:anywhere]">{collab.title}</h1>
          <Badge variant={statusVariant(collab.status)} className="px-3 py-1 text-sm capitalize">{collab.status}</Badge>
          <Badge variant="outline" className="px-3 py-1 text-sm capitalize">{collab.engagement_tier}</Badge>
          {collab.review_due && hasReviewDate && <Badge variant="warning" className="px-3 py-1 text-sm">Review due</Badge>}
        </div>

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
          <span className="font-medium text-foreground">{collab.source_domain_name ?? 'Source domain'}</span>
          {collab.source_ecosystem_name && <span className="text-xs">({collab.source_ecosystem_name})</span>}
          <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="sr-only">to</span>
          <span className="font-medium text-foreground">{collab.target_domain_name ?? 'Target domain'}</span>
          {collab.target_ecosystem_name && <span className="text-xs">({collab.target_ecosystem_name})</span>}
        </p>

        {collab.proposed_by_name && (
          <p className="text-sm text-muted-foreground">Proposed by <span className="font-semibold text-foreground">{collab.proposed_by_name}</span> on {formatDate(collab.created_at)}</p>
        )}
        {waiting && <p className="text-sm font-bold">{waiting}</p>}

        <ApproveButtons collab={collab} onDone={focusHeading} />
        <div className="flex flex-wrap gap-2">
          <ReviewDialog collab={collab} onDone={focusHeading} />
          <EndDialog collab={collab} onDone={focusHeading} />
        </div>
        {collab.review_due && collab.caller_can_review && (
          <p className="text-sm">Its review date has passed: record a review to keep it going, or end it.</p>
        )}
      </div>

      {collab.reviewed_at && (
        <Card>
          <CardHeader><CardTitle className="text-base">Last review</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              {collab.reviewed_by_name ? `Reviewed by ${collab.reviewed_by_name}` : 'Reviewed'} on {formatDate(collab.reviewed_at)}.
              {collab.review_date && hasReviewDate ? ` Next review: ${formatDate(collab.review_date)}.` : ''}
            </p>
            {collab.review_note && <p className="whitespace-pre-wrap">Found: {collab.review_note}</p>}
          </CardContent>
        </Card>
      )}

      {ended && (
        <Card>
          <CardHeader><CardTitle className="text-base">{collab.status === 'completed' ? 'Completed' : 'Dissolved'}</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p>
              {collab.ended_by_name ? `Ended by ${collab.ended_by_name}` : 'Ended'}
              {collab.ended_at ? ` on ${formatDate(collab.ended_at)}` : ''}.
            </p>
            {collab.end_reason && <p>Reason: {collab.end_reason}</p>}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Approvals</CardTitle></CardHeader>
        <CardContent>
          {collab.approvals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No ecosystem has approved it yet.</p>
          ) : (
            <ul className="space-y-2">
              {collab.approvals.map((approval) => (
                <li key={approval.ecosystem_id} className="text-sm">
                  <span className="font-semibold">{approval.ecosystem_name ?? 'An ecosystem'}</span>
                  {': approved'}
                  {approval.approved_by ? ` by ${approval.approved_by}` : ''}
                  {approval.approved_at ? ` on ${formatDate(approval.approved_at)}` : ''}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Overview</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {collab.description && <p className="whitespace-pre-wrap text-sm leading-relaxed">{collab.description}</p>}
          {/* One div per dt/dd pair, the icon inside the dt: a dl admits nothing else (axe definition-list, dlitem). */}
          <dl className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
            <div>
              <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />Started
              </dt>
              <dd className="pl-6 text-sm font-medium">{formatDate(collab.started_date)}</dd>
            </div>
            {hasReviewDate && (
              <div>
                <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />Review date
                </dt>
                <dd className="pl-6 text-sm font-medium">{formatDate(collab.review_date)}{collab.review_due ? ' (review due)' : ''}</dd>
              </div>
            )}
            <div>
              <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4 shrink-0" aria-hidden="true" />Proposed
              </dt>
              <dd className="pl-6 text-sm font-medium">{formatDate(collab.created_at)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {termsText ? (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" aria-hidden="true" />Terms</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm leading-relaxed">{termsText}</p></CardContent>
        </Card>
      ) : collab.terms ? (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" aria-hidden="true" />Terms</CardTitle></CardHeader>
          <CardContent>
            <pre className="overflow-auto whitespace-pre-wrap rounded-none border-2 border-strong-border bg-muted p-3 text-xs">{JSON.stringify(collab.terms, null, 2)}</pre>
          </CardContent>
        </Card>
      ) : null}

      {collab.required_agreement_ids.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Agreement prerequisites</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">This collaboration was proposed only after the required agreement consents were verified.</p>
          </CardContent>
        </Card>
      )}

      {collab.linked_publications.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Link2 className="h-4 w-4" aria-hidden="true" />Started from</CardTitle></CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {collab.linked_publications.map((post) => (
                <li key={post.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline" className="rounded-none">{POST_TYPE_LABELS[post.type] ?? post.type}</Badge>
                  <Link href={postHref(post.id)} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-2">{post.title}</Link>
                  <span className="text-muted-foreground">{postStatusLabel(post.status)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function CollaborationDetail() {
  const [, params] = useRoute('/discover/collaborations/:id');
  const id = params?.id ?? '';
  const query = useCollaboration(id);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/discover?tab=collaborations">
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Back to collaborations
        </Link>
      </Button>
      <QueryState
        query={query}
        errorTitle="We couldn't load this collaboration"
        loading={
          <div className="max-w-3xl space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-48 rounded-none" />
            <Skeleton className="h-32 rounded-none" />
          </div>
        }
      >
        {(collab) => <CollaborationBody collab={collab} />}
      </QueryState>
    </div>
  );
}
