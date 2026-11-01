// Answering a share, need or solution: a private message to its author, then a link to that conversation.
import { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { FieldError } from '@/components/FieldError';
import { useRespondToSharesNeeds } from '@/hooks/use-discover';
import { useRequiredFields } from '@/hooks/use-required-fields';
import { apiErrorMessage } from '@/lib/api-error-message';
import { conversationHref, respondActionLabel, respondView } from '@/lib/exchange';
import type { SharesNeedsPost, SharesNeedsRespondResult } from '@/types/api';

interface RespondDialogProps {
  post: SharesNeedsPost;
  label: string;
  open: boolean;
  /** `sent` is true when the dialog closes after a message went through. */
  onOpenChange: (open: boolean, sent: boolean) => void;
}

/** The answer button and its dialog: a required message, an inline error, then "Open the conversation". */
export function RespondDialog({ post, label, open, onOpenChange }: RespondDialogProps) {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState<SharesNeedsRespondResult | null>(null);
  const respond = useRespondToSharesNeeds();
  const fields = useRequiredFields({ message: 'Write a message before sending.' });
  const sentRef = useRef<HTMLParagraphElement>(null);
  const fieldId = `respond-${post.id}-message`;
  const hintId = `${fieldId}-hint`;
  const author = post.author_name ?? 'the author';
  const messageField = fields.field('message');

  const changeOpen = (next: boolean) => {
    if (respond.isPending) return;
    onOpenChange(next, !next && sent !== null);
    if (!next) {
      setMessage('');
      setSent(null);
      respond.reset();
    }
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    // React submit events bubble through portals; keep this one away from any form around the dialog.
    event.stopPropagation();
    if (!fields.validate({ message })) return;
    respond.mutate(
      { id: post.id, message: message.trim() },
      {
        onSuccess: (result) => {
          setSent(result);
          setMessage('');
          window.requestAnimationFrame(() => sentRef.current?.focus());
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" aria-label={`${label}: ${post.title}`}>{label}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{label}: {post.title}</DialogTitle>
          <DialogDescription>
            Your message goes to {author} as a private conversation in Messages. They see it as unread.
          </DialogDescription>
        </DialogHeader>
        {sent ? (
          <div className="space-y-4">
            <p ref={sentRef} tabIndex={-1} role="status" className="font-bold focus:outline-none">
              {sent.created ? `Message sent to ${author}.` : `Message added to your earlier conversation with ${author}.`}
            </p>
            <DialogFooter className="gap-2">
              <Button asChild>
                <Link href={conversationHref(sent.conversation_id)}>Open the conversation</Link>
              </Button>
              <Button type="button" variant="outline" onClick={() => changeOpen(false)}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={fieldId}>Your message</Label>
              <p id={hintId} className="text-xs text-muted-foreground">
                Say what you can offer or what you would like, and how to reach you.
              </p>
              <Textarea
                id={fieldId}
                {...messageField}
                aria-describedby={[messageField['aria-describedby'], hintId].filter(Boolean).join(' ')}
                value={message}
                maxLength={10_000}
                rows={5}
                onChange={(event) => {
                  setMessage(event.target.value);
                  fields.settle('message', event.target.value);
                }}
              />
              <FieldError {...fields.error('message')} />
            </div>
            {respond.error && (
              <p role="alert" className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                {apiErrorMessage(respond.error)}
              </p>
            )}
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => changeOpen(false)} disabled={respond.isPending}>Cancel</Button>
              <Button type="submit" disabled={respond.isPending}>{respond.isPending ? 'Sending…' : 'Send message'}</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** What a post offers the caller about answering: the button, their earlier answer, or why they cannot. */
export function RespondAction({ post }: { post: SharesNeedsPost }) {
  const view = respondView(post);
  // The dialog stays mounted while open: the refetch after sending flips the post to "answered" underneath it.
  const [open, setOpen] = useState(false);
  const answeredLinkRef = useRef<HTMLAnchorElement>(null);
  const focusAnswered = useRef(false);

  useEffect(() => {
    if (open || view.kind !== 'answered' || !focusAnswered.current) return;
    focusAnswered.current = false;
    // After Radix's own close-focus pass, which aims at the trigger that has just unmounted.
    const timer = window.setTimeout(() => answeredLinkRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, view.kind]);

  if (open || view.kind === 'respond') {
    return (
      <RespondDialog
        post={post}
        label={view.kind === 'respond' ? view.label : respondActionLabel(post.type)}
        open={open}
        onOpenChange={(next, sent) => {
          if (!next && sent) focusAnswered.current = true;
          setOpen(next);
        }}
      />
    );
  }
  if (view.kind === 'answered') {
    return (
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="font-bold">You answered this.</span>
        <Link
          ref={answeredLinkRef}
          href={conversationHref(view.conversationId)}
          className="inline-flex min-h-11 items-center font-bold text-link underline underline-offset-2"
        >
          Open the conversation<span className="sr-only">: {post.title}</span>
        </Link>
      </p>
    );
  }
  if (view.kind === 'blocked') return <p className="text-sm text-muted-foreground">{view.text}</p>;
  return null;
}
