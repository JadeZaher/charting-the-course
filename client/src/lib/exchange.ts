// Shares, needs and collaborations: the wording and the decisions the exchange screens share (see client/src/AGENTS.md "Exchange (G-Exchange)").
import { apiErrorMessage } from './api-error-message';
import type {
  CollaborationEndOutcome,
  CollaborationSide,
  SharesNeedsMove,
  SharesNeedsPost,
  SharesNeedsRespondBlocked,
  SharesNeedsStatus,
  SharesNeedsType,
  SharesNeedsVisibility,
} from '@/types/api';

/** Days after posting, reopening or "keep it open" when the author is asked "Still open?". */
export const STILL_OPEN_AFTER_DAYS = 90;

export const POST_TYPE_LABELS: Readonly<Record<SharesNeedsType, string>> = { share: 'Share', need: 'Need', solution: 'Solution' };

export const POST_STATUS_LABELS: Readonly<Record<SharesNeedsStatus, string>> = {
  active: 'Open',
  fulfilled: 'Fulfilled',
  withdrawn: 'Withdrawn',
};

/** Plain label for a post status; an unknown value is shown as sent. */
export function postStatusLabel(status: string): string {
  return hasKey(POST_STATUS_LABELS, status) ? POST_STATUS_LABELS[status] : status;
}

/** The card's answer button: what answering means for each kind of post. */
export function respondActionLabel(type: SharesNeedsType): string {
  if (type === 'need') return 'Offer help';
  if (type === 'share') return 'Ask for this';
  return 'Ask about this';
}

/** Why the caller cannot answer, in words, instead of a dead button. */
export function respondBlockedText(code: SharesNeedsRespondBlocked, status?: string): string {
  switch (code) {
    case 'OWN_POST':
      return 'This is your post. Answers to it arrive in Messages.';
    case 'POST_CLOSED':
      if (status === 'fulfilled') return 'This post is marked fulfilled, so it is not taking answers.';
      if (status === 'withdrawn') return 'This post was withdrawn, so it is not taking answers.';
      return 'This post is closed, so it is not taking answers.';
    case 'AUTHOR_INACTIVE':
      return 'The person who posted this is no longer an active member, so they cannot receive answers.';
    case 'CONSENT_PENDING':
      return "You can answer once you have agreed to your ecosystem's membership agreements.";
    case 'MEMBERSHIP_REQUIRED':
      return 'You need to be an active member of an ecosystem before you can answer posts.';
    default:
      return 'You cannot answer this post.';
  }
}

function hasKey<Key extends string>(record: Readonly<Record<Key, unknown>>, key: string): key is Key {
  return Object.prototype.hasOwnProperty.call(record, key);
}

export type RespondView =
  | { kind: 'answered'; conversationId: string | null }
  | { kind: 'respond'; label: string }
  | { kind: 'blocked'; text: string }
  | { kind: 'none' };

/** What a post shows the caller about answering it: their earlier answer, the answer button, the reason they cannot, or nothing. */
export function respondView(
  post: Pick<SharesNeedsPost, 'type' | 'status' | 'caller_has_responded' | 'caller_conversation_id' | 'caller_can_respond' | 'respond_blocked'>,
): RespondView {
  if (post.caller_has_responded) return { kind: 'answered', conversationId: post.caller_conversation_id };
  if (post.caller_can_respond) return { kind: 'respond', label: respondActionLabel(post.type) };
  if (post.respond_blocked) return { kind: 'blocked', text: respondBlockedText(post.respond_blocked, post.status) };
  return { kind: 'none' };
}

export type PostMoveKind = 'fulfil' | 'withdraw' | 'keep-open' | 'reopen';

export interface PostMoveAction {
  status: SharesNeedsStatus;
  kind: PostMoveKind;
  label: string;
  /** AlertDialog copy for moves that need a yes; null when the move opens its own dialog or needs none. */
  confirm: { title: string; description: string; action: string } | null;
}

const DEFAULT_MOVE_LABELS: Readonly<Record<PostMoveKind, string>> = {
  fulfil: 'Mark fulfilled',
  withdraw: 'Withdraw',
  'keep-open': 'Keep it open',
  reopen: 'Reopen',
};

/** Which move `from` -> `to` is; null for a target this screen does not know. */
export function postMoveKind(from: SharesNeedsStatus, to: SharesNeedsStatus): PostMoveKind | null {
  if (to === 'fulfilled') return 'fulfil';
  if (to === 'withdrawn') return 'withdraw';
  if (to === 'active') return from === 'active' ? 'keep-open' : 'reopen';
  return null;
}

function moveConfirmation(kind: PostMoveKind, title: string): PostMoveAction['confirm'] {
  if (kind === 'withdraw') {
    return {
      title: `Withdraw “${title}”?`,
      description: 'It stops showing in Discover and stops taking answers. You can reopen it later.',
      action: 'Withdraw',
    };
  }
  if (kind === 'reopen') {
    return {
      title: `Reopen “${title}”?`,
      description: 'It shows in Discover again and can take answers.',
      action: 'Reopen',
    };
  }
  return null;
}

/** The author's buttons, from the server's `allowed_next` (never from a client table). */
export function postMoveActions(post: Pick<SharesNeedsPost, 'status' | 'title'> & { allowed_next: readonly SharesNeedsMove[] }): PostMoveAction[] {
  return post.allowed_next.flatMap((move) => {
    const kind = postMoveKind(post.status, move.status);
    if (!kind) return [];
    return [{ status: move.status, kind, label: move.label?.trim() || DEFAULT_MOVE_LABELS[kind], confirm: moveConfirmation(kind, post.title) }];
  });
}

/** Toast after a status move, read from the post the server returned. */
export function postMoveToast(post: Pick<SharesNeedsPost, 'status'>): { title: string; description: string } {
  if (post.status === 'fulfilled') return { title: 'Marked fulfilled', description: 'It no longer takes answers. You can reopen it.' };
  if (post.status === 'withdrawn') return { title: 'Withdrawn', description: 'It no longer shows in Discover. You can reopen it.' };
  return { title: 'Open', description: `It shows in Discover and takes answers. We will ask again in ${STILL_OPEN_AFTER_DAYS} days.` };
}

export const POST_VISIBILITIES: readonly SharesNeedsVisibility[] = ['public', 'ecosystem', 'domain'];

export const VISIBILITY_LABELS: Readonly<Record<SharesNeedsVisibility, string>> = {
  public: 'Everyone on NEOS',
  ecosystem: 'Ecosystem members',
  domain: 'Domain participants',
};

/** Label for a stored visibility; a retired value (e.g. `private`) is shown as sent. */
export function visibilityLabel(visibility: string): string {
  return hasKey(VISIBILITY_LABELS, visibility) ? VISIBILITY_LABELS[visibility] : visibility;
}

/** One line saying who can see a post with this visibility. */
export function visibilityHelp(visibility: SharesNeedsVisibility, ecosystemName?: string | null): string {
  const ecosystem = ecosystemName?.trim() || 'this ecosystem';
  if (visibility === 'public') return 'Anyone signed in to NEOS can find it in Discover and answer it.';
  if (visibility === 'ecosystem') return `Only active members of ${ecosystem} can see and answer it.`;
  return `Only people who take part in this domain, and the stewards of ${ecosystem}.`;
}

/** Success toast after publishing, naming where the post is listed, and the page that shows it. */
export function publishedNotice(
  post: Pick<SharesNeedsPost, 'id' | 'type' | 'visibility' | 'ecosystem_id' | 'ecosystem_name' | 'domain_id' | 'domain_name'>,
): { title: string; description: string; href: string } {
  const title = `${POST_TYPE_LABELS[post.type] ?? 'Post'} published`;
  const ecosystem = post.ecosystem_name?.trim() || 'your ecosystem';
  const domain = post.domain_name?.trim() || 'its domain';
  if (post.visibility === 'ecosystem') {
    return { title, description: `Only members of ${ecosystem} see it. It is listed on ${ecosystem}'s page.`, href: `/ecosystems/${encodeURIComponent(post.ecosystem_id)}` };
  }
  if (post.visibility === 'domain') {
    return {
      title,
      description: `Only people in ${domain} and the stewards of ${ecosystem} see it. It is listed on the ${domain} page.`,
      href: `/domains/${encodeURIComponent(post.domain_id)}`,
    };
  }
  return { title, description: 'It is listed in Discover, under Shares + needs, for everyone signed in.', href: postHref(post.id) };
}

/** "today", "yesterday", "3 days ago", "2 weeks ago", "4 months ago" from a whole-day count. */
export function ageText(days: number): string {
  const whole = Number.isFinite(days) ? Math.max(0, Math.floor(days)) : 0;
  if (whole === 0) return 'today';
  if (whole === 1) return 'yesterday';
  if (whole < 7) return `${whole} days ago`;
  if (whole < 30) {
    const weeks = Math.floor(whole / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  const months = Math.floor(whole / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

/** "A", "A and B", "A, B and C". */
export function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** "Waiting on A and B" for a proposed collaboration's missing approvals; null when none are missing. */
export function waitingOnText(awaiting: readonly Pick<CollaborationSide, 'ecosystem_name'>[]): string | null {
  if (awaiting.length === 0) return null;
  return `Waiting on ${joinNames(awaiting.map((side) => side.ecosystem_name?.trim() || 'another ecosystem'))}`;
}

export const END_OUTCOME_LABELS: Readonly<Record<CollaborationEndOutcome, string>> = {
  completed: 'Completed: it did what it set out to do',
  dissolved: 'Dissolved: it ends without being completed',
};

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** A record id from the query string (`post`, `from`), or null; anything that is not a plain id is refused so it never reaches a request path. */
export function idFromQuery(queryString: string, name: string): string | null {
  const id = new URLSearchParams(queryString).get(name)?.trim() ?? '';
  return SAFE_ID.test(id) ? id : null;
}

/** The post a Discover URL opens (`/discover?tab=shares-needs&post=<id>`, the bell's "Still open?" link). */
export function postIdFromQuery(queryString: string): string | null {
  return idFromQuery(queryString, 'post');
}

/** Discover URL that opens one post's detail. */
export function postHref(id: string): string {
  return `/discover?tab=shares-needs&post=${encodeURIComponent(id)}`;
}

/** The same Discover URL without `post`, keeping every other parameter (closing the detail). */
export function discoverWithoutPost(path: string, queryString: string): string {
  const params = new URLSearchParams(queryString);
  params.delete('post');
  const rest = params.toString();
  return rest ? `${path}?${rest}` : path;
}

/** Messages, opened on one conversation when the server named it. */
export function conversationHref(conversationId: string | null | undefined): string {
  return conversationId ? `/messaging?conversation=${encodeURIComponent(conversationId)}` : '/messaging';
}

/** The collaboration form, prefilled from a post. */
export function proposeFromPostHref(postId: string): string {
  return `/discover/collaborations/new?from=${encodeURIComponent(postId)}`;
}

/** The server's error extras (ExchangeApiError in lib/api-client.ts), read by shape so this module stays free of import.meta.env. */
interface ExchangeErrorShape {
  code?: unknown;
  field?: unknown;
  details?: unknown;
}

/** The `code` an exchange route answered with, or null. */
export function exchangeErrorCode(error: unknown): string | null {
  if (!(error instanceof Error)) return null;
  const { code } = error as ExchangeErrorShape;
  return typeof code === 'string' ? code : null;
}

export interface FormErrorView<Name extends string> {
  /** The server's sentence under the field it named. */
  fields: Partial<Record<Name, string>>;
  /** The sentence for the whole form when it named no field this form shows. */
  form: string | null;
  /** DUPLICATE_POST: the author's open post with the same title, to link to. */
  duplicateOf: string | null;
}

/** Splits a failed write into one message: under the server's `field` when this form shows it (`fieldMap`: server name -> form name), else for the whole form. */
export function formErrorView<Name extends string>(error: unknown, fieldMap: Readonly<Record<string, Name>>): FormErrorView<Name> {
  if (!error) return { fields: {}, form: null, duplicateOf: null };
  const message = apiErrorMessage(error);
  const { field, details } = (error instanceof Error ? error : {}) as ExchangeErrorShape;
  const existing = details && typeof details === 'object' ? (details as Record<string, unknown>).existing_id : undefined;
  const duplicateOf = exchangeErrorCode(error) === 'DUPLICATE_POST' && typeof existing === 'string' && SAFE_ID.test(existing) ? existing : null;
  if (typeof field === 'string' && Object.prototype.hasOwnProperty.call(fieldMap, field)) {
    return { fields: { [fieldMap[field]]: message } as Partial<Record<Name, string>>, form: null, duplicateOf };
  }
  return { fields: {}, form: message, duplicateOf };
}

/** A publication as an older /profiles/me sent it (before `own_publications`). */
export interface LegacyPublication {
  id: string;
  type: SharesNeedsType;
  title: string;
  description: string | null;
  category: string | null;
  capacity: string | null;
  tags?: string[];
  visibility: string;
  status: string;
  ecosystem_id: string;
  ecosystem_name?: string | null;
  domain_id: string;
  domain_name?: string | null;
  author_member_id: string | null;
  author_name?: string | null;
  created_at: string | null;
}

/** An item of the public `publications` list read as the caller's own (that list is only ever their active, public posts). */
function asOwnPost(item: LegacyPublication & Partial<Omit<SharesNeedsPost, keyof LegacyPublication>>): SharesNeedsPost {
  const status: SharesNeedsStatus = hasKey(POST_STATUS_LABELS, item.status) ? item.status : 'active';
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    description: item.description,
    category: item.category,
    capacity: item.capacity,
    tags: item.tags ?? [],
    visibility: hasKey(VISIBILITY_LABELS, item.visibility) ? item.visibility : 'public',
    status,
    ecosystem_id: item.ecosystem_id,
    ecosystem_name: item.ecosystem_name ?? null,
    domain_id: item.domain_id,
    domain_name: item.domain_name ?? null,
    author_member_id: item.author_member_id,
    author_name: item.author_name ?? null,
    created_at: item.created_at ?? '',
    updated_at: item.updated_at ?? item.created_at ?? '',
    age_days: item.age_days ?? 0,
    status_reason: item.status_reason ?? null,
    status_changed_at: item.status_changed_at ?? null,
    fulfilled_by_member_id: item.fulfilled_by_member_id ?? null,
    fulfilled_by_name: item.fulfilled_by_name ?? null,
    hidden: item.hidden ?? false,
    hidden_reason: item.hidden_reason ?? null,
    hidden_at: item.hidden_at ?? null,
    hidden_by_name: item.hidden_by_name ?? null,
    response_count: item.response_count ?? null,
    responders: item.responders ?? [],
    caller_is_author: item.caller_is_author ?? true,
    caller_can_edit: item.caller_can_edit ?? true,
    caller_can_moderate: item.caller_can_moderate ?? false,
    caller_can_manage: item.caller_can_manage ?? true,
    caller_can_delete: item.caller_can_delete ?? false,
    caller_can_respond: item.caller_can_respond ?? false,
    respond_blocked: item.respond_blocked ?? 'OWN_POST',
    caller_has_responded: item.caller_has_responded ?? false,
    caller_conversation_id: item.caller_conversation_id ?? null,
    allowed_next: item.allowed_next ?? (status === 'active' ? [{ status: 'withdrawn', label: 'Withdraw' }] : []),
  };
}

/** The owner's list on Me: `own_publications` (every state) when the server sends it, else the public list read as their own. */
export function ownPublicationsOf(profile: {
  publications: readonly LegacyPublication[];
  own_publications?: readonly SharesNeedsPost[] | null;
}): SharesNeedsPost[] {
  if (profile.own_publications) return [...profile.own_publications];
  return profile.publications.map((item) => asOwnPost(item));
}

// FX-Exchange: the Messaging deep link and the Moderation sidebar item (client/src/AGENTS.md "Exchange (G-Exchange)").

/** The conversation `/messaging?conversation=<id>` opens (the bell's "answered your post", RespondDialog's link). */
export function conversationIdFromQuery(queryString: string): string | null {
  return idFromQuery(queryString, 'conversation');
}

/** The ecosystems the caller moderates that are in the header selection, in the server's order. */
export function moderatedInSelection<Ecosystem extends { id: string }>(
  moderated: readonly Ecosystem[] | undefined,
  selectedIds: readonly string[],
): Ecosystem[] {
  return (moderated ?? []).filter((ecosystem) => selectedIds.includes(ecosystem.id));
}
