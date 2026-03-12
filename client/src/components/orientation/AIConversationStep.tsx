import { useState, useRef, useEffect } from 'react';
import type { JourneyStep, OmniBotMessage, OmniBotContext } from '@/types/orientation';
import { sendOmniBotMessage } from '@/lib/omnibot';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, SendHorizontal, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  step: JourneyStep;
  context?: OmniBotContext;
  onComplete: (response?: unknown) => void;
}

export function AIConversationStep({ step, context, onComplete }: Props) {
  const systemPrompt =
    step.ai_prompt_template ??
    'You are a helpful orientation guide. Assist the user thoughtfully with this orientation step.';

  const [messages, setMessages] = useState<OmniBotMessage[]>([
    { role: 'assistant', content: systemPrompt },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnCount, setTurnCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || isLoading) return;
    const userMsg: OmniBotMessage = { role: 'user', content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setIsLoading(true);
    try {
      const resp = await sendOmniBotMessage(newMsgs, context);
      setMessages(m => [...m, resp.message]);
      setTurnCount(t => t + 1);
    } catch {
      setMessages(m => [
        ...m,
        { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  // Filter out system messages for display
  const displayMessages = messages.filter(m => m.role !== 'system');
  const canComplete = !step.required || turnCount >= 1;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{step.title}</h2>
        {step.description && (
          <p className="text-muted-foreground mt-1 text-sm">{step.description}</p>
        )}
      </div>

      {/* Chat window */}
      <div
        className="border rounded-xl bg-muted/10 flex flex-col overflow-hidden"
        style={{ height: '340px' }}
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {displayMessages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                'flex gap-2.5',
                msg.role === 'user' ? 'justify-end' : 'justify-start',
              )}
            >
              {msg.role === 'assistant' && (
                <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    <Bot className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-background border rounded-bl-sm',
                )}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                  <AvatarFallback className="text-xs">
                    <User className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <Avatar className="h-7 w-7 flex-shrink-0 mt-0.5">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  <Bot className="h-3.5 w-3.5" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-background border rounded-2xl rounded-bl-sm px-3.5 py-2.5">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t p-3 flex gap-2 bg-background">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message… (Enter to send)"
            rows={2}
            className="resize-none flex-1 text-sm"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button
            size="icon"
            onClick={send}
            disabled={isLoading || !input.trim()}
            className="self-end"
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {!canComplete && (
          <p className="text-xs text-muted-foreground">Send at least one message to continue</p>
        )}
        <Button
          className="ml-auto"
          disabled={!canComplete}
          onClick={() => onComplete({ turns: turnCount, messages })}
        >
          <CheckCircle className="h-4 w-4 mr-1.5" />
          Continue
        </Button>
      </div>
    </div>
  );
}
