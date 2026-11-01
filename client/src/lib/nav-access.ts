// Sidebar link gating: a link shows only to members its destination admits; see client/src/AGENTS.md §App shell.
import { isStewardIn, type MembershipRow } from './ecosystem-join';

/** The gate of the page a link opens: `content` = the /quiz/manage route; `admin-panel` = AdminPanel's own check. */
export type NavAccess = 'content' | 'admin-panel';

export interface NavPermissions {
  canManageContent: boolean;
  /** The server's platform-admin flag (G-Authority); never derived from a member profile. */
  isPlatformAdmin: boolean;
}

/** AdminPanel's gate, which also decides the Administration group: platform admins only. */
export function canOpenAdminPanel(permissions: Pick<NavPermissions, 'isPlatformAdmin'>): boolean {
  return permissions.isPlatformAdmin;
}

/** The links whose destination admits this member, in their declared order. */
export function visibleNavItems<T extends { access: NavAccess }>(items: readonly T[], permissions: NavPermissions): T[] {
  return items.filter((item) => (item.access === 'content' ? permissions.canManageContent : canOpenAdminPanel(permissions)));
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
