import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { JoinGates } from './join-gates';
import { spaceHomeCopy as copy } from './space-home-copy';
import {
  happening,
  headerStatus,
  isCompletedNextStep,
  isLongOverdue,
  modelContains,
  nextCard,
  pendingJoinAction,
  publicMemberCount,
  spaceViewer,
  stepsForEcosystem,
  directoryCandidates,
  whosHere,
  type SpaceStep,
} from './space-home';

const NOW = new Date(2026, 10, 10, 12, 0, 0);
const ECO = 'eco-1';
const NAME = 'Northwind';

function step(partial: Partial<SpaceStep> & Pick<SpaceStep, 'uid'>): SpaceStep {
  return {
    kind: 'proposal',
    id: partial.uid,
    ecosystem_id: ECO,
    action: 'Open',
    what: 'A short next step.',
    link: '/proposals/p-1',
    overdue: false,
    due: null,
    ...partial,
  };
}

const gatesBlocked: JoinGates = {
  target_type: 'ecosystem',
  target_id: ECO,
  eligible: false,
  status: 'quiz_required',
  required_quizzes: [{ id: 'quiz-1', title: 'Readiness', scope_type: 'ecosystem', scope_id: ECO, status: 'required', completion_mode: 'completion', href: '/quiz/take/quiz-1' }],
  required_agreements: [],
};

test('header status uses the table sentences and only pending offers finish joining', () => {
  assert.equal(headerStatus('member', NAME).text, "You're an active member of Northwind.");
  assert.equal(headerStatus('pending', NAME).text, 'Your membership is pending. Finish the steps below to take part.');
  assert.equal(headerStatus('pending', NAME).finishJoining, true);
  assert.equal(headerStatus('signed-out', NAME).text, 'This is a public preview of Northwind.');
  assert.equal(headerStatus('guest', NAME).text, "You're not a member of Northwind yet.");
  assert.equal(spaceViewer(false, 'active'), 'signed-out');
  assert.equal(spaceViewer(true, 'pending'), 'pending');
  assert.equal(spaceViewer(true, 'left'), 'guest');
});

test('a missing public count is not invented', () => {
  assert.equal(publicMemberCount({}), null);
  assert.equal(publicMemberCount({ member_count: 0 }), 0);
  assert.equal(publicMemberCount({ member_count: '4' }), 4);
  assert.equal(publicMemberCount({ member_count: -1 }), null);
});

test('long overdue is the server flag plus the day cutoff, not a client guess', () => {
  assert.equal(isLongOverdue('2026-09-10', true, NOW), true);
  assert.equal(isLongOverdue('2026-09-12', true, NOW), false);
  assert.equal(isLongOverdue('2026-01-01', false, NOW), false);
  assert.equal(isLongOverdue(null, true, NOW), false);
});

test('an active member does not see a finished entry quiz or joining consent again', () => {
  const quiz = step({ uid: 'q', kind: 'newcomer', action: 'Start the entry questionnaire', link: '/quiz/take/quiz-1', what: 'Entry questionnaire' });
  const consent = step({ uid: 'c', kind: 'newcomer', what: 'Consent to the membership agreements', link: '/agreements/a-1' });
  const orientation = step({ uid: 'o', kind: 'newcomer', what: 'Start orientation', link: '/orientation/eco-1' });
  assert.equal(isCompletedNextStep(quiz, true), true);
  assert.equal(isCompletedNextStep(consent, true), true);
  assert.equal(isCompletedNextStep(orientation, true), false);
  assert.equal(isCompletedNextStep(quiz, false), false);
});

test('the next card shows one primary, two secondary actions, and a view-all link', () => {
  const items = [1, 2, 3, 4, 5].map((n) => step({
    uid: `s-${n}`,
    id: `p-${n}`,
    action: `Do step ${n}`,
    what: `Step ${n} is waiting.`,
    link: `/proposals/p-${n}`,
    kind: 'proposal',
    title: 'Advice',
  }));
  const card = nextCard({ viewer: 'member', name: NAME, ecosystemId: ECO, items, now: NOW, firstSession: false, signInHref: '/login' });
  assert.equal(card.primary?.label, 'Do step 1');
  assert.deepEqual(card.secondary.map((item) => item.label), ['Do step 2', 'Do step 3']);
  assert.equal(card.overflow?.label, 'View all 5 items');
  assert.equal(card.sentence, 'Step 1 is waiting.');
});

test('day one does not lead with months-overdue work, and another ecosystem stays out', () => {
  const items = [
    step({ uid: 'old', action: 'Give advice on the old charter', what: 'Advise on the old charter', due: '2026-05-29', overdue: true, link: '/proposals/old' }),
    step({ uid: 'fresh', kind: 'newcomer', action: 'Start orientation', what: 'Orientation is still open.', link: '/orientation/eco-1' }),
    step({ uid: 'other', ecosystem_id: 'eco-9', action: 'Read Secret Charter', what: 'Secret Charter is waiting.', link: '/proposals/secret' }),
  ];
  const card = nextCard({ viewer: 'member', name: NAME, ecosystemId: ECO, items, now: NOW, firstSession: true, signInHref: '/login' });
  assert.equal(card.welcome, true);
  assert.equal(card.primary && card.primary.kind === 'link' && card.primary.label, 'Start orientation');
  assert.equal(modelContains(card, 'old charter'), false);
  assert.equal(modelContains(card, 'Secret Charter'), false);
  assert.equal(card.overflow?.label, 'View all 2 items');
});

test('a clear member queue uses the empty sentence and its two links', () => {
  const card = nextCard({ viewer: 'member', name: NAME, ecosystemId: ECO, items: [], now: NOW, firstSession: false, signInHref: '/login' });
  assert.equal(card.empty, true);
  assert.equal(card.sentence, copy.next.empty);
  assert.equal(card.primary?.label, 'Browse open proposals');
  assert.equal(card.secondary[0]?.label, 'View recent decisions');
});

test('only older work on day one is a group, not the overdue title', () => {
  const items = [step({ uid: 'old', action: 'Give advice on the old charter', due: '2026-05-29', overdue: true })];
  const card = nextCard({ viewer: 'member', name: NAME, ecosystemId: ECO, items, now: NOW, firstSession: true, signInHref: '/login' });
  assert.equal(card.primary, null);
  assert.equal(card.secondary[0]?.label, 'Older items');
  assert.equal(modelContains(card, 'old charter'), false);
});

test('signed-out and guests do not render queue titles', () => {
  const items = [step({ uid: 'p', what: 'Private proposal title', action: 'Give advice' })];
  const signedOut = nextCard({ viewer: 'signed-out', name: NAME, ecosystemId: ECO, items, now: NOW, firstSession: false, signInHref: '/login?ecosystem=eco-1' });
  assert.equal(signedOut.primary?.label, 'Sign in to join');
  assert.equal(modelContains(signedOut, 'Private proposal title'), false);
  const guest = nextCard({ viewer: 'guest', name: NAME, ecosystemId: ECO, items, now: NOW, firstSession: false, signInHref: '/login' });
  assert.equal(guest.primary?.label, 'Join Northwind');
  assert.equal(modelContains(guest, 'Private proposal title'), false);
});

test('a pending member gets one join action, and an empty queue falls back to the gate', () => {
  const queued = nextCard({
    viewer: 'pending',
    name: NAME,
    ecosystemId: ECO,
    items: [step({ uid: 'advice', action: 'Give advice', what: 'Private proposal title' })],
    now: NOW,
    firstSession: false,
    gates: gatesBlocked,
    signInHref: '/login',
  });
  assert.equal(queued.primary?.label, 'Start the entry questionnaire');
  assert.deepEqual(queued.secondary, []);
  assert.equal(modelContains(queued, 'Private proposal title'), false);
  assert.notEqual(queued.sentence, copy.next.empty);

  const empty = nextCard({ viewer: 'pending', name: NAME, ecosystemId: ECO, items: [], now: NOW, firstSession: false, gates: gatesBlocked, signInHref: '/login' });
  assert.equal(empty.primary?.label, 'Start the entry questionnaire');
  assert.equal(empty.empty, false);

  const agreements: JoinGates = { ...gatesBlocked, status: 'agreement_consent_required', required_quizzes: [], required_agreements: [{ id: 'a-1', title: 'Membership', href: '/agreements/a-1' }] };
  assert.equal(pendingJoinAction(agreements, null)?.label, 'Read and consent to the agreements');
});

test("who's here is a count for pending, public and signed-out viewers, with no names", () => {
  const input = {
    ecosystemName: NAME,
    memberCount: 9,
    stewards: [{ display_name: 'A. Steward', role: 'admin' }],
    circles: [{ name: 'Core Operations', purpose: 'Runs the day', steward: 'A. Steward', code: 'DOM-SECRET' }],
    members: [{ display_name: 'A. Member', role: 'user', directory_visible: true, id: 'mem-1', phone: '555-0100', did: 'did:example:secret' } as never],
  };
  for (const viewer of ['pending', 'guest', 'signed-out'] as const) {
    const panel = whosHere({ viewer, ...input });
    assert.equal(panel.mode, 'count');
    assert.equal(panel.countText, "9 members. You'll see names and roles once you join.");
    assert.equal(modelContains(panel, 'A. Steward'), false);
    assert.equal(modelContains(panel, 'A. Member'), false);
    assert.equal(modelContains(panel, '555-0100'), false);
    assert.equal(modelContains(panel, 'did:example'), false);
    assert.equal(modelContains(panel, 'DOM-SECRET'), false);
    assert.equal(modelContains(panel, 'mem-1'), false);
  }
  assert.equal(whosHere({ viewer: 'signed-out', ecosystemName: NAME, memberCount: 0 }).countText, 'No members are listed yet.');
  assert.equal(whosHere({ viewer: 'signed-out', ecosystemName: NAME, memberCount: null }).countText, null);
});

test('members see opted-in people and circles, and nobody who opted out', () => {
  const panel = whosHere({
    viewer: 'member',
    ecosystemName: NAME,
    memberCount: 3,
    stewards: [{ display_name: 'A. Steward', role: 'admin' }, { display_name: '11111111-2222-3333-4444-555555555555', role: 'owner' }],
    circles: [
      { name: 'Core Operations', purpose: 'Runs the day', steward: 'A. Steward', code: 'DOM-SECRET' },
      { name: 'DOM-ONLY', code: 'DOM-ONLY' },
    ],
    members: [
      { display_name: 'A. Member', role: 'user', directory_visible: true, id: 'mem-1', phone: '555-0100' } as DirectoryWithSecrets,
      { display_name: 'B. Member', role: 'mod', directory_visible: false, id: 'mem-2' },
      { display_name: 'C. Member', role: 'user', id: 'mem-3' },
      { display_name: 'D. Member', role: 'owner', id: 'mem-4' },
    ],
    optedInIds: new Set(['mem-4']),
  });
  assert.equal(panel.stewards[0]?.text, 'A. Steward — steward of Northwind');
  assert.equal(panel.circles[0]?.text, 'A. Steward — steward of Core Operations');
  assert.equal(panel.circles[0]?.detail, 'Runs the day');
  assert.equal(panel.emptyCircles, false);
  assert.deepEqual(panel.members.map((row) => row.text), ['A. Member — member', 'D. Member — owner']);
  assert.equal(modelContains(panel, 'B. Member'), false);
  assert.equal(modelContains(panel, 'C. Member'), false);
  assert.equal(modelContains(panel, '555-0100'), false);
  assert.equal(modelContains(panel, 'DOM-SECRET'), false);
  assert.equal(modelContains(panel, 'DOM-ONLY'), false);
  assert.equal(modelContains(panel, 'mem-1'), false);
  assert.equal(modelContains(panel, '11111111-2222-3333-4444-555555555555'), false);
});

test('an empty directory and empty circles use the table sentences', () => {
  const panel = whosHere({ viewer: 'member', ecosystemName: NAME, memberCount: 2, stewards: [], circles: [], members: [] });
  assert.equal(panel.emptyDirectory, true);
  assert.equal(panel.emptyCircles, true);
  assert.equal(copy.whosHere.emptyDirectory, 'No one has added themselves to the directory yet. You can still take part in governance.');
  assert.equal(copy.whosHere.emptyCircles, 'No circles are listed yet.');
});

test('participant names are kept and an explicit opt-out removes them, without contact fields', () => {
  const people = directoryCandidates(
    [{ display_name: 'B. Member', role: 'user', directory_visible: false, id: 'mem-2', phone: '555-0199' } as DirectoryWithSecrets],
    [{ display_name: 'A. Member', member_id: 'mem-1', user_id: 'user-1' }, { display_name: 'B. Member', member_id: 'mem-2' }],
  );
  assert.deepEqual(people.map((person) => person.display_name), ['A. Member']);
  assert.equal(modelContains(people, '555-0199'), false);
  assert.equal(people[0]?.directory_visible, true);
});

test('the directory stops at eight people', () => {
  const members = Array.from({ length: 10 }, (_, index) => ({
    display_name: `Person ${index + 1}`,
    role: 'user',
    directory_visible: true as const,
  }));
  const panel = whosHere({ viewer: 'member', ecosystemName: NAME, memberCount: 10, members });
  assert.equal(panel.members.length, 8);
  assert.equal(panel.moreDirectory, true);
});

const PRIVATE_TITLE = 'Private proposal title';

test("what's happening attributes work in text and asks only when the queue says so", () => {
  const feed = happening({
    viewer: 'member',
    ecosystemId: ECO,
    askedProposalIds: new Set(['p-advice']),
    proposals: [
      { id: 'p-advice', title: 'Shared kitchen', status: 'advice', proposer: 'A. Member', created_at: '2026-11-09T00:00:00Z', ecosystem_id: ECO },
      { id: 'p-consent', title: 'Quiet hours', status: 'consent', proposer: 'B. Member', created_at: '2026-11-08T00:00:00Z', ecosystem_id: ECO },
      { id: 'p-other', title: 'Elsewhere', status: 'advice', proposer: 'C. Member', created_at: '2026-11-10T00:00:00Z', ecosystem_id: 'eco-9' },
      { id: 'p-done', title: 'Already ratified', status: 'ratified', proposer: 'A. Member', created_at: '2026-11-10T00:00:00Z', ecosystem_id: ECO },
    ],
    decisions: [{ id: 'd-1', title: 'Bench budget', actor: 'B. Member', at: '2026-11-07T00:00:00Z', ecosystem_id: ECO }],
    agreements: [{ id: 'a-1', title: 'Membership', version: '3', at: '2026-11-06T00:00:00Z', ecosystem_id: ECO }],
  });
  const text = (index: number) => `${feed.items[index].before}${feed.items[index].title}${feed.items[index].after}`;
  assert.equal(text(0), 'A. Member opened Shared kitchen, now in Advice. Your advice is requested.');
  assert.equal(feed.items[0].href, '/proposals/p-advice');
  assert.equal(text(1), 'B. Member opened Quiet hours, now in Consent.');
  assert.equal(text(1).includes('Your consent is requested'), false);
  assert.equal(text(2), 'B. Member recorded a decision on Bench budget.');
  assert.equal(text(3), 'The agreement Membership was updated to version 3.');
  assert.equal(modelContains(feed, 'Elsewhere'), false);
  assert.equal(modelContains(feed, 'Already ratified'), false);
  assert.equal(feed.canStartProposal, true);
});

test('the feed is newest first, capped at ten, and the filter drops other kinds', () => {
  const proposals = Array.from({ length: 12 }, (_, index) => ({
    id: `p-${index}`,
    title: `Proposal ${index}`,
    status: 'draft',
    proposer: 'A. Member',
    created_at: new Date(Date.UTC(2026, 10, index + 1)).toISOString(),
    ecosystem_id: ECO,
  }));
  const all = happening({ viewer: 'member', ecosystemId: ECO, proposals, decisions: [{ id: 'd-1', title: 'A decision', at: '2026-11-20T00:00:00Z', ecosystem_id: ECO }] });
  assert.equal(all.items.length, 10);
  assert.equal(all.items[0].title, 'A decision');
  const only = happening({ viewer: 'member', ecosystemId: ECO, proposals, filter: 'proposals' });
  assert.equal(only.items.length, 10);
  assert.equal(only.items.every((item) => item.kind === 'proposal'), true);
  assert.equal(only.items[0].title, 'Proposal 11');
});

test('pending and signed-out feeds never include private titles', () => {
  const bag = {
    ecosystemId: ECO,
    proposals: [{ id: 'p-1', title: PRIVATE_TITLE, status: 'advice', proposer: 'A. Member', ecosystem_id: ECO }],
    decisions: [{ id: 'd-1', title: 'Private decision', ecosystem_id: ECO }],
    agreements: [{ id: 'a-1', title: 'Private agreement', version: '2', ecosystem_id: ECO }],
    opportunities: [{ id: 'op-1', title: 'Public workshop', url: '/practices/workshop' }],
  };
  for (const viewer of ['pending', 'guest', 'signed-out'] as const) {
    const feed = happening({ viewer, ...bag });
    assert.equal(feed.mode, 'public');
    assert.equal(feed.canStartProposal, false);
    assert.equal(feed.items[0]?.title, 'Public workshop');
    assert.equal(modelContains(feed, PRIVATE_TITLE), false);
    assert.equal(modelContains(feed, 'Private decision'), false);
    assert.equal(modelContains(feed, 'Private agreement'), false);
  }
  const hidden = happening({ viewer: 'pending', ecosystemId: ECO, proposals: bag.proposals, opportunitiesRequireSignIn: true, opportunities: bag.opportunities });
  assert.equal(hidden.mode, 'invite');
  assert.deepEqual(hidden.items, []);
  assert.equal(modelContains(hidden, PRIVATE_TITLE), false);
  assert.equal(modelContains(hidden, 'Public workshop'), false);
});

test('queue rows from another ecosystem are dropped before the card sees them', () => {
  const kept = stepsForEcosystem([
    step({ uid: 'here', ecosystem_id: ECO }),
    step({ uid: 'there', ecosystem_id: 'eco-9', what: 'Other ecosystem work' }),
  ], ECO);
  assert.deepEqual(kept.map((item) => item.uid), ['here']);
});

interface DirectoryWithSecrets {
  display_name: string;
  role: string;
  directory_visible: boolean;
  id: string;
  phone?: string;
  did?: string;
}
