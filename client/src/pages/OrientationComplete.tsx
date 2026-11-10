import { useRoute } from 'wouter';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useEthosDetail } from '@/hooks/useEthos';
import { resolveExternalUrl } from '@/lib/media';
import { API_BASE_URL } from '@/lib/api-origin';

const BASE_URL = API_BASE_URL;
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, { credentials: 'include', ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as any).error || res.statusText);
  }
  return res.json();
}
import { keys } from '@/lib/query-keys';
import { useUserProgress } from '@/hooks/useOrientation';
import type { JourneyMap } from '@/types/orientation';
import { OmniBotPanel } from '@/components/omnibot/OmniBotPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryState } from '@/components/QueryState';
import { CheckCircle, ExternalLink, Wrench, ArrowRight, Home, Scale, Vote, User } from 'lucide-react';

function useJourneyMap(journeyMapId?: string) {
  return useQuery({
    queryKey: keys.orientation.journeyMap(journeyMapId),
    queryFn: () => apiFetch<any>(`/api/v1/orientation/journey-maps/${journeyMapId}`),
    // The response may wrap the map; unwrap by select so the cached value stays the API response.
    select: (result): JourneyMap => (result?.map ?? result?.data ?? result) as JourneyMap,
    enabled: !!journeyMapId,
  });
}

export default function OrientationComplete() {
  const [, params] = useRoute('/orientation/:ethos_slug/complete');
  const ethosSlug = params?.ethos_slug ?? '';

  const ethosQuery = useEthosDetail(ethosSlug);
  const ethosData = ethosQuery.data;
  const ethos = ethosData?.ethos;
  const ethosId = ethos?.id ?? '';

  const progressQuery = useUserProgress(ethosId);
  const progress = progressQuery.data;
  const mapQuery = useJourneyMap(progress?.journey_map_id);
  const journeyMap = mapQuery.data;
  const isComplete = progress?.status === 'complete';

  const pkg = journeyMap?.exit_package;
  const safeDocs = (pkg?.docs ?? []).flatMap((doc) => {
    const url = resolveExternalUrl(doc.url);
    return url ? [{ ...doc, url }] : [];
  });
  const safeTools = (pkg?.tools ?? []).flatMap((tool) => {
    const url = resolveExternalUrl(tool.url);
    return url ? [{ ...tool, url }] : [];
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Celebration hero — only once saved progress says the journey is complete */}
      <QueryState query={ethosQuery} loading={<Skeleton className="h-56 rounded-none" />} errorTitle="We couldn't load this ecosystem">
        {() => (
          <QueryState
            query={progressQuery}
            loading={<Skeleton className="h-56 rounded-none" />}
            idle={<Skeleton className="h-56 rounded-none" />}
            errorTitle="We couldn't load your journey progress"
          >
            {() =>
              !isComplete ? (
        <div className="space-y-4 border border-strong-border bg-card p-8 text-center">
          <h1 className="text-3xl font-bold">You haven't finished this journey yet</h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            {progress
              ? 'Pick up where you left off to complete your orientation.'
              : 'Choose a journey to begin your orientation.'}
          </p>
          <Button asChild>
            <Link href={progress ? `/orientation/${ethosSlug}/journey` : `/orientation/${ethosSlug}`}>
              {progress ? 'Continue the journey' : 'Choose a journey'}
              <ArrowRight className="ml-1.5 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
              ) : (
      <div>
        <div className="space-y-4 border border-strong-border bg-card p-8 text-center">
          <div className="select-none text-6xl">
            <span role="img" aria-label="celebration">&#x1F389;</span>
          </div>
          <h1 className="text-3xl font-bold">Journey Complete!</h1>
          {ethos ? (
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              You've completed orientation for{' '}
              <span className="font-semibold text-foreground">{ethos.name}</span> and are ready to participate in governance.
              Your community is stronger with you in it.
            </p>
          ) : (
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              You've completed your orientation and are ready to participate in governance.
              Your community is stronger with you in it.
            </p>
          )}
          <Badge variant="default" className="text-sm px-3 py-1">
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Journey Complete
          </Badge>
        </div>
      </div>
              )
            }
          </QueryState>
        )}
      </QueryState>

      {/* What's Next */}
      <div className="space-y-4 mt-8">
        <h2 className="text-xl font-semibold">What's Next?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/ecosystems">
            <Card className="h-full cursor-pointer border-strong-border transition-colors hover:bg-muted/50 motion-reduce:transition-none">
              <CardContent className="p-6 text-center space-y-2">
                <Scale className="h-8 w-8 mx-auto text-primary" />
                <h3 className="font-medium">Explore Ecosystems</h3>
                <p className="text-sm text-muted-foreground">See active proposals and agreements</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/proposals/new">
            <Card className="h-full cursor-pointer border-strong-border transition-colors hover:bg-muted/50 motion-reduce:transition-none">
              <CardContent className="p-6 text-center space-y-2">
                <Vote className="h-8 w-8 mx-auto text-primary" />
                <h3 className="font-medium">Make a Proposal</h3>
                <p className="text-sm text-muted-foreground">Start the ACT process for an idea</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/me">
            <Card className="h-full cursor-pointer border-strong-border transition-colors hover:bg-muted/50 motion-reduce:transition-none">
              <CardContent className="p-6 text-center space-y-2">
                <User className="h-8 w-8 mx-auto text-primary" />
                <h3 className="font-medium">Set Up Your Profile</h3>
                <p className="text-sm text-muted-foreground">Tell the community about yourself</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Exit package contents; a failed load says so rather than silently omitting the resources */}
      <QueryState query={mapQuery} loading={<div className="space-y-4"><Skeleton className="h-36 rounded-none" /><Skeleton className="h-36 rounded-none" /></div>} errorTitle="We couldn't load your orientation resources">
        {() => pkg ? (
        <>
          {/* Key docs */}
          {safeDocs.length > 0 && (
            <div className="border border-strong-border bg-card p-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                Key Resources
              </h2>
              <ul className="space-y-2">
                {safeDocs.map((doc, i) => (
                  <li key={i}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
                      {doc.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tools & platforms */}
          {safeTools.length > 0 && (
            <div className="border border-strong-border bg-card p-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                <Wrench className="h-4 w-4" />
                Tools &amp; Platforms
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {safeTools.map((tool, i) => (
                  <a
                    key={i}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2.5 border border-strong-border bg-muted/30 p-4 transition-colors hover:bg-muted/50 motion-reduce:transition-none"
                  >
                    <Wrench className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tool.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{tool.description}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Next steps */}
          {pkg.next_steps && pkg.next_steps.length > 0 && (
            <div className="border border-primary bg-primary/5 p-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                <ArrowRight className="h-4 w-4" />
                Your Next Steps
              </h2>
              <ol className="space-y-2.5">
                {pkg.next_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center bg-primary text-xs font-bold text-primary-foreground">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
        ) : null}
      </QueryState>

      {/* Navigation CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button variant="outline" asChild>
          <Link href="/discover">
            <Home className="h-4 w-4 mr-1.5" />
            Browse More ETHOS
          </Link>
        </Button>
        {ethos && (
          <Button asChild>
            <Link href={`/ethos/${ethosSlug}`}>
              Visit {ethos.name}
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      {/* Floating OmniBot for post-orientation Q&A */}
      <OmniBotPanel
        context={{
          journey_id: journeyMap?.id,
          ethos_name: ethos?.name,
          session_type: 'ongoing',
        }}
      />
    </div>
  );
}
