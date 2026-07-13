import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCollaboration } from '@/hooks/use-discover';
import { useDomains } from '@/hooks/use-governance';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const TIER_OPTIONS = [
  { value: 'exploratory', label: 'Exploratory — early conversations' },
  { value: 'formal', label: 'Formal — structured agreement' },
  { value: 'deep', label: 'Deep — tight integration' },
];

export default function CollaborationForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { selected: selectedEcosystem } = useEcosystem();
  const createMutation = useCreateCollaboration();
  const { data: domainsData } = useDomains({ per_page: '100' });
  const domains = domainsData?.items ?? [];

  const [sourceDomainId, setSourceDomainId] = useState('');
  const [targetDomainId, setTargetDomainId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [engagementTier, setEngagementTier] = useState('exploratory');
  const [terms, setTerms] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!sourceDomainId) errs.sourceDomain = 'Source domain is required';
    if (!targetDomainId) errs.targetDomain = 'Target domain is required';
    if (sourceDomainId && targetDomainId && sourceDomainId === targetDomainId) {
      errs.targetDomain = 'Source and target domains must be different';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let parsedTerms: Record<string, any> | null = null;
    if (terms.trim()) {
      parsedTerms = { text: terms.trim() };
    }

    const payload: Record<string, any> = {
      source_domain_id: sourceDomainId,
      target_domain_id: targetDomainId,
      title: title.trim(),
      description: description || null,
      engagement_tier: engagementTier,
      terms: parsedTerms,
      status: 'proposed',
    };
    if (selectedEcosystem) {
      payload.ecosystem_id = selectedEcosystem.id;
    }

    try {
      const result = await createMutation.mutateAsync(payload);
      toast({ title: 'Collaboration proposed', description: 'The collaboration proposal has been submitted.' });
      navigate(`/discover/collaborations/${result.id}`);
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

      <h1 className="text-3xl font-bold">Propose Collaboration</h1>

      {createMutation.error && (
        <div className="rounded-none border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {(createMutation.error as Error).message}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Collaboration title"
              />
              {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Source Domain */}
              <div className="space-y-2">
                <Label htmlFor="source-domain">Source Domain *</Label>
                <Select value={sourceDomainId} onValueChange={setSourceDomainId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.domain_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sourceDomain && <p className="text-sm text-destructive">{errors.sourceDomain}</p>}
              </div>

              {/* Target Domain */}
              <div className="space-y-2">
                <Label htmlFor="target-domain">Target Domain *</Label>
                <Select value={targetDomainId} onValueChange={setTargetDomainId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select target domain" />
                  </SelectTrigger>
                  <SelectContent>
                    {domains.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.domain_id}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.targetDomain && <p className="text-sm text-destructive">{errors.targetDomain}</p>}
              </div>
            </div>

            {/* Engagement Tier */}
            <div className="space-y-2">
              <Label htmlFor="tier">Engagement Tier</Label>
              <Select value={engagementTier} onValueChange={setEngagementTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose and goals of this collaboration..."
                rows={4}
              />
            </div>

            {/* Terms */}
            <div className="space-y-2">
              <Label htmlFor="terms">Terms</Label>
              <Textarea
                id="terms"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Any specific terms, commitments, or conditions for this collaboration..."
                rows={4}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Proposing...' : 'Propose Collaboration'}
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
