import { useState } from 'react';
import type { JourneyStep } from '@/types/orientation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  step: JourneyStep;
  onComplete: (response?: unknown) => void;
}

export function ConfirmationStep({ step, onComplete }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const label = step.confirmation_label ?? 'I confirm and agree to proceed.';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{step.title}</h2>
        {step.description && (
          <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{step.description}</p>
        )}
      </div>

      <label className="flex cursor-pointer select-none items-start gap-3 border border-strong-border bg-muted/30 p-5 transition-colors hover:bg-muted/50 motion-reduce:transition-none">
        <Checkbox
          checked={confirmed}
          onCheckedChange={v => setConfirmed(!!v)}
          className="mt-0.5 flex-shrink-0"
        />
        <span className="text-sm leading-relaxed">{label}</span>
      </label>

      <div className="flex justify-end">
        <Button
          disabled={step.required && !confirmed}
          onClick={() => onComplete({ confirmed })}
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
