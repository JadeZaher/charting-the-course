import { useState } from 'react';
import { Link } from 'wouter';
import { usePermissions } from '@/hooks/usePermissions';
import { useEthosList } from '@/hooks/useEthos';
import { useEcosystem } from '@/contexts/EcosystemContext';
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

export default function Discover() {
  const { selectedIds, ecosystems: selectedEcosystems, isAll } = useEcosystem();
  const { isAdmin, isLoading: permLoading } = usePermissions();
  const [adminSelectedEthosId, setAdminSelectedEthosId] = useState<string>('');

  // Admin: fetch all ETHOS for dropdown selector
  const { data: allEthosData } = useEthosList(undefined, 100, 0);

  // Derive access rows from ALL selected ecosystems (not just one)
  const allEthosList = allEthosData?.ethos ?? [];
  const accessRows = selectedIds
    .map((ecoId) => ({
      ethos_id: ecoId,
      ethos: (allEthosList.find(e => e.id === ecoId) as unknown as EthosRef) ?? null,
    }))
    .filter(row => row.ethos !== null);

  if (permLoading) {
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
        <h1 className="text-2xl font-bold">My Solutions</h1>
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">You haven't been matched to a Solution yet.</p>
        </div>
      </div>
    );
  }

  // Admin mode: allow selecting any ethos
  const ethosListForAdmin = allEthosList as unknown as EthosRef[];
  const displayRows = isAdmin
    ? (adminSelectedEthosId
        ? [{ ethos_id: adminSelectedEthosId, ethos: ethosListForAdmin.find(e => e.id === adminSelectedEthosId) ?? null }]
        : ethosListForAdmin.map(e => ({ ethos_id: e.id, ethos: e }))
      ).filter(row => row.ethos !== null)
    : accessRows;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">
          {displayRows.length === 1 ? displayRows[0].ethos?.name : 'My Solutions'}
        </h1>
        {isAdmin && ethosListForAdmin.length > 1 && (
          <Select
            value={adminSelectedEthosId || 'all'}
            onValueChange={(v) => setAdminSelectedEthosId(v === 'all' ? '' : v)}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="All Solutions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Solutions</SelectItem>
              {ethosListForAdmin.map(e => (
                <SelectItem key={e.id} value={e.id}>
                  {e.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {displayRows.map(({ ethos }) => (
          <div key={ethos!.id} className="rounded-lg border p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-semibold">{ethos!.name}</h2>
              {ethos!.tagline && (
                <p className="text-muted-foreground mt-1">{ethos!.tagline}</p>
              )}
            </div>
            <Link href={`/ethos/${ethos!.slug}/detail`}>
              <Button variant="outline" className="w-full">
                View Solution Details
              </Button>
            </Link>
          </div>
        ))}
      </div>

      {/* Aligned Participants for each selected ecosystem */}
      {displayRows.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Aligned Participants</h2>
          {displayRows.map(({ ethos }) => (
            <div key={ethos!.id}>
              {displayRows.length > 1 && (
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{ethos!.name}</h3>
              )}
              <AlignedParticipants ethosId={ethos!.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
