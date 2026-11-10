// What the ecosystem home (/ethos/:id) may show, and to whom.
// Private titles, directory names, ids and contact fields stay out of the view model
// unless this caller is an active member and the person opted into the directory.
import type { JoinGates } from './join-gates';
import { proposalPhaseLabel } from './proposal-vocab';
import { parseDue } from './next-steps';
import { resolveInternalPath } from './internal-path';
import { spaceHomeCopy as copy } from './space-home-copy';

export type SpaceViewer = 'member' | 'pending' | 'guest' | 'signed-out';

/** Standing the membership helper already computed, plus whether a session exists. */
export function spaceViewer(authenticated: boolean, standing: 'none' | 'active' | 'pending' | 'left' | 'paused'): SpaceViewer {
  if (!authenticated) return 'signed-out';
  if (standing === 'active') return 'member';
  if (standing === 'pending') return 'pending';
  return 'guest';
}

export function headerStatus(viewer: SpaceViewer, name: string): { text: string; finishJoining: boolean } {
  if (viewer === 'member') return { text: copy.header.member(name), finishJoining: false };
  if (viewer === 'pending') return { text: copy.header.pending, finishJoining: true };
  if (viewer === 'signed-out') return { text: copy.header.publicPreview(name), finishJoining: false };
  return { text: copy.header.guest(name), finishJoining: false };
}

/** A public payload's member count, or null when the payload does not say. Never guessed. */
export function publicMemberCount(record: object | null | undefined): number | null {
  const value = (record as { member_count?: unknown } | null | undefined)?.member_count;
  const count = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isInteger(count) && count >= 0 ? count : null;
}

/** Days past a server-overdue date before day-one treats the item as older work. "Months" is not a number in the spec; 60 days is the cutoff used here. */
export const LONG_OVERDUE_DAYS = 60;

const DAY_MS = 86_400_000;

export function isLongOverdue(due: string | null | undefined, overdue: boolean | null | undefined, now: Date, days = LONG_OVERDUE_DAYS): boolean {
  if (overdue !== true || !due) return false;
  const date = parseDue(due);
  if (Number.isNaN(date.getTime())) return false;
  return now.getTime() - date.getTime() >= days * DAY_MS;
}

export interface SpaceStep {
  uid: string;
  kind: string;
  id: string;
  key?: string | null;
  title?: string;
  ecosystem_id?: string | null;
  action?: string;
  what?: string;
  why?: string;
  due?: string | null;
  overdue?: boolean;
  link?: string;
  /** Present only if a payload says the act is already done. */
  completed?: boolean;
}

const ORIENTATION = /orientation|journey/i;
const ENTRY_QUIZ = /quiz|questionnaire/i;
const CONSENT = /consent|agreement/i;
const ACT_ASK = /advice|consent|test/i;

/** An entry quiz or a joining consent still sitting in the queue after the membership is active. */
export function isCompletedNextStep(step: SpaceStep, activeMember: boolean): boolean {
  if (step.completed === true) return true;
  if (!activeMember || step.kind !== 'newcomer') return false;
  const blob = `${step.key ?? ''} ${step.action ?? ''} ${step.what ?? ''} ${step.title ?? ''} ${step.link ?? ''}`;
  if (ORIENTATION.test(blob)) return false;
  return ENTRY_QUIZ.test(blob) || CONSENT.test(blob);
}

export type SpaceAction =
  | { kind: 'link'; id: string; label: string; href: string }
  | { kind: 'quiz'; id: string; label: string; quizId: string }
  | { kind: 'join'; id: string; label: string };

export interface NextCardModel {
  /** Show the one-time welcome above the card. */
  welcome: boolean;
  sentence: string | null;
  primary: SpaceAction | null;
  secondary: SpaceAction[];
  overflow: { label: string; href: string } | null;
  /** Member queue is clear: the empty sentence plus its two links. */
  empty: boolean;
}

function stepBlob(step: SpaceStep): string {
  return `${step.key ?? ''} ${step.action ?? ''} ${step.what ?? ''} ${step.title ?? ''} ${step.link ?? ''}`;
}

function actionLabel(step: SpaceStep): string | null {
  const action = step.action?.trim();
  const what = step.what?.trim();
  if (action && action.length <= 80) return action;
  if (what && what.length <= 80) return what;
  return null;
}

function rank(step: SpaceStep, now: Date, firstSession: boolean): number {
  const blob = stepBlob(step);
  let base = 3;
  if (step.kind === 'newcomer' && ORIENTATION.test(blob)) base = 1;
  else if (step.kind === 'newcomer' || (step.kind === 'agreement' && CONSENT.test(blob))) base = 0;
  else if (step.kind === 'proposal' && ACT_ASK.test(blob)) base = 2;
  if (isLongOverdue(step.due, step.overdue, now)) base += firstSession ? 100 : 10;
  return base;
}

function stepAction(step: SpaceStep): SpaceAction | null {
  const label = actionLabel(step);
  const href = resolveInternalPath(step.link);
  if (!label || !href) return null;
  return { kind: 'link', id: step.uid, label, href };
}

/** One remaining join step. Agreements, then the entry quiz, then orientation, then a status refresh. */
export function pendingJoinAction(gates: JoinGates | null | undefined, orientationHref: string | null): SpaceAction | null {
  if (!gates) return null;
  const agreement = gates.required_agreements[0];
  if (gates.status === 'agreement_consent_required' || (agreement && !gates.eligible)) {
    const href = agreement ? resolveInternalPath(agreement.href) ?? `/agreements/${encodeURIComponent(agreement.id)}` : '/welcome/consent';
    return { kind: 'link', id: 'join-agreements', label: copy.next.readAgreements, href };
  }
  const quiz = gates.required_quizzes.find((item) => item.status === 'required');
  if (quiz) {
    return {
      kind: 'quiz',
      id: `join-quiz-${quiz.id}`,
      label: quiz.completion_mode === 'completion' ? copy.next.startQuestionnaire : copy.next.startQuiz,
      quizId: quiz.id,
    };
  }
  if (orientationHref && (gates.status === 'ready' || gates.eligible)) {
    return { kind: 'link', id: 'join-orientation', label: copy.next.startOrientation, href: orientationHref };
  }
  return { kind: 'link', id: 'join-refresh', label: copy.next.refreshStatus, href: '/welcome/consent' };
}

export function nextCard(input: {
  viewer: SpaceViewer;
  name: string;
  ecosystemId: string;
  items: readonly SpaceStep[];
  now: Date;
  /** Welcome still on screen: do not lead with months-overdue work. */
  firstSession: boolean;
  gates?: JoinGates | null;
  orientationHref?: string | null;
  signInHref: string;
}): NextCardModel {
  const welcome = input.viewer === 'member' && input.firstSession;
  if (input.viewer === 'signed-out') {
    return {
      welcome: false,
      sentence: null,
      primary: { kind: 'link', id: 'sign-in', label: copy.next.signInToJoin, href: input.signInHref },
      secondary: [],
      overflow: null,
      empty: false,
    };
  }
  if (input.viewer === 'guest') {
    return {
      welcome: false,
      sentence: null,
      primary: { kind: 'join', id: 'join', label: copy.next.join(input.name) },
      secondary: [],
      overflow: null,
      empty: false,
    };
  }

  // Queue titles are private. Only a confirmed active member may see them.
  // Missing gates, an eligible-but-pending row, and every other state get a join step with no record title.
  if (input.viewer !== 'member') {
    const primary = input.viewer === 'pending'
      ? pendingJoinAction(input.gates, input.orientationHref ?? null)
        ?? { kind: 'link' as const, id: 'join-refresh', label: copy.next.refreshStatus, href: '/welcome/consent' }
      : null;
    return { welcome: false, sentence: null, primary, secondary: [], overflow: null, empty: false };
  }

  const open = input.items.filter((step) => (!step.ecosystem_id || step.ecosystem_id === input.ecosystemId) && !isCompletedNextStep(step, true));

  const ranked = [...open].sort((a, b) => rank(a, input.now, input.firstSession) - rank(b, input.now, input.firstSession));
  // Months-overdue work stays under Older items after the welcome is dismissed.
  const fresh = ranked.filter((step) => !isLongOverdue(step.due, step.overdue, input.now));
  const actions = fresh.map(stepAction).filter((action): action is SpaceAction => action !== null);
  const shown = actions.slice(0, 3);
  if (shown.length === 0) {
    if (open.length > 0) {
      return {
        welcome,
        sentence: null,
        primary: null,
        secondary: [{ kind: 'link', id: 'older', label: copy.next.olderItems, href: '/dashboard' }],
        overflow: null,
        empty: false,
      };
    }
    return {
      welcome,
      sentence: copy.next.empty,
      primary: { kind: 'link', id: 'browse', label: copy.next.browseProposals, href: '/proposals' },
      secondary: [{ kind: 'link', id: 'decisions', label: copy.next.viewDecisions, href: '/decisions' }],
      overflow: null,
      empty: true,
    };
  }
  const [primary, ...rest] = shown;
  const lead = fresh[0];
  const sentence = lead?.what?.trim() && lead.what.trim() !== primary.label ? lead.what.trim() : lead?.why?.trim() && lead.why.trim() !== primary.label ? lead.why.trim() : null;
  const overdueCount = open.length - fresh.length;
  const older = overdueCount > 0 ? [{ kind: 'link' as const, id: 'older', label: copy.next.olderItems, href: '/dashboard' }] : [];
  return {
    welcome,
    sentence,
    primary,
    secondary: [...rest.slice(0, older.length ? 1 : 2), ...older],
    overflow: fresh.length > shown.length ? { label: copy.next.overflow(open.length), href: '/dashboard' } : null,
    empty: false,
  };
}

/** Keep queue rows for this ecosystem, dropping ones another ecosystem owns. */
export function stepsForEcosystem(items: readonly SpaceStep[], ecosystemId: string): SpaceStep[] {
  return items.filter((step) => !step.ecosystem_id || step.ecosystem_id === ecosystemId);
}

export interface DirectoryPerson {
  display_name: string;
  role?: string | null;
  /** True only when this payload says the person opted in. Missing means they did not. */
  directory_visible?: boolean | null;
  id?: string;
  member_id?: string;
  user_id?: string;
}

export interface DirectoryCircle {
  name: string;
  purpose?: string | null;
  steward?: string | null;
  /** Generated code. Never copied into the view. */
  code?: string | null;
}

export interface PersonRow {
  key: string;
  text: string;
  detail?: string;
}

export interface WhosHereModel {
  mode: 'count' | 'directory';
  countText: string | null;
  stewards: PersonRow[];
  circles: PersonRow[];
  members: PersonRow[];
  moreDirectory: boolean;
  emptyDirectory: boolean;
  emptyCircles: boolean;
}

const DIRECTORY_CAP = 8;
const GENERATED_CODE = /^DOM-[A-Z0-9]+$/i;
const OPAQUE_ID = /^[0-9a-f]{8}-[0-9a-f-]{8,}$/i;

export function roleWord(role: string | null | undefined): string {
  const key = (role ?? '').trim().toLowerCase();
  if (key === 'user' || key === 'member') return copy.roles.member;
  if (key === 'owner') return copy.roles.owner;
  if (key === 'mod' || key === 'admin' || key === 'steward' || key === 'moderator') return copy.roles.steward;
  if (!key || OPAQUE_ID.test(key) || GENERATED_CODE.test(key)) return copy.roles.member;
  return key.replace(/[_-]+/g, ' ');
}

function humanName(value: string | null | undefined): string | null {
  const name = value?.trim();
  if (!name || OPAQUE_ID.test(name) || GENERATED_CODE.test(name)) return null;
  return name;
}

/** Any active member may load the participant list. Opt-in decides who is listed, not who may look. */
export function loadsParticipantDirectory(viewer: SpaceViewer): boolean {
  return viewer === 'member';
}

/** People the directory may name: participant-list rows, plus members the payload marks as opted in. An explicit opt-out wins. Contact fields are not copied. */
export function directoryCandidates(
  members: readonly DirectoryPerson[],
  participants: readonly { display_name?: string | null; member_id?: string | null; user_id?: string | null }[],
): DirectoryPerson[] {
  const rows = new Map<string, DirectoryPerson>();
  participants.forEach((person, index) => {
    const name = person.display_name?.trim();
    const id = person.member_id || person.user_id || `participant-${index}`;
    if (!name) return;
    rows.set(id, { display_name: name, id: person.member_id || person.user_id || undefined, member_id: person.member_id ?? undefined, user_id: person.user_id ?? undefined, directory_visible: true });
  });
  for (const member of members) {
    const ids = [member.id, member.member_id, member.user_id].filter((id): id is string => !!id);
    if (member.directory_visible === false) {
      ids.forEach((id) => rows.delete(id));
      continue;
    }
    const existingKey = ids.find((id) => rows.has(id));
    if (existingKey) {
      const existing = rows.get(existingKey)!;
      existing.role = member.role;
      existing.display_name = member.display_name;
      continue;
    }
    if (member.directory_visible === true && member.display_name?.trim()) {
      rows.set(member.id || member.display_name, {
        display_name: member.display_name,
        role: member.role,
        directory_visible: true,
        id: member.id,
      });
    }
  }
  return Array.from(rows.values());
}

export function whosHere(input: {
  viewer: SpaceViewer;
  ecosystemName: string;
  memberCount: number | null;
  stewards?: readonly { display_name?: string | null; role?: string | null }[];
  circles?: readonly DirectoryCircle[];
  members?: readonly DirectoryPerson[];
  /** Ids returned by the opted-in participant list. Null when that list was not loaded. */
  optedInIds?: ReadonlySet<string> | null;
}): WhosHereModel {
  if (input.viewer !== 'member') {
    const count = input.memberCount;
    return {
      mode: 'count',
      countText: count === 0 ? copy.whosHere.none : count == null ? null : copy.whosHere.count(count),
      stewards: [],
      circles: [],
      members: [],
      moreDirectory: false,
      emptyDirectory: false,
      emptyCircles: false,
    };
  }

  const stewards = (input.stewards ?? []).flatMap((steward, index) => {
    const name = humanName(steward.display_name);
    if (!name) return [];
    const role = roleWord(steward.role);
    const text = role === copy.roles.steward
      ? copy.happening.stewardOf(name, input.ecosystemName)
      : copy.happening.personRole(name, role);
    return [{ key: `steward-${index}`, text }];
  });

  const circles = (input.circles ?? []).flatMap((circle, index) => {
    const name = humanName(circle.name);
    if (!name || (circle.code && name === circle.code)) return [];
    const steward = humanName(circle.steward);
    const text = steward ? copy.happening.stewardOf(steward, name) : name;
    const detail = circle.purpose?.trim() || undefined;
    return [{ key: `circle-${index}`, text, detail }];
  });

  const opted = input.optedInIds;
  const visible = (input.members ?? []).filter((person) => {
    if (person.directory_visible === false) return false;
    if (person.directory_visible === true) return true;
    if (!opted) return false;
    return [person.id, person.member_id, person.user_id].some((id) => !!id && opted.has(id));
  });
  const members = visible.slice(0, DIRECTORY_CAP).flatMap((person, index) => {
    const name = humanName(person.display_name);
    if (!name) return [];
    return [{ key: `member-${index}`, text: copy.happening.personRole(name, roleWord(person.role)) }];
  });

  return {
    mode: 'directory',
    countText: null,
    stewards,
    circles,
    members,
    moreDirectory: visible.length > DIRECTORY_CAP,
    emptyDirectory: members.length === 0,
    emptyCircles: circles.length === 0,
  };
}

export type HappeningFilter = 'all' | 'proposals' | 'decisions' | 'agreements';

export const HAPPENING_FILTERS: { id: HappeningFilter; label: (typeof copy.happening.filters)[number] }[] = [
  { id: 'all', label: 'All' },
  { id: 'proposals', label: 'Proposals' },
  { id: 'decisions', label: 'Decisions' },
  { id: 'agreements', label: 'Agreements' },
];

export interface HappeningItem {
  key: string;
  kind: 'proposal' | 'decision' | 'agreement' | 'public';
  before: string;
  title: string;
  after: string;
  href: string | null;
  at: number;
}

export interface SpaceProposal {
  id: string;
  title: string;
  status: string;
  proposer?: string | null;
  created_at?: string | null;
  ecosystem_id?: string | null;
}

export interface SpaceDecision {
  id: string;
  title: string;
  actor?: string | null;
  at?: string | null;
  ecosystem_id?: string | null;
}

export interface SpaceAgreement {
  id: string;
  title: string;
  version?: string | null;
  at?: string | null;
  ecosystem_id?: string | null;
}

export interface PublicOpportunity {
  id: string;
  title: string;
  url?: string | null;
}

const OPEN_PHASES = new Set(['draft', 'advice', 'consent', 'test']);

function stamp(value: string | null | undefined): number {
  if (!value) return 0;
  const date = Date.parse(value);
  return Number.isFinite(date) ? date : 0;
}

function inEcosystem(id: string | null | undefined, ecosystemId: string): boolean {
  return !id || id === ecosystemId;
}

function requestSentence(phase: string): string | null {
  if (phase === 'advice') return copy.happening.adviceRequested;
  if (phase === 'consent') return copy.happening.consentRequested;
  if (phase === 'test') return copy.happening.testWaiting;
  return null;
}

export interface HappeningModel {
  mode: 'feed' | 'invite' | 'public';
  items: HappeningItem[];
  canStartProposal: boolean;
}

/** Private records are ignored unless the viewer is an active member. */
export function happening(input: {
  viewer: SpaceViewer;
  ecosystemId: string;
  proposals?: readonly SpaceProposal[];
  decisions?: readonly SpaceDecision[];
  agreements?: readonly SpaceAgreement[];
  /** Proposal ids the caller's own queue says are waiting on them. */
  askedProposalIds?: ReadonlySet<string>;
  opportunities?: readonly PublicOpportunity[] | null;
  opportunitiesRequireSignIn?: boolean;
  filter?: HappeningFilter;
}): HappeningModel {
  if (input.viewer !== 'member') {
    const opportunities = input.opportunitiesRequireSignIn ? [] : input.opportunities ?? [];
    const items = opportunities.flatMap((item, index) => {
      const title = item.title?.trim();
      if (!title) return [];
      return [{
        key: `public-${index}`,
        kind: 'public' as const,
        before: '',
        title,
        after: '',
        href: resolveInternalPath(item.url) ?? null,
        at: 0,
      }];
    });
    return { mode: items.length ? 'public' : 'invite', items, canStartProposal: false };
  }

  const asked = input.askedProposalIds ?? new Set<string>();
  const proposals: HappeningItem[] = (input.proposals ?? []).flatMap((proposal) => {
    const phase = proposal.status?.trim().toLowerCase();
    if (!OPEN_PHASES.has(phase) || !inEcosystem(proposal.ecosystem_id, input.ecosystemId)) return [];
    const title = proposal.title?.trim();
    if (!title) return [];
    const phaseLabel = proposalPhaseLabel(proposal.status);
    const request = asked.has(proposal.id) ? requestSentence(phase) : null;
    const sentence = copy.happening.opened(humanName(proposal.proposer) ?? copy.happening.unnamed, title, phaseLabel);
    const [before, after = ''] = splitTitle(sentence, title);
    return [{
      key: `proposal-${proposal.id}`,
      kind: 'proposal' as const,
      before,
      title,
      after: request ? `${after} ${request}` : after,
      href: `/proposals/${encodeURIComponent(proposal.id)}`,
      at: stamp(proposal.created_at),
    }];
  });

  const decisions: HappeningItem[] = (input.decisions ?? []).flatMap((decision) => {
    if (!inEcosystem(decision.ecosystem_id, input.ecosystemId)) return [];
    const title = decision.title?.trim();
    if (!title) return [];
    const sentence = copy.happening.decision(humanName(decision.actor) ?? copy.happening.unnamed, title);
    const [before, after = ''] = splitTitle(sentence, title);
    return [{
      key: `decision-${decision.id}`,
      kind: 'decision' as const,
      before,
      title,
      after,
      href: `/decisions/${encodeURIComponent(decision.id)}`,
      at: stamp(decision.at),
    }];
  });

  const agreements: HappeningItem[] = (input.agreements ?? []).flatMap((agreement) => {
    if (!inEcosystem(agreement.ecosystem_id, input.ecosystemId)) return [];
    const title = agreement.title?.trim();
    if (!title) return [];
    const sentence = copy.happening.agreement(title, (agreement.version ?? '').trim() || '1');
    const [before, after = ''] = splitTitle(sentence, title);
    return [{
      key: `agreement-${agreement.id}`,
      kind: 'agreement' as const,
      before,
      title,
      after,
      href: `/agreements/${encodeURIComponent(agreement.id)}`,
      at: stamp(agreement.at),
    }];
  });

  const filter = input.filter ?? 'all';
  const want: HappeningItem['kind'] | 'all' = filter === 'proposals' ? 'proposal' : filter === 'decisions' ? 'decision' : filter === 'agreements' ? 'agreement' : 'all';
  const all = [...proposals, ...decisions, ...agreements].sort((a, b) => b.at - a.at);
  const filtered = want === 'all' ? all : all.filter((item) => item.kind === want);
  return { mode: 'feed', items: filtered.slice(0, 10), canStartProposal: true };
}

function splitTitle(sentence: string, title: string): [string, string] {
  const at = sentence.indexOf(title);
  if (at < 0) return [sentence, ''];
  return [sentence.slice(0, at), sentence.slice(at + title.length)];
}

/** True when the rendered model contains a private string it must not. */
export function modelContains(value: unknown, secret: string): boolean {
  return JSON.stringify(value).includes(secret);
}
