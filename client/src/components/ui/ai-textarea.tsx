import * as React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useAIAssist } from '@/hooks/use-ai-assist';
import { Sparkles, Loader2 } from 'lucide-react';
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

    const handleAIAssist = async () => {
      const result = await generate(value);
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
