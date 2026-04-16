import { useState } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useEthosList } from '@/hooks/useEthos';
import { AlignedParticipants } from '@/components/discovery/AlignedParticipants';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface EthosRef {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
}

interface AccessRow {
  ethos_id: string;
  ethos: EthosRef | null;
}

export default function Discover() {
  const { member } = useAuth();
  const { isAdmin, isLoading: permLoading } = usePermissions();
  const [adminSelectedEthosId, setAdminSelectedEthosId] = useState<string>('');

  // Admin: fetch all ETHOS for dropdown selector
  const { data: allEthosData } = useEthosList(undefined, 100, 0);

  // Derive the user's ethos access from their NEOS Den ecosystem membership
  // TODO: Replace with /api/v1/members/:id/ethos-access when dedicated endpoint exists
  const accessRows: AccessRow[] = member?.ecosystem_id
    ? [{
        ethos_id: member.ecosystem_id,
        ethos: (allEthosData?.ethos ?? []).find(e => e.id === member.ecosystem_id) as unknown as EthosRef ?? null
      }]
    : [];
  const accessLoading = false;

  if (accessLoading || permLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-lg" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </div>
    );
  }

  // Gate: non-admins with no access rows see no-match message
  if (!isAdmin && accessRows.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">My Solution</h1>
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">You haven't been matched to a Solution yet.</p>
        </div>
      </div>
    );
  }

  const ethosListForAdmin = allEthosData?.ethos ?? [];
  const activeEthos: EthosRef | null = isAdmin
    ? ((ethosListForAdmin.find(e => e.id === adminSelectedEthosId) ?? ethosListForAdmin[0]) as unknown as EthosRef | null) ?? null
    : (accessRows[0]?.ethos ?? null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">
          {activeEthos ? activeEthos.name : 'My Solution'}
        </h1>
        {isAdmin && ethosListForAdmin.length > 1 && (
          <Select
            value={adminSelectedEthosId || (ethosListForAdmin[0]?.id ?? '')}
            onValueChange={setAdminSelectedEthosId}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a Solution" />
            </SelectTrigger>
            <SelectContent>
              {ethosListForAdmin.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {(e as any).name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left area: Solution Detail */}
        <div className="rounded-lg border p-6 h-full flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-semibold">{activeEthos?.name}</h2>
            {activeEthos?.tagline && (
              <p className="text-muted-foreground mt-1">{activeEthos.tagline}</p>
            )}
          </div>
          <Link href={`/ethos/${activeEthos?.slug}/detail`}>
            <Button variant="outline" className="w-full">
              View Solution Details
            </Button>
          </Link>
        </div>

        {/* Right area: Aligned Participants */}
        <div className="h-full">
          {activeEthos?.id && <AlignedParticipants ethosId={activeEthos.id} />}
        </div>
      </div>
    </div>
  );
}
