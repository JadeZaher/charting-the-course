import { useState, useEffect } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useDomain, useCreateDomain } from '@/hooks/use-governance';
import { useEcosystem } from '@/contexts/EcosystemContext';
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
  const { selected: selectedEcosystem } = useEcosystem();
  const { data: existing, isLoading: loadingExisting } = useDomain(editId ?? '');
  const createMutation = useCreateDomain();

  const [purpose, setPurpose] = useState('');
  const [currentSteward, setCurrentSteward] = useState('');
  const [status, setStatus] = useState('draft');
  const [metricDefinitions, setMetricDefinitions] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing && isEdit) {
      setPurpose(existing.purpose || '');
      setCurrentSteward(existing.current_steward || '');
      setStatus(existing.status || 'draft');
      setMetricDefinitions(existing.metric_definitions || '');
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
    };

    if (!isEdit && selectedEcosystem) {
      payload.ecosystem_id = selectedEcosystem.id;
    }

    try {
      const result = await createMutation.mutateAsync(payload);
      navigate(`/domains/${result.id}`);
    } catch {
      // Error handled by mutation state
    }
  };

  const isPending = createMutation.isPending;
  const mutationError = createMutation.error;

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href={isEdit ? `/domains/${editId}` : '/domains'}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isEdit ? 'Back to Domain' : 'Back to Domains'}
        </Button>
      </Link>

      <h1 className="text-3xl font-bold">{isEdit ? 'Edit Domain' : 'New Domain'}</h1>

      {mutationError && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {(mutationError as Error).message}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose *</Label>
              <Textarea
                id="purpose"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Domain purpose..."
                rows={5}
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
              <Textarea
                id="metric_definitions"
                value={metricDefinitions}
                onChange={(e) => setMetricDefinitions(e.target.value)}
                placeholder="Define metrics for this domain..."
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : (isEdit ? 'Update Domain' : 'Create Domain')}
              </Button>
              <Link href={isEdit ? `/domains/${editId}` : '/domains'}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
