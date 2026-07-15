import { useState, useCallback } from 'react';
import { aiAssist } from '@/lib/api-client';

interface UseAIAssistOptions {
  fieldLabel: string;
  fieldContext?: string;
}

const FALLBACK_MESSAGE = 'AI assist is unavailable right now — you can keep writing manually.';

// Backend/network failures we degrade to a friendly message; validation errors pass through as-is.
function isDegradedAIError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('ai service') ||
    lower.includes('service unavailable') ||
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('load failed') ||
    lower.includes('network request failed')
  );
}

export function useAIAssist({ fieldLabel, fieldContext = '' }: UseAIAssistOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (currentText: string, userPrompt?: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const action = currentText.trim() ? 'improve' : 'generate';
      const trimmedPrompt = userPrompt?.trim();
      const result = await aiAssist({
        field_label: fieldLabel,
        field_context: fieldContext,
        current_text: currentText,
        action,
        ...(trimmedPrompt ? { user_prompt: trimmedPrompt } : {}),
      });
      return result.text;
    } catch (err) {
      const message = (err as Error).message || 'Something went wrong';
      setError(isDegradedAIError(message) ? FALLBACK_MESSAGE : message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fieldLabel, fieldContext]);

  return { generate, isLoading, error };
}
