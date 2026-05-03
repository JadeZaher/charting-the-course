import { useState, useEffect } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useMember, useCreateMember, useUpdateMember } from '@/hooks/use-governance';
import { useToast } from '@/hooks/use-toast';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { ArrowLeft } from 'lucide-react';

const PROFILE_OPTIONS = [
  { value: 'co_creator', label: 'Co-Creator' },
  { value: 'builder', label: 'Builder' },
  { value: 'collaborator', label: 'Collaborator' },
  { value: 'townhall', label: 'Townhall' },
];

export default function MemberForm() {
  const [, editParams] = useRoute('/members/:id/edit');
  const editId = editParams?.id;
  const isEdit = !!editId;

  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { selected: selectedEcosystem } = useEcosystem();
  const { data: existing, isLoading: loadingExisting } = useMember(editId ?? '');
  const createMutation = useCreateMember();
  const updateMutation = useUpdateMember(editId ?? '');

  const [displayName, setDisplayName] = useState('');
  const [profile, setProfile] = useState('');
  const [phone, setPhone] = useState('');
  const [skillsOffered, setSkillsOffered] = useState('');
  const [skillsNeeded, setSkillsNeeded] = useState('');
  const [interests, setInterests] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing && isEdit) {
      setDisplayName(existing.display_name || '');
      setProfile(existing.profile || '');
      setPhone(existing.phone || '');
      setSkillsOffered(existing.skills_offered?.join(', ') || '');
      setSkillsNeeded(existing.skills_needed?.join(', ') || '');
      setInterests(existing.interests?.join(', ') || '');
    }
  }, [existing, isEdit]);

  if (isEdit && loadingExisting) return <LoadingState message="Loading member..." />;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!displayName.trim()) errs.displayName = 'Display name is required';
    if (!profile) errs.profile = 'Profile is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const parseCommaSeparated = (value: string): string[] =>
    value.split(',').map(s => s.trim()).filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, any> = {
      display_name: displayName.trim(),
      profile,
      phone: phone || null,
      skills_offered: parseCommaSeparated(skillsOffered),
      skills_needed: parseCommaSeparated(skillsNeeded),
      interests: parseCommaSeparated(interests),
    };

    if (!isEdit && selectedEcosystem) {
      payload.ecosystem_id = selectedEcosystem.id;
    }

    try {
      let result;
      if (isEdit) {
        result = await updateMutation.mutateAsync(payload);
      } else {
        result = await createMutation.mutateAsync(payload);
      }
      toast({ title: isEdit ? 'Member updated' : 'Member created', description: 'Member record has been saved successfully.' });
      navigate(`/members/${result.id}`);
    } catch {
      // Error handled by mutation state
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href={isEdit ? `/members/${editId}` : '/members'}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {isEdit ? 'Back to Member' : 'Back to Members'}
        </Button>
      </Link>

      <h1 className="text-3xl font-bold">{isEdit ? 'Edit Member' : 'New Member'}</h1>

      {mutationError && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {(mutationError as Error).message}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name *</Label>
              <Input
                id="display_name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Member display name"
                required
                aria-required="true"
              />
              {errors.displayName && <p className="text-sm text-destructive">{errors.displayName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile">Profile *</Label>
              <Select value={profile} onValueChange={setProfile}>
                <SelectTrigger>
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent>
                  {PROFILE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.profile && <p className="text-sm text-destructive">{errors.profile}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills_offered">Skills Offered</Label>
              <Textarea
                id="skills_offered"
                value={skillsOffered}
                onChange={(e) => setSkillsOffered(e.target.value)}
                placeholder="Comma-separated skills (e.g., facilitation, design, coding)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills_needed">Skills Needed</Label>
              <Textarea
                id="skills_needed"
                value={skillsNeeded}
                onChange={(e) => setSkillsNeeded(e.target.value)}
                placeholder="Comma-separated skills needed"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">Interests</Label>
              <Textarea
                id="interests"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="Comma-separated interests"
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : (isEdit ? 'Update Member' : 'Create Member')}
              </Button>
              <Link href={isEdit ? `/members/${editId}` : '/members'}>
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
