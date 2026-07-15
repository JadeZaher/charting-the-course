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
import { useEcosystem } from '@/contexts/EcosystemContext';
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
  const { selected: selectedEcosystem } = useEcosystem();
  const createMutation = useCreateSharesNeeds();
  const { data: domainsData } = useDomains({ per_page: '100' });
  const domains = domainsData?.items ?? [];

  const [type, setType] = useState<'share' | 'need'>('share');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [capacity, setCapacity] = useState('');
  const [domainId, setDomainId] = useState('');
  const [visibility, setVisibility] = useState('ecosystem');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!domainId) errs.domain = 'Domain is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, any> = {
      type,
      title: title.trim(),
      description: description || null,
      category: category || null,
      capacity: capacity || null,
      domain_id: domainId,
      visibility,
      tags: [],
    };
    if (selectedEcosystem) {
      payload.ecosystem_id = selectedEcosystem.id;
    }

    try {
      await createMutation.mutateAsync(payload);
      toast({ title: 'Created', description: 'Your share/need has been posted.' });
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

      <h1 className="text-3xl font-bold">Add Share / Need</h1>

      {createMutation.error && (
        <div className="rounded-none border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {(createMutation.error as Error).message}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div className="space-y-2">
              <Label>Type *</Label>
              <RadioGroup
                value={type}
                onValueChange={(v) => setType(v as 'share' | 'need')}
                className="flex gap-6"
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
              </RadioGroup>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={type === 'share' ? 'e.g. Offering technical expertise in data engineering' : 'e.g. Need graphic design support'}
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide more details..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
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
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="e.g. 5 hrs/week, up to 3 teams"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Domain */}
              <div className="space-y-2">
                <Label htmlFor="domain">Domain *</Label>
                <Select value={domainId} onValueChange={setDomainId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.domain_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.domain && <p className="text-sm text-destructive">{errors.domain}</p>}
              </div>

              {/* Visibility */}
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

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Posting...' : 'Post Share / Need'}
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
