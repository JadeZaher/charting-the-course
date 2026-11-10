import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useEthosDetail } from '@/hooks/useEthos';
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
import { journeyDestination, previousJourneyStep } from '@/lib/journey-routing';
import { keys } from '@/lib/query-keys';
import { useUserProgress, useSaveProgress } from '@/hooks/useOrientation';
import type { JourneyMap } from '@/types/orientation';
import { VideoStep } from '@/components/orientation/VideoStep';
import { ChoiceStep } from '@/components/orientation/ChoiceStep';
import { ConfirmationStep } from '@/components/orientation/ConfirmationStep';
import { ReflectionStep } from '@/components/orientation/ReflectionStep';
import { AIConversationStep } from '@/components/orientation/AIConversationStep';
import { SurveyStep } from '@/components/orientation/SurveyStep';
import { OmniBotPanel } from '@/components/omnibot/OmniBotPanel';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function useJourneyMap(journeyMapId?: string) {
  return useQuery({
    queryKey: keys.orientation.journeyMap(journeyMapId),
    queryFn: () => apiFetch<any>(`/api/v1/orientation/journey-maps/${journeyMapId}`),
    // The response may wrap the map; unwrap by select so the cached value stays the API response.
    select: (result): JourneyMap => (result?.map ?? result?.data ?? result) as JourneyMap,
    enabled: !!journeyMapId,
  });
}

export default function OrientationJourney() {
  const [, params] = useRoute('/orientation/:ethos_slug/journey');
  const [, navigate] = useLocation();
  const ethosSlug = params?.ethos_slug ?? '';

  const { data: ethosData, error: ethosError, refetch: refetchEthos } = useEthosDetail(ethosSlug);
  const ethos = ethosData?.ethos;
  const ethosId = ethos?.id ?? '';

  const { data: progress, isLoading: progressLoading, isFetching: progressFetching } = useUserProgress(ethosId);
  const {
    data: journeyMap,
    isLoading: mapLoading,
    error: mapError,
    refetch: refetchMap,
  } = useJourneyMap(progress?.journey_map_id);
  const saveProgress = useSaveProgress();

  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [routeError, setRouteError] = useState('');

  // Sync step index from saved progress on load
  useEffect(() => {
    if (progress?.current_step !== undefined) {
      setCurrentStepIdx(progress.current_step);
    }
  }, [progress?.current_step]);

  // Redirect to gate if no progress record found
  useEffect(() => {
    if (!progressLoading && !progressFetching && !progress && ethosId) {
      navigate(`/orientation/${ethosSlug}`);
    }
  }, [progressLoading, progressFetching, progress, ethosId, ethosSlug, navigate]);

  const steps = journeyMap?.content_sequence ?? [];
  const totalSteps = steps.length;
  // Saved progress can point past the last step (e.g. the sequence was shortened); clamp it.
  const stepIndex = totalSteps > 0 ? Math.min(Math.max(currentStepIdx, 0), totalSteps - 1) : 0;
  const currentStep = steps[stepIndex];
  const progressPct = totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0;
  const isLoading = (!ethos && !ethosError) || progressLoading || progressFetching || mapLoading;

  function handleBack() {
    if (stepIndex > 0) {
      try { setCurrentStepIdx(previousJourneyStep(steps, stepIndex, progress?.step_responses || {})); setRouteError(''); } catch (error) { setRouteError((error as Error).message); }
    }
  }

  async function handleStepComplete(response?: unknown) {
    if (!progress || !journeyMap || !currentStep) return;
    let nextIdx: number;
    try { nextIdx = journeyDestination(steps, stepIndex, response); setRouteError(''); } catch (error) { setRouteError((error as Error).message); return; }
    const isLast = nextIdx >= totalSteps;

    try {
      await saveProgress.mutateAsync({
        ethos_id: ethosId,
        journey_map_id: journeyMap.id,
        current_step: nextIdx,
        step_key: `step_${stepIndex}`,
        step_response: response,
        status: isLast ? 'complete' : 'in_progress',
      });
    } catch {
      // Error already toasted by useSaveProgress; stay on this step so the member can retry.
      return;
    }

    if (isLast) {
      navigate(`/orientation/${ethosSlug}/complete`);
    } else {
      setCurrentStepIdx(nextIdx);
    }
  }

  const omnibotCtx = {
    journey_id: journeyMap?.id,
    step_id:currentStep?.type==='ai_conversation'?`step_${stepIndex}`:undefined,
    ethos_name: ethos?.name,
    current_step: currentStep?.title,
    session_type: 'orientation' as const,
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-2 rounded-none" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-none" />
      </div>
    );
  }

  // A load failure, an empty journey, and a finished journey are distinct states with distinct copy.
  if (progress?.status === 'complete') {
    return (
      <div className="text-center py-20 space-y-3">
        <h1 className="text-2xl font-bold">Journey complete</h1>
        <p className="text-muted-foreground">
          You've finished this orientation journey.{' '}
          <Link href={`/orientation/${ethosSlug}/complete`} className="text-primary underline">
            View your orientation kit
          </Link>
        </p>
      </div>
    );
  }

  if (!progress && !ethosError) {
    // No saved progress yet: the effect above sends the member to the journey gate.
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-64 rounded-none" />
      </div>
    );
  }

  if (ethosError || mapError || !journeyMap) {
    return (
      <div className="max-w-lg mx-auto space-y-4 border border-strong-border bg-card p-8 text-center">
        <div role="alert" className="space-y-2">
          <h1 className="text-xl font-bold">We couldn't load this journey</h1>
          <p className="text-sm text-muted-foreground">
            Your saved progress is safe. Try again, or return to the ecosystem page.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => (ethosError ? refetchEthos() : refetchMap())}>Retry</Button>
          <Button variant="outline" asChild>
            <Link href={`/ethos/${ethosSlug}`}>Back to {ethos?.name ?? 'the ecosystem'}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="max-w-lg mx-auto space-y-4 border border-strong-border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">This journey has no steps yet</h1>
        <p className="text-sm text-muted-foreground">
          {journeyMap.title} doesn't have any steps to follow yet. You can choose another journey.
        </p>
        <Button variant="outline" asChild>
          <Link href={`/orientation/${ethosSlug}`}>Choose another journey</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/ethos/${ethosSlug}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              {ethos?.name}
            </Link>
          </Button>
          <span className="text-xs text-muted-foreground">
            Step {stepIndex + 1} of {totalSteps}
          </span>
        </div>
        <Progress value={progressPct} aria-label="Journey completion" className="h-1.5" />
      </div>

      {routeError && <p role="alert" className="text-destructive">{routeError}</p>}
      {/* Step card */}
      <div className="border border-strong-border bg-card p-6 sm:p-8">
        {currentStep.type === 'video' && (
          <VideoStep key={stepIndex} step={currentStep} onComplete={handleStepComplete} />
        )}
        {currentStep.type === 'choice' && (
          <ChoiceStep key={stepIndex} step={currentStep} onComplete={handleStepComplete} />
        )}
        {currentStep.type === 'confirmation' && (
          <ConfirmationStep key={stepIndex} step={currentStep} onComplete={handleStepComplete} />
        )}
        {currentStep.type === 'reflection' && (
          <ReflectionStep key={stepIndex} step={currentStep} onComplete={handleStepComplete} />
        )}
        {currentStep.type === 'ai_conversation' && (
          <AIConversationStep
            key={stepIndex}
            step={currentStep}
            context={omnibotCtx}
            onComplete={handleStepComplete}
          />
        )}
        {currentStep.type === 'survey' && (
          <SurveyStep key={stepIndex} step={currentStep} ecosystemId={ethosId} onComplete={handleStepComplete} />
        )}
      </div>

      {/* Step navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          disabled={stepIndex === 0}
          className={stepIndex === 0 ? 'invisible' : ''}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous Step
        </Button>
        <span className="text-xs text-muted-foreground">
          Step {stepIndex + 1} of {totalSteps}
        </span>
        {/* Forward navigation is handled by step completion */}
        <div className="w-[120px]" /> {/* Spacer to balance layout */}
      </div>

      {/* Floating OmniBot available on all journey pages */}
      <OmniBotPanel context={omnibotCtx} />
    </div>
  );
}
