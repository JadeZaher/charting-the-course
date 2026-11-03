import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { reconcilePushOwner } from '@/lib/web-push';

export function EngagementSessionBoundary() {
  const { user, isLoading } = useAuth();
  const client = useQueryClient();
  const previous = useRef<string | null>(null);
  useEffect(() => {
    if (isLoading) return;
    const current = user?.id ?? null;
    if (previous.current !== current) {
      const old = previous.current;
      if (old) { void client.cancelQueries({ queryKey: ['engagement', old] }); client.removeQueries({ queryKey: ['engagement', old] }); }
      previous.current = current;
    }
    void reconcilePushOwner(current).catch(() => {});
  }, [user?.id, isLoading, client]);
  return null;
}
