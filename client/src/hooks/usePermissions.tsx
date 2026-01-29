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
  role?: string;
}

export function usePermissions() {
  const { user, isLoading: authLoading } = useSupabaseAuth();

  const { data, isLoading: permLoading, error } = useQuery<UserPermissionData>({
    queryKey: ['user-permissions', user?.id],
    queryFn: async () => {
      if (!user?.id) return { permissions: [], isArchived: false };

      try {
        // Try to get permissions from users table first
        const { data: userData, error: usersError } = await supabase
          .from('users')
          .select('permissions, is_archived, role')
          .eq('id', user.id)
          .maybeSingle();

        if (!usersError && userData) {
          return {
            permissions: (userData?.permissions as Permission[]) || [],
            isArchived: userData?.is_archived || false,
            role: userData?.role
          };
        }

        // Fallback: try to get role from user_roles/roles tables
        console.log('Users table not accessible, trying user_roles fallback...');
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleError || !userRole) {
          // Last resort: check user metadata
          const metaRole = (user as any)?.user_metadata?.role || (user as any)?.role;
          return { 
            permissions: [], 
            isArchived: false,
            role: metaRole || 'viewer'
          };
        }

        // Get role key from roles table
        const { data: roleData } = await supabase
          .from('roles')
          .select('key')
          .eq('id', userRole.role_id)
          .single();

        return {
          permissions: [],
          isArchived: false,
          role: roleData?.key || 'viewer'
        };
      } catch (err) {
        console.error('Unexpected error fetching permissions:', err);
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
    permissions, isArchived, legacyRole, authLoading, permLoading, error,
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
