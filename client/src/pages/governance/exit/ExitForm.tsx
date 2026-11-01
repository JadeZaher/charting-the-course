import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useFileExit } from '@/hooks/use-exit';
import { useToast } from '@/hooks/use-toast';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { ArrowLeft } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api-error-message';

// Matches HANDOFF_DAYS in neos_agent api/exit.py; the skill caps the handoff at 30 days.
const EXIT_TYPE_OPTIONS = [
  { value: 'standard', label: 'Standard: up to 30 days to hand over' },
  { value: 'urgent', label: 'Urgent: up to 7 days to hand over' },
] as const;

type ExitType = (typeof EXIT_TYPE_OPTIONS)[number]['value'];

export default function ExitForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { selected } = useEcosystem();
  const fileExit = useFileExit();
  const [exitType, setExitType] = useState<ExitType>('standard');
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);

  const submit = async () => {
    if (!selected) return;
    try {
      const filed = await fileExit.mutateAsync({ ecosystem_id: selected.id, exit_type: exitType, reason: reason.trim() || null });
      toast({ title: 'Exit filed', description: 'A steward will start the handoff. You can withdraw it until your departure is confirmed.' });
      navigate(`/exit/${filed.id}`);
    } catch {
      setConfirming(false); // the error renders above the form
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/exit"><ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />Back to Exits</Link>
      </Button>

      <h1 className="text-3xl font-bold">Leave {selected?.name ?? 'an ecosystem'}</h1>
      {/* One story with the confirm dialog: nobody can refuse, but membership ends at the steward's confirmation (p3-needs-across-ecosystems-2). */}
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>
          Nobody can refuse your exit. You stay a member until a steward confirms your departure at the end of the
          handoff, within 30 days of filing (7 for an urgent exit). During the handoff a steward helps you hand over your
          roles and commitments, and you can withdraw your exit. You can download your governance record from the exit page.
        </p>
        <p>
          When your departure is confirmed, your open shares and needs in {selected?.name ?? 'the ecosystem'} are
          withdrawn, marked “author left”. Conversations are not deleted, but the ones you take part in as a member there
          leave your Messages.
        </p>
      </div>

      {!selected && <p className="text-sm">Choose the ecosystem you are leaving in the picker at the top of the page.</p>}

      {fileExit.error && (
        <p role="alert" className="border-2 border-destructive p-3 text-sm text-destructive">{apiErrorMessage(fileExit.error)}</p>
      )}

      {selected && (
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={(event) => { event.preventDefault(); setConfirming(true); }} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exit_type">Handoff</Label>
                <Select value={exitType} onValueChange={(value) => setExitType(value as ExitType)}>
                  <SelectTrigger id="exit_type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXIT_TYPE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exit-reason">Reason (optional)</Label>
                <Textarea id="exit-reason" rows={4} value={reason} onChange={(event) => setReason(event.target.value)}
                  aria-describedby="exit-reason-hint" />
                <p id="exit-reason-hint" className="text-xs text-muted-foreground">
                  Members of {selected.name} can read it. Leave it blank to keep your reasons to yourself.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={fileExit.isPending}>{fileExit.isPending ? 'Filing…' : 'File my exit'}</Button>
                <Button asChild variant="outline"><Link href="/exit">Cancel</Link></Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>File your exit from {selected?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Nobody can refuse it. Stewards see it and start the handoff, which ends within {exitType === 'urgent' ? '7' : '30'} days.
              You stay a member until a steward confirms your departure, and you can withdraw until then. On confirmation
              your open shares and needs there are withdrawn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void submit(); }} disabled={fileExit.isPending}>
              {fileExit.isPending ? 'Filing…' : 'Yes, file my exit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
