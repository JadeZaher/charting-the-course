// Closing an audit's loop: abandon a draft with a reason (F6), record the stewards' response to a published audit (F7).
// See client/src/AGENTS.md "Maintenance and health (G-Maint)" > "FX-Maint".
import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FieldError } from '@/components/FieldError';
import { useProposals } from '@/hooks/use-governance';
import { useAbandonAudit, useRespondToAudit } from '@/hooks/use-health';
import { useRequiredFields } from '@/hooks/use-required-fields';
import { apiErrorMessage } from '@/lib/api-error-message';
import { formatDate } from '@/lib/utils';
import type { AuditStewardRecord, GovernanceAudit } from '@/types/api';

const MIN_NOTE_LENGTH = 8;
const NO_PROPOSAL = 'none';

/** "Abandon this draft": a reason (recorded), then the draft stops holding the "audit due" reminder. */
export function AbandonAuditButton({ audit }: { audit: GovernanceAudit }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const mutation = useAbandonAudit(audit.id);
  const fields = useRequiredFields({ reason: 'Say why the draft is abandoned.' });
  const tooShort = reason.trim().length > 0 && reason.trim().length < MIN_NOTE_LENGTH;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) { mutation.reset(); setReason(''); }
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fields.validate({ reason }) || tooShort) return;
    try {
      await mutation.mutateAsync(reason.trim());
      setOpen(false);
    } catch {
      // rendered below from mutation.error
    }
  };

  return (
    <>
      <Button type="button" variant="outline" className="min-h-11" onClick={() => handleOpenChange(true)}>Abandon this draft</Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <DialogHeader>
              <DialogTitle>Abandon this draft audit?</DialogTitle>
              <DialogDescription>
                It never counted and cannot be published afterwards. The reason is recorded, and stewards are told again
                when the next audit is due.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={`abandon-reason-${audit.id}`}>Why is it abandoned? *</Label>
              <Textarea
                id={`abandon-reason-${audit.id}`}
                rows={3}
                value={reason}
                onChange={(event) => { setReason(event.target.value); fields.settle('reason', event.target.value); }}
                {...fields.field('reason')}
              />
              <FieldError {...fields.error('reason')} />
              {tooShort && <p role="alert" className="text-sm text-destructive">The reason needs at least {MIN_NOTE_LENGTH} characters.</p>}
            </div>
            {mutation.error && <p role="alert" className="border-2 border-destructive p-3 text-sm text-destructive">{apiErrorMessage(mutation.error)}</p>}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" className="min-h-11" onClick={() => handleOpenChange(false)}>Keep the draft</Button>
              <Button type="submit" variant="destructive" className="min-h-11" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Abandon it'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** "Record the stewards' response": what the stewards will do, optionally naming a proposal of the audited ecosystem. */
export function RespondToAuditButton({ audit }: { audit: GovernanceAudit }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [proposalId, setProposalId] = useState(NO_PROPOSAL);
  const mutation = useRespondToAudit(audit.id);
  const proposals = useProposals(open ? { per_page: '100' } : false);
  const fields = useRequiredFields({ note: "Write the stewards' response." });
  const tooShort = note.trim().length > 0 && note.trim().length < MIN_NOTE_LENGTH;
  const options = (proposals.data?.items ?? []).filter((proposal) => proposal.ecosystem_id === audit.ecosystem_id);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) { mutation.reset(); setNote(''); setProposalId(NO_PROPOSAL); }
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!fields.validate({ note }) || tooShort) return;
    try {
      await mutation.mutateAsync({ note: note.trim(), ...(proposalId !== NO_PROPOSAL ? { proposal_id: proposalId } : {}) });
      setOpen(false);
    } catch {
      // rendered below from mutation.error
    }
  };

  return (
    <>
      <Button type="button" className="min-h-11" onClick={() => handleOpenChange(true)}>Record the stewards&apos; response</Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <DialogHeader>
              <DialogTitle>Record the stewards&apos; response</DialogTitle>
              <DialogDescription>
                Say what you will do about the indicators this audit rated, or why no change is needed. It is recorded
                on the audit and clears the reminder for every steward. The recommendations are advice.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor={`response-note-${audit.id}`}>The response *</Label>
              <Textarea
                id={`response-note-${audit.id}`}
                rows={4}
                value={note}
                onChange={(event) => { setNote(event.target.value); fields.settle('note', event.target.value); }}
                {...fields.field('note')}
              />
              <FieldError {...fields.error('note')} />
              {tooShort && <p role="alert" className="text-sm text-destructive">The response needs at least {MIN_NOTE_LENGTH} characters.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor={`response-proposal-${audit.id}`}>A proposal it answers with (optional)</Label>
              <Select value={proposalId} onValueChange={setProposalId}>
                <SelectTrigger id={`response-proposal-${audit.id}`} className="min-h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_PROPOSAL}>No proposal</SelectItem>
                  {options.map((proposal) => (
                    <SelectItem key={proposal.id} value={proposal.id}>{proposal.title} ({proposal.proposal_id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {proposals.error && <p className="text-sm text-destructive">{apiErrorMessage(proposals.error)}</p>}
            </div>
            {mutation.error && <p role="alert" className="border-2 border-destructive p-3 text-sm text-destructive">{apiErrorMessage(mutation.error)}</p>}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" className="min-h-11" onClick={() => handleOpenChange(false)}>Cancel</Button>
              <Button type="submit" className="min-h-11" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Record the response'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** What a steward recorded: the response (with its proposal) or why the draft was abandoned. */
export function AuditStewardRecordNote({ record, kind }: { record: AuditStewardRecord; kind: 'response' | 'abandonment' }) {
  const when = record.date ? ` on ${formatDate(record.date)}` : '';
  return (
    <div className="space-y-2 border-2 border-strong-border p-4 text-sm" role="status">
      <p className="font-semibold">
        {kind === 'response'
          ? `The stewards' response, recorded by ${record.recorded_by ?? 'a steward'}${when}`
          : `Abandoned by ${record.recorded_by ?? 'a steward'}${when}`}
      </p>
      <p className="whitespace-pre-wrap">{record.note}</p>
      {record.proposal && (
        <p>
          Proposal: <Link href={`/proposals/${record.proposal.id}`} className="underline">{record.proposal.title} ({record.proposal.proposal_id})</Link>
        </p>
      )}
    </div>
  );
}
