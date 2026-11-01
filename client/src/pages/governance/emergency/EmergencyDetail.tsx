import { useState } from 'react';
import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { QueryState } from '@/components/QueryState';
import { CompleteRecoveryDialog } from '@/components/governance/emergency/CompleteRecoveryDialog';
import { RecordReviewDialog } from '@/components/governance/emergency/RecordReviewDialog';
import { useEmergencyCosign, useEmergencyRecord, useEmergencyWithdrawal, useEndEmergencyAuthority } from '@/hooks/use-emergency';
import { emergencyLogLabel, emergencyPhaseLabel } from '@/lib/emergency-phase';
import { apiErrorMessage } from '@/lib/api-error-message';
import type { EmergencyRecord } from '@/types/api';
import { ArrowLeft } from 'lucide-react';

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—');
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '—');

type Move = 'cosign' | 'withdraw' | 'end';

const MOVE_COPY: Record<Move, { label: string; title: string; description: (e: EmergencyRecord) => string; confirm: string }> = {
  cosign: {
    label: 'Co-sign this emergency',
    title: 'Co-sign this emergency?',
    description: (e) => `You confirm this is an emergency. Emergency authority starts now and ends automatically after ${e.authority_days ?? 7} days, or earlier if it is ended. Every member sees it.`,
    confirm: 'Yes, co-sign',
  },
  withdraw: {
    label: 'Withdraw declaration',
    title: 'Withdraw this declaration?',
    description: () => 'Nobody has co-signed it, so nothing has changed. It stays in the history as withdrawn.',
    confirm: 'Yes, withdraw',
  },
  end: {
    label: 'End emergency authority now',
    title: 'End emergency authority now?',
    description: () => 'Emergency authority stops and Recovery starts: decisions made during the emergency are reviewed, and a post-emergency review is due within 30 days. Normal governance resumes for new decisions. This cannot be undone.',
    confirm: 'Yes, end it',
  },
};

function EmergencyMoves({ emergency }: { emergency: EmergencyRecord }) {
  const [pending, setPending] = useState<Move | null>(null);
  const mutations = {
    cosign: useEmergencyCosign(emergency.id),
    withdraw: useEmergencyWithdrawal(emergency.id),
    end: useEndEmergencyAuthority(emergency.id),
  };
  const available = ([
    ['cosign', emergency.caller_can_cosign],
    ['end', emergency.caller_can_end],
    ['withdraw', emergency.caller_can_withdraw],
  ] as const).filter(([, allowed]) => allowed).map(([move]) => move);
  const failed = available.map((move) => mutations[move].error).find(Boolean);
  const busy = available.some((move) => mutations[move].isPending);

  const confirm = async () => {
    if (!pending) return;
    try {
      await mutations[pending].mutateAsync();
    } catch {
      // rendered below
    } finally {
      setPending(null);
    }
  };

  if (available.length === 0) return null;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {available.map((move) => (
          <Button key={move} variant={move === 'withdraw' ? 'outline' : move === 'cosign' ? 'destructive' : 'default'}
            onClick={() => setPending(move)} disabled={busy}>
            {MOVE_COPY[move].label}
          </Button>
        ))}
      </div>
      {failed && <p role="alert" className="border-2 border-destructive p-3 text-sm text-destructive">{apiErrorMessage(failed)}</p>}
      <AlertDialog open={!!pending} onOpenChange={(open) => { if (!open) setPending(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pending ? MOVE_COPY[pending].title : ''}</AlertDialogTitle>
            <AlertDialogDescription>{pending ? MOVE_COPY[pending].description(emergency) : ''}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirm}>{pending ? MOVE_COPY[pending].confirm : 'Confirm'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function RecoveryCard({ emergency }: { emergency: EmergencyRecord }) {
  const reviewStatus = emergency.post_review_status === 'complete' ? 'Complete'
    : emergency.post_review_status === 'scheduled' ? 'Scheduled' : 'Not scheduled yet';
  return (
    <Card className={emergency.review_overdue && emergency.caller_is_steward ? 'border-destructive' : 'border-warning'}>
      <CardHeader>
        <CardTitle className="text-lg">Recovery: review due {day(emergency.review_due_at)}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {emergency.review_overdue && emergency.caller_is_steward && (
          <p role="alert" className="font-semibold text-destructive">
            Review overdue. Recovery stays open until the review is recorded as complete; it does not close by itself.
          </p>
        )}
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div><dt className="text-muted-foreground">Recovery started</dt><dd className="font-medium">{day(emergency.recovery_started_at)}</dd></div>
          <div><dt className="text-muted-foreground">Schedule the review by</dt><dd className="font-medium">{day(emergency.review_schedule_by)}</dd></div>
          <div><dt className="text-muted-foreground">Review</dt><dd className="font-medium">{reviewStatus}</dd></div>
        </dl>
        <div className="flex flex-wrap items-start gap-3">
          {emergency.caller_can_review && <RecordReviewDialog emergency={emergency} />}
          <CompleteRecoveryDialog emergency={emergency} />
        </div>
        {!emergency.caller_can_review && emergency.post_review_status !== 'complete' && (
          <p className="text-muted-foreground">
            Someone who did not declare, co-sign or end this emergency records the review.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ActivityLog({ emergency }: { emergency: EmergencyRecord }) {
  if (emergency.actions_log.length === 0) return null;
  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Activity</CardTitle></CardHeader>
      <CardContent>
        <ol className="space-y-3 text-sm">
          {emergency.actions_log.map((entry, index) => (
            <li key={`${entry.timestamp}-${index}`} className="border-l-2 border-strong-border pl-3">
              <p className="font-medium">{emergencyLogLabel(entry)}</p>
              <p className="text-muted-foreground">{when(entry.timestamp)}{entry.actor ? ` · ${entry.actor}` : ''}</p>
              {entry.summary && <p className="mt-1 whitespace-pre-wrap">{entry.summary}</p>}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export default function EmergencyDetail() {
  const [, params] = useRoute('/emergency/:id');
  const id = params?.id ?? '';
  const record = useEmergencyRecord(id);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/emergency"><ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />Back to Emergencies</Link>
      </Button>
      <QueryState query={record} errorTitle="We couldn't load this emergency">
        {(emergency) => (
          <>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Emergency{emergency.ecosystem_name ? ` in ${emergency.ecosystem_name}` : ''}</h1>
              <Badge variant={emergency.phase === 'open' ? 'destructive' : 'secondary'}>{emergencyPhaseLabel(emergency.phase)}</Badge>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-lg">What happens next</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p>{emergency.next_step}</p>
                {emergency.phase === 'pending' && (
                  <p>
                    Co-sign by <strong>{when(emergency.cosign_deadline)}</strong>
                    {emergency.caller_can_withdraw && !emergency.caller_can_cosign
                      ? '. Ask another active member to open this page and co-sign.'
                      : '.'}
                  </p>
                )}
                {emergency.phase === 'open' && (
                  <p>Emergency authority ends automatically by <strong>{when(emergency.authority_ends_at)}</strong>.</p>
                )}
                <EmergencyMoves emergency={emergency} />
              </CardContent>
            </Card>

            {emergency.phase === 'recovery' && <RecoveryCard emergency={emergency} />}

            <Card>
              <CardHeader><CardTitle className="text-lg">Declaration</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                <p className="whitespace-pre-wrap leading-relaxed">{emergency.notes || 'No reason recorded.'}</p>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div><dt className="text-muted-foreground">Declared by</dt><dd className="font-medium">{emergency.declared_by ?? 'Unknown'}</dd></div>
                  <div><dt className="text-muted-foreground">Declared</dt><dd className="font-medium">{when(emergency.declared_at)}</dd></div>
                  <div><dt className="text-muted-foreground">Co-signed by</dt><dd className="font-medium">{emergency.co_signed_by ?? 'Not yet'}</dd></div>
                  {emergency.co_signed_at && <div><dt className="text-muted-foreground">Co-signed</dt><dd className="font-medium">{when(emergency.co_signed_at)}</dd></div>}
                  {emergency.authority_days && <div><dt className="text-muted-foreground">Authority requested</dt><dd className="font-medium">{emergency.authority_days} days</dd></div>}
                  {emergency.closed_at && <div><dt className="text-muted-foreground">Closed</dt><dd className="font-medium">{when(emergency.closed_at)}</dd></div>}
                </dl>
              </CardContent>
            </Card>

            <ActivityLog emergency={emergency} />
          </>
        )}
      </QueryState>
    </div>
  );
}
