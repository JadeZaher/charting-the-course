import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ageText,
  conversationIdFromQuery,
  discoverWithoutPost,
  formErrorView,
  moderatedInSelection,
  ownPublicationsOf,
  postIdFromQuery,
  postMoveActions,
  postMoveToast,
  postStatusLabel,
  publishedNotice,
  respondBlockedText,
  respondView,
  visibilityHelp,
  waitingOnText,
} from './exchange';
import type { SharesNeedsPost } from '@/types/api';

/** A server-shaped error (lib/api-client.ts ExchangeApiError) without importing the client. */
function serverError(status: number, message: string, details: Record<string, unknown> = {}) {
  return Object.assign(new Error(message), {
    status,
    code: typeof details.code === 'string' ? details.code : null,
    field: typeof details.field === 'string' ? details.field : null,
    details,
  });
}

test('the answer button names what answering means for each kind of post', () => {
  const answerable = { status: 'active', caller_has_responded: false, caller_conversation_id: null, caller_can_respond: true, respond_blocked: null } as const;
  const cases: Array<[SharesNeedsPost['type'], string]> = [
    ['need', 'Offer help'],
    ['share', 'Ask for this'],
    ['solution', 'Ask about this'],
  ];
  for (const [type, label] of cases) {
    assert.deepEqual(respondView({ ...answerable, type }), { kind: 'respond', label }, type);
  }
});

test('a post the caller cannot answer explains why; an earlier answer wins over every other state', () => {
  const base = { type: 'need', status: 'active', caller_has_responded: false, caller_conversation_id: null, caller_can_respond: false, respond_blocked: null } as const;
  assert.deepEqual(
    respondView({ ...base, status: 'fulfilled', caller_has_responded: true, caller_conversation_id: 'c-1', respond_blocked: 'POST_CLOSED' }),
    { kind: 'answered', conversationId: 'c-1' },
  );
  assert.deepEqual(respondView({ ...base, respond_blocked: 'OWN_POST' }), { kind: 'blocked', text: respondBlockedText('OWN_POST') });
  assert.deepEqual(respondView(base), { kind: 'none' });

  const sentences: Array<[Parameters<typeof respondBlockedText>[0], string | undefined, RegExp]> = [
    ['OWN_POST', undefined, /your post/],
    ['POST_CLOSED', 'fulfilled', /marked fulfilled/],
    ['POST_CLOSED', 'withdrawn', /was withdrawn/],
    ['AUTHOR_INACTIVE', undefined, /no longer an active member/],
    ['CONSENT_PENDING', undefined, /membership agreements/],
    ['MEMBERSHIP_REQUIRED', undefined, /active member of an ecosystem/],
  ];
  for (const [code, status, expected] of sentences) assert.match(respondBlockedText(code, status), expected, code);
});

test("the author's buttons come from allowed_next: keep-open versus reopen depends on the current status", () => {
  const open = postMoveActions({
    status: 'active',
    title: 'Seed library',
    allowed_next: [
      { status: 'fulfilled', label: 'Mark fulfilled' },
      { status: 'withdrawn', label: 'Withdraw' },
      { status: 'active', label: '' },
    ],
  });
  assert.deepEqual(open.map((move) => [move.kind, move.label]), [['fulfil', 'Mark fulfilled'], ['withdraw', 'Withdraw'], ['keep-open', 'Keep it open']]);
  assert.equal(open[0].confirm, null, 'fulfil opens its own dialog');
  assert.match(open[1].confirm?.title ?? '', /Withdraw “Seed library”/);
  assert.equal(open[2].confirm, null, 'keeping a post open needs no confirmation');

  const closed = postMoveActions({ status: 'withdrawn', title: 'Seed library', allowed_next: [{ status: 'active', label: 'Reopen' }] });
  assert.deepEqual(closed.map((move) => move.kind), ['reopen']);
  assert.match(closed[0].confirm?.title ?? '', /Reopen/);

  assert.deepEqual(postMoveActions({ status: 'active', title: 'x', allowed_next: [] }), [], 'a non-author gets no buttons');
});

test('the toast after a move reads the status the server returned', () => {
  assert.equal(postMoveToast({ status: 'fulfilled' }).title, 'Marked fulfilled');
  assert.equal(postMoveToast({ status: 'withdrawn' }).title, 'Withdrawn');
  assert.match(postMoveToast({ status: 'active' }).description, /90 days/);
  assert.equal(postStatusLabel('active'), 'Open');
  assert.equal(postStatusLabel('toString'), 'toString', 'prototype keys are not statuses');
});

test('visibility help says who can see the post, naming the ecosystem', () => {
  assert.match(visibilityHelp('public', 'Oasis'), /Anyone signed in/);
  assert.equal(visibilityHelp('ecosystem', 'Oasis'), 'Only active members of Oasis can see and answer it.');
  assert.equal(visibilityHelp('domain', 'Oasis'), 'Only people who take part in this domain, and the stewards of Oasis.');
  assert.match(visibilityHelp('domain', null), /stewards of this ecosystem/);
});

test('the publish toast names where the post is listed and lands on a page that shows it', () => {
  const post = { id: 'p-1', type: 'need', ecosystem_id: 'e-1', ecosystem_name: 'Oasis', domain_id: 'd-1', domain_name: 'Water' } as const;
  const cases: Array<[SharesNeedsPost['visibility'], RegExp, string]> = [
    ['public', /Discover/, '/discover?tab=shares-needs&post=p-1'],
    ['ecosystem', /members of Oasis/, '/ecosystems/e-1'],
    ['domain', /people in Water and the stewards of Oasis/, '/domains/d-1'],
  ];
  for (const [visibility, description, href] of cases) {
    const notice = publishedNotice({ ...post, visibility });
    assert.equal(notice.title, 'Need published');
    assert.match(notice.description, description, visibility);
    assert.equal(notice.href, href, visibility);
  }
});

test('age text steps from days to weeks to months', () => {
  const cases: Array<[number, string]> = [
    [0, 'today'],
    [-3, 'today'],
    [Number.NaN, 'today'],
    [1, 'yesterday'],
    [2, '2 days ago'],
    [6, '6 days ago'],
    [7, '1 week ago'],
    [29, '4 weeks ago'],
    [30, '1 month ago'],
    [95, '3 months ago'],
  ];
  for (const [days, expected] of cases) assert.equal(ageText(days), expected, String(days));
});

test('"Waiting on" names every ecosystem that has not approved yet', () => {
  assert.equal(waitingOnText([]), null);
  assert.equal(waitingOnText([{ ecosystem_name: 'Oasis' }]), 'Waiting on Oasis');
  assert.equal(waitingOnText([{ ecosystem_name: 'Oasis' }, { ecosystem_name: 'OmniOne' }]), 'Waiting on Oasis and OmniOne');
  assert.equal(waitingOnText([{ ecosystem_name: 'A' }, { ecosystem_name: null }, { ecosystem_name: 'C' }]), 'Waiting on A, another ecosystem and C');
});

test('?post= opens a post only for a plain id, and closing keeps the other parameters', () => {
  const cases: Array<[string, string | null]> = [
    ['tab=shares-needs&post=3f2a-b9', '3f2a-b9'],
    ['?post=abc_123', 'abc_123'],
    ['tab=shares-needs', null],
    ['post=', null],
    ['post=../admin', null],
    ['post=a%2Fb', null],
  ];
  for (const [query, expected] of cases) assert.equal(postIdFromQuery(query), expected, query);
  assert.equal(discoverWithoutPost('/discover', 'tab=shares-needs&post=p-1'), '/discover?tab=shares-needs');
  assert.equal(discoverWithoutPost('/discover', 'post=p-1'), '/discover');
});

test('a failed write shows one message: under the field the server named, else for the whole form', () => {
  const fieldMap = { title: 'title', domain_id: 'domain' } as const;
  assert.deepEqual(
    formErrorView(serverError(400, 'Title must be 255 characters or fewer.', { field: 'title' }), fieldMap),
    { fields: { title: 'Title must be 255 characters or fewer.' }, form: null, duplicateOf: null },
  );
  assert.deepEqual(
    formErrorView(serverError(400, 'Choose a domain.', { field: 'domain_id' }), fieldMap).fields,
    { domain: 'Choose a domain.' },
  );
  assert.deepEqual(
    formErrorView(serverError(400, 'Bad tags.', { field: 'tags' }), fieldMap),
    { fields: {}, form: 'Bad tags.', duplicateOf: null },
    'a field this form does not show becomes a form message',
  );
  assert.equal(formErrorView(serverError(400, 'x', { field: 'constructor' }), fieldMap).form, 'x', 'prototype keys are not fields');
  assert.deepEqual(
    formErrorView(serverError(409, 'You already have this open.', { code: 'DUPLICATE_POST', existing_id: 'p-9' }), fieldMap),
    { fields: {}, form: 'You already have this open.', duplicateOf: 'p-9' },
  );
  assert.equal(formErrorView(serverError(409, 'Clash.', { code: 'OTHER', existing_id: 'p-9' }), fieldMap).duplicateOf, null);
  assert.deepEqual(formErrorView(null, fieldMap), { fields: {}, form: null, duplicateOf: null });
});

test("Me lists own_publications when the server sends them, else reads the public list as the author's own", () => {
  const legacy = {
    id: 'p-1', type: 'share', title: 'Tools', description: null, category: null, capacity: null, visibility: 'public',
    status: 'active', ecosystem_id: 'e-1', domain_id: 'd-1', author_member_id: 'm-1', created_at: '2026-10-01T00:00:00Z',
  } as const;
  const [fallback] = ownPublicationsOf({ publications: [legacy] });
  assert.equal(fallback.caller_can_edit, true);
  assert.deepEqual(fallback.allowed_next, [{ status: 'withdrawn', label: 'Withdraw' }]);
  assert.equal(fallback.caller_can_delete, false, 'delete waits for the server to say nobody answered');

  const own = { ...fallback, id: 'p-2', status: 'withdrawn', allowed_next: [{ status: 'active', label: 'Reopen' }] } as SharesNeedsPost;
  assert.deepEqual(ownPublicationsOf({ publications: [legacy], own_publications: [own] }).map((post) => post.id), ['p-2']);
});

// FX-Exchange
test('?conversation= opens a conversation only for a plain id', () => {
  assert.equal(conversationIdFromQuery('?conversation=4f2c-9a'), '4f2c-9a');
  assert.equal(conversationIdFromQuery('conversation=abc&tab=x'), 'abc');
  assert.equal(conversationIdFromQuery(''), null);
  assert.equal(conversationIdFromQuery('?conversation=../admin'), null);
  assert.equal(conversationIdFromQuery('?post=abc'), null);
});

test('the Moderation link shows for the moderated ecosystems inside the header selection only', () => {
  const moderated = [{ id: 'oasis', name: 'Oasis' }, { id: 'river', name: 'River House' }];
  assert.deepEqual(moderatedInSelection(moderated, ['river', 'fresh']).map((e) => e.name), ['River House']);
  assert.deepEqual(moderatedInSelection(moderated, ['fresh']), []);  // a steward elsewhere: no link
  assert.deepEqual(moderatedInSelection(undefined, ['oasis']), []);  // still loading
});
