import { activeEcosystemIds, type MembershipsInput } from './consent-gate';

export const PLATFORM_TOUR_STEPS = [
  {
    title: 'Welcome to your ecosystem',
    description: 'You have joined a community. This short tour shows you where to take part, find people, and get help.',
    location: 'Community selector at the top of the page',
    detail: 'An ecosystem is a community with its own agreements and roles. Use the selector to choose the communities you are working in. Joining another community may require its own quizzes and consent.',
    links: [{ label: 'Find communities', href: '/communities' }],
  },
  {
    title: 'Start with your next steps',
    description: 'Your dashboard brings together what needs your attention and what is happening in your communities.',
    location: 'Navigation → Dashboard',
    detail: 'Look at your next steps for requests and deadlines, then check community activity. An empty list means there is nothing waiting for you there right now.',
    links: [{ label: 'Open dashboard', href: '/dashboard' }],
  },
  {
    title: 'Take part in shared decisions',
    description: 'Read the agreements that guide your community, follow proposals, and review recorded decisions.',
    location: 'Navigation → Active Governance',
    detail: 'Open a proposal to see its current phase and the contributions available to your role. Actions depend on the community’s rules and your permissions.',
    links: [{ label: 'Open proposals', href: '/proposals' }, { label: 'Read agreements', href: '/agreements' }, { label: 'View decisions', href: '/decisions' }],
  },
  {
    title: 'Find people and working groups',
    description: 'Meet members and find the teams and domains where work is coordinated.',
    location: 'Navigation → Community, or Messaging',
    detail: 'Expand Community in the navigation to find Members, Teams, and Domains. Use Messaging to start a conversation. A subgroup can have its own joining requirements.',
    links: [{ label: 'Explore teams', href: '/teams' }, { label: 'Find members', href: '/members' }, { label: 'Open messaging', href: '/messaging' }],
  },
  {
    title: 'Share resources and collaborate',
    description: 'Discover what people can offer, what they need, and projects you could contribute to.',
    location: 'Navigation → Discover → Shares & Needs or Collaborations',
    detail: 'Browse an offer or request, or explore a collaboration. Each page shows the actions available to you; publishing and joining follow the relevant community’s rules.',
    links: [{ label: 'Browse shares & needs', href: '/discover?tab=shares-needs' }, { label: 'Find collaborations', href: '/discover?tab=collaborations' }],
  },
  {
    title: 'Choose how to stay involved',
    description: 'Updates is your inbox for community activity. You decide what to follow and how to hear about it.',
    location: 'Navigation → Updates; Me → Notification settings',
    detail: 'Choose broad community updates or specific items, mute what you do not need, and set your pace. Email, push, and SMS delivery are available only when enabled and configured.',
    links: [{ label: 'Read updates', href: '/updates' }, { label: 'Choose notifications', href: '/settings/notifications' }],
  },
  {
    title: 'Get help as you go',
    description: 'Use the AI assistant to understand the platform or help with a task. Page guides explain the work on the current screen.',
    location: 'Bottom-right communications button → AI Chat; right-edge Guide tab',
    detail: 'Try “What can I do in my ecosystem?” or “Help me prepare a proposal.” Review suggested actions and any confirmation request. The assistant works within your access. Guides appear on pages that have one.',
    links: [{ label: 'Read about NEOS', href: '/about' }],
  },
  {
    title: 'Make it your own',
    description: 'Keep your profile current, know where to raise concerns, and return to this tour whenever you need it.',
    location: 'Navigation → Me or Safety & Integrity; top bar → Platform tour',
    detail: 'Me holds your profile and personal settings. Safety & Integrity includes conflict, emergency, safeguard, and exit processes. Finishing this tour does not submit anything or complete a community requirement.',
    links: [{ label: 'Open my profile', href: '/me' }, { label: 'View conflict support', href: '/conflicts' }],
  },
] as const;

export type PlatformTourProgress = { version: 1; status: 'in_progress' | 'paused' | 'completed'; step: number };
type TourStorage = Pick<Storage, 'getItem' | 'setItem'>;
const sessionProgress = new Map<string, PlatformTourProgress>();

export function platformTourKey(ownerId: string): string {
  return `neos:platform-tour:v1:${encodeURIComponent(ownerId)}`;
}

export function parsePlatformTourProgress(raw: string | null): PlatformTourProgress | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value?.version !== 1 || !['in_progress', 'paused', 'completed'].includes(value.status) ||
      !Number.isInteger(value.step) || value.step < 0 || value.step >= PLATFORM_TOUR_STEPS.length) return null;
    return { version: 1, status: value.status, step: value.step };
  } catch { return null; }
}

export function readPlatformTourProgress(ownerId: string, storage: () => TourStorage): PlatformTourProgress | null {
  try {
    return sessionProgress.get(ownerId) ?? parsePlatformTourProgress(storage().getItem(platformTourKey(ownerId)));
  } catch { return sessionProgress.get(ownerId) ?? null; }
}

export function savePlatformTourProgress(ownerId: string, progress: PlatformTourProgress, storage: () => TourStorage): boolean {
  sessionProgress.set(ownerId, progress);
  try {
    storage().setItem(platformTourKey(ownerId), JSON.stringify(progress));
    return true;
  } catch { return false; }
}

export function isPlatformTourEligible(input: MembershipsInput & { userId?: string; isAuthenticated: boolean }): boolean {
  return Boolean(input.isAuthenticated && input.userId && activeEcosystemIds(input).length > 0);
}

export function shouldOfferPlatformTour(path: string, progress: PlatformTourProgress | null): boolean {
  return (path === '/' || path === '/dashboard') && progress === null;
}
