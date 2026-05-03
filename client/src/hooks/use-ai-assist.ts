import { useState, useCallback } from 'react';
import { aiAssist } from '@/lib/api-client';

interface UseAIAssistOptions {
  fieldLabel: string;
  fieldContext?: string;
}

export function useAIAssist({ fieldLabel, fieldContext = '' }: UseAIAssistOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (currentText: string): Promise<string | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const action = currentText.trim() ? 'improve' : 'generate';
      const result = await aiAssist({
        field_label: fieldLabel,
        field_context: fieldContext,
        current_text: currentText,
        action,
      });
      return result.text;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [fieldLabel, fieldContext]);

  return { generate, isLoading, error };
}
