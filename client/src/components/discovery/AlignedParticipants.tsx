import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { User, Phone, Mail, Edit2, Check, X } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || '';
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as any).error || res.statusText);
  }
  return res.json();
}

interface Participant {
  user_id: string;
  display_name: string | null;
  phone: string | null;
  email: string | null;
  is_company: boolean | null;
  consented_at: string | null;
}

function ParticipantCard({ p }: { p: Participant }) {
  const displayName = p.display_name || 'Member';
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card">
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
        <User className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium truncate">{displayName}</span>
          {p.is_company && <Badge variant="outline">Company</Badge>}
        </div>
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
      const result = await apiFetch<Participant[]>(
        `/api/v1/participants/?ethos_id=${encodeURIComponent(ethosId)}`
      );
      return { participants: result };
    },
    enabled: !!ethosId,
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({ phone, email }: { phone: string; email: string }) => {
      await apiFetch('/api/v1/participants/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ethos_id: ethosId, phone: phone || null, email: email || null, consented: true }),
      });
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

      {participants.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Consented Participants</p>
          {participants.map(p => <ParticipantCard key={p.user_id} p={p} />)}
        </div>
      )}
    </div>
  );
}
