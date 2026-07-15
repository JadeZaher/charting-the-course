// OmniBot API helper — see "OmniBot" section in client/src/AGENTS.md for why this is a stub

import type { OmniBotMessage, OmniBotContext } from '@/types/orientation';

export interface OmniBotResponse {
  message: OmniBotMessage;
  is_stub: boolean;
}

const BASE_URL = import.meta.env.VITE_API_URL || '';

export async function sendOmniBotMessage(
  messages: OmniBotMessage[],
  context?: OmniBotContext,
  maxTokens = 800
): Promise<OmniBotResponse> {
  // Stub: the governance chat endpoint (/api/v1/chat/send) is tool-driven and
  // session-listed, not a clean fit for orientation Q&A — see client/src/AGENTS.md.
  // Always returns a stub reply; UI callers must branch on `is_stub`.
  return {
    message: {
      role: 'assistant',
      content: 'OmniBot is not yet connected to the Sanic API. Please check back later.',
    } as OmniBotMessage,
    is_stub: true,
  };
}

export function buildUserProfileSummary(tiles: { dimension?: string | null; content?: Record<string, unknown> }[]): string {
  if (!tiles || tiles.length === 0) return '';
  const dimensions = tiles
    .map((tile) => tile.dimension)
    .filter((dimension): dimension is string => Boolean(dimension));
  const dims = Array.from(new Set(dimensions));
  return dims.length > 0 ? `Dimensions: ${dims.join(', ')}` : '';
}
