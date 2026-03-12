import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEthosDetail } from '@/hooks/useEthos';
import { useUserProgress, useSaveProgress } from '@/hooks/useOrientation';
import type { JourneyMap } from '@/types/orientation';
import { VideoStep } from '@/components/orientation/VideoStep';
import { ChoiceStep } from '@/components/orientation/ChoiceStep';
import { ConfirmationStep } from '@/components/orientation/ConfirmationStep';
import { ReflectionStep } from '@/components/orientation/ReflectionStep';
import { AIConversationStep } from '@/components/orientation/AIConversationStep';
import { OmniBotPanel } from '@/components/omnibot/OmniBotPanel';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

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

export default function OrientationJourney() {
  const [, params] = useRoute('/orientation/:ethos_slug/journey');
  const [, navigate] = useLocation();
  const ethosSlug = params?.ethos_slug ?? '';

  const { data: ethosData } = useEthosDetail(ethosSlug);
  const ethos = ethosData?.ethos;
  const ethosId = ethos?.id ?? '';

  const { data: progress, isLoading: progressLoading } = useUserProgress(ethosId);
  const { data: journeyMap, isLoading: mapLoading } = useJourneyMap(progress?.journey_map_id);
  const saveProgress = useSaveProgress();

  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Sync step index from saved progress on load
  useEffect(() => {
    if (progress?.current_step !== undefined) {
      setCurrentStepIdx(progress.current_step);
    }
  }, [progress?.current_step]);

  // Redirect to gate if no progress record found
  useEffect(() => {
    if (!progressLoading && !progress && ethosId) {
      navigate(`/orientation/${ethosSlug}`);
    }
  }, [progressLoading, progress, ethosId, ethosSlug, navigate]);

  const steps = journeyMap?.content_sequence ?? [];
  const totalSteps = steps.length;
  const currentStep = steps[currentStepIdx];
  const progressPct = totalSteps > 0 ? Math.round((currentStepIdx / totalSteps) * 100) : 0;
  const isLoading = progressLoading || mapLoading || !ethos;

  async function handleStepComplete(response?: unknown) {
    if (!progress || !journeyMap) return;
    const nextIdx = currentStepIdx + 1;
    const isLast = nextIdx >= totalSteps;

    await saveProgress.mutateAsync({
      ethos_id: ethosId,
      journey_map_id: journeyMap.id,
      current_step: nextIdx,
      step_key: `step_${currentStepIdx}`,
      step_response: response,
      status: isLast ? 'complete' : 'in_progress',
    });

    if (isLast) {
      navigate(`/orientation/${ethosSlug}/complete`);
    } else {
      setCurrentStepIdx(nextIdx);
    }
  }

  const omnibotCtx = {
    ethos_name: ethos?.name,
    current_step: currentStep?.title,
    session_type: 'orientation' as const,
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-2 rounded-full" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (!currentStep) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-muted-foreground">
          Journey complete or no steps found.{' '}
          <Link href={`/orientation/${ethosSlug}/complete`} className="text-primary underline">
            View your orientation kit
          </Link>
        </p>
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
            Step {currentStepIdx + 1} of {totalSteps}
          </span>
        </div>
        <Progress value={progressPct} className="h-1.5" />
      </div>

      {/* Step card */}
      <div className="border rounded-2xl bg-card p-6 sm:p-8 shadow-sm">
        {currentStep.type === 'video' && (
          <VideoStep step={currentStep} onComplete={handleStepComplete} />
        )}
        {currentStep.type === 'choice' && (
          <ChoiceStep step={currentStep} onComplete={handleStepComplete} />
        )}
        {currentStep.type === 'confirmation' && (
          <ConfirmationStep step={currentStep} onComplete={handleStepComplete} />
        )}
        {currentStep.type === 'reflection' && (
          <ReflectionStep step={currentStep} onComplete={handleStepComplete} />
        )}
        {currentStep.type === 'ai_conversation' && (
          <AIConversationStep
            step={currentStep}
            context={omnibotCtx}
            onComplete={handleStepComplete}
          />
        )}
      </div>

      {/* Floating OmniBot available on all journey pages */}
      <OmniBotPanel context={omnibotCtx} />
    </div>
  );
}
