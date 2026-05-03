import { useState, useEffect } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AITextarea } from '@/components/ui/ai-textarea';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useAgreement, useCreateAgreement, useUpdateAgreement } from '@/hooks/use-governance';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const TYPE_OPTIONS = [
  { value: 'uaf', label: 'UAF' },
  { value: 'ecosystem', label: 'Ecosystem' },
  { value: 'access', label: 'Access' },
  { value: 'stewardship', label: 'Stewardship' },
  { value: 'ethos', label: 'Ethos' },
  { value: 'culture_code', label: 'Culture Code' },
];

const HIERARCHY_OPTIONS = [
  { value: 'foundational', label: 'Foundational' },
  { value: 'operational', label: 'Operational' },
  { value: 'domain', label: 'Domain' },
  { value: 'local', label: 'Local' },
];

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

  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [text, setText] = useState('');
  const [proposer, setProposer] = useState('');
  const [domain, setDomain] = useState('');
  const [hierarchyLevel, setHierarchyLevel] = useState('operational');
  const [reviewDate, setReviewDate] = useState('');
  const [sunsetDate, setSunsetDate] = useState('');
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
    }
  }, [existing, isEdit]);

  if (isEdit && loadingExisting) return <LoadingState message="Loading agreement..." />;

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
      text: text || null,
      proposer: proposer || null,
      domain: domain || null,
      hierarchy_level: hierarchyLevel,
      review_date: reviewDate || null,
      sunset_date: sunsetDate || null,
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

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href={isEdit ? `/agreements/${editId}` : '/agreements'}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isEdit ? 'Back to Agreement' : 'Back to Agreements'}
        </Button>
      </Link>

      <h1 className="text-3xl font-bold">{isEdit ? 'Edit Agreement' : 'New Agreement'}</h1>

      {mutationError && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
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
                  {TYPE_OPTIONS.map(o => (
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

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : (isEdit ? 'Update Agreement' : 'Create Agreement')}
              </Button>
              <Link href={isEdit ? `/agreements/${editId}` : '/agreements'}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
