// The messaging socket's first paint. "Disconnected" is a failed or dropped attempt, not the moment before it starts.

export type ConnectionPhase = 'connecting' | 'connected' | 'disconnected';

export type ConnectionEvent = 'start' | 'open' | 'failure';

/**
 * `start` begins an attempt. The first one stays connecting until it opens or fails.
 * A later attempt after a failure stays disconnected until it actually opens,
 * so a retry does not hide the failure. A start while connected is a new attempt.
 */
export function connectionPhase(phase: ConnectionPhase, event: ConnectionEvent): ConnectionPhase {
  if (event === 'open') return 'connected';
  if (event === 'failure') return 'disconnected';
  return phase === 'disconnected' ? 'disconnected' : 'connecting';
}

export function connectionStatusLabel(phase: ConnectionPhase): 'Connecting…' | 'Connected' | 'Disconnected' {
  if (phase === 'connecting') return 'Connecting…';
  if (phase === 'connected') return 'Connected';
  return 'Disconnected';
}

export function connectionStatusTone(phase: ConnectionPhase): 'neutral' | 'success' | 'danger' {
  if (phase === 'connecting') return 'neutral';
  if (phase === 'connected') return 'success';
  return 'danger';
}
