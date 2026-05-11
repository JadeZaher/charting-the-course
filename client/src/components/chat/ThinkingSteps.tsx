import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { ThinkingStep } from '@/hooks/use-chat';

interface ThinkingStepsProps {
  steps?: ThinkingStep[];
  isStreaming?: boolean;
}

export function ThinkingSteps({ steps, isStreaming }: ThinkingStepsProps) {
  const [visible, setVisible] = useState(true);

  // Reset visibility when new steps arrive
  useEffect(() => {
    if (steps?.length) setVisible(true);
  }, [steps?.length]);

  // Fade out after streaming ends
  useEffect(() => {
    if (!isStreaming && steps?.length) {
      const timer = setTimeout(() => setVisible(false), 800);
      return () => clearTimeout(timer);
    }
  }, [isStreaming, steps?.length]);

  if (!steps?.length || !visible) return null;

  const latest = steps[steps.length - 1];

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground transition-opacity duration-500 ${
        isStreaming ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
      <span className="italic truncate">{latest.step}</span>
    </div>
  );
}
