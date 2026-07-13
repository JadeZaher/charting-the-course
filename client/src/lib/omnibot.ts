// OmniBot API helper — calls the Sanic BFF API

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
  // TODO: Replace with the Sanic BFF omnibot endpoint when implemented
  // Placeholder: returns a stub response so existing UI compiles and renders
  console.warn('OmniBot: Sanic API endpoint not yet implemented, returning stub response.');
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
