// Sidebar link gating: a link shows only to members its destination admits; see client/src/AGENTS.md §App shell.
import { isStewardIn, type MembershipRow } from './ecosystem-join';

/** The gate of the page a link opens: `quiz-steward` = who the server lets write quizzes; `admin-panel` = AdminPanel's own check. */
export type NavAccess = 'quiz-steward' | 'admin-panel';

export interface NavPermissions {
  /** The server's platform-admin flag (G-Authority); never derived from a member profile. */
  isPlatformAdmin: boolean;
  /** A steward (the server's rule, `isStewardIn`) of an ecosystem in the header selection. */
  stewardsSelection: boolean;
}

/** The sidebar's permissions from /auth/me: the platform-admin flag and the per-ecosystem steward rule over the selection. */
export function navPermissionsFor(input: {
  isPlatformAdmin: boolean;
  selectedIds: readonly string[];
  memberships: readonly MembershipRow[];
}): NavPermissions {
  return { isPlatformAdmin: input.isPlatformAdmin, stewardsSelection: showsNewcomers(input.selectedIds, input.memberships) };
}

/** Quiz authoring as the server allows it (api/quizzes.py `quiz_steward_or_error`): a steward of the quiz's ecosystem, or a
 * platform admin for a quiz shared by every ecosystem. A profile (townhall, collaborator) confers nothing (p3-collaboration-and-moderation-10). */
export function canManageQuizzes(permissions: NavPermissions): boolean {
  return permissions.isPlatformAdmin || permissions.stewardsSelection;
}

/** AdminPanel's gate, which also decides the Administration group: platform admins only. */
export function canOpenAdminPanel(permissions: Pick<NavPermissions, 'isPlatformAdmin'>): boolean {
  return permissions.isPlatformAdmin;
}

/** The links whose destination admits this member, in their declared order. */
export function visibleNavItems<T extends { access: NavAccess }>(items: readonly T[], permissions: NavPermissions): T[] {
  return items.filter((item) => (item.access === 'quiz-steward' ? canManageQuizzes(permissions) : canOpenAdminPanel(permissions)));
}

// G-Authority
/** The auth context's one platform-admin source, `isPlatformAdmin` (/auth/me `is_platform_admin`); absent or
 * anything but `true` reads as not an admin. Never derived from a member profile. */
export function readPlatformAdmin(auth: object): boolean {
  return (auth as Record<string, unknown>).isPlatformAdmin === true;
}

// FX-Onboard
/** The Newcomers link: shown to a steward (`isStewardIn`, the server's rule) of a selected ecosystem. */
export function showsNewcomers(selectedIds: readonly string[], memberships: readonly MembershipRow[]): boolean {
  return selectedIds.some((ecosystemId) => isStewardIn(ecosystemId, memberships));
}

// Pass 03 (p3-collaboration-and-moderation-10)
/** The header picker's label: the selected ecosystem's name, "All Ecosystems" or "N ecosystems"; with nothing selectable
 * yet, the ecosystem waiting on the member's consent. Never "0 ecosystems". */
export function ecosystemPickerLabel(input: {
  selected: readonly { name: string }[];
  activeCount: number;
  awaitingConsent: readonly { name: string }[];
}): string {
  const { selected, activeCount, awaitingConsent } = input;
  if (selected.length === 1) return selected[0].name;
  if (selected.length > 1) return selected.length === activeCount ? 'All Ecosystems' : `${selected.length} ecosystems`;
  if (activeCount > 0) return 'Choose an ecosystem';
  if (awaitingConsent.length === 1) return `${awaitingConsent[0].name} (awaiting your consent)`;
  if (awaitingConsent.length > 1) return `${awaitingConsent.length} ecosystems awaiting your consent`;
  return 'No ecosystem yet';
}
