import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { apiErrorMessage } from '@/lib/api-error-message';
import {
  claimEcosystemAdmin,
  fetchEcosystemAdmins,
  fetchMembers,
  fetchMyPublicProfile,
  grantEcosystemAdmin,
  redesignateEcosystemAdmin,
  revokeEcosystemAdmin,
  type EcosystemAdminDesignation,
} from '@/lib/api-client';
import { membershipStanding } from '@/lib/ecosystem-join';
import {
  SEAT_HELD_MESSAGE,
  adminDesignationText,
  canChangeLink,
  canClaimSeat,
  canGrantLink,
  designationLabel,
  isAdminDesignation,
  isSeatHeld,
  redesignateTargets,
  vacantDesignations,
  type AdminActor,
  type AdminDesignation,
  type EcosystemAdminRow,
} from '@/lib/ecosystem-admins';
import { keys } from '@/lib/query-keys';

function httpStatus(error: unknown): number | null {
  const status = (error as { status?: unknown } | null)?.status;
  return typeof status === 'number' ? status : null;
}

function readAdmins(rows: { id?: string; display_name?: string; designations?: unknown }[] | undefined): EcosystemAdminRow[] {
  return (rows ?? []).flatMap((row) => {
    const id = typeof row.id === 'string' ? row.id : '';
    const displayName = typeof row.display_name === 'string' ? row.display_name.trim() : '';
    const designations = Array.isArray(row.designations) ? row.designations.filter(isAdminDesignation) : [];
    if (!id || !displayName) return [];
    return [{ id, display_name: displayName, designations }];
  });
}

/**
 * Lead Link (internal) and Rep Link (external) for one ecosystem.
 * Grant: owner, internal admin, or node admin.
 * Revoke and re-designate: that admin, or a node admin.
 * Claim: any active member, for a vacant seat.
 */
export function EcosystemAdmins({ ecosystemId }: { ecosystemId: string }) {
  const { member, user, ecosystems, isNodeAdmin } = useAuth();
  const standing = membershipStanding(ecosystemId, ecosystems);
  const role = ecosystems.find((ecosystem) => ecosystem.id === ecosystemId)?.role ?? null;
  const callerInPlace = member?.ecosystem_id === ecosystemId ? member.id : null;
  const profile = useQuery({
    queryKey: [...keys.profiles.mine(), user?.id, 'membership-ids'],
    queryFn: fetchMyPublicProfile,
    enabled: !callerInPlace && !!user?.id,
  });
  const callerMemberId = callerInPlace
    ?? profile.data?.ecosystems.find((ecosystem) => ecosystem.id === ecosystemId)?.membership.id
    ?? null;

  const roster = useQuery({
    queryKey: keys.ecosystems.admins(ecosystemId),
    queryFn: () => fetchEcosystemAdmins(ecosystemId),
    enabled: !!ecosystemId,
    retry: false,
  });
  const admins = readAdmins(roster.data?.admins);
  const rosterPrivate = httpStatus(roster.error) === 403;
  const held = admins.find((admin) => admin.id === callerMemberId)?.designations ?? [];
  const actor: AdminActor = {
    memberId: callerMemberId,
    role,
    active: standing === 'active',
    isNodeAdmin,
    held,
  };
  const grant = canGrantLink(actor);
  const vacant = roster.isSuccess ? vacantDesignations(admins) : (['internal', 'external'] as const);
  const showClaim = roster.isSuccess ? canClaimSeat(actor, vacant) : actor.active && rosterPrivate;

  const people = useQuery({
    queryKey: keys.members.list({ ecosystem_ids: ecosystemId, status: 'active', per_page: '100' }),
    queryFn: () => fetchMembers({ ecosystem_ids: ecosystemId, status: 'active', per_page: '100' }),
    enabled: grant,
  });

  const invalidate = [keys.ecosystems.admins(ecosystemId), keys.ecosystems.detail(ecosystemId)];
  const grantLink = useApiMutation({
    mutationFn: (input: { memberId: string; designation: AdminDesignation }) => grantEcosystemAdmin(ecosystemId, input.memberId, input.designation),
    invalidates: invalidate,
    silent: true,
    success: 'Link granted',
  });
  const claim = useApiMutation({
    mutationFn: (designation: AdminDesignation | 'both') => claimEcosystemAdmin(ecosystemId, designation),
    invalidates: invalidate,
    silent: true,
    success: 'Seat claimed',
  });
  const change = useApiMutation<unknown, { kind: 'revoke' | 'redesignate'; memberId: string; designation: AdminDesignation }>({
    mutationFn: async (input) => (
      input.kind === 'revoke'
        ? revokeEcosystemAdmin(ecosystemId, input.memberId, input.designation)
        : redesignateEcosystemAdmin(ecosystemId, input.memberId, input.designation)
    ),
    invalidates: invalidate,
    silent: true,
    success: ( _data, input) => input.kind === 'revoke' ? 'Link removed' : 'Link re-designated',
  });

  const refreshRoster = roster.refetch;
  const reportedSeat = useRef<unknown>(null);
  useEffect(() => {
    if (claim.error && claim.error !== reportedSeat.current && isSeatHeld(claim.error)) {
      reportedSeat.current = claim.error;
      void refreshRoster();
    }
  }, [claim.error, refreshRoster]);

  const [memberId, setMemberId] = useState('');
  const [designation, setDesignation] = useState<EcosystemAdminDesignation>('internal');
  const [pending, setPending] = useState<{ kind: 'revoke' | 'redesignate'; memberId: string; name: string; designation: AdminDesignation } | null>(null);

  const confirmChange = async () => {
    if (!pending) return;
    const action = pending;
    setPending(null);
    try {
      await change.mutateAsync(action);
    } catch {
      // Rendered from change.error.
    }
  };

  const claimSeat = async (seat: AdminDesignation | 'both') => {
    try {
      await claim.mutateAsync(seat);
    } catch {
      // SEAT_HELD and other refusals render below.
    }
  };

  const grantSeat = async () => {
    if (!memberId) return;
    try {
      await grantLink.mutateAsync({ memberId, designation });
      setMemberId('');
    } catch {
      // Rendered from grantLink.error.
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle id="ecosystem-admins-heading" className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5" aria-hidden="true" />
          Ecosystem admins
        </CardTitle>
        <CardDescription>
          Lead Link (internal) stewards this ecosystem. Rep Link (external) is its public contact.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4" aria-labelledby="ecosystem-admins-heading">
        {roster.isPending && <p role="status">Loading admins.</p>}
        {roster.isError && !rosterPrivate && (
          <p role="alert">{apiErrorMessage(roster.error)}</p>
        )}
        {roster.isSuccess && admins.length === 0 && (
          <p>No admin holds a link. An active member can claim a vacant seat.</p>
        )}
        {roster.isSuccess && admins.length > 0 && (
          <ul className="space-y-3">
            {admins.map((admin) => {
              const changeable = canChangeLink(actor, admin.id);
              return (
                <li key={admin.id} className="border border-border p-3">
                  <p className="font-semibold">{admin.display_name}</p>
                  <p className="text-sm text-muted-foreground">{adminDesignationText(admin.designations)}</p>
                  {changeable && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {admin.designations.map((seat) => (
                        <Button key={seat} type="button" variant="outline" onClick={() => setPending({ kind: 'revoke', memberId: admin.id, name: admin.display_name, designation: seat })}>
                          Revoke {designationLabel(seat)}
                        </Button>
                      ))}
                      {redesignateTargets(admin.designations).map((seat) => (
                        <Button key={seat} type="button" variant="outline" onClick={() => setPending({ kind: 'redesignate', memberId: admin.id, name: admin.display_name, designation: seat })}>
                          Re-designate as {designationLabel(seat)}
                        </Button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {rosterPrivate && <p className="text-sm text-muted-foreground">The admin list is visible to an owner, an admin, or a node admin.</p>}

        {grant && (
          <form className="space-y-3 border border-border p-3" onSubmit={(event) => { event.preventDefault(); void grantSeat(); }}>
            <p className="font-semibold" id="grant-admin-label">Grant a link</p>
            <div className="space-y-1">
              <Label htmlFor="grant-admin-member">Member</Label>
              <select id="grant-admin-member" className="min-h-11 w-full border bg-background p-2" value={memberId} onChange={(event) => setMemberId(event.target.value)}>
                <option value="">Choose an active member</option>
                {(people.data?.items ?? []).filter((person) => person.current_status === 'active').map((person) => (
                  <option key={person.id} value={person.id}>{person.display_name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="grant-admin-designation">Designation</Label>
              <select id="grant-admin-designation" className="min-h-11 w-full border bg-background p-2" value={designation} onChange={(event) => setDesignation(event.target.value === 'external' ? 'external' : 'internal')}>
                <option value="internal">Lead Link (internal)</option>
                <option value="external">Rep Link (external)</option>
              </select>
            </div>
            <Button type="submit" disabled={!memberId || grantLink.isPending}>{grantLink.isPending ? 'Granting…' : 'Grant link'}</Button>
            {people.isError && <p role="alert">{apiErrorMessage(people.error)}</p>}
            {grantLink.error && <p role="alert">{apiErrorMessage(grantLink.error)}</p>}
          </form>
        )}

        {showClaim && (
          <div className="space-y-2">
            <p className="font-semibold" id="claim-admin-label">Claim a vacant seat</p>
            <div className="flex flex-wrap gap-2" aria-labelledby="claim-admin-label">
              {(roster.isSuccess ? vacant : (['internal', 'external'] as const)).map((seat) => (
                <Button key={seat} type="button" variant="outline" disabled={claim.isPending} onClick={() => void claimSeat(seat)}>
                  Claim {designationLabel(seat)}
                </Button>
              ))}
              {(!roster.isSuccess || vacant.length === 2) && (
                <Button type="button" variant="outline" disabled={claim.isPending} onClick={() => void claimSeat('both')}>
                  Claim both seats
                </Button>
              )}
            </div>
            {isSeatHeld(claim.error) ? (
              <p role="status">{SEAT_HELD_MESSAGE}</p>
            ) : claim.error ? (
              <p role="alert">{apiErrorMessage(claim.error)}</p>
            ) : null}
          </div>
        )}
        {change.error && <p role="alert">{apiErrorMessage(change.error)}</p>}
      </CardContent>

      <AlertDialog open={pending !== null} onOpenChange={(open) => { if (!open) setPending(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pending?.kind === 'revoke'
                ? `Revoke ${designationLabel(pending.designation)} from ${pending.name}?`
                : `Re-designate ${pending?.name ?? 'this admin'} as ${pending ? designationLabel(pending.designation) : ''}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pending?.kind === 'revoke'
                ? 'Removing the last link leaves the ecosystem with no admin. An active member can then claim a vacant seat.'
                : 'They keep only this link. The other designation, if they hold it, is removed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmChange()}>{pending?.kind === 'revoke' ? 'Revoke link' : 'Re-designate'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
