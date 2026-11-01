import { useState } from 'react';
import { useRoute, useLocation, useSearch } from 'wouter';
import { Link } from 'wouter';
import { useDetectPath, useRecommendJourney, useUserProgress, useSaveProgress } from '@/hooks/useOrientation';
import { useEthosDetail } from '@/hooks/useEthos';
import { useRequestJoinEcosystem } from '@/hooks/use-governance';
import { useAuth } from '@/contexts/AuthContext';
import { holdsMembershipIn, joinThen } from '@/lib/ecosystem-join';
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
  // ?journey=<id> (from the ethos page "Begin <title>" links) preselects that journey.
  const requestedJourneyId = new URLSearchParams(useSearch()).get('journey');

  const { data: ethosData, isLoading: ethosLoading } = useEthosDetail(ethosSlug);
  const ethos = ethosData?.ethos;
  const ethosId = ethos?.id ?? '';

  const { data: pathData, isLoading: pathLoading } = useDetectPath(ethosId);
  const { data: recData, isLoading: recLoading } = useRecommendJourney(ethosId);
  const { data: existingProgress, isLoading: progressLoading } = useUserProgress(ethosId);
  const saveProgress = useSaveProgress();
  const { ecosystems } = useAuth();
  const join = useRequestJoinEcosystem(ethosId);
  // Progress is stored on the member row in this ecosystem, so a non-member joins first (api/AGENTS.md "Join-first").
  const isMember = holdsMembershipIn(ethosId, ecosystems);
  const isStarting = join.isPending || saveProgress.isPending;

  const [selectedMap, setSelectedMap] = useState<JourneyMap | null>(null);

  // Include progressLoading so skeletons stay up until we know if already completed
  const isLoading = ethosLoading || pathLoading || recLoading || progressLoading;
  const allMaps: JourneyMap[] = recData
    ? [recData.recommended, ...recData.alternatives].filter(m => m && m.id)
    : [];
  const chosen =
    selectedMap ??
    allMaps.find(map => map.id === requestedJourneyId) ??
    (allMaps.length > 0 ? allMaps[0] : null);

  async function handleStart() {
    if (!chosen || !ethosId) return;
    try {
      await joinThen(
        () => saveProgress.mutateAsync({
          ethos_id: ethosId,
          journey_map_id: chosen.id,
          current_step: 0,
          status: 'in_progress',
          orientation_path: pathData?.path ?? 'explorer',
          was_recommended: chosen.id === recData?.recommended?.id,
        }),
        { isMember, join: () => join.mutateAsync() },
      );
    } catch {
      return; // The join or useSaveProgress already toasted the failure; stay on the picker.
    }
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
          <Skeleton className="h-16 rounded-none" />
          <Skeleton className="h-24 rounded-none" />
          <Skeleton className="h-24 rounded-none" />
        </div>
      )}

      {/* Path detection summary */}
      {!isLoading && pathData && (
        <div className="flex items-start gap-3 border border-strong-border bg-muted/40 p-5">
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
        <div className="border border-strong-border py-12 text-center text-muted-foreground">
          No orientation journeys are available for this ETHOS yet.
        </div>
      )}

      {/* Start CTA */}
      {!isLoading && !isMember && (
        <p id="orientation-join-note" className="border-l-4 border-strong-border pl-4 text-sm leading-6 text-muted-foreground">
          You are not a member of {ethos?.name ?? 'this ecosystem'} yet. Starting a journey asks to join it. If it asks
          newcomers to consent to its agreements first, your membership waits for that consent.
        </p>
      )}
      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={!chosen || isStarting}
          onClick={handleStart}
          aria-describedby={!isLoading && !isMember ? 'orientation-join-note' : undefined}
        >
          {join.isPending ? 'Joining…' : saveProgress.isPending ? 'Starting…' : isMember ? 'Start Journey' : 'Join and start journey'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
