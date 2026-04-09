import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSupabaseAuth } from './useSupabaseAuth';
import { supabase } from '@/lib/supabase';

export type Permission = 'manage_users' | 'manage_content' | 'proxy_quiz' | 'view_analytics';

export const ALL_PERMISSIONS: Permission[] = [
  'manage_users',
  'manage_content', 
  'proxy_quiz',
  'view_analytics'
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

interface UserPermissionData {
  permissions: Permission[];
  isArchived: boolean;
  canAccessDiscover: boolean;
  role?: string;
}

export function usePermissions() {
  const { user, isLoading: authLoading } = useSupabaseAuth();

  const { data, isLoading: permLoading, error } = useQuery<UserPermissionData>({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return { permissions: [], isArchived: false };

      try {
        // Get role from user_roles/roles tables first (always available)
        const { data: userRole } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id)
          .maybeSingle();

        let roleKey = 'viewer';
        if (userRole) {
          const { data: roleData } = await supabase
            .from('roles')
            .select('key')
            .eq('id', userRole.role_id)
            .single();
          roleKey = roleData?.key || 'viewer';
        }

        // Try to get permissions from profiles table
        // This may fail silently if permissions column doesn't exist yet
        let permissions: Permission[] = [];
        let isArchived = false;

        try {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('permissions, is_archived')
            .eq('id', user.id)
            .maybeSingle();

          // Only use profile data if query succeeded and returned data
          if (!profileError && profileData) {
            permissions = (profileData.permissions as Permission[]) || [];
            isArchived = profileData.is_archived || false;
          }
          // Silently fall back to empty permissions if column doesn't exist
        } catch {
          // Column doesn't exist yet - that's fine, use empty permissions
        }

        // Discover access: user has ≥1 ethos_user_access row
        const { data: ethosAccessRows } = await supabase
          .from('ethos_user_access')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);
        const canAccessDiscover = (ethosAccessRows?.length ?? 0) > 0;

        return {
          permissions,
          isArchived,
          canAccessDiscover,
          role: roleKey
        };
      } catch (err) {
        console.error('Error fetching user role:', err);
        return { 
          permissions: [], 
          isArchived: false,
          role: 'viewer'
        };
      }
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const permissions = data?.permissions || [];
  const isArchived = data?.isArchived || false;
  const canAccessDiscover = data?.canAccessDiscover || false;
  const legacyRole = data?.role;

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  const hasAnyPermission = useCallback(
    (...perms: Permission[]): boolean => {
      return perms.some(p => permissions.includes(p));
    },
    [permissions]
  );

  const hasAllPermissions = useCallback(
    (...perms: Permission[]): boolean => {
      return perms.every(p => permissions.includes(p));
    },
    [permissions]
  );

  const canManageUsers = useMemo(
    () => hasPermission('manage_users') || legacyRole === 'admin',
    [hasPermission, legacyRole]
  );

  const canManageContent = useMemo(
    () => hasPermission('manage_content') || legacyRole === 'admin' || legacyRole === 'facilitator' || legacyRole === 'contributor',
    [hasPermission, legacyRole]
  );

  const canProxyQuiz = useMemo(
    () => hasPermission('proxy_quiz') || legacyRole === 'admin',
    [hasPermission, legacyRole]
  );

  const canViewAnalytics = useMemo(
    () => hasPermission('view_analytics') || legacyRole === 'admin' || legacyRole === 'facilitator',
    [hasPermission, legacyRole]
  );

  const canDeleteQuizzes = useMemo(
    () => legacyRole === 'admin',
    [legacyRole]
  );

  const isAdmin = useMemo(
    () => legacyRole === 'admin' || (permissions.includes('manage_users') && permissions.includes('manage_content')),
    [legacyRole, permissions]
  );

  return useMemo(() => ({
    permissions,
    isArchived,
    canAccessDiscover,
    legacyRole,
    isLoading: authLoading || permLoading,
    error,
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
    permissions, isArchived, canAccessDiscover, legacyRole, authLoading, permLoading, error,
    hasPermission, hasAnyPermission, hasAllPermissions,
    canManageUsers, canManageContent, canProxyQuiz, canViewAnalytics, canDeleteQuizzes, isAdmin
  ]);
}

export function RequirePermission({ 
  permission, 
  children, 
  fallback = null 
}: { 
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}): React.ReactElement | null {
  const { hasPermission, isLoading } = usePermissions();
  
  if (isLoading) return null;
  if (!hasPermission(permission)) return <>{fallback}</>;
  
  return <>{children}</>;
}
