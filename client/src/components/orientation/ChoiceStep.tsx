import { useState } from 'react';
import type { JourneyStep } from '@/types/orientation';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  step: JourneyStep;
  onComplete: (response?: unknown) => void;
}

export function ChoiceStep({ step, onComplete }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const choices = step.choices ?? [];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{step.title}</h2>
        {step.description && (
          <p className="text-muted-foreground mt-1 text-sm">{step.description}</p>
        )}
      </div>

      <div className="space-y-2.5">
        {choices.map(choice => (
          <button
            key={choice.value}
            onClick={() => setSelected(choice.value)}
            className={cn(
              'w-full border-2 p-5 text-left transition-colors motion-reduce:transition-none',
              selected === choice.value
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/40',
            )}
          >
            <div className="flex items-start gap-3">
              {/* Radio indicator */}
              <div
                className={cn(
                  'mt-0.5 h-4 w-4 rounded-full border-2 flex-shrink-0 transition-colors',
                  selected === choice.value
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground',
                )}
              />
              <div>
                <p className="font-medium text-sm">{choice.label}</p>
                {choice.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{choice.description}</p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          disabled={step.required && !selected}
          onClick={() => onComplete({ choice: selected })}
        >
          <CheckCircle className="h-4 w-4 mr-1.5" />
          Continue
        </Button>
      </div>
    </div>
  );
}
