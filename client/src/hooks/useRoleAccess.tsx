import React, { useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'facilitator' | 'contributor' | 'viewer';

interface RolePermissions {
  // Quiz permissions
  canTakeQuizzes: boolean;
  canViewQuizResults: boolean;
  canCreateQuizzes: boolean;
  canEditQuizzes: boolean;
  canDeleteQuizzes: boolean;
  canPublishQuizzes: boolean;
  canAssignQuizzes: boolean;

  // User management
  canManageUsers: boolean;
  canAssignRoles: boolean;
  canViewAllUsers: boolean;

  // Badge management
  canCreateBadges: boolean;
  canEditBadges: boolean;
  canDeleteBadges: boolean;
  canAssignBadges: boolean;

  // Profile
  canViewPublicProfiles: boolean;
  canEditOwnProfile: boolean;

  // Analytics
  canViewAnalytics: boolean;
  canViewAllQuizResults: boolean;

  // Admin
  isAdmin: boolean;
  isAdminOrFacilitator: boolean;
  canAccessAdminPanel: boolean;
}

const rolePermissions: Record<UserRole, RolePermissions> = {
  admin: {
    // Quiz
    canTakeQuizzes: true,
    canViewQuizResults: true,
    canCreateQuizzes: true,
    canEditQuizzes: true,
    canDeleteQuizzes: true,
    canPublishQuizzes: true,
    canAssignQuizzes: true,
    // Users
    canManageUsers: true,
    canAssignRoles: true,
    canViewAllUsers: true,
    // Badges
    canCreateBadges: true,
    canEditBadges: true,
    canDeleteBadges: true,
    canAssignBadges: true,
    // Profile
    canViewPublicProfiles: true,
    canEditOwnProfile: true,
    // Analytics
    canViewAnalytics: true,
    canViewAllQuizResults: true,
    // Admin
    isAdmin: true,
    isAdminOrFacilitator: true,
    canAccessAdminPanel: true,
  },
  facilitator: {
    // Quiz
    canTakeQuizzes: true,
    canViewQuizResults: true,
    canCreateQuizzes: true,
    canEditQuizzes: true, // Only own quizzes
    canDeleteQuizzes: false,
    canPublishQuizzes: true,
    canAssignQuizzes: true,
    // Users
    canManageUsers: false,
    canAssignRoles: false,
    canViewAllUsers: true, // For quiz assignment
    // Badges
    canCreateBadges: true,
    canEditBadges: true, // Only own badges
    canDeleteBadges: false,
    canAssignBadges: false,
    // Profile
    canViewPublicProfiles: true,
    canEditOwnProfile: true,
    // Analytics
    canViewAnalytics: true, // For own quizzes
    canViewAllQuizResults: false,
    // Admin
    isAdmin: false,
    isAdminOrFacilitator: true,
    canAccessAdminPanel: false,
  },
  contributor: {
    // Quiz
    canTakeQuizzes: true,
    canViewQuizResults: true,
    canCreateQuizzes: true,
    canEditQuizzes: true, // Only own quizzes
    canDeleteQuizzes: false,
    canPublishQuizzes: false, // Needs facilitator/admin approval
    canAssignQuizzes: false,
    // Users
    canManageUsers: false,
    canAssignRoles: false,
    canViewAllUsers: false,
    // Badges
    canCreateBadges: false,
    canEditBadges: false,
    canDeleteBadges: false,
    canAssignBadges: false,
    // Profile
    canViewPublicProfiles: true,
    canEditOwnProfile: true,
    // Analytics
    canViewAnalytics: false,
    canViewAllQuizResults: false,
    // Admin
    isAdmin: false,
    isAdminOrFacilitator: false,
    canAccessAdminPanel: false,
  },
  viewer: {
    // Quiz
    canTakeQuizzes: true,
    canViewQuizResults: true, // Only own results
    canCreateQuizzes: false,
    canEditQuizzes: false,
    canDeleteQuizzes: false,
    canPublishQuizzes: false,
    canAssignQuizzes: false,
    // Users
    canManageUsers: false,
    canAssignRoles: false,
    canViewAllUsers: false,
    // Badges
    canCreateBadges: false,
    canEditBadges: false,
    canDeleteBadges: false,
    canAssignBadges: false,
    // Profile
    canViewPublicProfiles: true,
    canEditOwnProfile: true,
    // Analytics
    canViewAnalytics: false,
    canViewAllQuizResults: false,
    // Admin
    isAdmin: false,
    isAdminOrFacilitator: false,
    canAccessAdminPanel: false,
  },
};

function profileToRole(profile: string | null | undefined): UserRole {
  switch (profile) {
    case 'co_creator':
    case 'builder':
      return 'admin';
    case 'collaborator':
      return 'facilitator';
    default:
      return 'viewer';
  }
}

function roleToDisplayName(role: UserRole): string {
  switch (role) {
    case 'admin': return 'Admin';
    case 'facilitator': return 'Facilitator';
    case 'contributor': return 'Contributor';
    default: return 'Viewer';
  }
}

/**
 * Hook for role-based access control.
 * Derives role from the DID auth member's profile field.
 */
export function useRoleAccess() {
  const { member, isLoading } = useAuth();

  const role = useMemo(() => profileToRole(member?.profile), [member?.profile]);
  const permissions = useMemo(
    () => rolePermissions[role] || rolePermissions.viewer,
    [role]
  );

  const hasPermission = useCallback(
    (permission: keyof RolePermissions) => permissions[permission],
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (...perms: (keyof RolePermissions)[]) => perms.some(p => permissions[p]),
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (...perms: (keyof RolePermissions)[]) => perms.every(p => permissions[p]),
    [permissions]
  );

  return useMemo(() => ({
    role,
    roleName: roleToDisplayName(role),
    permissions,
    isLoading,
    error: null,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  }), [role, permissions, isLoading, hasPermission, hasAnyPermission, hasAllPermissions]);
}

/**
 * Component that only renders children if user has required permission
 */
export function RequirePermission({
  permission,
  children,
  fallback = null
}: {
  permission: keyof RolePermissions;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): React.ReactElement | null {
  const { permissions, isLoading } = useRoleAccess();

  if (isLoading) return null;
  if (!permissions[permission]) return <>{fallback}</>;

  return <>{children}</>;
}

/**
 * Component that only renders children if user has required role
 */
export function RequireRole({
  roles,
  children,
  fallback = null
}: {
  roles: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): React.ReactElement | null {
  const { role, isLoading } = useRoleAccess();

  if (isLoading) return null;

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  if (!allowedRoles.includes(role)) return <>{fallback}</>;

  return <>{children}</>;
}
