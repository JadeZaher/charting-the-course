// Small read-only pieces every post surface shares: badges, byline, and the closed/hidden notices.
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ageText, postStatusLabel, visibilityLabel } from '@/lib/exchange';
import type { SharesNeedsPost } from '@/types/api';

function formatDay(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** The Shares + needs list heading (SharesNeedsList), where focus lands when a post's detail closes on nothing. */
export const SHARES_NEEDS_HEADING_ID = 'shares-needs-heading';

/** Focus the list heading, else the page's main region (the post was opened away from the list). */
export function focusSharesNeedsHeading(): void {
  (document.getElementById(SHARES_NEEDS_HEADING_ID) ?? document.getElementById('main-content'))?.focus();
}

/** Who can see a post, in the form's words; a hidden post only by its author and the stewards, whatever it was posted as. */
export function postAudienceLabel(post: Pick<SharesNeedsPost, 'hidden' | 'visibility'>): string {
  return post.hidden ? 'Only its author and the stewards' : visibilityLabel(post.visibility);
}

/** Status, hidden and visibility badges; every card says who can see it (p3-plain-words-and-joining-4). */
export function PostBadges({ post }: { post: SharesNeedsPost }) {
  return (
    <span className="flex flex-wrap items-center gap-2">
      <Badge variant={post.status === 'active' ? 'success' : 'outline'} className="rounded-none">
        {postStatusLabel(post.status)}
      </Badge>
      {post.hidden && (
        <Badge variant="destructive" className="rounded-none">Hidden</Badge>
      )}
      <Badge variant="outline" className="gap-1 rounded-none">
        <Eye className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="sr-only">Who can see it: </span>
        {postAudienceLabel(post)}
      </Badge>
    </span>
  );
}

/** "Posted 3 days ago by Ana", then where it lives. */
export function PostByline({ post }: { post: SharesNeedsPost }) {
  const where = [post.domain_name, post.ecosystem_name].filter(Boolean).join(' · ');
  return (
    <p className="text-xs text-muted-foreground">
      Posted {ageText(post.age_days)}
      {post.author_name ? <> by <span className="font-semibold text-foreground">{post.author_name}</span></> : null}
      {where ? <> · {where}</> : null}
    </p>
  );
}

/** Why a post is closed or hidden, as recorded; nothing for an open, visible post. */
export function PostStateNotes({ post }: { post: SharesNeedsPost }) {
  const hiddenOn = formatDay(post.hidden_at);
  const changedOn = formatDay(post.status_changed_at);
  return (
    <>
      {post.hidden && (
        <div className="border-2 border-destructive p-3 text-sm" role="note">
          <p className="font-bold text-destructive">Hidden from every list{post.hidden_by_name ? ` by ${post.hidden_by_name}` : ''}{hiddenOn ? ` on ${hiddenOn}` : ''}.</p>
          {post.hidden_reason && <p className="mt-1">Reason: {post.hidden_reason}</p>}
          <p className="mt-1 text-muted-foreground">Only its author and the stewards of {post.ecosystem_name ?? 'its ecosystem'} can see it.</p>
        </div>
      )}
      {post.status !== 'active' && (
        <div className="border-2 border-border p-3 text-sm" role="note">
          <p className="font-bold">
            {post.status === 'fulfilled'
              ? post.fulfilled_by_name ? `Fulfilled with help from ${post.fulfilled_by_name}` : 'Fulfilled'
              : postStatusLabel(post.status)}
            {changedOn ? ` on ${changedOn}` : ''}.
          </p>
          {post.status_reason && <p className="mt-1">Note: {post.status_reason}</p>}
        </div>
      )}
    </>
  );
}
