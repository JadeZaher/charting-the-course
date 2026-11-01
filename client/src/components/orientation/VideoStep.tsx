import { useState } from 'react';
import type { JourneyStep } from '@/types/orientation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Play, CheckCircle } from 'lucide-react';
import { resolveExternalUrl, resolveMediaUrl, resolveResourceUrl } from '@/lib/media';

interface Props {
  step: JourneyStep;
  onComplete: (response?: unknown) => void;
}

function getYouTubeId(url?: string): string | null {
  const safeUrl = resolveExternalUrl(url);
  if (!safeUrl) return null;

  const parsed = new URL(safeUrl);
  const host = parsed.hostname.toLowerCase();
  let id: string | null = null;
  if (host === 'youtu.be' || host.endsWith('.youtu.be')) {
    id = parsed.pathname.split('/').filter(Boolean)[0] ?? null;
  } else if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
    id = parsed.pathname.startsWith('/embed/')
      ? parsed.pathname.split('/').filter(Boolean)[1] ?? null
      : parsed.searchParams.get('v');
  }
  return id && /^[a-z0-9_-]{11}$/i.test(id) ? id : null;
}

/** A required video gates Continue on an acknowledgement, which also covers a video that cannot load. See client/src/AGENTS.md §Orientation journeys. */
export function VideoStep({ step, onComplete }: Props) {
  const [watched, setWatched] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const ytId = getYouTubeId(step.video_url);
  const videoUrl = resolveMediaUrl(step.video_url);
  const captionsUrl = resolveResourceUrl(step.captions_url);
  const transcriptUrl = resolveResourceUrl(step.transcript_url);
  const hasTranscript = Boolean(step.transcript || transcriptUrl);
  const unavailable = !ytId && (!videoUrl || loadFailed);
  const acknowledgementId = `video-acknowledgement-${step.step}`;
  const unavailableId = `video-unavailable-${step.step}`;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{step.title}</h2>
        {step.description && (
          <p className="text-muted-foreground mt-1 text-sm">{step.description}</p>
        )}
      </div>

      {ytId ? (
        <div className="aspect-video overflow-hidden border border-strong-border bg-muted">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?rel=0`}
            title={step.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-presentation allow-same-origin allow-scripts"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
      ) : videoUrl && !loadFailed ? (
        <div className="aspect-video overflow-hidden border border-strong-border bg-muted">
          <video
            src={videoUrl}
            controls
            className="w-full h-full"
            onEnded={() => setWatched(true)}
            onError={() => setLoadFailed(true)}
          >
            {captionsUrl && (
              <track
                kind="captions"
                src={captionsUrl}
                srcLang={step.captions_language || 'en'}
                label="Captions"
                default
              />
            )}
          </video>
        </div>
      ) : (
        <div className="flex aspect-video items-center justify-center border border-strong-border bg-muted">
          <div className="max-w-sm px-4 text-center text-muted-foreground" role="status" id={unavailableId}>
            <Play className="h-12 w-12 mx-auto mb-2 opacity-30" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground">
              {videoUrl ? 'This video could not be loaded.' : 'No video is available for this step yet.'}
            </p>
            <p className="mt-1 text-sm">
              {hasTranscript ? 'You can read the transcript below and continue.' : 'You can continue without it.'}
            </p>
          </div>
        </div>
      )}

      {(step.required || ytId) && (
        <div className="flex items-start gap-3 border-2 border-strong-border bg-card p-4">
          <Checkbox
            id={acknowledgementId}
            checked={watched}
            onCheckedChange={(checked) => setWatched(checked === true)}
            aria-describedby={unavailable ? unavailableId : undefined}
          />
          <Label htmlFor={acknowledgementId} className="cursor-pointer text-sm leading-6">
            {unavailable
              ? `I'll continue without the video${hasTranscript ? ' and have read its transcript' : ''}.`
              : `I watched the video${hasTranscript ? ' or reviewed its transcript' : ''}.`}
          </Label>
        </div>
      )}

      {hasTranscript && (
        <section className="border-2 border-strong-border bg-card p-4" aria-labelledby={`video-transcript-${step.step}`}>
          <h3 id={`video-transcript-${step.step}`} className="text-sm font-black uppercase tracking-[0.12em]">
            Transcript
          </h3>
          {step.transcript && <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{step.transcript}</p>}
          {transcriptUrl && (
            <a
              href={transcriptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-link underline"
            >
              Open full transcript
            </a>
          )}
        </section>
      )}

      <div className="flex items-center justify-between">
        {!step.required && (
          <p className="text-xs text-muted-foreground">This step is optional</p>
        )}
        <Button
          className="ml-auto"
          onClick={() => onComplete(unavailable ? { watched: false, acknowledged: watched, video_unavailable: true } : { watched })}
          disabled={step.required && !watched}
        >
          <CheckCircle className="h-4 w-4 mr-1.5" aria-hidden="true" />
          {step.required && !watched ? (unavailable ? 'Confirm to continue' : 'Watch to continue') : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
