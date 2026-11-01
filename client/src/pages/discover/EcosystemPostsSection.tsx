// An ecosystem page's shares, needs and solutions: publish into one of its domains, answer, and manage by the server's flags.
import { useMemo, useState } from 'react';
import { Handshake, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QueryState } from '@/components/QueryState';
import { useCreateSharesNeeds, useEcosystemPosts } from '@/hooks/use-discover';
import { useDomains } from '@/hooks/use-governance';
import { useToast } from '@/hooks/use-toast';
import { domainOptionLabel } from '@/lib/domain-label';
import { POST_TYPE_LABELS, publishedNotice } from '@/lib/exchange';
import { SectionPost } from './DomainPostsSection';
import { PostForm, type DomainChoice } from './PostForm';

/** The shares-needs card of EcosystemDetail (active members only; the server lists under the one visibility rule). */
export function EcosystemPostsSection({ ecosystemId, ecosystemName }: { ecosystemId: string; ecosystemName: string }) {
  const postsQuery = useEcosystemPosts(ecosystemId);
  const [showForm, setShowForm] = useState(false);
  const domainsQuery = useDomains(showForm ? { ecosystem_id: ecosystemId, per_page: '100' } : false);
  const create = useCreateSharesNeeds();
  const { toast } = useToast();
  const formId = `ecosystem-${ecosystemId}-post-form`;
  const domainChoices = useMemo<DomainChoice[]>(
    () => (domainsQuery.data?.items ?? [])
      .filter((domain) => domain.ecosystem_id === ecosystemId)
      .map((domain) => ({ id: domain.id, ecosystemId, label: domainOptionLabel(domain) })),
    [domainsQuery.data, ecosystemId],
  );

  const toggleForm = () => {
    create.reset();
    setShowForm((current) => !current);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Handshake className="h-5 w-5" aria-hidden="true" />
            Shares & Needs
          </CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={toggleForm} aria-expanded={showForm} aria-controls={formId}>
            {showForm ? <><X className="mr-1 h-4 w-4" aria-hidden="true" />Cancel</> : <><Plus className="mr-1 h-4 w-4" aria-hidden="true" />Add</>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <div id={formId} className="border-2 border-strong-border bg-muted/30 p-4">
            {domainsQuery.error ? (
              <p role="alert" className="text-sm text-destructive">The domains could not be loaded, so there is nowhere to post yet. Close and try again.</p>
            ) : !domainsQuery.isLoading && domainChoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">{ecosystemName} has no domains yet. A post belongs to a domain, so one has to be created first.</p>
            ) : (
              <PostForm
                domainChoices={domainChoices}
                ecosystemNameFor={() => ecosystemName}
                error={create.error}
                pending={create.isPending}
                disabled={domainsQuery.isLoading}
                submitLabel={(type) => `Publish ${POST_TYPE_LABELS[type].toLowerCase()}`}
                pendingLabel="Publishing…"
                onCancel={toggleForm}
                onSubmit={(values) => {
                  const domain = domainChoices.find((choice) => choice.id === values.domainId);
                  if (!domain) return;
                  create.mutate(
                    {
                      ecosystem_id: ecosystemId,
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
                        setShowForm(false);
                      },
                    },
                  );
                }}
              />
            )}
          </div>
        )}

        <QueryState
          query={postsQuery}
          loading={<p className="text-sm text-muted-foreground">Loading shares and needs…</p>}
          errorTitle="We couldn't load shares and needs"
          isEmpty={(result) => (result.items ?? []).length === 0}
          empty={<p className="text-sm text-muted-foreground">Nothing has been shared or asked for in {ecosystemName} yet.</p>}
        >
          {(result) => (
            <ul className="space-y-3" aria-label={`Shares and needs in ${ecosystemName}`}>
              {result.items.map((post) => <SectionPost key={post.id} post={post} />)}
            </ul>
          )}
        </QueryState>
      </CardContent>
    </Card>
  );
}
