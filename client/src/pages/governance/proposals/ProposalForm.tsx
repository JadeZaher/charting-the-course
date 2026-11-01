import { useState, useEffect, useRef } from 'react';
import { Link, useRoute, useLocation, useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AITextarea } from '@/components/ui/ai-textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { EcosystemMultiSelect } from '@/components/EcosystemMultiSelect';
import { useProposal, useCreateProposal, useUpdateProposal, useAgreements, useAgreement } from '@/hooks/use-governance';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DECISION_TYPE_OPTIONS, PROPOSAL_TYPE_OPTIONS, proposalEditLock } from '@/lib/proposal-vocab';
import { URGENCY_OPTIONS } from '@/lib/urgency';
import { ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { apiErrorMessage } from '@/lib/api-error-message';

// Agreements a proposal may follow or amend: those in force (api/proposals.py IN_FORCE_AGREEMENT_STATUSES).
const IN_FORCE = ['active', 'under_review'];

export default function ProposalForm() {
  const [, editParams] = useRoute('/proposals/:id/edit');
  const editId = editParams?.id;
  const isEdit = !!editId;

  const [, navigate] = useLocation();
  // "Propose a change" on an agreement opens /proposals/new?amends=<agreement id>.
  const search = useSearch();
  const amendsParam = isEdit ? '' : new URLSearchParams(search).get('amends') ?? '';
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
  const [minAdviceRounds, setMinAdviceRounds] = useState('1');
  const [consentRequired, setConsentRequired] = useState(true);
  const [consentQuorum, setConsentQuorum] = useState('');
  const [testCases, setTestCases] = useState('');
  const [governingAgreementId, setGoverningAgreementId] = useState('');
  const [declareGates, setDeclareGates] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { data: agreementsData } = useAgreements({ per_page: '100' });
  const { member } = useAuth();
  const proposerPrefilled = useRef(false);
  const amendsId = isEdit ? existing?.amends_agreement_id ?? '' : amendsParam;
  const { data: amended } = useAgreement(amendsId);
  const amendPrefilled = useRef(false);
  const inForceAgreements = (agreementsData?.items ?? []).filter((a) => IN_FORCE.includes(a.status));
  const selectedDecisionType = DECISION_TYPE_OPTIONS.find((o) => o.value === decisionType);

  // A change proposal starts from the agreement's current text, ready to edit.
  useEffect(() => {
    if (isEdit || amendPrefilled.current || !amended) return;
    amendPrefilled.current = true;
    setTitle((current) => current || `Change “${amended.title}”`);
    setProposedChange((current) => current || amended.text || '');
  }, [isEdit, amended]);

  // New proposals default the proposer to the caller (still editable, e.g. proposing on someone's behalf).
  const callerDisplayName = member?.display_name ?? '';
  useEffect(() => {
    if (isEdit || proposerPrefilled.current || !callerDisplayName) return;
    proposerPrefilled.current = true;
    setProposer((current) => current || callerDisplayName);
  }, [isEdit, callerDisplayName]);

  useEffect(() => {
    if (existing && isEdit) {
      setTitle(existing.title);
      setType(existing.type);
      // Legacy 'advice'/'autocratic' decided nothing; they show as the consent default and are not resent.
      setDecisionType(DECISION_TYPE_OPTIONS.some((o) => o.value === existing.decision_type) ? existing.decision_type ?? '' : '');
      setProposer(existing.proposer || '');
      setAffectedDomain(existing.affected_domain || '');
      setUrgency(existing.urgency || 'medium');
      setProposedChange(existing.proposed_change || '');
      setRationale(existing.rationale || '');
      setAdviceDeadline(existing.advice_deadline || '');
      setSharedEcosystemIds(existing.shared_ecosystem_ids ?? []);
      setGoverningAgreementId(existing.governing_agreement_id ?? '');
      const stored = existing.own_act_policy;
      setDeclareGates(stored != null);
      const policy = stored ?? existing.act_policy;
      if (policy) {
        setMinAdviceRounds(String(policy.min_advice_rounds ?? 1));
        setConsentRequired(policy.consent_required ?? true);
        setConsentQuorum(policy.consent_quorum != null ? String(policy.consent_quorum) : '');
        setTestCases((policy.test_cases ?? []).join('\n'));
      }
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
      affected_domain: affectedDomain || null,
      urgency: urgency || null,
      proposed_change: proposedChange || null,
      rationale: rationale || null,
      advice_deadline: adviceDeadline || null,
      shared_ecosystem_ids: sharedEcosystemIds,
      act_policy: declareGates
        ? {
            min_advice_rounds: Math.max(0, parseInt(minAdviceRounds, 10) || 0),
            consent_required: consentRequired,
            consent_quorum: consentQuorum.trim() ? Math.max(1, parseInt(consentQuorum, 10) || 1) : null,
            test_cases: testCases.split('\n').map((c) => c.trim()).filter(Boolean),
          }
        : null,
      governing_agreement_id: governingAgreementId || null,
    };
    if (amendsId) payload.amends_agreement_id = amendsId;

    if (!isEdit) {
      // Proposer is set once at creation; PUT does not accept it.
      payload.proposer = proposer.trim() || null;
      if (selectedEcosystem) payload.ecosystem_id = selectedEcosystem.id;
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
  const editLocked = isEdit && existing != null && !existing.caller_can_manage;
  // Members decide on the text from consent on; the server refuses edits there too (409).
  const stageLock = isEdit && existing != null ? proposalEditLock(existing.status) : null;
  // A proposal with a linked author: only that author moves the advice deadline (server: 403).
  const deadlineAuthorOnly = isEdit && existing != null && !!existing.proposer_member_id && !existing.caller_is_proposer;

  return (
    <div className="space-y-6 max-w-2xl">
      <Button asChild variant="ghost" size="sm">
        <Link href={isEdit ? `/proposals/${editId}` : '/proposals'}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isEdit ? 'Back to Proposal' : 'Back to Proposals'}
        </Link>
      </Button>

      <h1 className="text-3xl font-bold">{isEdit ? 'Edit Proposal' : 'New Proposal'}</h1>

      {amendsId && (
        <div role="note" className="rounded-none border-2 border-strong-border bg-muted p-3 text-sm">
          {amended ? (
            <>
              This proposal changes the agreement{' '}
              <Link href={`/agreements/${amended.id}`} className="font-medium underline underline-offset-2">
                {amended.title}
              </Link>{' '}
              (v{amended.version}). Write the full new text under Proposed Change. Once ratified, a steward registers it
              as the next version and members consent to it again.
            </>
          ) : (
            'This proposal changes an existing agreement.'
          )}
        </div>
      )}

      {editLocked && (
        <div role="status" className="rounded-none border-2 border-strong-border bg-muted p-3 text-sm text-muted-foreground">
          Only the proposer or an ecosystem steward can edit this proposal.
        </div>
      )}

      {stageLock && (
        <div role="status" className="rounded-none border-2 border-strong-border bg-muted p-3 text-sm text-muted-foreground">
          {stageLock}{' '}
          <Link href={`/proposals/${editId}`} className="font-medium underline underline-offset-2">Back to the proposal</Link>
        </div>
      )}

      {mutationError && (
        <div role="alert" className="rounded-none border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {apiErrorMessage(mutationError)}
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
                  <SelectTrigger
                    id="type"
                    aria-required="true"
                    aria-invalid={errors.type ? true : undefined}
                    aria-describedby={errors.type ? 'type-error' : undefined}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPOSAL_TYPE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p id="type-error" className="text-sm text-destructive">{errors.type}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="decision_type">Decision Type</Label>
                <Select value={decisionType} onValueChange={setDecisionType}>
                  <SelectTrigger id="decision_type" aria-describedby="decision_type-hint">
                    <SelectValue placeholder="Consent (default)" />
                  </SelectTrigger>
                  <SelectContent>
                    {DECISION_TYPE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p id="decision_type-hint" className="text-xs text-muted-foreground">
                  {selectedDecisionType?.hint ?? DECISION_TYPE_OPTIONS[0].hint}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proposer">Proposer</Label>
                {isEdit ? (
                  <>
                    <Input id="proposer" value={proposer || 'Not recorded'} readOnly aria-describedby="proposer-hint" className="bg-muted" />
                    <p id="proposer-hint" className="text-xs text-muted-foreground">Set when the proposal was created; it cannot be changed here.</p>
                  </>
                ) : (
                  <>
                    <Input id="proposer" value={proposer} onChange={(e) => setProposer(e.target.value)} placeholder="Proposer name" aria-describedby="proposer-hint" />
                    <p id="proposer-hint" className="text-xs text-muted-foreground">Defaults to you. Change it if you are proposing on someone's behalf.</p>
                  </>
                )}
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
                  <SelectTrigger id="urgency">
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
                <Input id="advice_deadline" type="date" value={adviceDeadline} disabled={deadlineAuthorOnly}
                  onChange={(e) => setAdviceDeadline(e.target.value)} />
                {deadlineAuthorOnly && <p className="text-xs text-muted-foreground">Only the proposer can change the advice deadline.</p>}
              </div>
            </div>

            <div className="space-y-3 border-2 border-strong-border p-4">
              <div>
                <p className="text-sm font-medium">ACT Gates</p>
                <p className="text-xs text-muted-foreground">
                  Gates are inherited from the governing agreement by default; declare them on this
                  proposal only to override. You close advice when you are ready; consent moves to Test by
                  itself once its gate is met; a steward confirms ratification.
                  {isEdit && existing && !['draft', 'advice'].includes(existing.status) && (
                    <span className="block mt-1 text-warning">Locked — gates can only be redeclared while the proposal is in draft or advice.</span>
                  )}
                </p>
              </div>
              {(() => {
                const locked = isEdit && existing ? !['draft', 'advice'].includes(existing.status) : false;
                return (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="governing_agreement">Governing agreement</Label>
                      <Select value={governingAgreementId || 'none'} onValueChange={(v) => setGoverningAgreementId(v === 'none' ? '' : v)} disabled={locked}>
                        <SelectTrigger id="governing_agreement">
                          <SelectValue placeholder="None — use default gates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None — use default gates</SelectItem>
                          {inForceAgreements.map((a) => (
                            <SelectItem key={a.id} value={a.id}>{a.title} ({a.agreement_id})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        The agreement in force (e.g. the decision-making protocol) whose declared gates this
                        proposal follows, quorum included. It is not the agreement this proposal changes.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="declare_gates" checked={declareGates} onCheckedChange={(v) => setDeclareGates(v === true)} disabled={locked} />
                      <Label htmlFor="declare_gates" className="text-sm font-normal">
                        Declare gates on this proposal (override the inherited gates)
                      </Label>
                    </div>
                    <fieldset disabled={locked || !declareGates} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="min_advice_rounds">Minimum advice rounds</Label>
                          <Input id="min_advice_rounds" type="number" min={0} value={minAdviceRounds} onChange={(e) => setMinAdviceRounds(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="consent_quorum">Consent quorum (optional)</Label>
                          <Input id="consent_quorum" type="number" min={1} value={consentQuorum} onChange={(e) => setConsentQuorum(e.target.value)} placeholder="1 position" aria-describedby="consent_quorum-hint" />
                          <p id="consent_quorum-hint" className="text-xs text-muted-foreground">Blank: the governing agreement's quorum, else 1 position.</p>
                        </div>
                        <div className="flex items-end gap-2 pb-2">
                          <Checkbox id="consent_required" checked={consentRequired} onCheckedChange={(v) => setConsentRequired(v === true)} />
                          <Label htmlFor="consent_required" className="text-sm font-normal">Consent round required</Label>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="test_cases">Declared test cases (one per line)</Label>
                        <AITextarea
                          id="test_cases"
                          value={testCases}
                          onChange={(e) => setTestCases(e.target.value)}
                          placeholder={"Participation rate above 60% of eligible members\nNo unresolved objections during test period"}
                          rows={3}
                          fieldLabel="Declared test cases"
                          fieldContext="Success criteria a governance proposal must demonstrate during its test phase before it can be ratified"
                        />
                      </div>
                    </fieldset>
                  </>
                );
              })()}
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
              <Button type="submit" disabled={isPending || editLocked || stageLock !== null}>
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
