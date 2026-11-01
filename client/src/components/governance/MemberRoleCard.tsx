import { useState } from 'react';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAssignMemberRole, useGrantMemberProfile } from '@/hooks/use-governance';
import { apiErrorMessage } from '@/lib/api-error-message';
import { formatDate } from '@/lib/utils';
import type { RoleGrant } from '@/types/api';

/** Each ecosystem role tier in plain words: what it lets someone do here. */
const ROLE_WORDS: Record<string, { label: string; can: string }> = {
  user: { label: 'Member', can: 'takes part: gives advice, records positions and files test reports' },
  mod: { label: 'Moderator (steward)', can: 'also manages proposals and domains, and confirms ratifications' },
  admin: { label: 'Admin (steward)', can: 'also conducts agreement ceremonies and gives the moderator role' },
  owner: { label: 'Owner', can: 'also gives the admin role, and is the only one who can make another owner' },
};

const roleLabel = (role: string) => ROLE_WORDS[role]?.label ?? role;

/** Member profiles; the first two carry administration rights, so only an owner grants them. */
const PROFILE_LABELS: Record<string, string> = {
  co_creator: 'Co-Creator (administration rights)',
  builder: 'Builder (administration rights)',
  collaborator: 'Collaborator',
  townhall: 'Townhall',
};

const profileLabel = (profile: string) => (profile ? PROFILE_LABELS[profile] ?? profile : 'no profile');

/**
 * A member's role in this ecosystem, who may change it, and every recorded change.
 * The server offers only tiers the caller may give (owner decision: below your own rank; only an owner makes an owner).
 */
export function MemberRoleCard({ memberId, memberName, role, assignable, history, isSelf, profile = null, grantableProfiles = [] }: {
  memberId: string;
  memberName: string;
  role: string;
  assignable: string[];
  history: RoleGrant[];
  isSelf: boolean;
  profile?: string | null;
  grantableProfiles?: string[];
}) {
  const assign = useAssignMemberRole(memberId);
  const grantProfile = useGrantMemberProfile(memberId);
  const [choice, setChoice] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [profileChoice, setProfileChoice] = useState('');
  const [confirmingProfile, setConfirmingProfile] = useState(false);
  const words = ROLE_WORDS[role];

  const confirmProfile = async () => {
    setConfirmingProfile(false);
    try {
      await grantProfile.mutateAsync(profileChoice);
      setProfileChoice('');
    } catch {
      // Rendered below from grantProfile.error
    }
  };

  const confirm = async () => {
    setConfirming(false);
    try {
      await assign.mutateAsync(choice);
      setChoice('');
    } catch {
      // Rendered below from assign.error
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Shield className="h-5 w-5" aria-hidden="true" />
          Role in this ecosystem
        </CardTitle>
        <CardDescription>
          <Badge variant="outline" className="mr-2">{roleLabel(role)}</Badge>
          {words ? `${isSelf ? 'You' : memberName} ${words.can}.` : null}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignable.length > 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="space-y-1 flex-1">
              <Label htmlFor="member-role-choice">{isSelf ? 'Step down to' : 'Change role to'}</Label>
              <Select value={choice} onValueChange={setChoice}>
                <SelectTrigger id="member-role-choice">
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {assignable.map((tier) => (
                    <SelectItem key={tier} value={tier}>{roleLabel(tier)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" disabled={!choice || assign.isPending} onClick={() => setConfirming(true)}>
              {assign.isPending ? 'Saving...' : 'Change role…'}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            You can give only roles below your own, and only an owner can make someone an owner.
          </p>
        )}
        {assign.error && <p className="text-sm text-destructive" role="alert">{apiErrorMessage(assign.error)}</p>}

        {grantableProfiles.length > 0 && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="space-y-1 flex-1">
              <Label htmlFor="member-profile-choice">Profile (now {profileLabel(profile ?? '')})</Label>
              <Select value={profileChoice} onValueChange={setProfileChoice}>
                <SelectTrigger id="member-profile-choice">
                  <SelectValue placeholder="Choose a profile" />
                </SelectTrigger>
                <SelectContent>
                  {grantableProfiles.map((option) => (
                    <SelectItem key={option} value={option}>{profileLabel(option)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="outline" disabled={!profileChoice || grantProfile.isPending} onClick={() => setConfirmingProfile(true)}>
              {grantProfile.isPending ? 'Saving...' : 'Change profile…'}
            </Button>
          </div>
        )}
        {grantProfile.error && <p className="text-sm text-destructive" role="alert">{apiErrorMessage(grantProfile.error)}</p>}

        <div>
          <p className="text-sm font-medium">Role history</p>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">No role changes recorded.</p>
          ) : (
            <ul className="mt-1 space-y-1 text-sm">
              {history.map((grant, index) => (
                <li key={`${grant.date}-${index}`}>
                  {grant.kind === 'profile'
                    ? `${formatDate(grant.date)}: profile ${profileLabel(grant.from_role)} to ${profileLabel(grant.to_role)}`
                    : `${formatDate(grant.date)}: ${roleLabel(grant.from_role)} to ${roleLabel(grant.to_role)}`}
                  {grant.granted_by ? `, by ${grant.granted_by}` : ''}
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isSelf ? 'Step down?' : `Make ${memberName} ${roleLabel(choice)}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {isSelf
                ? `You become ${roleLabel(choice)}. Only someone above that rank can give your role back.`
                : `${memberName} becomes ${roleLabel(choice)}. The change and your name are recorded in their role history.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirm}>Change role</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmingProfile} onOpenChange={setConfirmingProfile}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Make {memberName} {profileLabel(profileChoice)}?</AlertDialogTitle>
            <AlertDialogDescription>
              {['co_creator', 'builder'].includes(profileChoice)
                ? `This profile carries administration rights in this ecosystem. The change and your name are recorded in ${memberName}'s role history.`
                : `The change and your name are recorded in ${memberName}'s role history.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmProfile}>Change profile</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
