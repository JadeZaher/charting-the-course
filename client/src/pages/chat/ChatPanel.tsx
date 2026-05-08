import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSSEChat, type ChatMessage } from '@/hooks/use-chat';
import { useEcosystem } from '@/contexts/EcosystemContext';
import {
  Bot, User, Send, Square, Trash2, Loader2, Wrench, ArrowRight,
  Building2, Coins, Copy, Check, Share2, Globe, Lock, Users,
} from 'lucide-react';
import { marked } from 'marked';

marked.setOptions({ breaks: true, gfm: true });

interface ChatPanelProps {
  embedded?: boolean;
}

type Privacy = 'private' | 'ecosystem' | 'public';

const privacyConfig: Record<Privacy, { icon: typeof Lock; label: string }> = {
  private: { icon: Lock, label: 'Private' },
  ecosystem: { icon: Users, label: 'Ecosystem' },
  public: { icon: Globe, label: 'Public' },
};

const privacyCycle: Privacy[] = ['private', 'ecosystem', 'public'];

export default function ChatPanel({ embedded }: ChatPanelProps) {
  const { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages } = useSSEChat();
  const { selected: ecosystem } = useEcosystem();
  const [input, setInput] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [privacy, setPrivacy] = useState<Privacy>('private');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
  };

  const handleCopy = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIdx(index);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleShare = async () => {
    const text = messages
      .map(m => `${m.role === 'user' ? 'You' : 'Agent'}: ${m.content}`)
      .join('\n\n');
    if (navigator.share) {
      await navigator.share({ title: 'NEOS Chat', text });
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  const cyclePrivacy = () => {
    const idx = privacyCycle.indexOf(privacy);
    setPrivacy(privacyCycle[(idx + 1) % privacyCycle.length]);
  };

  const PrivacyIcon = privacyConfig[privacy].icon;

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
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={cyclePrivacy}>
                  <PrivacyIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{privacyConfig[privacy].label}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {messages.length > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share conversation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button variant="outline" size="sm" onClick={clearMessages} disabled={messages.length === 0}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
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

                <div className={`group flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                      {msg.role === 'assistant' && msg.content ? (
                        <div
                          className="text-sm prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                          dangerouslySetInnerHTML={{ __html: marked.parse(msg.content) as string }}
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content || (msg.isStreaming ? '...' : '')}
                        </p>
                      )}
                      {msg.isStreaming && <Loader2 className="h-3 w-3 animate-spin mt-1" />}
                    </div>

                    {/* Actions row: tokens + copy */}
                    {msg.role === 'assistant' && msg.content && !msg.isStreaming && (
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() => handleCopy(msg.content, i)}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {copiedIdx === i ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          {copiedIdx === i ? 'Copied' : 'Copy'}
                        </button>
                        {msg.usage && msg.usage.total_tokens > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Coins className="h-3 w-3" />
                            {msg.usage.total_tokens} tokens
                            <span className="opacity-50">({msg.usage.prompt_tokens} in / {msg.usage.completion_tokens} out)</span>
                          </span>
                        )}
                      </div>
                    )}
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
