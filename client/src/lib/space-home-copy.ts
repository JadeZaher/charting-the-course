/**
 * Ecosystem-home sentences. Edit them here.
 * Wording is the §7 copy table (Axian, 2026-11-10), used as written.
 * A few action labels come from §3.2–§3.5 and are marked below; the table does not replace them.
 */

export const spaceHomeCopy = {
  header: {
    pending: 'Your membership is pending. Finish the steps below to take part.',
    /** §3.2 link text. The table does not give this label. */
    finishJoining: 'Finish joining',
    publicPreview: (name: string) => `This is a public preview of ${name}.`,
    member: (name: string) => `You're an active member of ${name}.`,
    guest: (name: string) => `You're not a member of ${name} yet.`,
  },
  welcome: (name: string) => `Welcome to ${name}. You're now an active member.`,
  /** Control on the welcome. Not a table row; the welcome itself is. */
  dismissWelcome: 'Dismiss',
  next: {
    heading: 'What to do next',
    loading: 'Loading your next steps.',
    error: "We couldn't load your next steps. Try again.",
    empty: 'Nothing is waiting on you here right now. You can browse open proposals or look over recent decisions.',
    browseProposals: 'Browse open proposals',
    viewDecisions: 'View recent decisions',
    overflow: (count: number) => `View all ${count} items`,
    /** §3.3. The table does not give these two labels. */
    signInToJoin: 'Sign in to join',
    join: (name: string) => `Join ${name}`,
    startQuestionnaire: 'Start the entry questionnaire',
    /** Graded entry quizzes keep the existing control name. Not a table row. */
    startQuiz: 'Start entry quiz',
    readAgreements: 'Read and consent to the agreements',
    startOrientation: 'Start orientation',
    /** Machine action `attest_agreement` on a next-step button. */
    attestAgreement: 'I consent to the membership agreements',
    refreshStatus: 'Refresh status',
    retry: 'Try again',
    /** Dashboard group label, reused when day-one work is only long-overdue. */
    olderItems: 'Older items',
  },
  whosHere: {
    heading: "Who's here",
    stewards: 'Stewards and circles',
    members: 'Members',
    directory: 'View the full directory',
    loading: "Loading who's here.",
    error: (name: string) => `We couldn't load the people in ${name}. Try again.`,
    emptyDirectory: 'No one has added themselves to the directory yet. You can still take part in governance.',
    emptyCircles: 'No circles are listed yet.',
    /** The table uses this plural for every count, including 1. */
    count: (count: number) => `${count} members. You'll see names and roles once you join.`,
    /** Members already see names. The count is only this sentence, and only when member_count was sent. */
    memberCount: (count: number) => `${count} members.`,
    none: 'No members are listed yet.',
    retry: 'Try again',
  },
  directory: {
    heading: 'Appear in the participant directory',
    lead: "This doesn't change your membership. It only decides whether other members can find you here.",
    confirm: 'Save my directory choices',
    dismiss: 'Not now',
    saved: 'Your consent is saved.',
  },
  happening: {
    heading: "What's happening",
    filters: ['All', 'Proposals', 'Decisions', 'Agreements'] as const,
    loading: "Loading what's happening.",
    error: "We couldn't load recent activity. Try again.",
    empty: 'Nothing has been recorded here yet. New proposals, decisions and agreement changes will appear in this list.',
    startProposal: 'Start a proposal',
    viewProposals: 'View all proposals',
    viewDecisions: 'View all decisions',
    retry: 'Try again',
    /** §3.5, for viewers who must not receive private titles. Not a table row. */
    joining: 'Joining lets you see open proposals and recent decisions.',
    opened: (name: string, title: string, phase: string) => `${name} opened ${title}, now in ${phase}.`,
    adviceRequested: 'Your advice is requested.',
    consentRequested: 'Your consent is requested.',
    testWaiting: 'A test is waiting for you.',
    decision: (name: string, title: string) => `${name} recorded a decision on ${title}.`,
    agreement: (title: string, version: string) => `The agreement ${title} was updated to version ${version}.`,
    /** Used only when a record has no display name. Not a directory entry. */
    unnamed: 'A member',
    stewardOf: (name: string, place: string) => `${name} — steward of ${place}`,
    personRole: (name: string, role: string) => `${name} — ${role}`,
  },
  teamsEmpty: (name: string) => `No teams are listed in ${name} yet.`,
  roles: {
    member: 'member',
    steward: 'steward',
    owner: 'owner',
  },
} as const;
