import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useMyDecisions, useUpdateMyDecision, useDeleteMyDecision } from '@/hooks/use-governance';
import { useToast } from '@/hooks/use-toast';
import { MEMBER_DECISION_STATE_LABELS, memberDecisionStateVariant } from '@/components/governance/RecordDecisionDialog';
import type { MemberDecision, MemberDecisionState, MemberDecisionSubjectType } from '@/types/api';
import { ClipboardCheck, Loader2, Trash2 } from 'lucide-react';

const STATE_ORDER: MemberDecisionState[] = ['intended', 'in_progress', 'follow_up', 'done', 'dropped'];

const SUBJECT_TYPE_LABELS: Record<MemberDecisionSubjectType, string> = {
  agreement: 'Agreement',
  proposal: 'Proposal',
  share: 'Share',
  need: 'Need',
};

function DecisionRow({ decision }: { decision: MemberDecision }) {
  const updateMutation = useUpdateMyDecision();
  const deleteMutation = useDeleteMyDecision();
  const { toast } = useToast();
  const [notes, setNotes] = useState(decision.notes ?? '');

  const setState = async (state: MemberDecisionState) => {
    try {
      await updateMutation.mutateAsync({ id: decision.id, data: { state } });
    } catch (e) {
      toast({ title: 'Could not update the decision', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const saveNotes = async () => {
    const trimmed = notes.trim();
    if (trimmed === (decision.notes ?? '')) return;
    try {
      await updateMutation.mutateAsync({ id: decision.id, data: { notes: trimmed || null } });
      toast({ title: 'Notes saved' });
    } catch (e) {
      toast({ title: 'Could not save notes', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const remove = async () => {
    try {
      await deleteMutation.mutateAsync(decision.id);
      toast({ title: 'Decision deleted' });
    } catch (e) {
      toast({ title: 'Could not delete the decision', description: e instanceof Error ? e.message : 'Unknown error', variant: 'destructive' });
    }
  };

  return (
    <li className="border-2 border-strong-border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{SUBJECT_TYPE_LABELS[decision.subject_type]}</Badge>
            <span className="font-medium truncate">{decision.subject_title ?? 'Untitled subject'}</span>
          </div>
          <p className="mt-2 text-sm">{decision.decision}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Recorded {decision.created_at ? new Date(decision.created_at).toLocaleDateString() : '—'}
            {decision.updated_at && decision.updated_at !== decision.created_at
              ? ` · updated ${new Date(decision.updated_at).toLocaleDateString()}`
              : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Select value={decision.state} onValueChange={(v) => setState(v as MemberDecisionState)} disabled={updateMutation.isPending}>
            <SelectTrigger className="w-36 min-h-11" aria-label="Decision state">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATE_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{MEMBER_DECISION_STATE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="min-h-11 text-destructive" onClick={remove} disabled={deleteMutation.isPending} aria-label="Delete decision">
            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={saveNotes}
        placeholder="Follow-up notes (only you see these) — saved when you click away."
        rows={2}
        aria-label="Decision notes"
      />
    </li>
  );
}

// The member's own decisions as a follow-up task list. The API is
// own-rows-only by construction — this page can only ever show the caller's
// own decisions.
export default function MyDecisionsPage() {
  const { data, isLoading, error, refetch } = useMyDecisions();
  const decisions = data?.items ?? [];

  const grouped = STATE_ORDER.map((state) => ({
    state,
    items: decisions.filter((d) => d.state === state),
  })).filter((g) => g.items.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ClipboardCheck className="h-5 w-5" /> My decisions
        </CardTitle>
        <CardDescription>
          Decisions you've recorded about agreements, proposals, shares, and needs — your
          follow-up list. Only you can see or edit these.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2"><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></div>
        ) : error ? (
          <div className="text-sm text-destructive">
            Could not load your decisions.{' '}
            <Button variant="outline" size="sm" className="ml-2 min-h-11" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : decisions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No decisions recorded yet. Record one from an active agreement, a ratified proposal,
            or a share/need you'd like to use or serve.
          </p>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => (
              <section key={group.state}>
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant={memberDecisionStateVariant(group.state)}>
                    {MEMBER_DECISION_STATE_LABELS[group.state]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{group.items.length}</span>
                </div>
                <ul className="space-y-3">
                  {group.items.map((d) => <DecisionRow key={d.id} decision={d} />)}
                </ul>
              </section>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
