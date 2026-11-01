import { useMemo, useState } from 'react';
import { Link, useLocation, useSearch } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FieldError } from '@/components/FieldError';
import { QueryState } from '@/components/QueryState';
import { useCreateCollaboration, useSharesNeedsPost } from '@/hooks/use-discover';
import { useDomains } from '@/hooks/use-governance';
import { useRequiredFields } from '@/hooks/use-required-fields';
import { useToast } from '@/hooks/use-toast';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { domainOptionLabel } from '@/lib/domain-label';
import { exchangeErrorCode, formErrorView, idFromQuery, POST_TYPE_LABELS, postHref } from '@/lib/exchange';
import type { CollaborationProposal, SharesNeedsPost } from '@/types/api';

const TIER_OPTIONS = [
  { value: 'observe', label: 'Observe: learn before committing' },
  { value: 'cooperate', label: 'Cooperate: coordinate a shared outcome' },
  { value: 'federate', label: 'Federate: align governance across domains' },
  { value: 'integrate', label: 'Integrate: operate as a tightly coupled partnership' },
];

type FieldName = 'title' | 'sourceDomain' | 'targetDomain' | 'tier' | 'reviewDate' | 'description' | 'terms';

/** Server field name -> this form's field. */
const SERVER_FIELDS: Record<string, FieldName> = {
  title: 'title',
  source_domain_id: 'sourceDomain',
  target_domain_id: 'targetDomain',
  engagement_tier: 'tier',
  review_date: 'reviewDate',
  description: 'description',
  terms: 'terms',
};

function ProposalForm({ fromPost }: { fromPost: SharesNeedsPost | null }) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { ecosystems } = useEcosystem();
  const createMutation = useCreateCollaboration();
  const domainsQuery = useDomains({ per_page: '100' });
  const domains = domainsQuery.data?.items ?? [];

  const [sourceDomainId, setSourceDomainId] = useState('');
  const [targetDomainId, setTargetDomainId] = useState(fromPost?.domain_id ?? '');
  const [title, setTitle] = useState(fromPost ? `${POST_TYPE_LABELS[fromPost.type]}: ${fromPost.title}`.slice(0, 255) : '');
  const [description, setDescription] = useState('');
  const [engagementTier, setEngagementTier] = useState('cooperate');
  const [reviewDate, setReviewDate] = useState('');
  const [terms, setTerms] = useState('');
  const [edited, setEdited] = useState<ReadonlySet<FieldName>>(new Set());
  const required = useRequiredFields({
    title: 'Add a title.',
    sourceDomain: 'Choose one of your domains.',
    targetDomain: 'Choose the domain you want to work with.',
  });

  const server = useMemo(() => formErrorView(createMutation.error, SERVER_FIELDS), [createMutation.error]);
  const ecosystemName = (ecosystemId: string) => ecosystems.find((ecosystem) => ecosystem.id === ecosystemId)?.name;
  const sourceChoices = domains.filter((domain) => domain.id !== targetDomainId);
  const markEdited = (name: FieldName) => setEdited((current) => (current.has(name) ? current : new Set(current).add(name)));

  // One message per field: the required error, else the server's until the field changes; SAME_DOMAIN lands on the target.
  const sameDomain = exchangeErrorCode(createMutation.error) === 'SAME_DOMAIN' && !edited.has('targetDomain') && !edited.has('sourceDomain');
  const messageFor = (name: FieldName): string | undefined => {
    if (name === 'title' || name === 'sourceDomain' || name === 'targetDomain') {
      const message = required.error(name).message;
      if (message) return message;
    }
    if (name === 'targetDomain' && sameDomain) return server.fields.targetDomain ?? server.form ?? undefined;
    return edited.has(name) ? undefined : server.fields[name];
  };
  const errorId = (name: FieldName) =>
    name === 'title' || name === 'sourceDomain' || name === 'targetDomain' ? required.error(name).id : `collaboration-${name}-error`;
  const aria = (name: FieldName, hintId?: string) => {
    const message = messageFor(name);
    const describedBy = [message ? errorId(name) : null, hintId ?? null].filter(Boolean).join(' ');
    return { 'aria-invalid': message ? (true as const) : undefined, 'aria-describedby': describedBy || undefined };
  };
  const formMessage = sameDomain ? null : server.form;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!required.validate({ title, sourceDomain: sourceDomainId, targetDomain: targetDomainId })) return;
    setEdited(new Set());
    const payload: CollaborationProposal = {
      source_domain_id: sourceDomainId,
      target_domain_id: targetDomainId,
      title: title.trim(),
      description: description.trim() || null,
      engagement_tier: engagementTier,
      terms: terms.trim() ? { text: terms.trim() } : null,
      ...(reviewDate ? { review_date: reviewDate } : {}),
      ...(fromPost ? { linked_share_need_id: fromPost.id } : {}),
    };
    createMutation.mutate(payload, {
      onSuccess: (result) => {
        toast({ title: 'Collaboration proposed', description: 'It becomes active once a steward of each ecosystem approves it.' });
        navigate(`/discover/collaborations/${result.id}`);
      },
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {formMessage && (
            <div role="alert" className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">{formMessage}</div>
          )}
          {domainsQuery.error && (
            <div role="alert" className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              Your domains could not be loaded. Refresh the page to try again.
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="collaboration-title">Title</Label>
            <Input
              id="collaboration-title"
              {...required.field('title')}
              {...aria('title')}
              value={title}
              maxLength={255}
              onChange={(event) => { setTitle(event.target.value); required.settle('title', event.target.value); markEdited('title'); }}
            />
            <FieldError id={errorId('title')} message={messageFor('title')} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="collaboration-source">Your domain</Label>
              <Select
                value={sourceDomainId}
                disabled={domainsQuery.isLoading}
                onValueChange={(value) => { setSourceDomainId(value); required.settle('sourceDomain', value); markEdited('sourceDomain'); }}
              >
                <SelectTrigger id="collaboration-source" {...required.field('sourceDomain')} {...aria('sourceDomain')}>
                  <SelectValue placeholder="Choose one of your domains" />
                </SelectTrigger>
                <SelectContent>
                  {sourceChoices.map((domain) => {
                    const owner = ecosystemName(domain.ecosystem_id);
                    return <SelectItem key={domain.id} value={domain.id}>{owner ? `${domainOptionLabel(domain)} · ${owner}` : domainOptionLabel(domain)}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
              <FieldError id={errorId('sourceDomain')} message={messageFor('sourceDomain')} />
            </div>

            <div className="space-y-2">
              {fromPost ? (
                <>
                  <p id="collaboration-target-label" className="text-sm font-bold">With</p>
                  <p aria-labelledby="collaboration-target-label" className="border-2 border-border p-3 text-sm">
                    <span className="font-semibold">{fromPost.domain_name ?? 'The post’s domain'}</span>
                    {fromPost.ecosystem_name ? ` in ${fromPost.ecosystem_name}` : ''}
                    <span className="block text-xs text-muted-foreground">Fixed by the post this starts from.</span>
                  </p>
                  <FieldError id={errorId('targetDomain')} message={messageFor('targetDomain')} />
                </>
              ) : (
                <>
                  <Label htmlFor="collaboration-target">Domain to work with</Label>
                  <Select
                    value={targetDomainId}
                    disabled={domainsQuery.isLoading}
                    onValueChange={(value) => { setTargetDomainId(value); required.settle('targetDomain', value); markEdited('targetDomain'); }}
                  >
                    <SelectTrigger id="collaboration-target" {...required.field('targetDomain')} {...aria('targetDomain', 'collaboration-target-hint')}>
                      <SelectValue placeholder="Choose a domain" />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.filter((domain) => domain.id !== sourceDomainId).map((domain) => {
                        const owner = ecosystemName(domain.ecosystem_id);
                        return <SelectItem key={domain.id} value={domain.id}>{owner ? `${domainOptionLabel(domain)} · ${owner}` : domainOptionLabel(domain)}</SelectItem>;
                      })}
                    </SelectContent>
                  </Select>
                  <p id="collaboration-target-hint" className="text-xs text-muted-foreground">
                    To work with another ecosystem, start from one of its posts in Discover: “Propose collaboration”.
                  </p>
                  <FieldError id={errorId('targetDomain')} message={messageFor('targetDomain')} />
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="collaboration-tier">Engagement tier</Label>
              <Select value={engagementTier} onValueChange={(value) => { setEngagementTier(value); markEdited('tier'); }}>
                <SelectTrigger id="collaboration-tier" {...aria('tier')}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIER_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <FieldError id={errorId('tier')} message={messageFor('tier')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collaboration-review">Review date (optional)</Label>
              <Input
                id="collaboration-review"
                type="date"
                {...aria('reviewDate', 'collaboration-review-hint')}
                value={reviewDate}
                onChange={(event) => { setReviewDate(event.target.value); markEdited('reviewDate'); }}
              />
              <p id="collaboration-review-hint" className="text-xs text-muted-foreground">Left empty, it is a year after it becomes active.</p>
              <FieldError id={errorId('reviewDate')} message={messageFor('reviewDate')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="collaboration-description">Description (optional)</Label>
            <Textarea
              id="collaboration-description"
              {...aria('description')}
              value={description}
              rows={4}
              maxLength={20_000}
              onChange={(event) => { setDescription(event.target.value); markEdited('description'); }}
              placeholder="What will the two domains do together, and why?"
            />
            <FieldError id={errorId('description')} message={messageFor('description')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collaboration-terms">Terms (optional)</Label>
            <Textarea
              id="collaboration-terms"
              {...aria('terms')}
              value={terms}
              rows={4}
              maxLength={20_000}
              onChange={(event) => { setTerms(event.target.value); markEdited('terms'); }}
              placeholder="Commitments or conditions each side agrees to"
            />
            <FieldError id={errorId('terms')} message={messageFor('terms')} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={createMutation.isPending || domainsQuery.isLoading}>
              {createMutation.isPending ? 'Proposing…' : 'Propose collaboration'}
            </Button>
            <Button asChild variant="outline">
              <Link href={fromPost ? postHref(fromPost.id) : '/discover?tab=collaborations'}>Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function CollaborationForm() {
  const fromId = idFromQuery(useSearch(), 'from');
  const postQuery = useSharesNeedsPost(fromId);

  return (
    <div className="max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href={fromId ? postHref(fromId) : '/discover?tab=collaborations'}>
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          {fromId ? 'Back to the post' : 'Back to collaborations'}
        </Link>
      </Button>

      <h1 className="text-3xl font-bold">Propose a collaboration</h1>

      {fromId ? (
        <QueryState query={postQuery} errorTitle="We couldn't load the post this starts from">
          {(post) => (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Starting from the {POST_TYPE_LABELS[post.type].toLowerCase()} “{post.title}”
                {post.author_name ? ` by ${post.author_name}` : ''}. It is linked to the collaboration.
              </p>
              <ProposalForm fromPost={post} />
            </div>
          )}
        </QueryState>
      ) : (
        <ProposalForm fromPost={null} />
      )}
    </div>
  );
}
