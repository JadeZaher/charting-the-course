import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, signIn, signUp, signOut, getSession } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

/**
 * Hook for Supabase authentication
 * This replaces the old useAuth hook that used Express API
 */
export function useSupabaseAuth() {
  const queryClient = useQueryClient();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });
  
  // Track if we've already invalidated to prevent loops
  const hasInvalidated = useRef(false);

  // Listen to auth state changes
  useEffect(() => {
    let isMounted = true;
    
    // Get initial session
    getSession().then(({ session }) => {
      if (isMounted) {
        setAuthState({
          user: session?.user ?? null,
          session: session ?? null,
          isLoading: false,
          isAuthenticated: !!session,
        });
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        setAuthState({
          user: session?.user ?? null,
          session: session ?? null,
          isLoading: false,
          isAuthenticated: !!session,
        });

        // Only invalidate user-related queries on sign in/out, and only once
        if ((event === 'SIGNED_IN' || event === 'SIGNED_OUT') && !hasInvalidated.current) {
          hasInvalidated.current = true;
          // Be specific about which queries to invalidate
          queryClient.invalidateQueries({ queryKey: ['user-role'] });
          queryClient.invalidateQueries({ queryKey: ['profile'] });
          queryClient.invalidateQueries({ queryKey: ['user-badges'] });
          queryClient.invalidateQueries({ queryKey: ['user-achievements'] });
          // Reset the flag after a short delay
          setTimeout(() => {
            hasInvalidated.current = false;
          }, 1000);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  // Sign in mutation
  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await signIn(email, password);
      if (error) throw error;
      return data;
    },
    // Don't invalidate here - let onAuthStateChange handle it
  });

  // Sign up mutation
  const signUpMutation = useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      firstName, 
      lastName 
    }: { 
      email: string; 
      password: string;
      firstName?: string;
      lastName?: string;
    }) => {
      const { data, error } = await signUp(email, password, {
        first_name: firstName,
        last_name: lastName,
      });
      if (error) throw error;
      return data;
    },
  });

  // Sign out mutation
  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });

  return {
    // State
    user: authState.user,
    session: authState.session,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,

    // Actions
    signIn: signInMutation.mutate,
    signInAsync: signInMutation.mutateAsync,
    signUp: signUpMutation.mutate,
    signUpAsync: signUpMutation.mutateAsync,
    signOut: signOutMutation.mutate,
    signOutAsync: signOutMutation.mutateAsync,

    // Loading states
    isSigningIn: signInMutation.isPending,
    isSigningUp: signUpMutation.isPending,
    isSigningOut: signOutMutation.isPending,

    // Errors
    signInError: signInMutation.error,
    signUpError: signUpMutation.error,
    signOutError: signOutMutation.error,
  };
}

/**
 * Hook to get user's role from the database
 * Uses a separate query that doesn't depend on useSupabaseAuth to avoid loops
 */
export function useUserRole() {
  return useQuery({
    queryKey: ['user-role'],
    queryFn: async () => {
      // Get current user directly from supabase
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // If no user or error getting user, return default role
      if (userError || !user) {
        return { key: 'viewer', name: 'Viewer' };
      }
      
      try {
        // First get the user_role record
        const { data: userRole, error: roleError } = await supabase
          .from('user_roles')
          .select('role_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (roleError) {
          console.error('[useUserRole] Error fetching user_role:', roleError);
          return { key: 'viewer', name: 'Viewer' };
        }

        if (!userRole) {
          return { key: 'viewer', name: 'Viewer' };
        }

        // Then get the role details
        const { data: role, error: roleDetailsError } = await supabase
          .from('roles')
          .select('key, name')
          .eq('id', userRole.role_id)
          .single();

        if (roleDetailsError || !role) {
          console.error('[useUserRole] Error fetching role details:', roleDetailsError);
          return { key: 'viewer', name: 'Viewer' };
        }

        return role as { key: string; name: string };
      } catch (err) {
        console.error('[useUserRole] Unexpected error:', err);
        return { key: 'viewer', name: 'Viewer' };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - roles don't change often
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch when component mounts
    refetchOnReconnect: false, // Don't refetch on reconnect
    retry: false, // Don't retry on failure - show error instead
  });
}

