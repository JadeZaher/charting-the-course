// Sidebar link gating: a link shows only to members its destination admits; see client/src/AGENTS.md §App shell.

/** The gate of the page a link opens: `content` = the /quiz/manage route; `admin-panel` = AdminPanel's own check. */
export type NavAccess = 'content' | 'admin-panel';

export interface NavPermissions {
  isAdmin: boolean;
  canManageUsers: boolean;
  canManageContent: boolean;
}

/** AdminPanel's gate, which also decides the Administration group. */
export function canOpenAdminPanel(permissions: NavPermissions): boolean {
  return permissions.isAdmin || permissions.canManageUsers;
}

/** The links whose destination admits this member, in their declared order. */
export function visibleNavItems<T extends { access: NavAccess }>(items: readonly T[], permissions: NavPermissions): T[] {
  return items.filter((item) => (item.access === 'content' ? permissions.canManageContent : canOpenAdminPanel(permissions)));
}
