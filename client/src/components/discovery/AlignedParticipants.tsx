import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Mail, Edit2, Check, X } from 'lucide-react';

interface Participant {
  user_id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile_url: string;
  phone: string | null;
  email: string | null;
  ethos_status: 'aligned' | 'member' | 'waiting';
  ethos_role: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  member: 'Active Member',
  waiting: 'In Waiting Pool',
  aligned: 'Matched',
};

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
  member: 'default',
  waiting: 'secondary',
  aligned: 'outline',
};

function ParticipantCard({ p }: { p: Participant }) {
  const displayName = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.username || 'Member';
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <User className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <a href={p.profile_url} className="text-sm font-medium hover:underline truncate">
            {displayName}
          </a>
          <Badge variant={STATUS_VARIANTS[p.ethos_status]}>{STATUS_LABELS[p.ethos_status]}</Badge>
        </div>
        {p.ethos_role && (
          <p className="text-xs text-muted-foreground mt-0.5">{p.ethos_role}</p>
        )}
        {(p.phone || p.email) && (
          <div className="flex flex-wrap gap-3 mt-1.5">
            {p.phone && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />{p.phone}
              </span>
            )}
            {p.email && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />{p.email}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  ethosId: string;
}

export function AlignedParticipants({ ethosId }: Props) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editingContact, setEditingContact] = useState(false);
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const { data, isLoading, isError } = useQuery<{ participants: Participant[] }>({
    queryKey: ['participants-list', ethosId],
    queryFn: async () => {
      const { data: res, error } = await supabase.functions.invoke(
        `participants-list?ethos_id=${ethosId}`,
        { method: 'GET' }
      );
      if (error) throw new Error(error.message || 'Failed to fetch participants');
      return (res as { data: { participants: Participant[] } }).data;
    },
    enabled: !!ethosId,
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ phone, email }: { phone: string; email: string }) => {
      const { error } = await supabase.functions.invoke('participants-update-contact', {
        body: { ethos_id: ethosId, phone: phone || null, email: email || null },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['participants-list', ethosId] });
      setEditingContact(false);
      toast({ title: 'Contact info updated' });
    },
    onError: () => {
      toast({ title: 'Failed to update contact info', variant: 'destructive' });
    },
  });

  const handleEditOpen = () => {
    setContactPhone('');
    setContactEmail('');
    setEditingContact(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border p-6">
        <p className="text-muted-foreground text-sm">Failed to load participants.</p>
      </div>
    );
  }

  const participants = data?.participants ?? [];
  const ethosMembers = participants.filter(p => p.ethos_status === 'member');
  const alignedAndWaiting = participants.filter(p => p.ethos_status !== 'member');

  return (
    <div className="space-y-5">
      {/* Edit contact info */}
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-sm">Aligned Participants</h2>
        {!editingContact && (
          <Button size="sm" variant="outline" onClick={handleEditOpen}>
            <Edit2 className="h-3.5 w-3.5 mr-1.5" />
            Edit my contact info
          </Button>
        )}
      </div>

      {editingContact && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">My contact info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input
              placeholder="Phone"
              value={contactPhone}
              onChange={e => setContactPhone(e.target.value)}
            />
            <Input
              placeholder="Email"
              type="email"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
            />
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => updateContactMutation.mutate({ phone: contactPhone, email: contactEmail })}
                disabled={updateContactMutation.isPending}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditingContact(false)}>
                <X className="h-3.5 w-3.5 mr-1" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {participants.length === 0 && (
        <div className="rounded-lg border p-6 text-center">
          <p className="text-muted-foreground text-sm">No participants yet.</p>
        </div>
      )}

      {ethosMembers.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">ETHOS Members</p>
          {ethosMembers.map(p => <ParticipantCard key={p.user_id} p={p} />)}
        </div>
      )}

      {alignedAndWaiting.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aligned Participants</p>
          {alignedAndWaiting.map(p => <ParticipantCard key={p.user_id} p={p} />)}
        </div>
      )}
    </div>
  );
}
