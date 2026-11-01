// One post in full, opened from a card's "Details" or a `?post=<id>` link (the bell's "Still open?").
import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QueryState } from '@/components/QueryState';
import { RecordDecisionAction } from '@/components/governance/RecordDecisionDialog';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useSharesNeedsPost } from '@/hooks/use-discover';
import { conversationHref, POST_TYPE_LABELS, proposeFromPostHref, visibilityHelp, visibilityLabel } from '@/lib/exchange';
import { queryStatePhase } from '@/lib/query-state';
import { sharesNeedsCategoryLabel } from '@/lib/sharesneeds-vocab';
import type { SharesNeedsPost } from '@/types/api';
import { focusSharesNeedsHeading, PostBadges, PostByline, PostStateNotes, postAudienceLabel } from './PostParts';
import { PostManageActions } from './PostManageActions';
import { RespondAction } from './RespondDialog';

function PostDetailBody({ post, onDeleted }: { post: SharesNeedsPost; onDeleted: () => void }) {
  const open = post.status === 'active' && !post.hidden;
  // Radix focused the only tabbable control while the post loaded (Close); once it is here, start at its title.
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titleRef.current?.focus(); }, [post.id]);
  const answers = post.response_count;
  // A private note is recorded on the caller's row in the post's ecosystem; elsewhere it would only refuse.
  const { ecosystems } = useEcosystem();
  const canTrack = open && (post.type === 'share' || post.type === 'need') && !post.caller_is_author
    && ecosystems.some((ecosystem) => ecosystem.id === post.ecosystem_id);
  return (
    <div className="space-y-5">
      <DialogHeader className="space-y-3 text-left">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">{POST_TYPE_LABELS[post.type]}</p>
        <DialogTitle ref={titleRef} tabIndex={-1} className="pr-8 text-2xl font-black leading-tight">{post.title}</DialogTitle>
        <DialogDescription asChild>
          <div className="space-y-2">
            <PostBadges post={post} />
            <PostByline post={post} />
          </div>
        </DialogDescription>
      </DialogHeader>

      <PostStateNotes post={post} />

      {post.description && <p className="whitespace-pre-wrap text-sm leading-6">{post.description}</p>}

      <dl className="grid gap-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Who can see it</dt>
          <dd className="mt-1 font-semibold">{postAudienceLabel(post)}</dd>
          <dd className="text-xs text-muted-foreground">
            {post.hidden
              ? `Hidden, so only its author and the stewards of ${post.ecosystem_name ?? 'its ecosystem'} see it. It was posted for: ${visibilityLabel(post.visibility)}.`
              : post.visibility === 'public' || post.visibility === 'ecosystem' || post.visibility === 'domain'
                ? visibilityHelp(post.visibility, post.ecosystem_name)
                : null}
          </dd>
        </div>
        {post.capacity && (
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Capacity</dt>
            <dd className="mt-1 font-semibold">{post.capacity}</dd>
          </div>
        )}
        {post.category && (
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Category</dt>
            <dd className="mt-1 font-semibold">{sharesNeedsCategoryLabel(post.category)}</dd>
          </div>
        )}
        {answers !== null && (
          <div>
            <dt className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">Answers</dt>
            <dd className="mt-1 font-semibold">
              {answers === 0 ? 'Nobody has answered yet' : answers === 1 ? '1 person answered' : `${answers} people answered`}
            </dd>
            {post.caller_is_author && answers > 0 && (
              <dd>
                <Link href={conversationHref(null)} className="inline-flex min-h-11 items-center text-sm font-bold text-link underline underline-offset-2">
                  Read them in Messages
                </Link>
              </dd>
            )}
          </div>
        )}
      </dl>

      {post.tags.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Tags">
          {post.tags.map((tag) => <li key={tag}><Badge variant="secondary" className="rounded-none">{tag}</Badge></li>)}
        </ul>
      )}

      <section className="space-y-3 border-t border-border pt-4" aria-label="What you can do">
        <RespondAction post={post} />
        <div className="flex flex-wrap gap-2">
          {open && (
            <Button asChild size="sm" variant="outline">
              <Link href={proposeFromPostHref(post.id)}>Propose collaboration</Link>
            </Button>
          )}
          {canTrack && (post.type === 'share' || post.type === 'need') && (
            <RecordDecisionAction
              subjectType={post.type}
              subjectId={post.id}
              subjectTitle={post.title}
              actionLabel="Track privately"
              triggerVariant="ghost"
              triggerSize="sm"
            />
          )}
        </div>
        <PostManageActions post={post} onDeleted={onDeleted} />
      </section>
    </div>
  );
}

/** The server answers 404 (or 403) for a post the caller may not see: deleted, hidden, or outside their ecosystems. */
function isUnavailable(error: unknown): boolean {
  const status = (error as { status?: unknown } | null)?.status;
  return status === 404 || status === 403;
}

/** Dialog for one post; `postId` null keeps it closed. A post the caller may not see says so, with no Retry. */
export function PostDetailDialog({ postId, onClose }: { postId: string | null; onClose: () => void }) {
  const query = useSharesNeedsPost(postId);
  const deleted = useRef(false);
  const lastPostId = useRef(postId);
  if (postId) lastPostId.current = postId;
  const unavailable = queryStatePhase(query) === 'error' && isUnavailable(query.error);
  const closeAfterDelete = () => { deleted.current = true; onClose(); };
  // Opened from a URL, the dialog has no trigger, so Radix would return focus to nothing (the page body). Back to the
  // post's own "Details" link while it is listed; after a delete, or opened from elsewhere, the Shares + needs heading
  // (p3-needs-across-ecosystems-4).
  const returnFocus = (event: Event) => {
    event.preventDefault();
    const wasDeleted = deleted.current;
    deleted.current = false;
    const id = lastPostId.current;
    const details = !wasDeleted && id ? document.querySelector<HTMLElement>(`[data-post-details="${CSS.escape(id)}"]`) : null;
    if (details) details.focus();
    else focusSharesNeedsHeading();
  };
  return (
    <Dialog open={postId !== null} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto" onCloseAutoFocus={returnFocus}>
        {unavailable ? (
          <DialogHeader className="space-y-3 text-left">
            <DialogTitle className="pr-8 text-xl font-black">This post is no longer available to you</DialogTitle>
            <DialogDescription>
              Its author may have deleted it, a steward may have hidden it, or it is shown only to the members of an
              ecosystem or domain you are not in.
            </DialogDescription>
          </DialogHeader>
        ) : (
          <QueryState
            query={query}
            errorTitle="We couldn't open this post"
            loading={<DialogTitle className="text-base">Loading the post…</DialogTitle>}
          >
            {(post) => <PostDetailBody post={post} onDeleted={closeAfterDelete} />}
          </QueryState>
        )}
        {query.isError && !query.data && !unavailable && <DialogTitle className="sr-only">Post unavailable</DialogTitle>}
      </DialogContent>
    </Dialog>
  );
}
