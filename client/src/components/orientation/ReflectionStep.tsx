import { useState } from 'react';
import type { JourneyStep } from '@/types/orientation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle } from 'lucide-react';

interface Props {
  step: JourneyStep;
  onComplete: (response?: unknown) => void;
}

const MIN_REQUIRED_CHARS = 20;

export function ReflectionStep({ step, onComplete }: Props) {
  const [text, setText] = useState('');
  const prompt = step.reflection_prompt ?? 'Share your thoughts on this step.';
  const canSubmit = !step.required || text.trim().length >= MIN_REQUIRED_CHARS;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{step.title}</h2>
        {step.description && (
          <p className="text-muted-foreground mt-1 text-sm">{step.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">{prompt}</p>
        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write your reflection here…"
          rows={6}
          className="resize-none"
        />
        {step.required && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Minimum {MIN_REQUIRED_CHARS} characters required</span>
            <span className={text.trim().length >= MIN_REQUIRED_CHARS ? 'text-green-600' : ''}>
              {text.trim().length} chars
            </span>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          disabled={!canSubmit}
          onClick={() => onComplete({ reflection: text.trim() })}
        >
          <CheckCircle className="h-4 w-4 mr-1.5" />
          Submit &amp; Continue
        </Button>
      </div>
    </div>
  );
}
