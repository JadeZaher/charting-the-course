import { cn } from '@/lib/utils';
import { Check, MessageSquare, ShieldCheck, FlaskConical, Award, FileText, Ban } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface ACTStepperProps {
  currentStatus: string;
}

const STEPS = [
  {
    key: 'draft',
    label: 'Draft',
    icon: FileText,
    description: 'Proposal is being written and refined before opening for community input.',
  },
  {
    key: 'advice',
    label: 'Advice',
    icon: MessageSquare,
    description: 'Gathering wisdom from people affected by this proposal. All perspectives welcome.',
  },
  {
    key: 'consent',
    label: 'Consent',
    icon: ShieldCheck,
    description: 'Not "do you agree?" but "can you live with this?" Objections improve the proposal.',
  },
  {
    key: 'test',
    label: 'Test',
    icon: FlaskConical,
    description: 'Try it in practice with defined success criteria. Measure, learn, adapt.',
  },
  {
    key: 'ratified',
    label: 'Ratified',
    icon: Award,
    description: 'This proposal has passed through the full ACT process and is now active policy.',
  },
];

export function ACTStepper({ currentStatus }: ACTStepperProps) {
  const isTerminal = ['withdrawn', 'archived'].includes(currentStatus);
  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="w-full">
      {/* Desktop horizontal stepper */}
      <div className="hidden sm:flex items-center justify-between relative">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = !isTerminal && currentIndex > index;
          const isCurrent = !isTerminal && currentIndex === index;
          const isFuture = isTerminal || currentIndex < index;

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center relative z-10">
                    <div
                      className={cn(
                        'flex items-center justify-center rounded-full border-2 transition-all duration-300',
                        isCompleted && 'h-10 w-10 bg-primary border-primary text-primary-foreground',
                        isCurrent && 'h-12 w-12 bg-primary/10 border-primary text-primary animate-pulse',
                        isFuture && 'h-10 w-10 bg-muted border-muted-foreground/25 text-muted-foreground',
                        isTerminal && 'h-10 w-10 bg-muted border-muted-foreground/25 text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-5 w-5" />
                      ) : (
                        <Icon className={cn('h-5 w-5', isCurrent && 'h-6 w-6')} />
                      )}
                    </div>
                    <span
                      className={cn(
                        'text-xs mt-2 font-medium',
                        isCompleted && 'text-primary',
                        isCurrent && 'text-primary font-semibold',
                        isFuture && 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p>{step.description}</p>
                </TooltipContent>
              </Tooltip>

              {/* Connector line */}
              {index < STEPS.length - 1 && (
                <div className="flex-1 mx-2 mt-[-1.25rem]">
                  <div
                    className={cn(
                      'h-0.5 w-full transition-colors duration-300',
                      !isTerminal && currentIndex > index
                        ? 'bg-primary'
                        : 'bg-muted-foreground/25'
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile vertical compact stepper */}
      <div className="sm:hidden flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = !isTerminal && currentIndex > index;
          const isCurrent = !isTerminal && currentIndex === index;

          return (
            <div key={step.key} className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5">
                    <div
                      className={cn(
                        'flex items-center justify-center rounded-full border-2 shrink-0',
                        isCompleted && 'h-7 w-7 bg-primary border-primary text-primary-foreground',
                        isCurrent && 'h-8 w-8 bg-primary/10 border-primary text-primary',
                        !isCompleted && !isCurrent && 'h-7 w-7 bg-muted border-muted-foreground/25 text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </div>
                    {isCurrent && (
                      <span className="text-xs font-semibold text-primary whitespace-nowrap">
                        {step.label}
                      </span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">{step.label}</p>
                  <p className="text-xs">{step.description}</p>
                </TooltipContent>
              </Tooltip>

              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'w-4 h-0.5 shrink-0',
                    !isTerminal && currentIndex > index
                      ? 'bg-primary'
                      : 'bg-muted-foreground/25'
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Terminal state indicator */}
      {isTerminal && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Ban className="h-4 w-4" />
          <span>
            This proposal has been{' '}
            <span className="font-medium">{currentStatus}</span>.
          </span>
        </div>
      )}
    </div>
  );
}
