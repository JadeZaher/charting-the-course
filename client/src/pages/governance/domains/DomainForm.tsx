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
import { useDomain, useCreateDomain, useUpdateDomain } from '@/hooks/use-governance';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
];

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

  const [purpose, setPurpose] = useState('');
  const [currentSteward, setCurrentSteward] = useState('');
  const [status, setStatus] = useState('draft');
  const [metricDefinitions, setMetricDefinitions] = useState('');
  const [sharedEcosystemIds, setSharedEcosystemIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing && isEdit) {
      setPurpose(existing.purpose || '');
      setCurrentSteward(existing.current_steward || '');
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

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!purpose.trim()) errs.purpose = 'Purpose is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, any> = {
      purpose: purpose.trim(),
      current_steward: currentSteward || null,
      status,
      metric_definitions: metricDefinitions || null,
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
      toast({ title: isEdit ? 'Domain updated' : 'Domain created', description: 'Domain has been saved successfully.' });
      navigate(`/domains/${result.id}`);
    } catch {
      // Error handled by mutation state
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  return (
    <div className="space-y-6 max-w-2xl">
      <Button asChild variant="ghost" size="sm">
        <Link href={isEdit ? `/domains/${editId}` : '/domains'}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isEdit ? 'Back to Domain' : 'Back to Domains'}
        </Link>
      </Button>

      <h1 className="text-3xl font-bold">{isEdit ? 'Edit Domain' : 'New Domain'}</h1>

      {mutationError && (
        <div className="rounded-none border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {(mutationError as Error).message}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose *</Label>
              <AITextarea
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Domain purpose..."
                rows={5}
                fieldLabel="Purpose"
                fieldContext="The purpose and scope of a governance domain within the organization"
              />
              {errors.purpose && <p className="text-sm text-destructive">{errors.purpose}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_steward">Current Steward</Label>
              <Input
                id="current_steward"
                value={currentSteward}
                onChange={(e) => setCurrentSteward(e.target.value)}
                placeholder="Steward name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              <Button type="submit" disabled={isPending}>
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
