import { useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useCreateSharesNeeds } from '@/hooks/use-discover';
import { useDomains } from '@/hooks/use-governance';
import { useToast } from '@/hooks/use-toast';
import { domainOptionLabel } from '@/lib/domain-label';
import { POST_TYPE_LABELS, publishedNotice } from '@/lib/exchange';
import { PostForm, type DomainChoice } from './PostForm';

/** Discover tab that lists shares, needs and solutions (DiscoverHub reads ?tab=). */
const SHARES_NEEDS_TAB_URL = '/discover?tab=shares-needs';

export default function SharesNeedsForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { ecosystems } = useEcosystem();
  const createMutation = useCreateSharesNeeds();
  const domainsQuery = useDomains({ per_page: '100' });

  const ecosystemName = (ecosystemId: string | null) => ecosystems.find((ecosystem) => ecosystem.id === ecosystemId)?.name ?? null;
  const multipleEcosystems = new Set((domainsQuery.data?.items ?? []).map((domain) => domain.ecosystem_id)).size > 1;
  const domainChoices = useMemo<DomainChoice[]>(
    () =>
      (domainsQuery.data?.items ?? []).map((domain) => {
        const owner = ecosystems.find((ecosystem) => ecosystem.id === domain.ecosystem_id)?.name;
        return {
          id: domain.id,
          ecosystemId: domain.ecosystem_id,
          label: multipleEcosystems && owner ? `${domainOptionLabel(domain)} · ${owner}` : domainOptionLabel(domain),
        };
      }),
    [domainsQuery.data, ecosystems, multipleEcosystems],
  );

  return (
    <div className="max-w-2xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href={SHARES_NEEDS_TAB_URL}>
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Back to Discover
        </Link>
      </Button>

      <h1 className="text-3xl font-bold">Post a share, need or solution</h1>

      {domainsQuery.error && (
        <div role="alert" className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          Domains could not be loaded, so there is nowhere to post yet. Refresh the page to try again.
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <PostForm
            domainChoices={domainChoices}
            ecosystemNameFor={ecosystemName}
            error={createMutation.error}
            pending={createMutation.isPending}
            disabled={domainsQuery.isLoading || Boolean(domainsQuery.error)}
            submitLabel={(type) => `Publish ${POST_TYPE_LABELS[type].toLowerCase()}`}
            pendingLabel="Publishing…"
            onCancel={() => navigate(SHARES_NEEDS_TAB_URL)}
            onSubmit={(values) => {
              const domain = domainChoices.find((choice) => choice.id === values.domainId);
              if (!domain) return;
              createMutation.mutate(
                {
                  ecosystem_id: domain.ecosystemId,
                  domain_id: domain.id,
                  type: values.type,
                  title: values.title,
                  description: values.description.trim() || null,
                  category: values.category || null,
                  capacity: values.capacity.trim() || null,
                  visibility: values.visibility,
                  tags: [],
                },
                {
                  onSuccess: (post) => {
                    const notice = publishedNotice(post);
                    toast({ title: notice.title, description: notice.description });
                    navigate(notice.href);
                  },
                },
              );
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
