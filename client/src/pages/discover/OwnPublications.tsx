// Me: every post the member wrote, in every state, with the author's controls (rendered inside the profile <form>).
import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ownPublicationsOf, POST_TYPE_LABELS, postHref, visibilityHelp } from '@/lib/exchange';
import type { PublicProfileResponse } from '@/types/api';
import { PostBadges, PostByline, PostStateNotes } from './PostParts';
import { PostManageActions } from './PostManageActions';

/** The owner's list: `own_publications` when the server sends it, else the public list (see lib/exchange.ts ownPublicationsOf). */
export function OwnPublications({ profile }: { profile: Pick<PublicProfileResponse, 'publications' | 'own_publications'> }) {
  const posts = ownPublicationsOf(profile);
  if (posts.length === 0) {
    return (
      <div className="border border-dashed border-foreground p-8 text-center">
        <p className="font-black">You have not published anything yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">Share a capability, name a need, or publish a solution.</p>
      </div>
    );
  }
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {posts.map((post) => (
        <article key={post.id} aria-labelledby={`own-post-${post.id}-title`} className="space-y-3 border border-border p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 id={`own-post-${post.id}-title`} className="font-black [overflow-wrap:anywhere]">{post.title}</h3>
            <Badge variant="outline">{POST_TYPE_LABELS[post.type] ?? 'Post'}</Badge>
          </div>
          <PostBadges post={post} />
          <PostByline post={post} />
          {post.visibility !== 'public' && (
            <p className="text-xs text-muted-foreground">{visibilityHelp(post.visibility, post.ecosystem_name)}</p>
          )}
          {post.description && <p className="line-clamp-3 text-sm text-muted-foreground">{post.description}</p>}
          <PostStateNotes post={post} />
          {post.response_count !== null && post.response_count > 0 && (
            <p className="text-sm">
              {post.response_count === 1 ? '1 person answered.' : `${post.response_count} people answered.`}{' '}
              <Link href="/messaging" className="font-bold text-link underline underline-offset-2">Read them in Messages</Link>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="ghost">
              <Link href={postHref(post.id)} aria-label={`Details: ${post.title}`}>Details</Link>
            </Button>
          </div>
          <PostManageActions post={post} />
        </article>
      ))}
    </div>
  );
}
