// The author's and the moderator's controls on one post, all from the server's flags (never from a client role table).
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { FieldError } from '@/components/FieldError';
import {
  useDeleteSharesNeeds, useHideSharesNeeds, useRestoreSharesNeeds, useUpdateSharesNeeds, useUpdateSharesNeedsStatus,
} from '@/hooks/use-discover';
import { useRequiredFields } from '@/hooks/use-required-fields';
import { apiErrorMessage } from '@/lib/api-error-message';
import { POST_TYPE_LABELS, postMoveActions, type PostMoveAction } from '@/lib/exchange';
import type { SharesNeedsPost } from '@/types/api';
import { PostForm } from './PostForm';

const NOBODY = 'none';

/** Inline failure text for one action; one message per failure, never also a toast. */
function ActionError({ error }: { error: unknown }) {
  if (!error) return null;
  return (
    <p role="alert" className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
      {apiErrorMessage(error)}
    </p>
  );
}

/** Refocuses the post's controls after the caller's own action changed it (see client/src/AGENTS.md "Exchange (G-Exchange)"). */
function useRefocusOnChange(post: SharesNeedsPost) {
  const groupRef = useRef<HTMLDivElement>(null);
  const acting = useRef(false);
  const signature = [post.status, String(post.hidden), ...post.allowed_next.map((move) => move.status)].join('|');
  const seen = useRef(signature);
  useEffect(() => {
    if (seen.current === signature) return;
    seen.current = signature;
    if (!acting.current) return;
    acting.current = false;
    // After Radix's own close-focus pass, which aims at a trigger that has just unmounted.
    const timer = window.setTimeout(() => {
      const active = document.activeElement;
      if (!active || active === document.body || !active.isConnected) groupRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [signature]);
  return { groupRef, markActing: () => { acting.current = true; } };
}

function FulfilDialog({ post, move, onStart }: { post: SharesNeedsPost; move: PostMoveAction; onStart: () => void }) {
  const [open, setOpen] = useState(false);
  const [helper, setHelper] = useState(NOBODY);
  const [note, setNote] = useState('');
  const mutation = useUpdateSharesNeedsStatus();
  const helperId = `fulfil-${post.id}-helper`;
  const noteId = `fulfil-${post.id}-note`;

  const changeOpen = (next: boolean) => {
    if (mutation.isPending) return;
    setOpen(next);
    if (next) {
      setHelper(NOBODY);
      setNote('');
      mutation.reset();
    }
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onStart();
    mutation.mutate(
      {
        id: post.id,
        status: move.status,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(helper !== NOBODY ? { fulfilled_by_member_id: helper } : {}),
      },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" aria-label={`${move.label}: ${post.title}`}>{move.label}</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{move.label}: {post.title}</DialogTitle>
            <DialogDescription>It stops taking answers and shows as fulfilled. You can reopen it later.</DialogDescription>
          </DialogHeader>
          {post.responders.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor={helperId}>Who helped? (optional)</Label>
              <Select value={helper} onValueChange={setHelper}>
                <SelectTrigger id={helperId}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NOBODY}>Someone else, or I'd rather not say</SelectItem>
                  {post.responders.map((responder) => (
                    <SelectItem key={responder.member_id} value={responder.member_id}>{responder.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nobody has answered it through NEOS, so there is nobody to name.</p>
          )}
          <div className="space-y-2">
            <Label htmlFor={noteId}>Note (optional)</Label>
            <Textarea id={noteId} value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={2_000} />
          </div>
          <ActionError error={mutation.error} />
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => changeOpen(false)} disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving…' : move.label}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Withdraw and Reopen: a yes first, then the move. */
function ConfirmMove({ post, move, onStart }: { post: SharesNeedsPost; move: PostMoveAction; onStart: () => void }) {
  const [open, setOpen] = useState(false);
  const mutation = useUpdateSharesNeedsStatus();
  const confirm = move.confirm;
  if (!confirm) return null;
  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!mutation.isPending) { setOpen(next); if (next) mutation.reset(); } }}>
      <AlertDialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" aria-label={`${move.label}: ${post.title}`}>{move.label}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirm.title}</AlertDialogTitle>
          <AlertDialogDescription>{confirm.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <ActionError error={mutation.error} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={mutation.isPending}
            onClick={(event) => {
              // Stay open until the move lands; a failure shows here.
              event.preventDefault();
              onStart();
              mutation.mutate({ id: post.id, status: move.status }, { onSuccess: () => setOpen(false) });
            }}
          >
            {mutation.isPending ? 'Saving…' : confirm.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** "Keep it open": resets the check-in, reversible, so no confirmation; its error shows under the buttons. */
function KeepOpen({ post, move }: { post: SharesNeedsPost; move: PostMoveAction }) {
  const mutation = useUpdateSharesNeedsStatus();
  return (
    <>
      {/* aria-disabled, not disabled: a focused button that becomes disabled drops focus to the page. */}
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-label={`${move.label}: ${post.title}`}
        aria-disabled={mutation.isPending}
        onClick={() => { if (!mutation.isPending) mutation.mutate({ id: post.id, status: move.status }); }}
      >
        {mutation.isPending ? 'Saving…' : move.label}
      </Button>
      {mutation.error ? <div className="basis-full"><ActionError error={mutation.error} /></div> : null}
    </>
  );
}

function EditPostDialog({ post }: { post: SharesNeedsPost }) {
  const [open, setOpen] = useState(false);
  const mutation = useUpdateSharesNeeds();
  const kind = (POST_TYPE_LABELS[post.type] ?? 'post').toLowerCase();
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!mutation.isPending) { setOpen(next); if (next) mutation.reset(); } }}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" aria-label={`Edit: ${post.title}`}>Edit</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {kind}</DialogTitle>
          <DialogDescription>
            It stays in {post.domain_name ?? 'its domain'}
            {post.ecosystem_name ? ` (${post.ecosystem_name})` : ''}. Changes show wherever it is listed once saved.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <PostForm
            initial={{
              type: post.type,
              title: post.title,
              description: post.description ?? '',
              category: post.category ?? '',
              capacity: post.capacity ?? '',
              visibility: post.visibility,
              domainId: post.domain_id,
            }}
            fixedEcosystemId={post.ecosystem_id}
            ecosystemNameFor={() => post.ecosystem_name}
            error={mutation.error}
            pending={mutation.isPending}
            submitLabel={() => 'Save changes'}
            pendingLabel="Saving…"
            onCancel={() => setOpen(false)}
            onSubmit={(values) =>
              mutation.mutate(
                {
                  id: post.id,
                  data: {
                    type: values.type,
                    title: values.title,
                    description: values.description.trim() || null,
                    category: values.category || null,
                    capacity: values.capacity.trim() || null,
                    visibility: values.visibility,
                  },
                },
                { onSuccess: () => setOpen(false) },
              )
            }
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeletePostDialog({ post, onDeleted }: { post: SharesNeedsPost; onDeleted?: () => void }) {
  const [open, setOpen] = useState(false);
  const mutation = useDeleteSharesNeeds();
  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!mutation.isPending) { setOpen(next); if (next) mutation.reset(); } }}>
      <AlertDialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" aria-label={`Delete: ${post.title}`}>Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{post.title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes it for good. Nobody has answered it yet, so no conversation is lost. To keep a record instead, withdraw it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ActionError error={mutation.error} />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={mutation.isPending}>Keep it</AlertDialogCancel>
          <AlertDialogAction
            className="border-destructive bg-destructive text-destructive-foreground"
            disabled={mutation.isPending}
            onClick={(event) => {
              event.preventDefault();
              mutation.mutate(post.id, { onSuccess: () => { setOpen(false); onDeleted?.(); } });
            }}
          >
            {mutation.isPending ? 'Deleting…' : 'Delete for good'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Steward's hide, with a required reason the author and other stewards will read. */
function HidePostDialog({ post, onStart }: { post: SharesNeedsPost; onStart: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const mutation = useHideSharesNeeds();
  const fields = useRequiredFields({ reason: 'Give a reason. The author and the other stewards will read it.' });
  const reasonId = `hide-${post.id}-reason`;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!fields.validate({ reason })) return;
    onStart();
    mutation.mutate({ id: post.id, reason: reason.trim() }, { onSuccess: () => setOpen(false) });
  };
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!mutation.isPending) { setOpen(next); if (next) { setReason(''); mutation.reset(); } } }}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" aria-label={`Hide: ${post.title}`}>Hide</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <form onSubmit={submit} noValidate className="space-y-4">
          <DialogHeader>
            <DialogTitle>Hide “{post.title}”?</DialogTitle>
            <DialogDescription>
              It disappears from Discover and every list. Its author and the stewards of {post.ecosystem_name ?? 'its ecosystem'} still
              see it, with your reason. A steward can restore it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={reasonId}>Reason</Label>
            <Textarea
              id={reasonId}
              {...fields.field('reason')}
              value={reason}
              rows={3}
              maxLength={2_000}
              onChange={(event) => { setReason(event.target.value); fields.settle('reason', event.target.value); }}
            />
            <FieldError {...fields.error('reason')} />
          </div>
          <ActionError error={mutation.error} />
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" variant="destructive" disabled={mutation.isPending}>{mutation.isPending ? 'Hiding…' : 'Hide post'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** A yes, then the restore; no note field, because the server records none (wave-c F10). */
function RestorePostDialog({ post, onStart }: { post: SharesNeedsPost; onStart: () => void }) {
  const [open, setOpen] = useState(false);
  const mutation = useRestoreSharesNeeds();
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onStart();
    mutation.mutate(post.id, { onSuccess: () => setOpen(false) });
  };
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!mutation.isPending) { setOpen(next); if (next) mutation.reset(); } }}>
      <DialogTrigger asChild>
        <Button type="button" size="sm" variant="outline" aria-label={`Restore: ${post.title}`}>Restore</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <form onSubmit={submit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Restore “{post.title}”?</DialogTitle>
            <DialogDescription>
              It shows again wherever its visibility allows. Who hid it and why stays on record; a steward can hide it again.
            </DialogDescription>
          </DialogHeader>
          <ActionError error={mutation.error} />
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={mutation.isPending}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Restoring…' : 'Restore post'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface PostManageActionsProps {
  post: SharesNeedsPost;
  /** Called after the author deletes the post (e.g. close its detail). */
  onDeleted?: () => void;
  /** `moderation`: only Hide/Restore (the moderation list never edits, moves or deletes). */
  include?: 'all' | 'moderation';
}

/** Mark fulfilled / Withdraw / Keep it open / Reopen from `allowed_next`, Edit, Delete while nobody answered, Hide/Restore for stewards. */
export function PostManageActions({ post, onDeleted, include = 'all' }: PostManageActionsProps) {
  const { groupRef, markActing } = useRefocusOnChange(post);
  const author = include === 'all';
  const moves = author ? postMoveActions(post) : [];
  const canEdit = author && post.caller_can_edit;
  const canDelete = author && post.caller_can_delete;
  const canHide = post.caller_can_moderate && !post.hidden;
  const canRestore = post.caller_can_moderate && post.hidden;
  if (!moves.length && !canEdit && !canDelete && !canHide && !canRestore) return null;

  return (
    <div ref={groupRef} tabIndex={-1} role="group" aria-label={`Manage: ${post.title}`} className="flex flex-wrap gap-2">
      {moves.map((move) => {
        if (move.kind === 'fulfil') return <FulfilDialog key={move.kind} post={post} move={move} onStart={markActing} />;
        if (move.kind === 'keep-open') return <KeepOpen key={move.kind} post={post} move={move} />;
        return <ConfirmMove key={move.kind} post={post} move={move} onStart={markActing} />;
      })}
      {canEdit && <EditPostDialog post={post} />}
      {canDelete && <DeletePostDialog post={post} onDeleted={onDeleted} />}
      {canHide && <HidePostDialog post={post} onStart={markActing} />}
      {canRestore && <RestorePostDialog post={post} onStart={markActing} />}
    </div>
  );
}
