import { useState } from 'react';
import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { QueryState } from '@/components/QueryState';
import { ExitDataExportCard } from '@/components/governance/exit/ExitDataExportCard';
import { useExitView, useMoveExit } from '@/hooks/use-exit';
import { EXIT_MOVE_COPY, exitStatusLabel, exitStatusVariant, handoffNotice } from '@/lib/exit-status';
import { apiErrorMessage } from '@/lib/api-error-message';
import { ArrowLeft } from 'lucide-react';

const day = (iso: string | null) => (iso ? new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '—');

export default function ExitDetail() {
  const [, params] = useRoute('/exit/:id');
  const id = params?.id ?? '';
  const exitQuery = useExitView(id);
  const move = useMoveExit(id);
  const [pending, setPending] = useState<string | null>(null);
  const copy = pending ? EXIT_MOVE_COPY[pending] : null;

  const confirm = async () => {
    if (!pending) return;
    try {
      await move.mutateAsync(pending);
    } catch {
      // rendered below
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/exit"><ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />Back to Exits</Link>
      </Button>
      <QueryState query={exitQuery} errorTitle="We couldn't load this exit">
        {(exit) => {
          const moves = exit.allowed_next.filter((status) => EXIT_MOVE_COPY[status]);
          const notice = handoffNotice(exit, new Date(), day);
          return (
            <>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">{exit.caller_is_leaver ? 'Your exit' : `Exit: ${exit.member_name ?? 'a member'}`}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={exitStatusVariant(exit.status)}>{exitStatusLabel(exit.status)}</Badge>
                  <span className="text-sm text-muted-foreground">{exit.exit_type === 'urgent' ? 'Urgent handoff' : 'Standard handoff'}</span>
                </div>
              </div>

              <Card>
                <CardHeader><CardTitle className="text-lg">What happens next</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <p>{exit.next_step}</p>
                  {notice && <p className="font-medium">{notice}</p>}
                  {moves.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {moves.map((status) => (
                        <Button key={status} variant={EXIT_MOVE_COPY[status].destructive ? 'destructive' : status === 'cancelled' ? 'outline' : 'default'}
                          onClick={() => setPending(status)} disabled={move.isPending}>
                          {EXIT_MOVE_COPY[status].label}
                        </Button>
                      ))}
                    </div>
                  )}
                  {move.error && <p role="alert" className="border-2 border-destructive p-3 text-sm text-destructive">{apiErrorMessage(move.error)}</p>}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div><dt className="text-muted-foreground">Member</dt><dd className="font-medium">{exit.member_name ?? '—'}</dd></div>
                    <div><dt className="text-muted-foreground">Filed</dt><dd className="font-medium">{day(exit.declared_date)}</dd></div>
                    <div><dt className="text-muted-foreground">Handoff ends</dt><dd className="font-medium">{day(exit.target_completion_date)}</dd></div>
                    {exit.completed_date && <div><dt className="text-muted-foreground">Departure confirmed</dt><dd className="font-medium">{day(exit.completed_date)}</dd></div>}
                  </dl>
                </CardContent>
              </Card>

              {exit.reason && (
                <Card>
                  <CardHeader><CardTitle className="text-lg">Reason</CardTitle></CardHeader>
                  <CardContent><p className="whitespace-pre-wrap text-sm leading-relaxed">{exit.reason}</p></CardContent>
                </Card>
              )}

              <ExitDataExportCard exit={exit} />
            </>
          );
        }}
      </QueryState>

      <AlertDialog open={!!pending} onOpenChange={(open) => { if (!open) setPending(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy?.title ?? 'Confirm'}</AlertDialogTitle>
            <AlertDialogDescription>{copy?.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirm}
              className={copy?.destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
              {copy?.label ?? 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
