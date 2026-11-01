// One post in full, opened from a card's "Details" or a `?post=<id>` link (the bell's "Still open?").
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QueryState } from '@/components/QueryState';
import { RecordDecisionAction } from '@/components/governance/RecordDecisionDialog';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useSharesNeedsPost } from '@/hooks/use-discover';
import { conversationHref, POST_TYPE_LABELS, proposeFromPostHref, visibilityHelp, visibilityLabel } from '@/lib/exchange';
import { sharesNeedsCategoryLabel } from '@/lib/sharesneeds-vocab';
import type { SharesNeedsPost } from '@/types/api';
import { PostBadges, PostByline, PostStateNotes } from './PostParts';
import { PostManageActions } from './PostManageActions';
import { RespondAction } from './RespondDialog';

function PostDetailBody({ post, onClose }: { post: SharesNeedsPost; onClose: () => void }) {
  const open = post.status === 'active' && !post.hidden;
  const answers = post.response_count;
  // A private note is recorded on the caller's row in the post's ecosystem; elsewhere it would only refuse.
  const { ecosystems } = useEcosystem();
  const canTrack = open && (post.type === 'share' || post.type === 'need') && !post.caller_is_author
    && ecosystems.some((ecosystem) => ecosystem.id === post.ecosystem_id);
  return (
    <div className="space-y-5">
      <DialogHeader className="space-y-3 text-left">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">{POST_TYPE_LABELS[post.type]}</p>
        <DialogTitle className="pr-8 text-2xl font-black leading-tight">{post.title}</DialogTitle>
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
          <dd className="mt-1 font-semibold">{visibilityLabel(post.visibility)}</dd>
          <dd className="text-xs text-muted-foreground">
            {post.visibility === 'public' || post.visibility === 'ecosystem' || post.visibility === 'domain'
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
        <PostManageActions post={post} onDeleted={onClose} />
      </section>
    </div>
  );
}

/** Dialog for one post; `postId` null keeps it closed. A post the caller may not see answers 404 and shows that plainly. */
export function PostDetailDialog({ postId, onClose }: { postId: string | null; onClose: () => void }) {
  const query = useSharesNeedsPost(postId);
  return (
    <Dialog open={postId !== null} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <QueryState
          query={query}
          errorTitle="We couldn't open this post"
          loading={<DialogTitle className="text-base">Loading the post…</DialogTitle>}
        >
          {(post) => <PostDetailBody post={post} onClose={onClose} />}
        </QueryState>
        {query.isError && !query.data && <DialogTitle className="sr-only">Post unavailable</DialogTitle>}
      </DialogContent>
    </Dialog>
  );
}
