// Reply modes belong to individual turns; see client/src/AGENTS.md "Assistant drawer".
export type ChatRouteMode = 'skill' | 'platform' | 'framework' | 'general';
export type ChatRouteSource = 'decision' | 'manual' | 'fallback' | 'transition';
export interface ChatRoute { mode: ChatRouteMode; skill: string | null; source: ChatRouteSource }

const MODES: readonly string[] = ['skill', 'platform', 'framework', 'general'];
const SOURCES: readonly string[] = ['decision', 'manual', 'fallback', 'transition'];

export function readChatRoute(value: unknown): ChatRoute | null {
  if (!value || typeof value !== 'object') return null;
  const route = value as Partial<ChatRoute>;
  if (!MODES.includes(route.mode ?? '') || !SOURCES.includes(route.source ?? '')) return null;
  if (route.mode === 'skill') {
    if (typeof route.skill !== 'string' || !/^[a-z0-9][a-z0-9-]{0,99}$/.test(route.skill)) return null;
  } else if (route.skill !== null) return null;
  return route as ChatRoute;
}

export function chatRouteLabel(route: ChatRoute): string {
  if (route.source === 'transition' && route.mode === 'general') return 'Process complete';
  if (route.mode === 'platform') return 'Platform help';
  if (route.mode === 'framework') return 'Governance guide';
  if (route.mode === 'general') return 'General help';
  const words = (route.skill ?? '').replace(/-/g, ' ');
  return `Guided process: ${words.charAt(0).toUpperCase()}${words.slice(1)}`;
}

interface RoutedMessage { role: 'user' | 'assistant'; skill?: string; routing?: ChatRoute }

export function applyChatRoute<T extends RoutedMessage>(messages: readonly T[], route: ChatRoute): T[] {
  const updated = [...messages];
  const last = updated[updated.length - 1];
  if (last?.role === 'assistant') updated[updated.length - 1] = { ...last, routing: route, skill: route.skill ?? undefined };
  return updated;
}

export function conversationLimit(messages: readonly { role: string }[], maximum: number) {
  const userCount = messages.filter(message => message.role === 'user').length;
  return { userCount, reached: userCount >= maximum };
}
