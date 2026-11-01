// A domain page's shares, needs and solutions: publish into this domain, answer, and manage by the server's flags.
import { useState } from 'react';
import { Link } from 'wouter';
import { Handshake, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { QueryState } from '@/components/QueryState';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useCreateSharesNeeds, useDomainPosts } from '@/hooks/use-discover';
import { useToast } from '@/hooks/use-toast';
import { POST_TYPE_LABELS, postHref, publishedNotice } from '@/lib/exchange';
import { sharesNeedsCategoryLabel } from '@/lib/sharesneeds-vocab';
import type { DomainDetail, SharesNeedsPost } from '@/types/api';
import { PostBadges, PostByline, PostStateNotes } from './PostParts';
import { PostForm } from './PostForm';
import { PostManageActions } from './PostManageActions';
import { RespondAction } from './RespondDialog';

/** One post in a page section (a domain's or an ecosystem's): badges, byline, answer, details and the caller's controls. */
export function SectionPost({ post }: { post: SharesNeedsPost }) {
  const titleId = `section-post-${post.id}-title`;
  return (
    <li aria-labelledby={titleId} className="space-y-3 border-2 border-strong-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={post.type === 'share' ? 'default' : 'secondary'} className="rounded-none">{POST_TYPE_LABELS[post.type]}</Badge>
        <h3 id={titleId} className="text-sm font-bold [overflow-wrap:anywhere]">{post.title}</h3>
        <PostBadges post={post} />
      </div>
      <PostByline post={post} />
      {post.description && <p className="text-sm text-muted-foreground">{post.description}</p>}
      {(post.category || post.capacity) && (
        <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          {post.category && <span>{sharesNeedsCategoryLabel(post.category)}</span>}
          {post.capacity && <span>Capacity: {post.capacity}</span>}
        </p>
      )}
      <PostStateNotes post={post} />
      <RespondAction post={post} />
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm" variant="ghost">
          <Link href={postHref(post.id)} aria-label={`Details: ${post.title}`}>Details</Link>
        </Button>
      </div>
      <PostManageActions post={post} />
    </li>
  );
}

/** The shares-needs card of DomainDetail; "Add" is offered to everyone and the server decides who may publish. */
export function DomainPostsSection({ domain }: { domain: DomainDetail }) {
  const postsQuery = useDomainPosts(domain.id);
  const create = useCreateSharesNeeds();
  const { toast } = useToast();
  const { ecosystems } = useEcosystem();
  const [showForm, setShowForm] = useState(false);
  const formId = `domain-${domain.id}-post-form`;
  const ecosystemName = ecosystems.find((ecosystem) => ecosystem.id === domain.ecosystem_id)?.name ?? null;

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
            <PostForm
              initial={{ domainId: domain.id }}
              fixedEcosystemId={domain.ecosystem_id}
              ecosystemNameFor={() => ecosystemName}
              error={create.error}
              pending={create.isPending}
              submitLabel={(type) => `Publish ${POST_TYPE_LABELS[type].toLowerCase()}`}
              pendingLabel="Publishing…"
              onCancel={toggleForm}
              onSubmit={(values) =>
                create.mutate(
                  {
                    ecosystem_id: domain.ecosystem_id,
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
                )
              }
            />
          </div>
        )}

        <QueryState
          query={postsQuery}
          loading={<p className="text-sm text-muted-foreground">Loading shares and needs…</p>}
          errorTitle="We couldn't load shares and needs"
          isEmpty={(result) => (result.items ?? []).length === 0}
          empty={<p className="text-sm text-muted-foreground">Nothing has been shared or asked for in this domain yet.</p>}
        >
          {(result) => (
            <ul className="space-y-3" aria-label={`Shares and needs in ${domain.display_name}`}>
              {result.items.map((post) => <SectionPost key={post.id} post={post} />)}
            </ul>
          )}
        </QueryState>
      </CardContent>
    </Card>
  );
}
