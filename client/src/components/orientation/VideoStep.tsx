import { useState } from 'react';
import type { JourneyStep } from '@/types/orientation';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle } from 'lucide-react';

interface Props {
  step: JourneyStep;
  onComplete: (response?: unknown) => void;
}

function getYouTubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

export function VideoStep({ step, onComplete }: Props) {
  const [watched, setWatched] = useState(false);
  const ytId = getYouTubeId(step.video_url);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{step.title}</h2>
        {step.description && (
          <p className="text-muted-foreground mt-1 text-sm">{step.description}</p>
        )}
      </div>

      {ytId ? (
        <div className="aspect-video rounded-xl overflow-hidden border bg-muted">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?rel=0`}
            title={step.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
            onLoad={() => setWatched(true)}
          />
        </div>
      ) : step.video_url ? (
        <div className="aspect-video rounded-xl overflow-hidden border bg-muted">
          <video
            src={step.video_url}
            controls
            className="w-full h-full"
            onPlay={() => setWatched(true)}
          />
        </div>
      ) : (
        <div className="aspect-video rounded-xl border bg-muted flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <Play className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No video available for this step</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        {!step.required && (
          <p className="text-xs text-muted-foreground">This step is optional</p>
        )}
        <Button
          className="ml-auto"
          onClick={() => onComplete({ watched })}
          disabled={step.required && !watched}
        >
          <CheckCircle className="h-4 w-4 mr-1.5" />
          {step.required && !watched ? 'Watch to continue' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
