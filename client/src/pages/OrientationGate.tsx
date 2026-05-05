import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Link } from 'wouter';
import { useDetectPath, useRecommendJourney, useUserProgress, useSaveProgress } from '@/hooks/useOrientation';
import { useEthosDetail } from '@/hooks/useEthos';
import { JourneyMapCard } from '@/components/orientation/JourneyMapCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, Info } from 'lucide-react';
import type { JourneyMap } from '@/types/orientation';

export default function OrientationGate() {
  const [, params] = useRoute('/orientation/:ethos_slug');
  const [, navigate] = useLocation();
  const ethosSlug = params?.ethos_slug ?? '';

  const { data: ethosData, isLoading: ethosLoading } = useEthosDetail(ethosSlug);
  const ethos = ethosData?.ethos;
  const ethosId = ethos?.id ?? '';

  const { data: pathData, isLoading: pathLoading } = useDetectPath(ethosId);
  const { data: recData, isLoading: recLoading } = useRecommendJourney(ethosId);
  const { data: existingProgress, isLoading: progressLoading } = useUserProgress(ethosId);
  const saveProgress = useSaveProgress();

  const [selectedMap, setSelectedMap] = useState<JourneyMap | null>(null);

  // Include progressLoading so skeletons stay up until we know if already completed
  const isLoading = ethosLoading || pathLoading || recLoading || progressLoading;
  const allMaps: JourneyMap[] = recData
    ? [recData.recommended, ...recData.alternatives].filter(m => m && m.id)
    : [];
  const chosen = selectedMap ?? (allMaps.length > 0 ? allMaps[0] : null);

  async function handleStart() {
    if (!chosen || !ethosId) return;
    await saveProgress.mutateAsync({
      ethos_id: ethosId,
      journey_map_id: chosen.id,
      current_step: 0,
      status: 'in_progress',
      orientation_path: pathData?.path ?? 'explorer',
      was_recommended: chosen.id === recData?.recommended?.id,
    });
    navigate(`/orientation/${ethosSlug}/journey`);
  }

  // Already completed — show shortcut
  if (existingProgress?.status === 'complete') {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold">You've completed orientation!</h1>
        <p className="text-muted-foreground">
          You've already completed orientation for{' '}
          <span className="font-semibold text-foreground">{ethos?.name ?? ethosSlug}</span>.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button variant="outline" asChild>
            <Link href={`/ethos/${ethosSlug}`}>Back to ETHOS</Link>
          </Button>
          <Button onClick={() => navigate(`/orientation/${ethosSlug}/complete`)}>
            View Orientation Kit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          <Link href={`/ethos/${ethosSlug}`} className="hover:underline">
            {ethos?.name ?? ethosSlug}
          </Link>
          {' → '}Orientation
        </p>
        <h1 className="text-2xl font-bold">Choose Your Journey</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Select the orientation path that fits your goals and background.
        </p>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      )}

      {/* Path detection summary */}
      {!isLoading && pathData && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/40 border">
          <Info className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-medium mb-1.5 flex items-center gap-2 flex-wrap">
              <span>Your detected path:</span>
              <Badge variant={pathData.path === 'ready' ? 'default' : 'secondary'}>
                {pathData.path === 'ready' ? '⚡ Ready to Join' : '🔭 Explorer'}
              </Badge>
            </div>
            {pathData.signals && pathData.signals.length > 0 && (
              <ul className="text-xs text-muted-foreground space-y-0.5">
                {pathData.signals.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Journey map selection */}
      {!isLoading && allMaps.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Select a Journey
          </h2>
          {allMaps.map(map => (
            <JourneyMapCard
              key={map.id}
              map={map}
              isRecommended={map.id === recData?.recommended?.id}
              misalignmentFlags={
                map.id === recData?.recommended?.id
                  ? recData?.misalignment_flags
                  : undefined
              }
              isSelected={chosen?.id === map.id}
              onSelect={() => setSelectedMap(map)}
            />
          ))}
        </div>
      )}

      {/* No journeys available */}
      {!isLoading && allMaps.length === 0 && (
        <div className="text-center py-12 text-muted-foreground border rounded-xl">
          No orientation journeys are available for this ETHOS yet.
        </div>
      )}

      {/* Start CTA */}
      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={!chosen || saveProgress.isPending}
          onClick={handleStart}
        >
          {saveProgress.isPending ? 'Starting…' : 'Start Journey'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
