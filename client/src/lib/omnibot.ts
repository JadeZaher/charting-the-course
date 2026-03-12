// OmniBot API helper — calls the omnibot-chat Edge Function

import { supabase } from './supabase';
import type { OmniBotMessage, OmniBotContext } from '@/types/orientation';

export interface OmniBotResponse {
  message: OmniBotMessage;
  is_stub: boolean;
}

export async function sendOmniBotMessage(
  messages: OmniBotMessage[],
  context?: OmniBotContext,
  maxTokens = 800
): Promise<OmniBotResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await supabase.functions.invoke('omnibot-chat', {
    body: { messages, context, max_tokens: maxTokens },
  });

  if (response.error) {
    throw new Error(response.error.message || 'OmniBot request failed');
  }

  return response.data as OmniBotResponse;
}

export function buildUserProfileSummary(tiles: { dimension?: string | null; content?: Record<string, unknown> }[]): string {
  if (!tiles || tiles.length === 0) return '';
  const dims = [...new Set(tiles.map(t => t.dimension).filter(Boolean))];
  return dims.length > 0 ? `Dimensions: ${dims.join(', ')}` : '';
}
