// Link and route gating: a destination's links and its route ask one rule; see client/src/AGENTS.md §App shell.
import { isStewardIn, type MembershipRow } from './ecosystem-join';
import { readNodeAdmin } from './node-admin';
export { readNodeAdmin };

/** The gate of the page a link opens: `quiz-steward` = who the server lets write quizzes; `admin-panel` = AdminPanel's own check. */
export type NavAccess = 'quiz-steward' | 'admin-panel';

export interface NavPermissions {
  isNodeAdmin: boolean;
  /** The server's platform-admin flag (G-Authority); never derived from a member profile. */
  isPlatformAdmin: boolean;
  /** A steward (the server's rule, `isStewardIn`) of an ecosystem in the header selection. */
  stewardsSelection: boolean;
}

/** The sidebar's permissions from /auth/me: the platform-admin flag and the per-ecosystem steward rule over the selection. */
export function navPermissionsFor(input: {
  isPlatformAdmin: boolean;
  isNodeAdmin?: boolean;
  selectedIds: readonly string[];
  memberships: readonly MembershipRow[];
}): NavPermissions {
  return { isPlatformAdmin: input.isPlatformAdmin, isNodeAdmin: input.isNodeAdmin === true, stewardsSelection: showsNewcomers(input.selectedIds, input.memberships) };
}

/** Quiz authoring as the server allows it (api/quizzes.py `quiz_steward_or_error`): a steward of the quiz's ecosystem, or a
 * platform admin for a quiz shared by every ecosystem. A profile (townhall, collaborator) confers nothing (p3-collaboration-and-moderation-10). */
export function canManageQuizzes(permissions: NavPermissions): boolean {
  return permissions.isPlatformAdmin || permissions.stewardsSelection;
}

/** Node support gate; organization profiles and compatibility flags confer no access. */
export function canOpenAdminPanel(permissions: Pick<NavPermissions, 'isNodeAdmin'>): boolean {
  return permissions.isNodeAdmin;
}

/** Whether a page gated by `access` admits this member; its links and its route both ask this, so they never disagree. */
export function admits(access: NavAccess, permissions: NavPermissions): boolean {
  return access === 'quiz-steward' ? canManageQuizzes(permissions) : canOpenAdminPanel(permissions);
}

/** The links whose destination admits this member, in their declared order. */
export function visibleNavItems<T extends { access: NavAccess }>(items: readonly T[], permissions: NavPermissions): T[] {
  return items.filter((item) => admits(item.access, permissions));
}

/** A route gated like its links (`App.tsx` ProtectedRoute `access`): `wait` while the header selection is still being
 * restored (it starts empty), so a steward's hard load never flashes Access Denied; see client/src/AGENTS.md "Pass 03 fixes". */
export function routeAccess(access: NavAccess, permissions: NavPermissions, selectionRestored: boolean): 'allow' | 'wait' | 'deny' {
  if (admits(access, permissions)) return 'allow';
  if (access === 'admin-panel') return 'deny';
  return selectionRestored ? 'deny' : 'wait';
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
