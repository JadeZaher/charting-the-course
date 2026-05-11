import { useState } from 'react';
import { Link } from 'wouter';
import { usePermissions } from '@/hooks/usePermissions';
import { useEthosList } from '@/hooks/useEthos';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { AlignedParticipants } from '@/components/discovery/AlignedParticipants';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowUpCircle, ArrowDownCircle, ArrowRight, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchEcosystemSharesNeeds, fetchEcosystemQuizzes } from '@/lib/api-client';

interface EthosRef {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
}

function EcosystemSharesNeedsSection({ ecosystemId }: { ecosystemId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['ecosystem-shares-needs', ecosystemId],
    queryFn: () => fetchEcosystemSharesNeeds(ecosystemId),
    enabled: !!ecosystemId,
  });

  const items = data?.items ?? [];
  const shares = items.filter((i: any) => i.type === 'share');
  const needs = items.filter((i: any) => i.type === 'need');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No shares or needs posted yet.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.slice(0, 6).map((item: any) => (
        <Card key={item.id} className="hover:shadow-sm transition-shadow">
          <CardHeader className="pb-1 pt-4 px-4">
            <div className="flex items-center gap-2">
              {item.type === 'share' ? (
                <ArrowUpCircle className="h-4 w-4 text-green-500 shrink-0" />
              ) : (
                <ArrowDownCircle className="h-4 w-4 text-blue-500 shrink-0" />
              )}
              <CardTitle className="text-sm line-clamp-1">{item.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
            )}
            <div className="flex gap-1 mt-1.5">
              <Badge variant={item.type === 'share' ? 'default' : 'secondary'} className="text-xs px-1.5">
                {item.type}
              </Badge>
              {item.category && (
                <Badge variant="outline" className="text-xs px-1.5">{item.category}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      {items.length > 6 && (
        <div className="flex items-center justify-center">
          <Link href="/discover/hub">
            <Button variant="ghost" size="sm" className="gap-1">
              View all ({items.length}) <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}

function EcosystemQuizzesSection({ ecosystemId }: { ecosystemId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['ecosystem-quizzes', ecosystemId],
    queryFn: () => fetchEcosystemQuizzes(ecosystemId),
    enabled: !!ecosystemId,
  });

  const quizzes = data?.quizzes ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No quizzes available for this ecosystem.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {quizzes.slice(0, 6).map((quiz: any) => (
        <Link key={quiz.id} href={`/quizzes/${quiz.id}`}>
          <Card className="hover:shadow-sm transition-shadow cursor-pointer">
            <CardContent className="flex items-center gap-3 py-3 px-4">
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium line-clamp-1">{quiz.title}</p>
                {quiz.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{quiz.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
      {quizzes.length > 6 && (
        <div className="flex items-center justify-center">
          <Link href="/quizzes">
            <Button variant="ghost" size="sm" className="gap-1">
              View all ({quizzes.length}) <ArrowRight className="h-3 w-3" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
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

      {/* Shares & Needs for each selected ecosystem */}
      {displayRows.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Shares & Needs</h2>
          {displayRows.map(({ ethos }) => (
            <div key={ethos!.id}>
              {displayRows.length > 1 && (
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{ethos!.name}</h3>
              )}
              <EcosystemSharesNeedsSection ecosystemId={ethos!.id} />
            </div>
          ))}
        </div>
      )}

      {/* Quizzes for each selected ecosystem */}
      {displayRows.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold">Quizzes</h2>
          {displayRows.map(({ ethos }) => (
            <div key={ethos!.id}>
              {displayRows.length > 1 && (
                <h3 className="text-sm font-medium text-muted-foreground mb-2">{ethos!.name}</h3>
              )}
              <EcosystemQuizzesSection ecosystemId={ethos!.id} />
            </div>
          ))}
        </div>
      )}

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
