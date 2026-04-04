import { useRoute, useLocation } from 'wouter';
import { Link } from 'wouter';
import { useEthosDetail } from '@/hooks/useEthos';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ArrowRight, ExternalLink, Users, Map } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const BASE_URL = import.meta.env.VITE_API_URL || '';
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as any).error || res.statusText);
  }
  return res.json();
}

export default function EthosDetail() {
  const [, params] = useRoute('/ethos/:slug');
  const [, navigate] = useLocation();
  const slug = params?.slug ?? '';

  const { data, isLoading, isError } = useEthosDetail(slug);

  const ethosId = data?.ethos?.id;
  const { data: journeyMaps = [] } = useQuery({
    queryKey: ['ethos-journey-maps', ethosId],
    queryFn: async () => {
      const result = await apiFetch<any>(`/api/v1/ecosystems/${ethosId}/journey-maps?is_active=true`);
      return result?.maps || result?.items || [];
    },
    enabled: !!ethosId,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-muted-foreground">ETHOS not found.</p>
        <Link href="/discover" className="text-primary underline text-sm">
          Browse all ETHOS
        </Link>
      </div>
    );
  }

  const { ethos, members, viewer_alignment } = data;
  const alignScore = ethos.alignment_score ?? viewer_alignment ?? null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Back navigation */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/discover">
          <ArrowLeft className="h-4 w-4 mr-1" />
          All ETHOS
        </Link>
      </Button>

      {/* Hero card */}
      <div className="rounded-2xl overflow-hidden border bg-card shadow-sm">
        <div className="h-44 bg-gradient-to-br from-primary/30 via-primary/10 to-muted relative flex items-center justify-center">
          {ethos.image_url ? (
            <img src={ethos.image_url} alt={ethos.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-7xl font-black text-primary/20 select-none">
              {ethos.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          {ethos.sector && (
            <Badge className="absolute top-3 left-3 capitalize">{ethos.sector}</Badge>
          )}
          {alignScore !== null && (
            <div className="absolute top-3 right-3 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-bold shadow">
              {alignScore}% aligned
            </div>
          )}
        </div>

        <div className="p-6">
          <h1 className="text-2xl font-bold mb-1">{ethos.name}</h1>
          {ethos.tagline && (
            <p className="text-muted-foreground mb-4 text-sm">{ethos.tagline}</p>
          )}

          <div className="flex flex-wrap gap-2 mb-5">
            <Badge variant="secondary" className="capitalize">{ethos.ethos_type}</Badge>
            {ethos.is_active && (
              <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
            )}
          </div>

          {ethos.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{ethos.description}</p>
          )}
        </div>
      </div>

      {/* Mission */}
      {ethos.mission && (
        <div className="border rounded-xl p-5 bg-muted/30">
          <h2 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
            Mission
          </h2>
          <p className="text-sm leading-relaxed">{ethos.mission}</p>
        </div>
      )}

      {/* Members grid */}
      {members.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">
              Members
              <span className="text-muted-foreground font-normal ml-1.5">({members.length})</span>
            </h2>
          </div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {members.map(m => (
              <Link key={m.user_id} href={m.profile_url}>
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
                  <Avatar className="h-9 w-9 flex-shrink-0">
                    <AvatarImage src={m.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {m.display_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.display_name}</p>
                    {m.role_in_ethos && (
                      <p className="text-xs text-muted-foreground truncate">{m.role_in_ethos}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* External URL */}
      {ethos.external_url && (
        <a
          href={ethos.external_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Visit external site
        </a>
      )}

      {/* Journey Maps */}
      {journeyMaps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Map className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Journey Maps</h2>
          </div>
          <div className="space-y-2.5">
            {journeyMaps.map((map: any) => (
              <div key={map.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/40 transition-all">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{map.title}</p>
                  {map.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{map.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{map.step_count} step{map.step_count !== 1 ? 's' : ''}</p>
                </div>
                <Button size="sm" className="ml-4 flex-shrink-0" onClick={() => navigate(`/orientation/${slug}`)}>
                  Begin Journey
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Begin orientation CTA */}
      <div className="flex justify-end pt-2">
        <Button size="lg" onClick={() => navigate(`/orientation/${slug}`)}>
          Begin Orientation
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
