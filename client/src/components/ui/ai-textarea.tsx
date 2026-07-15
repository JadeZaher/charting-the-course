import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAIAssist } from '@/hooks/use-ai-assist';
import { Sparkles, Loader2, MessageSquarePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AITextareaProps extends Omit<React.ComponentProps<typeof Textarea>, 'value' | 'onChange'> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  fieldLabel: string;
  fieldContext?: string;
}

const AITextarea = React.forwardRef<HTMLTextAreaElement, AITextareaProps>(
  ({ value, onChange, fieldLabel, fieldContext, className, ...props }, ref) => {
    const { generate, isLoading, error } = useAIAssist({ fieldLabel, fieldContext });
    const [guidance, setGuidance] = React.useState('');
    const [guidanceOpen, setGuidanceOpen] = React.useState(false);
    const guidanceInputId = React.useId();
    const hasGuidance = guidance.trim().length > 0;

    const handleAIAssist = async () => {
      const result = await generate(value, guidance);
      if (result !== null) {
        const syntheticEvent = {
          target: { value: result },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div>
        <Textarea
          ref={ref}
          value={value}
          onChange={onChange}
          className={cn(className)}
          {...props}
        />
        <div className="flex items-center gap-2 mt-1.5">
          <button
            type="button"
            className={cn(
              'inline-flex items-center gap-1.5 rounded-none border-2 border-strong-border px-3 py-1 text-xs font-medium transition-colors',
              'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50',
            )}
            onClick={handleAIAssist}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                Rewriting...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3" />
                Rewrite with AI
              </>
            )}
          </button>
          <Popover open={guidanceOpen} onOpenChange={setGuidanceOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  'inline-flex items-center justify-center h-6 w-6 rounded-none border-2 border-strong-border transition-colors',
                  'border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  'disabled:pointer-events-none disabled:opacity-50',
                  hasGuidance && 'border-foreground text-foreground',
                )}
                disabled={isLoading}
                title="Add direction for the AI rewrite"
              >
                <MessageSquarePlus className="h-3 w-3" />
                <span className="sr-only">Add direction for the AI rewrite</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="start">
              <label htmlFor={guidanceInputId} className="text-xs font-medium text-foreground">
                Guidance for AI (optional)
              </label>
              <input
                id={guidanceInputId}
                type="text"
                value={guidance}
                onChange={(e) => setGuidance(e.target.value)}
                placeholder="Optional: tell the AI what to focus on…"
                maxLength={2000}
                className={cn(
                  'mt-1.5 flex h-9 w-full rounded-[2px] border-2 border-control-border bg-background px-2 text-sm text-foreground transition-colors',
                  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-foreground',
                )}
              />
            </PopoverContent>
          </Popover>
          {error && (
            <span className="text-xs text-destructive">{error}</span>
          )}
        </div>
      </div>
    );
  }
);
AITextarea.displayName = 'AITextarea';

export { AITextarea };
