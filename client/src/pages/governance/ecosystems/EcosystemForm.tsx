import { useState, useEffect } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AITextarea } from '@/components/ui/ai-textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useEcosystemDetail, useCreateEcosystem, useUpdateEcosystem } from '@/hooks/use-governance';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'forming', label: 'Forming' },
  { value: 'inactive', label: 'Inactive' },
];

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'unlisted', label: 'Unlisted' },
];

export default function EcosystemForm() {
  const [, editParams] = useRoute('/ecosystems/:id/edit');
  const editId = editParams?.id;
  const isEdit = !!editId;

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { data: existing, isLoading: loadingExisting } = useEcosystemDetail(editId ?? '');
  const createMutation = useCreateEcosystem();
  const updateMutation = useUpdateEcosystem(editId ?? '');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [ecoLocation, setEcoLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [foundedDate, setFoundedDate] = useState('');
  const [status, setStatus] = useState('forming');
  const [visibility, setVisibility] = useState('public');
  const [tags, setTags] = useState('');
  const [governanceSummary, setGovernanceSummary] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing && isEdit) {
      setName(existing.name || '');
      setDescription(existing.description || '');
      setEcoLocation(existing.location || '');
      setWebsite(existing.website || '');
      setFoundedDate(existing.founded_date || '');
      setStatus(existing.status || 'forming');
      setVisibility(existing.visibility || 'public');
      setTags(existing.tags?.join(', ') || '');
      setGovernanceSummary(existing.governance_summary || '');
      setContactEmail(existing.contact_email || '');
    }
  }, [existing, isEdit]);

  if (isEdit && loadingExisting) return <LoadingState message="Loading ecosystem..." />;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const parseCommaSeparated = (value: string): string[] =>
    value.split(',').map(s => s.trim()).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, any> = {
      name: name.trim(),
      description: description || null,
      location: ecoLocation || null,
      website: website || null,
      founded_date: foundedDate || null,
      status,
      visibility,
      tags: parseCommaSeparated(tags),
      governance_summary: governanceSummary || null,
      contact_email: contactEmail || null,
    };

    try {
      let result;
      if (isEdit) {
        result = await updateMutation.mutateAsync(payload);
      } else {
        result = await createMutation.mutateAsync(payload);
      }
      toast({ title: isEdit ? 'Ecosystem updated' : 'Ecosystem created', description: 'Ecosystem has been saved successfully.' });
      navigate(`/ecosystems/${result.id}`);
    } catch {
      // Error handled by mutation state
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  return (
    <div className="space-y-6 max-w-2xl">
      <Button asChild variant="ghost" size="sm">
        <Link href={isEdit ? `/ecosystems/${editId}` : '/ecosystems'}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isEdit ? 'Back to Ecosystem' : 'Back to Ecosystems'}
        </Link>
      </Button>

      <h1 className="text-3xl font-bold">{isEdit ? 'Edit Ecosystem' : 'New Ecosystem'}</h1>

      {mutationError && (
        <div className="rounded-none border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {(mutationError as Error).message}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ecosystem name"
                required
                aria-required="true"
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <AITextarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the ecosystem..."
                rows={4}
                fieldLabel="Description"
                fieldContext="A description of a governance ecosystem - a community or organization using decentralized governance"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={ecoLocation}
                  onChange={(e) => setEcoLocation(e.target.value)}
                  placeholder="Location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIBILITY_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="founded_date">Founded Date</Label>
                <Input
                  id="founded_date"
                  type="date"
                  value={foundedDate}
                  onChange={(e) => setFoundedDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="contact@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma-separated tags"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="governance_summary">Governance Summary</Label>
              <AITextarea
                id="governance_summary"
                value={governanceSummary}
                onChange={(e) => setGovernanceSummary(e.target.value)}
                placeholder="Summary of governance structure..."
                rows={4}
                fieldLabel="Governance Summary"
                fieldContext="A summary of the governance structure, decision-making processes, and organizational framework"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : (isEdit ? 'Update Ecosystem' : 'Create Ecosystem')}
              </Button>
              <Button asChild variant="outline">
                <Link href={isEdit ? `/ecosystems/${editId}` : '/ecosystems'}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
