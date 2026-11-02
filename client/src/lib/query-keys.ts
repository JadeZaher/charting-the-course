// Query keys, invalidation map and ecosystem-switch list: the one place a query key is spelled.
// See client/src/AGENTS.md "Shared data and feedback contracts".
import type { QueryKey } from '@tanstack/react-query';

/** Plain object of the parameters a request sends; compared by value, so property order does not matter. */
export type ListParams = object;

/** Record identifier; undefined only while the query is disabled (`enabled: !!id`). */
export type RecordId = string | undefined;

interface ResourceKeys<Root extends string> {
  readonly all: readonly [Root];
}

interface CollectionKeys<Root extends string> extends ResourceKeys<Root> {
  readonly list: (params?: ListParams) => readonly [Root, 'list', ListParams];
  readonly detail: (id: RecordId) => readonly [Root, 'detail', RecordId];
}

// Query key factory pattern: every key an entity produces starts with its `all` key,
// so invalidating `all` reaches its lists, details and sub-resources.

/** Keys for a REST collection: all, list(params) and detail(id), plus named sub-keys from `extend`. */
function collection<Root extends string, Extra extends object = object>(
  root: Root,
  extend?: (base: CollectionKeys<Root>) => Extra,
): CollectionKeys<Root> & Extra {
  const base: CollectionKeys<Root> = {
    all: [root],
    list: (params = {}) => [root, 'list', params],
    detail: (id) => [root, 'detail', id],
  };
  return { ...base, ...(extend ? extend(base) : ({} as Extra)) };
}

/** Keys for a root with no list/detail split (singletons, per-member views), named by `extend`. */
function resource<Root extends string, Extra extends object>(
  root: Root,
  extend: (base: ResourceKeys<Root>) => Extra,
): ResourceKeys<Root> & Extra {
  const base: ResourceKeys<Root> = { all: [root] };
  return { ...base, ...extend(base) };
}

export const keys = {
  nodeAdmin: collection('node-admin'),
  nodeAudit: collection('node-audit'),
  agreements: collection('agreements', (agreement) => ({
    history: (id: RecordId) => [...agreement.detail(id), 'history'] as const,
    /** G-Next: the status banner (GET /explain/agreement/:id), refreshed with its record. */
    explain: (id: RecordId) => [...agreement.detail(id), 'explain'] as const,
  })),
  proposals: collection('proposals', (proposal) => ({
    explain: (id: RecordId) => [...proposal.detail(id), 'explain'] as const,
  })),
  members: collection('members', (member) => ({
    onboarding: (id: RecordId) => [...member.detail(id), 'onboarding'] as const,
    quizHistory: (id: RecordId) => [...member.detail(id), 'quiz-history'] as const,
    badges: (id: RecordId) => [...member.detail(id), 'badges'] as const,
    tags: (id: RecordId) => [...member.detail(id), 'tags'] as const,
    profile: (id: RecordId) => [...member.detail(id), 'profile'] as const,
    /** Members the caller can message (GET /messaging/members). */
    picker: () => [...member.all, 'picker'] as const,
  })),
  domains: collection('domains'),
  decisions: collection('decisions'),
  myDecisions: collection('my-decisions'),
  onboarding: collection('onboarding', (onboarding) => ({
    ceremony: (memberId: RecordId) => [...onboarding.detail(memberId), 'ceremony'] as const,
  })),
  conflicts: collection('conflicts', (conflict) => ({
    explain: (id: RecordId) => [...conflict.detail(id), 'explain'] as const,
  })),
  ecosystems: collection('ecosystems', (ecosystem) => ({
    members: (id: RecordId) => [...ecosystem.detail(id), 'members'] as const,
    /** Ethos access grants for an ecosystem (admin view). */
    accessGrants: (id: RecordId) => [...ecosystem.detail(id), 'access'] as const,
    /** The caller's own ethos access for an ecosystem. */
    myAccess: (id: RecordId) => [...ecosystem.detail(id), 'access', 'me'] as const,
  })),
  emergency: collection('emergency', (emergency) => ({
    /** G-Safety: live emergencies in every ecosystem the caller is active in (GET /emergency/active, the banner). */
    active: () => [...emergency.all, 'active'] as const,
    explain: (id: RecordId) => [...emergency.detail(id), 'explain'] as const,
  })),
  exits: collection('exits', (exit) => ({
    explain: (id: RecordId) => [...exit.detail(id), 'explain'] as const,
  })),
  audits: collection('audits'),
  courses: collection('courses'),
  collaborations: collection('collaborations'),
  discover: collection('discover'),
  sharesNeeds: collection('shares-needs', (sharesNeeds) => ({
    moderation: (params: ListParams = {}) => [...sharesNeeds.all, 'moderation', params] as const,
    forEcosystem: (ecosystemId: RecordId) => [...sharesNeeds.all, 'ecosystem', ecosystemId] as const,
    forDomain: (domainId: RecordId) => [...sharesNeeds.all, 'domain', domainId] as const,
  })),
  conversations: collection('conversations', (conversation) => ({
    messages: (id: RecordId, page: number) => [...conversation.detail(id), 'messages', page] as const,
    search: (query: string) => [...conversation.all, 'search', query] as const,
  })),
  chatSessions: collection('chat-sessions'),
  quizzes: collection('quizzes', (quiz) => ({
    results: (quizId: RecordId) => [...quiz.detail(quizId), 'results'] as const,
    resultCounts: () => [...quiz.all, 'result-counts'] as const,
    forEcosystem: (ecosystemId: RecordId) => [...quiz.all, 'ecosystem', ecosystemId] as const,
  })),
  quizAssignments: collection('quiz-assignments'),
  badges: collection('badges'),
  teams: collection('teams', (team) => ({
    members: (teamId: RecordId) => [...team.detail(teamId), 'members'] as const,
  })),
  profiles: collection('profiles', (profile) => ({
    /** The signed-in member's own public profile (GET /profiles/me). */
    mine: () => [...profile.all, 'mine'] as const,
  })),
  settings: collection('settings'),
  ctcHandoff: collection('ctc-handoff'),
  agentTokens: collection('agent-tokens'),
  dashboard: resource('dashboard', (dashboard) => ({
    summary: (ecosystemIds: readonly string[]) => [...dashboard.all, 'summary', ecosystemIds] as const,
  })),
  safeguards: resource('safeguards', (safeguards) => ({
    overview: () => [...safeguards.all, 'overview'] as const,
  })),
  compliance: resource('compliance', (compliance) => ({
    latest: (params: ListParams = {}) => [...compliance.all, 'latest', params] as const,
    history: (params: ListParams = {}) => [...compliance.all, 'history', params] as const,
  })),
  notifications: resource('notifications', (notifications) => ({
    preferences: () => [...notifications.all, 'preferences'] as const,
  })),
  orientation: resource('orientation', (orientation) => ({
    path: (ethosId: RecordId) => [...orientation.all, 'path', ethosId] as const,
    recommendation: (ethosId: RecordId) => [...orientation.all, 'recommendation', ethosId] as const,
    progress: (ethosId: RecordId) => [...orientation.all, 'progress', ethosId] as const,
    journeyMap: (journeyMapId: RecordId) => [...orientation.all, 'journey-map', journeyMapId] as const,
    journeyMaps: (ethosId: RecordId) => [...orientation.all, 'journey-maps', ethosId] as const,
  })),
  achievements: resource('achievements', (achievements) => ({
    forMember: (memberId: RecordId, params: ListParams = {}) => [...achievements.all, 'member', memberId, params] as const,
    experience: (memberId: RecordId) => [...achievements.all, 'experience', memberId] as const,
    levels: () => [...achievements.all, 'levels'] as const,
  })),
  platform: resource('platform', (platform) => ({
    health: () => [...platform.all, 'health'] as const,
    skills: (layer?: number) => [...platform.all, 'skills', layer] as const,
  })),
  omnibot: resource('omnibot', (omnibot) => ({
    sessions: () => [...omnibot.all, 'sessions'] as const,
  })),
  // G-Next
  /** The caller's own queue in every ecosystem they are active in (GET /me/next-steps): the bell and the dashboard. */
  nextSteps: resource('next-steps', (nextSteps) => ({
    mine: () => [...nextSteps.all, 'mine'] as const,
  })),
};

// Dependency map: the key prefixes a successful mutation of each domain must invalidate.
export const affects = {
  /** Activation mints a decision; consent activates a pending membership and leaves the caller's queue. */
  agreements: [keys.agreements.all, keys.decisions.all, keys.members.all, keys.dashboard.all, keys.myDecisions.all, keys.nextSteps.all],
  /** ACT moves change list badges and the dashboard queue; ratification mints a decision. */
  proposals: [keys.proposals.all, keys.decisions.all, keys.dashboard.all, keys.myDecisions.all, keys.nextSteps.all],
  /** Roles and status show on public profiles. */
  members: [keys.members.all, keys.dashboard.all, keys.profiles.all],
  /** Domain participation shows on public profiles. */
  domains: [keys.domains.all, keys.dashboard.all, keys.profiles.all],
  myDecisions: [keys.myDecisions.all],
  onboarding: [keys.onboarding.all, keys.members.all],
  conflicts: [keys.conflicts.all, keys.nextSteps.all],
  ecosystems: [keys.ecosystems.all, keys.discover.all],
  emergency: [keys.emergency.all, keys.nextSteps.all],
  exits: [keys.exits.all, keys.members.all, keys.nextSteps.all],
  audits: [keys.audits.all, keys.safeguards.all, keys.nextSteps.all],
  /** Every surface listing shares and needs, including public profiles and decisions about them. */
  sharesNeeds: [keys.sharesNeeds.all, keys.myDecisions.all, keys.profiles.all],
  collaborations: [keys.collaborations.all],
  compliance: [keys.compliance.all],
  conversations: [keys.conversations.all],
  courses: [keys.courses.all],
  quizzes: [keys.quizzes.all, keys.discover.all],
  /** A member's quiz results and the badges and XP they earn. */
  quizResults: [keys.quizzes.all, keys.members.all, keys.achievements.all, keys.profiles.all],
  quizAssignments: [keys.quizAssignments.all, keys.quizzes.all],
  badges: [keys.badges.all],
  teams: [keys.teams.all],
  profiles: [keys.profiles.all, keys.members.all],
  /** The profile name is the member name in every ecosystem: member pages and the governance records that name people. */
  profileName: [keys.profiles.all, keys.members.all, keys.dashboard.all, keys.nextSteps.all, keys.proposals.all,
    keys.agreements.all, keys.conflicts.all, keys.emergency.all, keys.exits.all],
  settings: [keys.settings.all],
  ctcHandoff: [keys.ctcHandoff.all],
  orientation: [keys.orientation.all],
  notifications: [keys.notifications.all],
  agentTokens: [keys.agentTokens.all],
  chatSessions: [keys.chatSessions.all],
  // G-Exchange
  /** A post write: every list and detail of posts, decisions about them, profiles, the queue ("still open?") and messages (an answer opens a conversation). */
  exchangePosts: [keys.sharesNeeds.all, keys.myDecisions.all, keys.profiles.all, keys.nextSteps.all, keys.conversations.all],
  /** A collaboration write: its lists and detail, and the stewards' approve/review queue. */
  exchangeCollaborations: [keys.collaborations.all, keys.nextSteps.all],
} as const satisfies Record<string, readonly QueryKey[]>;

/** Roots whose server reads filter by the selected-ecosystem cookie; refetched when the selection changes. */
export const ecosystemScoped = [
  keys.agreements.all,
  keys.audits.all,
  keys.badges.all,
  keys.chatSessions.all,
  keys.compliance.all,
  keys.conflicts.all,
  keys.conversations.all,
  keys.courses.all,
  keys.dashboard.all,
  keys.decisions.all,
  keys.domains.all,
  keys.emergency.all,
  keys.exits.all,
  keys.members.all,
  keys.onboarding.all,
  keys.proposals.all,
  keys.quizAssignments.all,
  keys.safeguards.all,
  keys.teams.all,
] as const satisfies readonly QueryKey[];

// G-Maint
/** Health keys under the safeguards and audits roots, so `affects.audits` refreshes them. */
export const healthKeys = {
  snapshot: (params: ListParams = {}) => [...keys.safeguards.all, 'snapshot', params] as const,
  auditExplain: (id: RecordId) => [...keys.audits.detail(id), 'explain'] as const,
};

// G-Onboard
/** Onboarding keys under the `onboarding` root, so `affects.onboarding` and the ecosystem switch reach them. */
export const onboardingKeys = {
  /** The steward's newcomers list (GET /onboarding/newcomers). */
  newcomers: () => [...keys.onboarding.all, 'newcomers'] as const,
};

/** What each onboarding write invalidates (lib/ecosystem-join.ts, hooks/use-onboarding.ts). */
export const onboardingAffects = {
  /** A join: the catalogue's buttons, the discover feed, the newcomer's queue, and the ecosystem's member and newcomer lists. */
  joinEcosystem: [keys.ecosystems.all, keys.discover.all, keys.nextSteps.all, keys.members.all, keys.onboarding.all],
  /** A steward's member move: member pages and lists, public profiles, the dashboard, the queue and the newcomers list. */
  memberMove: [keys.members.all, keys.dashboard.all, keys.profiles.all, keys.nextSteps.all, keys.onboarding.all],
} as const satisfies Record<string, readonly QueryKey[]>;
