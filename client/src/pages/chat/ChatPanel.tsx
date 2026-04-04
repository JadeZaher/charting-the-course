import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSSEChat } from '@/hooks/use-chat';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useAuth } from '@/contexts/AuthContext';
import { Bot, User, Send, Square, Trash2, Loader2, Wrench, ArrowRight, Building2 } from 'lucide-react';

export default function ChatPanel() {
  const { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages } = useSSEChat();
  const { selected: ecosystem } = useEcosystem();
  const { member } = useAuth();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Suppress unused variable warning — member may be used for future features
  void member;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            AI Governance Agent
          </h1>
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
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={clearMessages} disabled={messages.length === 0}>
            <Trash2 className="h-4 w-4 mr-1" /> Clear
          </Button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {/* Welcome state */}
            {messages.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">NEOS Governance Agent</p>
                <p className="text-sm mt-2 max-w-md mx-auto">
                  I can help you create proposals, draft agreements, navigate the ACT process,
                  manage domains, and resolve conflicts within your ecosystem.
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-6">
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
                {/* Skill transition banner */}
                {msg.skill && (
                  <div className="flex items-center justify-center gap-2 my-3 py-2 bg-primary/5 rounded-lg text-sm">
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Skill:</span>
                    <span className="font-semibold text-primary">{msg.skill}</span>
                  </div>
                )}

                <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className="max-w-[80%] space-y-2">
                    {/* Tool executions */}
                    {msg.tools && msg.tools.length > 0 && (
                      <div className="space-y-1">
                        {msg.tools.map((tool, ti) => (
                          <div
                            key={ti}
                            className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border-l-2 border-primary/30 rounded-r text-xs"
                          >
                            <Wrench className="h-3 w-3 text-muted-foreground" />
                            <code className="font-mono">{tool.name}</code>
                            <Badge
                              variant={
                                tool.status === 'success'
                                  ? 'default'
                                  : tool.status === 'error'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className="text-[10px] px-1 py-0"
                            >
                              {tool.status}
                            </Badge>
                            {tool.result && (
                              <span className="text-muted-foreground truncate max-w-[200px]">
                                {tool.result}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message content */}
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
                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-secondary-foreground" />
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
        <div className="p-4 border-t">
          <div className="flex gap-2">
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
              className="min-h-[60px] resize-none"
              disabled={isStreaming}
            />
            {isStreaming ? (
              <Button variant="destructive" onClick={stopStreaming} className="self-end">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSend} disabled={!input.trim()} className="self-end">
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
