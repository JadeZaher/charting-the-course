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
import { useDomain, useCreateDomain, useMembers, useUpdateDomain } from '@/hooks/use-governance';
import { Textarea } from '@/components/ui/textarea';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useToast } from '@/hooks/use-toast';
import { ApiFetchError } from '@/lib/api-client';
import { ArrowLeft } from 'lucide-react';
import { apiErrorMessage } from '@/lib/api-error-message';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];
const NO_STEWARD = 'none';
const MIN_REASON_LENGTH = 8;

export default function DomainForm() {
  const [, editParams] = useRoute('/domains/:id/edit');
  const editId = editParams?.id;
  const isEdit = !!editId;

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { selected: selectedEcosystem } = useEcosystem();
  const { data: existing, isLoading: loadingExisting } = useDomain(editId ?? '');
  const createMutation = useCreateDomain();
  const updateMutation = useUpdateDomain(editId ?? '');
  const members = useMembers({ status: 'active', per_page: '100' });

  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  // FX-Maint: the steward is a member (steward_id); the name members see follows it on the server.
  const [stewardId, setStewardId] = useState(NO_STEWARD);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('draft');
  const [metricDefinitions, setMetricDefinitions] = useState('');
  const [sharedEcosystemIds, setSharedEcosystemIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing && isEdit) {
      // Legacy rows have no stored name: seed the field with the derived label unless that is just the code.
      setName(existing.name ?? (existing.display_name !== existing.domain_id ? existing.display_name : ''));
      setPurpose(existing.purpose || '');
      setStewardId(existing.steward_id ?? NO_STEWARD);
      setStatus(existing.status || 'draft');
      setMetricDefinitions(
        typeof existing.metric_definitions === 'string'
          ? existing.metric_definitions
          : existing.metric_definitions
            ? JSON.stringify(existing.metric_definitions, null, 2)
            : '',
      );
      setSharedEcosystemIds(existing.shared_ecosystem_ids ?? []);
    }
  }, [existing, isEdit]);

  if (isEdit && loadingExisting) return <LoadingState message="Loading domain..." />;

  // Who holds a domain and whether it continues: a steward of the ecosystem who does not steward it, with a reason.
  const canChangeAuthority = !isEdit || (existing?.caller_can_change_authority ?? false);
  const stewardChanged = isEdit && (existing?.steward_id ?? NO_STEWARD) !== stewardId;
  const statusChanged = isEdit && (existing?.status ?? status) !== status;
  const needsReason = stewardChanged || statusChanged;
  const ecosystemId = isEdit ? existing?.ecosystem_id : selectedEcosystem?.id;
  const stewardOptions = (members.data?.items ?? []).filter((member) => member.ecosystem_id === ecosystemId);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    else if (name.trim().length > 200) errs.name = 'Name must be 200 characters or fewer';
    if (!purpose.trim()) errs.purpose = 'Purpose is required';
    if (needsReason && reason.trim().length < MIN_REASON_LENGTH) {
      errs.reason = `Give a reason for the change (at least ${MIN_REASON_LENGTH} characters); it is recorded.`;
    }
    setErrors(errs);
    const firstInvalidId = errs.name ? 'name' : errs.purpose ? 'purpose' : errs.reason ? 'authority_reason' : null;
    if (firstInvalidId) window.requestAnimationFrame(() => document.getElementById(firstInvalidId)?.focus());
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, any> = {
      name: name.trim(),
      purpose: purpose.trim(),
      metric_definitions: metricDefinitions || null,
      shared_ecosystem_ids: sharedEcosystemIds,
    };
    if (!isEdit && stewardId !== NO_STEWARD) payload.steward_id = stewardId;
    if (stewardChanged && stewardId !== NO_STEWARD) payload.steward_id = stewardId;
    if (statusChanged) payload.status = status;
    if (needsReason) payload.reason = reason.trim();

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
      toast({ title: isEdit ? 'Domain updated' : 'Domain created', description: 'Domain has been saved successfully.' });
      navigate(`/domains/${result.id}`);
    } catch {
      // Error handled by mutation state
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;
  const editLocked = isEdit && existing != null && !existing.caller_can_edit;
  const mutationMessage = mutationError instanceof ApiFetchError && mutationError.status === 403 && !isEdit
    ? 'Only an ecosystem steward (moderator or above) can create a domain. Ask a steward to create it, or to give you the moderator role.'
    : mutationError ? apiErrorMessage(mutationError) : undefined;

  return (
    <div className="space-y-6 max-w-2xl">
      <Button asChild variant="ghost" size="sm">
        <Link href={isEdit ? `/domains/${editId}` : '/domains'}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isEdit ? 'Back to Domain' : 'Back to Domains'}
        </Link>
      </Button>

      <h1 className="text-3xl font-bold">{isEdit ? 'Edit Domain' : 'New Domain'}</h1>

      {editLocked && (
        <div role="status" className="rounded-none border-2 border-strong-border bg-muted p-3 text-sm text-muted-foreground">
          Only this domain's steward or an ecosystem steward can edit this domain.
        </div>
      )}

      {mutationError && (
        <div role="alert" className="rounded-none border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {mutationMessage}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Community Kitchen"
                maxLength={200}
                aria-required="true"
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? 'name-hint name-error' : 'name-hint'}
              />
              <p id="name-hint" className="text-xs text-muted-foreground">How members will find and recognise this domain.</p>
              {errors.name && <p id="name-error" className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose *</Label>
              <AITextarea
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Domain purpose..."
                rows={5}
                aria-required="true"
                aria-invalid={errors.purpose ? true : undefined}
                aria-describedby={errors.purpose ? 'purpose-error' : undefined}
                fieldLabel="Purpose"
                fieldContext="The purpose and scope of a governance domain within the organization"
              />
              {errors.purpose && <p id="purpose-error" className="text-sm text-destructive">{errors.purpose}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="steward_id">Steward</Label>
              <Select value={stewardId} onValueChange={setStewardId} disabled={!canChangeAuthority}>
                <SelectTrigger id="steward_id" className="min-h-11">
                  <SelectValue placeholder="Choose a member" />
                </SelectTrigger>
                <SelectContent>
                  {(!isEdit || !existing?.steward_id) && <SelectItem value={NO_STEWARD}>No steward yet</SelectItem>}
                  {existing?.steward_id && !stewardOptions.some((m) => m.id === existing.steward_id) && (
                    <SelectItem value={existing.steward_id}>{existing.current_steward ?? 'Current steward'}</SelectItem>
                  )}
                  {stewardOptions.map((member) => (
                    <SelectItem key={member.id} value={member.id}>{member.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isEdit && !existing?.steward_id && existing?.current_steward && (
                <p className="text-xs text-muted-foreground">Shown today as “{existing.current_steward}”, who is not linked to a member.</p>
              )}
              {members.error && <p className="text-sm text-destructive">{apiErrorMessage(members.error)}</p>}
            </div>

            {/* A new domain starts active (the server sets it); status changes are an edit, with a reason. */}
            {isEdit && <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus} disabled={!canChangeAuthority}>
                <SelectTrigger id="status" className="min-h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!canChangeAuthority && (
                <p className="text-xs text-muted-foreground">
                  A steward of this ecosystem who does not steward this domain changes its steward or status, with a recorded reason.
                </p>
              )}
            </div>}

            {needsReason && (
              <div className="space-y-2">
                <Label htmlFor="authority_reason">Why change the {stewardChanged && statusChanged ? 'steward and status' : stewardChanged ? 'steward' : 'status'}? *</Label>
                <Textarea
                  id="authority_reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  aria-required="true"
                  aria-invalid={errors.reason ? true : undefined}
                  aria-describedby={errors.reason ? 'authority-reason-hint authority-reason-error' : 'authority-reason-hint'}
                />
                <p id="authority-reason-hint" className="text-xs text-muted-foreground">It is recorded in the decision registry.</p>
                {errors.reason && <p id="authority-reason-error" className="text-sm text-destructive">{errors.reason}</p>}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="metric_definitions">Metric Definitions</Label>
              <AITextarea
                id="metric_definitions"
                value={metricDefinitions}
                onChange={(e) => setMetricDefinitions(e.target.value)}
                placeholder="Define metrics for this domain..."
                rows={4}
                fieldLabel="Metric Definitions"
                fieldContext="Measurable metrics that define success for this governance domain"
              />
            </div>

            <EcosystemMultiSelect
              label="Cross-Ecosystem Sharing"
              description="Select additional ecosystems this applies to."
              primaryId={isEdit ? existing?.ecosystem_id ?? '' : selectedEcosystem?.id ?? ''}
              sharedIds={sharedEcosystemIds}
              onPrimaryChange={() => {}}
              onSharedChange={setSharedEcosystemIds}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending || editLocked}>
                {isPending ? 'Saving...' : (isEdit ? 'Update Domain' : 'Create Domain')}
              </Button>
              <Button asChild variant="outline">
                <Link href={isEdit ? `/domains/${editId}` : '/domains'}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
