import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSSEChat } from '@/hooks/use-chat';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { Bot, User, Send, Square, Trash2, Loader2, Wrench, ArrowRight, Building2 } from 'lucide-react';

interface ChatPanelProps {
  embedded?: boolean;
}

export default function ChatPanel({ embedded }: ChatPanelProps) {
  const { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages } = useSSEChat();
  const { selected: ecosystem } = useEcosystem();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className={embedded ? 'h-full flex flex-col' : 'max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col'}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <h2 className={`${embedded ? 'text-lg' : 'text-2xl'} font-bold flex items-center gap-2`}>
            <Bot className="h-5 w-5 flex-shrink-0" />
            AI Governance Agent
          </h2>
          {!embedded && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-muted-foreground">
                Navigate governance processes, create proposals, and manage agreements
              </p>
              {ecosystem && (
                <Badge variant="outline" className="text-xs">
                  <Building2 className="h-3 w-3 mr-1" />
                  {ecosystem.name}
                </Badge>
              )}
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={clearMessages} disabled={messages.length === 0}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Welcome state */}
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-base font-medium">NEOS Governance Agent</p>
                <p className="text-sm mt-1 max-w-sm mx-auto">
                  I can help you create proposals, draft agreements, and navigate governance.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {['Create a proposal', 'Draft an agreement', 'Start a consent round', 'Report a conflict'].map(suggestion => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => { setInput(suggestion); }}
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <div key={i}>
                {msg.skill && (
                  <div className="flex items-center justify-center gap-2 my-2 py-1.5 bg-primary/5 rounded-lg text-xs">
                    <ArrowRight className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground">Skill:</span>
                    <span className="font-semibold text-primary">{msg.skill}</span>
                  </div>
                )}

                <div className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                    </div>
                  )}
                  <div className="max-w-[85%] space-y-1">
                    {msg.tools && msg.tools.length > 0 && (
                      <div className="space-y-0.5">
                        {msg.tools.map((tool, ti) => (
                          <div
                            key={ti}
                            className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 border-l-2 border-primary/30 rounded-r text-xs"
                          >
                            <Wrench className="h-3 w-3 text-muted-foreground" />
                            <code className="font-mono text-xs">{tool.name}</code>
                            <Badge
                              variant={tool.status === 'success' ? 'default' : tool.status === 'error' ? 'destructive' : 'secondary'}
                              className="text-[10px] px-1 py-0"
                            >
                              {tool.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      className={`rounded-lg p-3 ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {msg.content || (msg.isStreaming ? '...' : '')}
                      </p>
                      {msg.isStreaming && <Loader2 className="h-3 w-3 animate-spin mt-1" />}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="h-7 w-7 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-3.5 w-3.5 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm border-t">
            {error}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t">
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask the governance agent..."
              className="min-h-[48px] max-h-[160px] resize-none flex-1"
              disabled={isStreaming}
            />
            {isStreaming ? (
              <Button variant="destructive" size="icon" onClick={stopStreaming} className="h-10 w-10 shrink-0">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="icon" onClick={handleSend} disabled={!input.trim()} className="h-10 w-10 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
