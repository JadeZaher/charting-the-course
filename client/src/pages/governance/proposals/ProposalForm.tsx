import { useState, useEffect } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AITextarea } from '@/components/ui/ai-textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { EcosystemMultiSelect } from '@/components/EcosystemMultiSelect';
import { useProposal, useCreateProposal, useUpdateProposal } from '@/hooks/use-governance';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useToast } from '@/hooks/use-toast';
import { PROPOSAL_TYPE_OPTIONS } from '@/lib/proposal-vocab';
import { URGENCY_OPTIONS } from '@/lib/urgency';
import { ArrowLeft } from 'lucide-react';

const DECISION_TYPE_OPTIONS = [
  { value: 'consent', label: 'Consent' },
  { value: 'consensus', label: 'Consensus' },
  { value: 'advice', label: 'Advice' },
  { value: 'autocratic', label: 'Autocratic' },
];

export default function ProposalForm() {
  const [, editParams] = useRoute('/proposals/:id/edit');
  const editId = editParams?.id;
  const isEdit = !!editId;

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { selected: selectedEcosystem } = useEcosystem();
  const { data: existing, isLoading: loadingExisting } = useProposal(editId ?? '');
  const createMutation = useCreateProposal();
  const updateMutation = useUpdateProposal(editId ?? '');

  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [decisionType, setDecisionType] = useState('');
  const [proposer, setProposer] = useState('');
  const [affectedDomain, setAffectedDomain] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [proposedChange, setProposedChange] = useState('');
  const [rationale, setRationale] = useState('');
  const [adviceDeadline, setAdviceDeadline] = useState('');
  const [sharedEcosystemIds, setSharedEcosystemIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing && isEdit) {
      setTitle(existing.title);
      setType(existing.type);
      setDecisionType(existing.decision_type || '');
      setProposer(existing.proposer || '');
      setAffectedDomain(existing.affected_domain || '');
      setUrgency(existing.urgency || 'medium');
      setProposedChange(existing.proposed_change || '');
      setRationale(existing.rationale || '');
      setAdviceDeadline(existing.advice_deadline || '');
      setSharedEcosystemIds(existing.shared_ecosystem_ids ?? []);
    }
  }, [existing, isEdit]);

  if (isEdit && loadingExisting) return <LoadingState message="Loading proposal..." />;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!type) errs.type = 'Type is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, any> = {
      title: title.trim(),
      type,
      decision_type: decisionType || null,
      proposer: proposer || null,
      affected_domain: affectedDomain || null,
      urgency: urgency || null,
      proposed_change: proposedChange || null,
      rationale: rationale || null,
      advice_deadline: adviceDeadline || null,
      shared_ecosystem_ids: sharedEcosystemIds,
    };

    if (!isEdit && selectedEcosystem) {
      payload.ecosystem_id = selectedEcosystem.id;
    }
    try {
      let result;
      if (isEdit) {
        result = await updateMutation.mutateAsync(payload);
      } else {
        result = await createMutation.mutateAsync(payload);
      }
      toast({ title: isEdit ? 'Proposal updated' : 'Proposal created', description: 'Your proposal has been saved successfully.' });
      navigate(`/proposals/${result.id}`);
    } catch {
      // Error handled by mutation state
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  return (
    <div className="space-y-6 max-w-2xl">
      <Button asChild variant="ghost" size="sm">
        <Link href={isEdit ? `/proposals/${editId}` : '/proposals'}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isEdit ? 'Back to Proposal' : 'Back to Proposals'}
        </Link>
      </Button>

      <h1 className="text-3xl font-bold">{isEdit ? 'Edit Proposal' : 'New Proposal'}</h1>

      {mutationError && (
        <div className="rounded-none border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {(mutationError as Error).message}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Proposal title" required aria-required="true" />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPOSAL_TYPE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="decision_type">Decision Type</Label>
                <Select value={decisionType} onValueChange={setDecisionType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select decision type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DECISION_TYPE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proposer">Proposer</Label>
                <Input id="proposer" value={proposer} onChange={(e) => setProposer(e.target.value)} placeholder="Proposer name" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="affected_domain">Affected Domain</Label>
                <Input id="affected_domain" value={affectedDomain} onChange={(e) => setAffectedDomain(e.target.value)} placeholder="Domain" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="urgency">Urgency</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCY_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="advice_deadline">Advice Deadline</Label>
                <Input id="advice_deadline" type="date" value={adviceDeadline} onChange={(e) => setAdviceDeadline(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposed_change">Proposed Change</Label>
              <AITextarea
                id="proposed_change"
                value={proposedChange}
                onChange={(e) => setProposedChange(e.target.value)}
                placeholder="Describe the proposed change..."
                rows={6}
                fieldLabel="Proposed Change"
                fieldContext="A governance proposal describing a change to be made in the organization"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rationale">Rationale</Label>
              <AITextarea
                id="rationale"
                value={rationale}
                onChange={(e) => setRationale(e.target.value)}
                placeholder="Why is this change needed?"
                rows={4}
                fieldLabel="Rationale"
                fieldContext="The reasoning and justification for why this governance proposal should be adopted"
              />
            </div>

            <EcosystemMultiSelect
              label="Cross-Ecosystem Sharing"
              description="Select additional ecosystems this proposal applies to."
              primaryId={isEdit ? existing?.ecosystem_id ?? '' : selectedEcosystem?.id ?? ''}
              sharedIds={sharedEcosystemIds}
              onPrimaryChange={() => {}}
              onSharedChange={setSharedEcosystemIds}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : (isEdit ? 'Update Proposal' : 'Create Proposal')}
              </Button>
              <Button asChild variant="outline">
                <Link href={isEdit ? `/proposals/${editId}` : '/proposals'}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
