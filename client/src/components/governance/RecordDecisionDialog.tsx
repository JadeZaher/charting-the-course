import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useCreateMyDecision, useMyDecisions } from '@/hooks/use-governance';
import type { MemberDecision, MemberDecisionState, MemberDecisionSubjectType } from '@/types/api';

const DECISION_PLACEHOLDERS: Record<MemberDecisionSubjectType, string> = {
  agreement: 'I accept this agreement and will uphold it',
  proposal: 'I accept this decision and will act on it',
  share: "I'll use this share",
  need: "I'll serve this need",
};

export const MEMBER_DECISION_STATE_LABELS: Record<MemberDecisionState, string> = {
  intended: 'Intended',
  in_progress: 'In progress',
  done: 'Done',
  follow_up: 'Follow up',
  dropped: 'Dropped',
};

export function memberDecisionStateVariant(state: MemberDecisionState) {
  switch (state) {
    case 'done': return 'success' as const;
    case 'in_progress': return 'info' as const;
    case 'follow_up': return 'warning' as const;
    case 'dropped': return 'outline' as const;
    default: return 'secondary' as const;
  }
}

interface RecordDecisionDialogProps {
  subjectType: MemberDecisionSubjectType;
  subjectId: string;
  subjectTitle: string;
  onRecorded?: (decision: MemberDecision) => void;
  triggerLabel?: string;
  triggerVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * Reusable dialog for recording the caller's own decision about a subject
 * (active agreement, ratified proposal, share to use, need to serve).
 * The API rejects duplicates (409) and non-members (403); the message is
 * surfaced honestly rather than hidden.
 */
export function RecordDecisionDialog({
  subjectType,
  subjectId,
  subjectTitle,
  onRecorded,
  triggerLabel = 'Record your decision',
  triggerVariant = 'default',
  triggerSize = 'default',
}: RecordDecisionDialogProps) {
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const createMutation = useCreateMyDecision();

  const decisionLength = decision.trim().length;
  const canSubmit = decisionLength >= 3 && decisionLength <= 500 && !createMutation.isPending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setErrorMessage(null);
    try {
      const created = await createMutation.mutateAsync({
        subject_type: subjectType,
        subject_id: subjectId,
        decision: decision.trim(),
        notes: notes.trim() || undefined,
      });
      setDecision('');
      setNotes('');
      setOpen(false);
      onRecorded?.(created);
    } catch (err) {
      // 409 (already have one), 403 (not a member), 400 (wrong state) — show the server's words.
      setErrorMessage(err instanceof Error ? err.message : 'Could not record your decision');
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setErrorMessage(null); }}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size={triggerSize}>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record your decision</DialogTitle>
          <DialogDescription>
            Your personal decision about <span className="font-medium text-foreground">{subjectTitle}</span>.
            Only you can see and edit it — find it later under Me → My decisions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`record-decision-text-${subjectId}`}>Your decision *</Label>
            <Input
              id={`record-decision-text-${subjectId}`}
              value={decision}
              onChange={(event) => setDecision(event.target.value)}
              placeholder={DECISION_PLACEHOLDERS[subjectType]}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">3–500 characters.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`record-decision-notes-${subjectId}`}>Notes (optional)</Label>
            <Textarea
              id={`record-decision-notes-${subjectId}`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Follow-up context only you will see."
              rows={3}
            />
          </div>
          {errorMessage && (
            <div className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {errorMessage}
            </div>
          )}
          <DialogFooter>
            <Button type="submit" disabled={!canSubmit}>
              {createMutation.isPending ? 'Recording...' : 'Record decision'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface RecordDecisionActionProps {
  subjectType: MemberDecisionSubjectType;
  subjectId: string;
  subjectTitle: string;
  actionLabel?: string;
  triggerVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon';
}

/**
 * Decision action for a decision-able subject: the record button, with the
 * caller's existing decision (if any) shown as a small badge + state beneath
 * it. The subject_id param is also matched client-side so a stale or
 * unfiltered listing can never masquerade as this subject's decision.
 */
export function RecordDecisionAction({
  subjectType,
  subjectId,
  subjectTitle,
  actionLabel = 'Record your decision',
  triggerVariant = 'default',
  triggerSize = 'sm',
}: RecordDecisionActionProps) {
  const { data } = useMyDecisions({ subject_type: subjectType, subject_id: subjectId });
  const existing = (data?.items ?? []).find(
    (item) => item.subject_type === subjectType && item.subject_id === subjectId && item.state !== 'dropped',
  );

  return (
    <div className="space-y-2">
      <RecordDecisionDialog
        subjectType={subjectType}
        subjectId={subjectId}
        subjectTitle={subjectTitle}
        triggerLabel={actionLabel}
        triggerVariant={triggerVariant}
        triggerSize={triggerSize}
      />
      {existing && (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={memberDecisionStateVariant(existing.state)}>
              {MEMBER_DECISION_STATE_LABELS[existing.state]}
            </Badge>
            <span className="text-xs text-muted-foreground">Your decision is recorded</span>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2">{existing.decision}</p>
          <Link href="/me" className="text-xs underline underline-offset-2 hover:text-primary">
            Manage it under Me → My decisions
          </Link>
        </div>
      )}
    </div>
  );
}
