import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AITextarea } from '@/components/ui/ai-textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EcosystemMultiSelect } from '@/components/EcosystemMultiSelect';
import { useCreateExit, useMembers } from '@/hooks/use-governance';
import { useToast } from '@/hooks/use-toast';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { ArrowLeft } from 'lucide-react';

const EXIT_TYPE_OPTIONS = [
  { value: 'voluntary', label: 'Voluntary' },
  { value: 'involuntary', label: 'Involuntary' },
  { value: 'timeout', label: 'Timeout' },
];

export default function ExitForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { selected: selectedEcosystem } = useEcosystem();
  const createMutation = useCreateExit();
  const { data: membersData } = useMembers();

  const [memberId, setMemberId] = useState('');
  const [exitType, setExitType] = useState('');
  const [reason, setReason] = useState('');
  const [sharedEcosystemIds, setSharedEcosystemIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!memberId) errs.memberId = 'Member is required';
    if (!exitType) errs.exitType = 'Exit type is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload: Record<string, any> = {
      member_id: memberId,
      exit_type: exitType,
      reason: reason.trim() || null,
    };

    if (selectedEcosystem) {
      payload.ecosystem_id = selectedEcosystem.id;
    }

    if (sharedEcosystemIds.length > 0) {
      payload.shared_ecosystem_ids = sharedEcosystemIds;
    }

    try {
      const result = await createMutation.mutateAsync(payload);
      toast({ title: 'Exit initiated', description: 'The exit process has been initiated successfully.' });
      navigate(`/exit/${result.id}`);
    } catch {
      // Error handled by mutation state
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Link href="/exit">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Exits
        </Button>
      </Link>

      <h1 className="text-3xl font-bold">Initiate Exit</h1>

      {createMutation.error && (
        <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
          {(createMutation.error as Error).message}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member">Member *</Label>
              <Select value={memberId} onValueChange={setMemberId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {membersData?.items.map((m) => (
                    <SelectItem key={m.id} value={m.id}>{m.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.memberId && <p className="text-sm text-destructive">{errors.memberId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="exit_type">Exit Type *</Label>
              <Select value={exitType} onValueChange={setExitType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exit type" />
                </SelectTrigger>
                <SelectContent>
                  {EXIT_TYPE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.exitType && <p className="text-sm text-destructive">{errors.exitType}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <AITextarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for exit..."
                rows={4}
                fieldLabel="Reason"
                fieldContext="The reason for a member's exit from the governance ecosystem"
              />
            </div>

            <EcosystemMultiSelect
              label="Cross-Ecosystem Sharing"
              description="Select additional ecosystems this applies to."
              primaryId={selectedEcosystem?.id ?? ''}
              sharedIds={sharedEcosystemIds}
              onPrimaryChange={() => {}}
              onSharedChange={setSharedEcosystemIds}
            />

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Submitting...' : 'Initiate Exit'}
              </Button>
              <Link href="/exit">
                <Button type="button" variant="outline">Cancel</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
