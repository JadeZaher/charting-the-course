import { useCallback, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { clearBrowserPush, currentPushSubscription, enrollBrowserPush, supportsWebPush } from '@/lib/web-push';
import { engagementKeys, useEngagementCapabilities } from './use-engagement';

export type NotificationPermission = 'default' | 'granted' | 'denied';
export function useNotifications() {
  const { user } = useAuth();
  const client = useQueryClient();
  const capabilities = useEngagementCapabilities();
  const isSupported = supportsWebPush();
  const [permission, setPermission] = useState<NotificationPermission>(isSupported ? Notification.permission : 'default');
  const [isSubscribed, setSubscribed] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setSubscribed(false);
    if (user?.id) currentPushSubscription(user.id).then(sub => { if (live) setSubscribed(!!sub); }).catch(() => {});
    return () => { live = false; };
  }, [user?.id]);
  const requestPermissionAndSubscribe = useCallback(async () => {
    setError(null); setLoading(true);
    try {
      const capability = capabilities.data?.channels.push;
      if (!user?.id || !capability?.public_key || !['ready', 'needs_verification'].includes(capability.state)) throw new Error(capability?.reason || 'Browser push setup is pending.');
      await enrollBrowserPush(user.id, capability.public_key);
      setSubscribed(true);
      setPermission(Notification.permission);
      await client.invalidateQueries({ queryKey: engagementKeys.owner(user.id) });
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Browser push could not be enabled.'); }
    finally { setLoading(false); }
  }, [user?.id, capabilities.data, client]);
  const unsubscribe = useCallback(async () => {
    setLoading(true); setError(null);
    try { await clearBrowserPush(true); setSubscribed(false); await client.invalidateQueries({ queryKey: engagementKeys.owner(user?.id) }); }
    catch (reason) { setSubscribed(false); setError(reason instanceof Error ? reason.message : 'Browser push cleanup failed. Please retry.'); }
    finally { setLoading(false); }
  }, [client, user?.id]);
  return { isSupported, permission, isSubscribed, isLoading, error, requestPermissionAndSubscribe, unsubscribe };
}
