import { useRoute } from 'wouter';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEthosDetail } from '@/hooks/useEthos';
import { useUserProgress } from '@/hooks/useOrientation';
import type { JourneyMap } from '@/types/orientation';
import { OmniBotPanel } from '@/components/omnibot/OmniBotPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, ExternalLink, Wrench, ArrowRight, Home } from 'lucide-react';

function useJourneyMap(journeyMapId?: string) {
  return useQuery({
    queryKey: ['journey-map', journeyMapId],
    queryFn: async () => {
      if (!journeyMapId) return null;
      const { data, error } = await supabase
        .from('journey_maps')
        .select('*')
        .eq('id', journeyMapId)
        .single();
      if (error) throw error;
      return data as JourneyMap;
    },
    enabled: !!journeyMapId,
  });
}

export default function OrientationComplete() {
  const [, params] = useRoute('/orientation/:ethos_slug/complete');
  const ethosSlug = params?.ethos_slug ?? '';

  const { data: ethosData, isLoading: ethosLoading } = useEthosDetail(ethosSlug);
  const ethos = ethosData?.ethos;
  const ethosId = ethos?.id ?? '';

  const { data: progress } = useUserProgress(ethosId);
  const { data: journeyMap, isLoading: mapLoading } = useJourneyMap(progress?.journey_map_id);

  const pkg = journeyMap?.exit_package;
  const isLoading = ethosLoading || mapLoading;

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-16">
      {/* Celebration hero */}
      <div className="text-center py-10 space-y-4">
        <div className="text-5xl select-none">🎉</div>
        <h1 className="text-3xl font-bold">Orientation Complete!</h1>
        {ethos && (
          <p className="text-muted-foreground">
            You've completed orientation for{' '}
            <span className="font-semibold text-foreground">{ethos.name}</span>.
          </p>
        )}
        <Badge variant="default" className="text-sm px-3 py-1">
          <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
          Journey Complete
        </Badge>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      )}

      {/* Exit package contents */}
      {!isLoading && pkg && (
        <>
          {/* Key docs */}
          {pkg.docs && pkg.docs.length > 0 && (
            <div className="border rounded-xl p-5 bg-card">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                <ExternalLink className="h-4 w-4" />
                Key Resources
              </h2>
              <ul className="space-y-2">
                {pkg.docs.map((doc, i) => (
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
          {pkg.tools && pkg.tools.length > 0 && (
            <div className="border rounded-xl p-5 bg-card">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                <Wrench className="h-4 w-4" />
                Tools &amp; Platforms
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {pkg.tools.map((tool, i) => (
                  <a
                    key={i}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2.5 p-3 rounded-lg border bg-muted/30 hover:border-primary/40 hover:bg-muted/50 transition-colors"
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
            <div className="border rounded-xl p-5 bg-primary/5">
              <h2 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                <ArrowRight className="h-4 w-4" />
                Your Next Steps
              </h2>
              <ol className="space-y-2.5">
                {pkg.next_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </>
      )}

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
          ethos_name: ethos?.name,
          session_type: 'ongoing',
        }}
      />
    </div>
  );
}
