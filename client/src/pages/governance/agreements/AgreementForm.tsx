import { useState, useEffect } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AITextarea } from '@/components/ui/ai-textarea';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { EcosystemMultiSelect } from '@/components/EcosystemMultiSelect';
import { useAgreement, useCreateAgreement, useDomains, useUpdateAgreement } from '@/hooks/use-governance';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useToast } from '@/hooks/use-toast';
import { AGREEMENT_TYPE_OPTIONS } from '@/lib/agreement-type';
import { ArrowLeft } from 'lucide-react';

const HIERARCHY_OPTIONS = [
  { value: 'foundational', label: 'Foundational' },
  { value: 'operational', label: 'Operational' },
  { value: 'domain', label: 'Domain' },
  { value: 'local', label: 'Local' },
];

const PREREQUISITE_OPTIONS = [
  { value: 'ecosystem', label: 'Ecosystem membership' },
  { value: 'domain', label: 'Domain participation' },
  { value: 'collaboration', label: 'Collaboration proposals and activation' },
] as const;

export default function AgreementForm() {
  const [, editParams] = useRoute('/agreements/:id/edit');
  const editId = editParams?.id;
  const isEdit = !!editId;

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { selected: selectedEcosystem } = useEcosystem();
  const { data: existing, isLoading: loadingExisting } = useAgreement(editId ?? '');
  const createMutation = useCreateAgreement();
  const updateMutation = useUpdateAgreement(editId ?? '');
  const agreementEcosystemId = isEdit ? existing?.ecosystem_id ?? '' : selectedEcosystem?.id ?? '';
  const { data: domainsData } = useDomains(
    agreementEcosystemId ? { ecosystem_id: agreementEcosystemId, per_page: '100' } : { per_page: '100' },
  );

  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [text, setText] = useState('');
  const [proposer, setProposer] = useState('');
  const [domain, setDomain] = useState('');
  const [hierarchyLevel, setHierarchyLevel] = useState('operational');
  const [reviewDate, setReviewDate] = useState('');
  const [sunsetDate, setSunsetDate] = useState('');
  const [sharedEcosystemIds, setSharedEcosystemIds] = useState<string[]>([]);
  const [prerequisiteScopes, setPrerequisiteScopes] = useState<string[]>([]);
  const [prerequisiteDomainIds, setPrerequisiteDomainIds] = useState<string[]>([]);
  const [alignmentPoints, setAlignmentPoints] = useState('5');
  const [minAdviceRounds, setMinAdviceRounds] = useState('1');
  const [actTestCases, setActTestCases] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing && isEdit) {
      setTitle(existing.title);
      setType(existing.type);
      setText(existing.text || '');
      setProposer(existing.proposer || '');
      setDomain(existing.domain || '');
      setHierarchyLevel(existing.hierarchy_level);
      setReviewDate(existing.review_date || '');
      setSunsetDate(existing.sunset_date || '');
      setSharedEcosystemIds(existing.shared_ecosystem_ids ?? []);
      setPrerequisiteScopes(existing.prerequisite_scopes ?? []);
      setPrerequisiteDomainIds(existing.prerequisite_domain_ids ?? []);
      setAlignmentPoints(String(existing.alignment_points ?? 5));
      const policy = existing.act_policy;
      if (policy) {
        setMinAdviceRounds(String(policy.min_advice_rounds ?? 1));
        setActTestCases((policy.test_cases ?? []).join('\n'));
      }
    }
  }, [existing, isEdit]);

  if (isEdit && loadingExisting) return <LoadingState message="Loading agreement..." />;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!type) errs.type = 'Type is required';
    const parsedAlignment = Number(alignmentPoints);
    if (!Number.isInteger(parsedAlignment) || parsedAlignment < 0 || parsedAlignment > 25) {
      errs.alignmentPoints = 'Alignment points must be a whole number from 0 to 25';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, any> = {
      title: title.trim(),
      type,
      text: text || null,
      proposer: proposer || null,
      domain: domain || null,
      hierarchy_level: hierarchyLevel,
      review_date: reviewDate || null,
      sunset_date: sunsetDate || null,
      shared_ecosystem_ids: sharedEcosystemIds,
      requires_explicit_consent: true,
      prerequisite_scopes: prerequisiteScopes,
      prerequisite_domain_ids: prerequisiteDomainIds,
      alignment_points: Number(alignmentPoints) || 0,
      act_policy: {
        min_advice_rounds: Math.max(0, parseInt(minAdviceRounds, 10) || 0),
        consent_required: true,
        consent_quorum: null,
        test_cases: actTestCases.split('\n').map((c) => c.trim()).filter(Boolean),
      },
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
      toast({ title: isEdit ? 'Agreement updated' : 'Agreement created', description: 'Your agreement has been saved successfully.' });
      navigate(`/agreements/${result.id}`);
    } catch {
      // Error handled by mutation state
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;
  const supportsTargeting = prerequisiteScopes.some((scope) => scope === 'domain' || scope === 'collaboration');
  const eligibleDomains = (domainsData?.items ?? []).filter((item) => item.ecosystem_id === agreementEcosystemId);

  return (
    <div className="space-y-6 max-w-2xl">
      <Button asChild variant="ghost" size="sm">
        <Link href={isEdit ? `/agreements/${editId}` : '/agreements'}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isEdit ? 'Back to Agreement' : 'Back to Agreements'}
        </Link>
      </Button>

      <h1 className="text-3xl font-bold">{isEdit ? 'Edit Agreement' : 'New Agreement'}</h1>

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

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {AGREEMENT_TYPE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="text">Agreement Text</Label>
              <AITextarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Full agreement text..."
                rows={10}
                fieldLabel="Agreement Text"
                fieldContext="The full text of a governance agreement that defines rules, policies, or commitments for the organization"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proposer">Proposer</Label>
                <Input
                  id="proposer"
                  value={proposer}
                  onChange={(e) => setProposer(e.target.value)}
                  placeholder="Proposer name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="Domain"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hierarchy">Hierarchy Level</Label>
              <Select value={hierarchyLevel} onValueChange={setHierarchyLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HIERARCHY_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="review_date">Review Date</Label>
                <Input
                  id="review_date"
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sunset_date">Sunset Date</Label>
                <Input
                  id="sunset_date"
                  type="date"
                  value={sunsetDate}
                  onChange={(e) => setSunsetDate(e.target.value)}
                />
              </div>
            </div>

            <EcosystemMultiSelect
              label="Cross-Ecosystem Sharing"
              description="Select additional ecosystems this applies to."
              primaryId={isEdit ? existing?.ecosystem_id ?? '' : selectedEcosystem?.id ?? ''}
              sharedIds={sharedEcosystemIds}
              onPrimaryChange={() => {}}
              onSharedChange={setSharedEcosystemIds}
            />

            <div className="space-y-4 border-t-2 border-strong-border pt-5">
              <div className="border border-border p-3 text-sm">
                <p className="font-medium">Explicit individual consent is mandatory</p>
                <p className="mt-1 text-muted-foreground">
                  The agreement cannot complete its consent ceremony until every participating member has personally attested.
                </p>
              </div>

              <div className="space-y-3 border-2 border-strong-border p-4">
                <div>
                  <p className="text-sm font-medium">ACT Gates</p>
                  <p className="text-xs text-muted-foreground">
                    Declared at the agreement level: the advice rounds and test evidence this agreement
                    must complete. Status moves automatically when the conditions are met.
                    {isEdit && existing && !['draft', 'advice'].includes(existing.status) && (
                      <span className="block mt-1 text-warning">Gates apply on save only while the agreement is in draft or advice.</span>
                    )}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_advice_rounds">Minimum advice rounds</Label>
                    <Input id="min_advice_rounds" type="number" min={0} value={minAdviceRounds} onChange={(e) => setMinAdviceRounds(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="act_test_cases">Declared test cases (one per line)</Label>
                  <AITextarea
                    id="act_test_cases"
                    value={actTestCases}
                    onChange={(e) => setActTestCases(e.target.value)}
                    placeholder={"Pilot completed in one domain\nReview notes logged to the decision record"}
                    rows={3}
                    fieldLabel="Declared test cases"
                    fieldContext="Test evidence an agreement must produce during its test stage before it can be activated"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Use this agreement as a participation prerequisite</Label>
                <p className="text-sm text-muted-foreground">
                  Members must hold current consent before entering the selected forms of participation.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PREREQUISITE_OPTIONS.map((option) => {
                    const checked = prerequisiteScopes.includes(option.value);
                    return (
                      <div key={option.value} className="flex min-h-11 items-center gap-3 border border-border p-3 text-sm">
                        <Checkbox
                          id={`prerequisite-${option.value}`}
                          checked={checked}
                          onCheckedChange={(next) => setPrerequisiteScopes((scopes) => (
                            next === true
                              ? Array.from(new Set([...scopes, option.value]))
                              : scopes.filter((scope) => scope !== option.value)
                          ))}
                        />
                        <Label htmlFor={`prerequisite-${option.value}`}>{option.label}</Label>
                      </div>
                    );
                  })}
                </div>

                {supportsTargeting && (
                  <div className="space-y-2">
                    <Label>Limit the domain and collaboration gates</Label>
                    <p className="text-sm text-muted-foreground">
                      Leave all domains unchecked to apply this prerequisite across the ecosystem.
                    </p>
                    {eligibleDomains.length ? (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {eligibleDomains.map((eligibleDomain) => {
                          const checked = prerequisiteDomainIds.includes(eligibleDomain.id);
                          return (
                            <div key={eligibleDomain.id} className="flex min-h-11 items-center gap-3 border border-border p-3 text-sm">
                              <Checkbox
                                id={`prerequisite-domain-${eligibleDomain.id}`}
                                checked={checked}
                                onCheckedChange={(next) => setPrerequisiteDomainIds((ids) => (
                                  next === true
                                    ? Array.from(new Set([...ids, eligibleDomain.id]))
                                    : ids.filter((domainId) => domainId !== eligibleDomain.id)
                                ))}
                              />
                              <Label htmlFor={`prerequisite-domain-${eligibleDomain.id}`}>{eligibleDomain.domain_id}</Label>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="border border-border p-3 text-sm text-muted-foreground">No domains are available yet; this prerequisite will apply across the ecosystem.</p>
                    )}
                  </div>
                )}
              </div>

              <div className="max-w-xs space-y-2">
                <Label htmlFor="alignment-points">Alignment earned per consent</Label>
                <Input
                  id="alignment-points"
                  type="number"
                  min="0"
                  max="25"
                  value={alignmentPoints}
                  onChange={(event) => setAlignmentPoints(event.target.value)}
                />
                <p className="text-sm text-muted-foreground">Recorded in the member's auditable alignment ledger.</p>
                {errors.alignmentPoints && <p className="text-sm text-destructive">{errors.alignmentPoints}</p>}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : (isEdit ? 'Update Agreement' : 'Create Agreement')}
              </Button>
              <Button asChild variant="outline">
                <Link href={isEdit ? `/agreements/${editId}` : '/agreements'}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
