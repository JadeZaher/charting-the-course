import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { QueryState } from '@/components/QueryState';
import { FieldError } from '@/components/FieldError';
import { useEmergencyDeclaration, useEmergencyOverview } from '@/hooks/use-emergency';
import { useRequiredFields } from '@/hooks/use-required-fields';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { emergencyPhaseLabel } from '@/lib/emergency-phase';
import { apiErrorMessage } from '@/lib/api-error-message';
import type { EmergencyOverview, EmergencyRecord } from '@/types/api';
import { ShieldCheck, Siren } from 'lucide-react';

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : '—');
const day = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString() : '—');

function LiveEmergencyCard({ emergency }: { emergency: EmergencyRecord }) {
  const deadline = {
    pending: ['Co-sign by', emergency.cosign_deadline],
    open: ['Authority ends by', emergency.authority_ends_at],
    recovery: ['Review due', emergency.review_due_at],
  }[emergency.phase as 'pending' | 'open' | 'recovery'];
  return (
    <Card className={emergency.phase === 'open' ? 'border-destructive' : 'border-warning'}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Siren className={emergency.phase === 'open' ? 'h-5 w-5 text-destructive' : 'h-5 w-5 text-warning'} aria-hidden="true" />
          {emergency.ecosystem_name ?? 'Emergency'}: {emergencyPhaseLabel(emergency.phase)}
        </CardTitle>
        <Badge variant={emergency.phase === 'open' ? 'destructive' : 'secondary'}>{emergencyPhaseLabel(emergency.phase)}</Badge>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p>{emergency.next_step}</p>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div><dt className="text-muted-foreground">Declared by</dt><dd className="font-medium">{emergency.declared_by ?? 'Unknown'}</dd></div>
          {deadline && <div><dt className="text-muted-foreground">{deadline[0]}</dt><dd className="font-medium">{day(deadline[1])}</dd></div>}
          {emergency.review_overdue && emergency.caller_is_steward && (
            <div><dt className="text-muted-foreground">Review</dt><dd><Badge variant="destructive">Review overdue</Badge></dd></div>
          )}
        </dl>
        <Button asChild size="sm">
          <Link href={`/emergency/${emergency.id}`}>{emergency.caller_can_cosign ? 'Review and co-sign' : 'Open'}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function DeclareForm({ overview, ecosystemId, ecosystemName }: { overview: EmergencyOverview; ecosystemId: string; ecosystemName: string }) {
  const [, navigate] = useLocation();
  const declare = useEmergencyDeclaration();
  const { limits } = overview;
  const [reason, setReason] = useState('');
  const [days, setDays] = useState(String(limits.default_authority_days));
  const [daysError, setDaysError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const fields = useRequiredFields({ reason: 'Say what is happening: a reason is required.' });

  const review = (event: React.FormEvent) => {
    event.preventDefault();
    const valid = fields.validate({ reason });
    const count = Number(days);
    const daysValid = Number.isInteger(count) && count >= 1 && count <= limits.max_authority_days;
    setDaysError(daysValid ? null : `Choose between 1 and ${limits.max_authority_days} days.`);
    if (valid && daysValid) setConfirming(true);
  };

  const submit = async () => {
    try {
      const record = await declare.mutateAsync({ ecosystem_id: ecosystemId, reason: reason.trim(), auto_revert_days: Number(days) });
      navigate(`/emergency/${record.id}`);
    } catch {
      setConfirming(false); // the error renders above the form
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Declare an emergency in {ecosystemName}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Any active member can declare. Nothing changes until a second active member co-signs, within{' '}
          {limits.cosign_window_hours} hours. Emergency authority then ends automatically after the days you choose,
          at most {limits.max_authority_days}, and Recovery reviews what was done.
        </p>
        {declare.error && (
          <p role="alert" className="border-2 border-destructive p-3 text-sm text-destructive">{apiErrorMessage(declare.error)}</p>
        )}
        <form onSubmit={review} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emergency-reason">What is happening?</Label>
            <Textarea
              id="emergency-reason"
              rows={4}
              value={reason}
              onChange={(event) => { setReason(event.target.value); fields.settle('reason', event.target.value); }}
              {...fields.field('reason')}
            />
            <FieldError {...fields.error('reason')} />
          </div>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="emergency-days">Days of emergency authority</Label>
            <Input
              id="emergency-days"
              type="number"
              inputMode="numeric"
              min={1}
              max={limits.max_authority_days}
              value={days}
              onChange={(event) => { setDays(event.target.value); setDaysError(null); }}
              aria-describedby="emergency-days-hint"
              aria-invalid={daysError ? true : undefined}
            />
            <p id="emergency-days-hint" className="text-xs text-muted-foreground">
              1 to {limits.max_authority_days} days, counted from the co-signature.
            </p>
            {daysError && <p role="alert" className="text-sm text-destructive">{daysError}</p>}
          </div>
          <Button type="submit" variant="destructive" disabled={declare.isPending}>
            <Siren className="mr-2 h-4 w-4" aria-hidden="true" />
            {declare.isPending ? 'Declaring…' : 'Declare emergency'}
          </Button>
        </form>
      </CardContent>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Declare an emergency in {ecosystemName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Every member sees it. It stays pending until a second active member co-signs within{' '}
              {limits.cosign_window_hours} hours; then emergency authority runs for {days} day{days === '1' ? '' : 's'}.
              You can withdraw it while it waits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void submit(); }} disabled={declare.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {declare.isPending ? 'Declaring…' : 'Yes, declare'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default function EmergencyDashboard() {
  const { selected } = useEcosystem();
  const overview = useEmergencyOverview();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Emergencies</h1>
      <QueryState query={overview} errorTitle="We couldn't load the emergency status">
        {(data) => {
          const liveHere = selected ? data.active.find((emergency) => emergency.ecosystem_id === selected.id) : undefined;
          const canDeclare = !!selected && data.caller_can_declare_in.includes(selected.id);
          return (
            <>
              {data.active.length > 0
                ? data.active.map((emergency) => <LiveEmergencyCard key={emergency.id} emergency={emergency} />)
                : (
                  <Card>
                    <CardContent className="flex items-center gap-3 pt-6 text-sm">
                      <ShieldCheck className="h-5 w-5 text-success" aria-hidden="true" />
                      No emergency is open. Governance is running normally.
                    </CardContent>
                  </Card>
                )}

              {selected && canDeclare && <DeclareForm overview={data} ecosystemId={selected.id} ecosystemName={selected.name} />}
              {selected && !canDeclare && !liveHere && (
                <p className="text-sm text-muted-foreground">Only active members of {selected.name} can declare an emergency there.</p>
              )}
              {!selected && <p className="text-sm text-muted-foreground">Choose an ecosystem to declare an emergency in.</p>}

              <Card>
                <CardHeader><CardTitle className="text-lg">History</CardTitle></CardHeader>
                <CardContent>
                  {data.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No emergencies have been declared here.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Declared</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Declared by</TableHead>
                          <TableHead>Co-signed by</TableHead>
                          <TableHead>Closed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell><Link href={`/emergency/${item.id}`} className="underline underline-offset-4">{when(item.declared_at)}</Link></TableCell>
                            <TableCell>{emergencyPhaseLabel(item.phase)}</TableCell>
                            <TableCell>{item.declared_by ?? '—'}</TableCell>
                            <TableCell>{item.co_signed_by ?? '—'}</TableCell>
                            <TableCell>{day(item.closed_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          );
        }}
      </QueryState>
    </div>
  );
}
