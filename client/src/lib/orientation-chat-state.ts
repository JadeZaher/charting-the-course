import type { OmniBotMessage } from '../types/orientation';

export interface OrientationHistory {
  id: string;
  journey_id: string;
  step_id?: string | null;
  messages: OmniBotMessage[];
  turn_count: number;
  stale?: boolean;
}

export function orientationChatScope(owner: string, journey?: string, step?: string): string {
  return JSON.stringify([owner, journey || '', step || '']);
}

export function currentOrientationHistory(history: OrientationHistory | undefined, session: string | null, journey?: string, step?: string): boolean {
  return !!history && history.id === session && history.journey_id === journey && (history.step_id || '') === (step || '');
}

export function orientationReplyCount(history: OrientationHistory | undefined): number {
  if (!history || history.stale || !Number.isInteger(history.turn_count) || history.turn_count < 0) return 0;
  const actual = history.messages.filter(message => message.role === 'assistant' && message.content.trim()).length;
  return Math.min(history.turn_count, actual);
}

export interface OrientationSelection { scope: string; mode: 'resume' | 'new' | 'selected'; id: string | null }
export function orientationSession(selection: OrientationSelection, scope: string, latest?: string | null): string | null {
  if (selection.scope !== scope || selection.mode === 'resume') return latest || null;
  return selection.mode === 'new' ? null : selection.id;
}
