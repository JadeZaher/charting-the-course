import { connectionStatusLabel, connectionStatusTone, type ConnectionPhase } from '@/lib/connection-status';

const TONE_CLASS = {
  neutral: 'bg-muted-foreground',
  success: 'bg-success',
  danger: 'bg-destructive',
} as const;

/** Socket status for a thread heading. Nothing until an attempt exists; Connecting… is neutral. */
export function ConnectionStatus({
  phase,
  compact = false,
}: {
  phase: ConnectionPhase | 'idle';
  compact?: boolean;
}) {
  if (phase === 'idle') return null;
  const tone = connectionStatusTone(phase);
  return (
    <div className={compact ? 'mt-0.5 flex items-center gap-1' : 'mt-1 flex items-center gap-2'}>
      <span aria-hidden="true" className={`${compact ? 'h-1.5 w-1.5' : 'h-2 w-2'} ${TONE_CLASS[tone]}`} />
      <span role="status" className={compact ? 'text-[10px] text-muted-foreground' : 'text-xs text-muted-foreground'}>
        {connectionStatusLabel(phase)}
      </span>
    </div>
  );
}
