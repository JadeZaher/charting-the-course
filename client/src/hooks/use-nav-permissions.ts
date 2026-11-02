import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { navPermissionsFor, readPlatformAdmin, readNodeAdmin, type NavPermissions } from '@/lib/nav-access';

/** The one read behind the sidebar's links, the Dashboard's actions and the gated routes: /auth/me's platform-admin
 * flag and steward rows over the header selection (lib/nav-access.ts). Never the member's profile. */
export function useNavPermissions(): NavPermissions {
  const auth = useAuth();
  const isPlatformAdmin = readPlatformAdmin(auth);
  const isNodeAdmin = readNodeAdmin(auth);
  const { ecosystems, selectedIds } = useEcosystem();
  return useMemo(
    () => navPermissionsFor({ isPlatformAdmin, isNodeAdmin, selectedIds, memberships: ecosystems }),
    [isPlatformAdmin, isNodeAdmin, selectedIds, ecosystems],
  );
}
