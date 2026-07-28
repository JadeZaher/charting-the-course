import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useCreateSharesNeeds } from '@/hooks/use-discover';
import { useDomains } from '@/hooks/use-governance';
import { useToast } from '@/hooks/use-toast';
import { SHARESNEEDS_CATEGORY_OPTIONS } from '@/lib/sharesneeds-vocab';
import { ArrowLeft } from 'lucide-react';

const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'ecosystem', label: 'Ecosystem' },
  { value: 'private', label: 'Private' },
];

export default function SharesNeedsForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const createMutation = useCreateSharesNeeds();
  const {
    data: domainsData,
    isLoading: domainsLoading,
    error: domainsError,
  } = useDomains({ per_page: '100' });
  const domains = domainsData?.items ?? [];

  const [type, setType] = useState<'share' | 'need' | 'solution'>('share');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [capacity, setCapacity] = useState('');
  const [domainId, setDomainId] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (title.trim().length > 255) errs.title = 'Title must be 255 characters or fewer';
    if (description.length > 20_000) errs.description = 'Description must be 20,000 characters or fewer';
    if (capacity.trim().length > 100) errs.capacity = 'Capacity must be 100 characters or fewer';
    if (!domainId) errs.domain = 'Domain is required';
    setErrors(errs);
    const firstInvalidId = errs.title
      ? 'title'
      : errs.description
        ? 'description'
        : errs.capacity
          ? 'capacity'
          : errs.domain
            ? 'domain'
            : null;
    if (firstInvalidId) {
      window.requestAnimationFrame(() => document.getElementById(firstInvalidId)?.focus());
    }
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedDomain = domains.find((domain) => domain.id === domainId);
    if (!selectedDomain) {
      setErrors((current) => ({ ...current, domain: 'Select an available domain' }));
      return;
    }

    const payload: Record<string, any> = {
      type,
      title: title.trim(),
      description: description || null,
      category: category || null,
      capacity: capacity || null,
      ecosystem_id: selectedDomain.ecosystem_id,
      domain_id: domainId,
      visibility,
      tags: [],
    };
    try {
      await createMutation.mutateAsync(payload);
      toast({ title: 'Published', description: `Your ${type} is now available.` });
      navigate('/discover');
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Button asChild variant="ghost" size="sm">
        <Link href="/discover">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Discover
        </Link>
      </Button>

      <h1 className="text-3xl font-bold">Publish a Share, Need, or Solution</h1>

      {createMutation.error && (
        <div role="alert" className="rounded-none border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {(createMutation.error as Error).message}
        </div>
      )}
      {domainsError && (
        <div role="alert" className="rounded-none border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          Domains could not be loaded. Please refresh before publishing.
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium leading-none">Type *</legend>
              <RadioGroup
                value={type}
                onValueChange={(v) => setType(v as 'share' | 'need' | 'solution')}
                className="grid gap-3 sm:grid-cols-3"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="share" id="type-share" />
                  <Label htmlFor="type-share" className="cursor-pointer font-normal">
                    Share — offering something
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="need" id="type-need" />
                  <Label htmlFor="type-need" className="cursor-pointer font-normal">
                    Need — requesting something
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="solution" id="type-solution" />
                  <Label htmlFor="type-solution" className="cursor-pointer font-normal">
                    Solution — publishing an approach
                  </Label>
                </div>
              </RadioGroup>
            </fieldset>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setErrors((current) => ({ ...current, title: '' }));
                }}
                maxLength={255}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? 'title-error' : undefined}
                placeholder={
                  type === 'share'
                    ? 'e.g. Offering technical expertise in data engineering'
                    : type === 'need'
                      ? 'e.g. Need graphic design support'
                      : 'e.g. A reusable process for community onboarding'
                }
              />
              {errors.title && <p id="title-error" className="text-sm text-destructive">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setErrors((current) => ({ ...current, description: '' }));
                }}
                maxLength={20_000}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? 'description-error' : undefined}
                placeholder="Provide more details..."
                rows={4}
              />
              {errors.description && <p id="description-error" className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SHARESNEEDS_CATEGORY_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity / Scale</Label>
                <Input
                  id="capacity"
                  value={capacity}
                  onChange={(e) => {
                    setCapacity(e.target.value);
                    setErrors((current) => ({ ...current, capacity: '' }));
                  }}
                  maxLength={100}
                  aria-invalid={Boolean(errors.capacity)}
                  aria-describedby={errors.capacity ? 'capacity-error' : undefined}
                  placeholder="e.g. 5 hrs/week, up to 3 teams"
                />
                {errors.capacity && <p id="capacity-error" className="text-sm text-destructive">{errors.capacity}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Domain */}
              <div className="space-y-2">
                <Label htmlFor="domain">Domain *</Label>
                <Select
                  value={domainId}
                  disabled={domainsLoading || Boolean(domainsError)}
                  onValueChange={(value) => {
                    setDomainId(value);
                    setErrors((current) => ({ ...current, domain: '' }));
                  }}
                >
                  <SelectTrigger
                    id="domain"
                    aria-invalid={Boolean(errors.domain)}
                    aria-describedby={errors.domain ? 'domain-error' : undefined}
                  >
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.domain_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.domain && <p id="domain-error" className="text-sm text-destructive">{errors.domain}</p>}
              </div>

              {/* Visibility */}
              <div className="space-y-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger id="visibility">
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

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={createMutation.isPending || domainsLoading || Boolean(domainsError)}
              >
                {createMutation.isPending ? 'Publishing...' : `Publish ${type}`}
              </Button>
              <Button asChild variant="outline">
                <Link href="/discover">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
