import { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type Permission = 'manage_users' | 'manage_content' | 'proxy_quiz' | 'view_analytics';

export const ALL_PERMISSIONS: Permission[] = [
  'manage_users', 'manage_content', 'proxy_quiz', 'view_analytics'
];

export const PERMISSION_LABELS: Record<Permission, string> = {
  manage_users: 'Manage Users',
  manage_content: 'Manage Content',
  proxy_quiz: 'Submit Quizzes for Others',
  view_analytics: 'View Analytics'
};

export const PERMISSION_DESCRIPTIONS: Record<Permission, string> = {
  manage_users: 'Can view, edit, and archive user accounts',
  manage_content: 'Can create, edit, and publish quizzes',
  proxy_quiz: 'Can submit quiz results on behalf of other users',
  view_analytics: 'Can view quiz analytics and reports'
};

function derivePermissions(profile: string | null | undefined): Permission[] {
  switch (profile) {
    case 'co_creator':
    case 'builder':
      return ['manage_users', 'manage_content', 'proxy_quiz', 'view_analytics'];
    case 'collaborator':
      return ['manage_content', 'proxy_quiz', 'view_analytics'];
    case 'townhall':
      return ['manage_content', 'view_analytics'];
    default:
      return [];
  }
}

function deriveRole(profile: string | null | undefined): string {
  switch (profile) {
    case 'co_creator':
    case 'builder':
      return 'admin';
    case 'collaborator':
      return 'facilitator';
    case 'townhall':
      return 'contributor';
    default:
      return 'viewer';
  }
}

export function usePermissions() {
  const { member, isLoading, isAuthenticated } = useAuth();

  const permissions = useMemo(() => derivePermissions(member?.profile), [member?.profile]);
  const legacyRole = useMemo(() => deriveRole(member?.profile), [member?.profile]);

  const hasPermission = useCallback(
    (permission: Permission): boolean => permissions.includes(permission),
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (...perms: Permission[]): boolean => perms.some(p => permissions.includes(p)),
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (...perms: Permission[]): boolean => perms.every(p => permissions.includes(p)),
    [permissions]
  );

  const canManageUsers = useMemo(() => hasPermission('manage_users'), [hasPermission]);
  const canManageContent = useMemo(() => hasPermission('manage_content'), [hasPermission]);
  const canProxyQuiz = useMemo(() => hasPermission('proxy_quiz'), [hasPermission]);
  const canViewAnalytics = useMemo(() => hasPermission('view_analytics'), [hasPermission]);
  const canDeleteQuizzes = useMemo(() => legacyRole === 'admin', [legacyRole]);
  const isAdmin = useMemo(() => legacyRole === 'admin', [legacyRole]);
  const canAccessDiscover = useMemo(() => isAuthenticated, [isAuthenticated]);

  return useMemo(() => ({
    permissions,
    isArchived: false,
    canAccessDiscover,
    legacyRole,
    isLoading,
    error: null,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageUsers,
    canManageContent,
    canProxyQuiz,
    canViewAnalytics,
    canDeleteQuizzes,
    isAdmin,
  }), [
    permissions, canAccessDiscover, legacyRole, isLoading,
    hasPermission, hasAnyPermission, hasAllPermissions,
    canManageUsers, canManageContent, canProxyQuiz, canViewAnalytics, canDeleteQuizzes, isAdmin
  ]);
}

export function RequirePermission({
  permission, children, fallback = null
}: {
  permission: Permission; children: React.ReactNode; fallback?: React.ReactNode;
}): React.ReactElement | null {
  const { hasPermission, isLoading } = usePermissions();
  if (isLoading) return null;
  if (!hasPermission(permission)) return <>{fallback}</>;
  return <>{children}</>;
}
