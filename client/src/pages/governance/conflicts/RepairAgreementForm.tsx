import { useState } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { createRepairAgreement } from '@/lib/api-client';

interface Commitment {
  description: string;
  responsible_party: string;
  deadline: string;
}

export default function RepairAgreementForm() {
  const [, params] = useRoute('/conflicts/:conflictId/repair-agreements/new');
  const conflictId = params?.conflictId ?? '';
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [parties, setParties] = useState<string[]>(['']);
  const [commitments, setCommitments] = useState<Commitment[]>([
    { description: '', responsible_party: '', deadline: '' },
  ]);
  const [reviewDate, setReviewDate] = useState('');
  const [facilitatorNotes, setFacilitatorNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: Record<string, any>) => createRepairAgreement(conflictId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conflicts', conflictId] });
      toast({
        title: 'Repair agreement created',
        description: 'The repair agreement has been saved.',
      });
      navigate(`/conflicts/${conflictId}`);
    },
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    const validCommitments = commitments.filter((c) => c.description.trim());
    if (validCommitments.length === 0)
      errs.commitments = 'At least one commitment with a description is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: title.trim(),
      parties: parties.filter((p) => p.trim()),
      commitments: commitments
        .filter((c) => c.description.trim())
        .map((c) => ({
          ...c,
          status: 'pending',
        })),
      review_date: reviewDate || null,
      facilitator_notes: facilitatorNotes.trim() || null,
    };

    try {
      await mutation.mutateAsync(payload);
    } catch {
      // Error handled by mutation state
    }
  };

  const updateParty = (idx: number, value: string) => {
    const updated = [...parties];
    updated[idx] = value;
    setParties(updated);
  };

  const removeParty = (idx: number) => {
    setParties(parties.filter((_, i) => i !== idx));
  };

  const updateCommitment = (idx: number, field: keyof Commitment, value: string) => {
    const updated = [...commitments];
    updated[idx] = { ...updated[idx], [field]: value };
    setCommitments(updated);
  };

  const removeCommitment = (idx: number) => {
    setCommitments(commitments.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/conflicts/${conflictId}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Conflict
        </Link>
      </Button>

      <h1 className="text-3xl font-bold">New Repair Agreement</h1>

      {mutation.error && (
        <div className="rounded-none border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {(mutation.error as Error).message}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border border-info bg-info/10 p-5 text-info">
              <p className="text-sm font-bold">
                Building a Path to Repair
              </p>
              <p className="mt-1 text-sm">
                This agreement captures the commitments made to address harm and rebuild trust.
                Each commitment should be specific, measurable, and have a clear timeline.
              </p>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Agreement title"
                required
                aria-required="true"
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            {/* Parties */}
            <div className="space-y-2">
              <Label>Parties</Label>
              <div className="space-y-2">
                {parties.map((party, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      value={party}
                      onChange={(e) => updateParty(idx, e.target.value)}
                      placeholder="Party name"
                    />
                    {parties.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeParty(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setParties([...parties, ''])}
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Party
                </Button>
              </div>
            </div>

            {/* Commitments */}
            <div className="space-y-2">
              <Label>Commitments *</Label>
              {errors.commitments && (
                <p className="text-sm text-destructive">{errors.commitments}</p>
              )}
              <div className="space-y-3">
                {commitments.map((c, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 items-start"
                  >
                    <div className="space-y-1">
                      <Input
                        placeholder="What needs to happen"
                        value={c.description}
                        onChange={(e) => updateCommitment(idx, 'description', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Input
                        placeholder="Who is responsible"
                        value={c.responsible_party}
                        onChange={(e) =>
                          updateCommitment(idx, 'responsible_party', e.target.value)
                        }
                      />
                    </div>
                    <Input
                      type="date"
                      value={c.deadline}
                      onChange={(e) => updateCommitment(idx, 'deadline', e.target.value)}
                      className="w-auto"
                    />
                    {commitments.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeCommitment(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCommitments([
                      ...commitments,
                      { description: '', responsible_party: '', deadline: '' },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-1" /> Add Commitment
                </Button>
              </div>
            </div>

            {/* Review Date */}
            <div className="space-y-2">
              <Label htmlFor="review_date">Review Date</Label>
              <Input
                id="review_date"
                type="date"
                value={reviewDate}
                onChange={(e) => setReviewDate(e.target.value)}
              />
            </div>

            {/* Facilitator Notes */}
            <div className="space-y-2">
              <Label htmlFor="facilitator_notes">Facilitator Notes</Label>
              <Textarea
                id="facilitator_notes"
                value={facilitatorNotes}
                onChange={(e) => setFacilitatorNotes(e.target.value)}
                placeholder="Notes from the facilitator..."
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Create Agreement'}
              </Button>
              <Button asChild variant="outline">
                <Link href={`/conflicts/${conflictId}`}>
                  Cancel
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
