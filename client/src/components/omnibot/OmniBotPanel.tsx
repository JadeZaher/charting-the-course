import { useState, useRef, useEffect } from 'react';
import type { OmniBotMessage, OmniBotContext } from '@/types/orientation';
import { sendOmniBotMessage } from '@/lib/omnibot';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bot, User, SendHorizontal, X, Loader2, MessageCircle, Mic, MicOff } from 'lucide-react';
import { useSpeechInput } from '@/hooks/useSpeechInput';
import { cn } from '@/lib/utils';

interface Props {
  context?: OmniBotContext;
}

export function OmniBotPanel({ context }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<OmniBotMessage[]>([
    {
      role: 'assistant',
      content: context?.ethos_name
        ? `Hi! I'm OmniBot, your orientation guide for ${context.ethos_name}. Ask me anything!`
        : "Hi! I'm OmniBot. How can I help you with your orientation?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { isListening, isSupported: isMicSupported, startListening, stopListening } = useSpeechInput({
    onTranscript: (text) => setInput(prev => prev ? `${prev} ${text}` : text),
  });

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages, open]);

  async function send() {
    if (!input.trim() || isLoading) return;
    const userMsg: OmniBotMessage = { role: 'user', content: input.trim() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setIsLoading(true);
    try {
      const resp = await sendOmniBotMessage(newMsgs, context);
      const botMsg = resp?.message ?? { role: 'assistant' as const, content: 'Sorry, I encountered an error. Please try again.' };
      setMessages(m => [...m, botMsg]);
    } catch {
      setMessages(m => [
        ...m,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {open && (
        <div
          className="flex w-80 flex-col overflow-hidden border-2 border-strong-border bg-background sm:w-96"
          style={{ height: '420px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span className="font-semibold text-sm">OmniBot</span>
              {context?.ethos_name && (
                <span className="text-xs opacity-75 truncate max-w-[120px]">
                  · {context.ethos_name}
                </span>
              )}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="opacity-75 hover:opacity-100 transition-opacity ml-2"
              aria-label="Close OmniBot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {msg.role === 'assistant' && (
                  <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                      <Bot className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[80%] border-2 border-strong-border px-3 py-2 text-xs leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted rounded-bl-sm',
                  )}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                    <AvatarFallback className="text-[10px]">
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 justify-start">
                <Avatar className="h-6 w-6 flex-shrink-0 mt-0.5">
                  <AvatarFallback className="bg-primary text-primary-foreground text-[10px]">
                    <Bot className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
                <div className="border bg-muted px-3 py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground motion-reduce:animate-none" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t p-2.5 flex-shrink-0">
            {isListening && (
              <p className="text-[10px] text-primary font-medium mb-1.5 px-0.5 animate-pulse">
                Listening…
              </p>
            )}
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask OmniBot anything…"
                rows={2}
                className="resize-none flex-1 text-xs"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <div className="flex flex-col gap-1.5 self-end">
                {isMicSupported && (
                  <Button
                    size="icon"
                    variant={isListening ? 'default' : 'outline'}
                    className={cn('h-9 w-9 flex-shrink-0', isListening && 'animate-pulse')}
                    onClick={isListening ? stopListening : startListening}
                    disabled={isLoading}
                    aria-label={isListening ? 'Stop recording' : 'Start voice input'}
                  >
                    {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  </Button>
                )}
                <Button
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={send}
                  disabled={isLoading || !input.trim()}
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating toggle button */}
      <Button
        size="icon"
        className="h-12 w-12 border-2 border-strong-border"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close OmniBot' : 'Open OmniBot'}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </Button>
    </div>
  );
}
