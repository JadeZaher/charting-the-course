import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { fetchEcosystem } from '@/lib/api-client';
import { membershipStanding } from '@/lib/ecosystem-join';
import { canManageQuizzes, navPermissionsFor, readPlatformAdmin, readNodeAdmin, type NavPermissions } from '@/lib/nav-access';
import { keys } from '@/lib/query-keys';

/** `null` while the selected ecosystem's admin state is still loading. */
function useVacantAdminQuiz(permissions: NavPermissions, selectedIds: readonly string[], memberships: readonly { id: string; membership_status?: string }[], selectionRestored: boolean): boolean | null {
  const single = selectedIds.length === 1 ? selectedIds[0] : undefined;
  const activeMember = !!single && membershipStanding(single, memberships) === 'active';
  const needsCheck = selectionRestored && activeMember && !canManageQuizzes(permissions);
  const query = useQuery({
    queryKey: keys.ecosystems.detail(single),
    queryFn: () => fetchEcosystem(single!),
    enabled: needsCheck && !!single,
  });
  if (!needsCheck) return false;
  if (query.isPending) return null;
  if (query.isError || !query.data || !('owner' in query.data)) return false;
  return query.data.owner === null;
}

/** The one read behind the sidebar's links, the Dashboard's actions and the gated routes: /auth/me's platform-admin
 * flag and steward rows over the header selection (lib/nav-access.ts). Never the member's profile. */
export function useNavPermissions(): NavPermissions {
  const auth = useAuth();
  const isPlatformAdmin = readPlatformAdmin(auth);
  const isNodeAdmin = readNodeAdmin(auth);
  const { ecosystems, selectedIds, selectionRestored } = useEcosystem();
  const base = useMemo(
    () => navPermissionsFor({ isPlatformAdmin, isNodeAdmin, selectedIds, memberships: ecosystems }),
    [isPlatformAdmin, isNodeAdmin, selectedIds, ecosystems],
  );
  const vacantAdminQuiz = useVacantAdminQuiz(base, selectedIds, ecosystems, selectionRestored);
  return useMemo(() => ({ ...base, vacantAdminQuiz }), [base, vacantAdminQuiz]);
}
