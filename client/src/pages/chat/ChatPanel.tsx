import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSSEChat, type ChatMessage } from '@/hooks/use-chat';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { fetchChatSessions, fetchChatSession, deleteChatSession, type ChatSessionItem } from '@/lib/api-client';
import {
  Bot, User, Send, Square, Trash2, Loader2, Wrench, ArrowRight,
  Building2, Coins, Copy, Check, Share2, Globe, Lock, Users, AlertTriangle,
  PanelLeftClose, PanelLeftOpen, Plus, Search, MessageSquare, Clock,
} from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'wouter';
import { ThinkingSteps } from '@/components/chat/ThinkingSteps';

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

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function ChatPanel({ embedded }: ChatPanelProps) {
  const {
    messages, isStreaming, error, sendMessage, stopStreaming,
    clearMessages, loadSession, activeSkill, sessionId,
    limitReached, userMessageCount, maxMessages,
  } = useSSEChat();
  const { selected: ecosystem } = useEcosystem();
  const [input, setInput] = useState('');
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [privacy, setPrivacy] = useState<Privacy>('private');
  const [sidebarOpen, setSidebarOpen] = useState(!embedded);
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load sessions on mount and when sidebar opens
  const loadSessions = useCallback(async (q?: string) => {
    setSessionsLoading(true);
    try {
      const result = await fetchChatSessions({ q: q || undefined, limit: 30 });
      setSessions(result.sessions);
    } catch {
      // Silently fail — sessions are a convenience feature
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sidebarOpen) loadSessions();
  }, [sidebarOpen, loadSessions]);

  // Reload sessions after a message exchange completes (new session may have been created)
  useEffect(() => {
    if (!isStreaming && sessionId && sidebarOpen) {
      loadSessions(searchQuery || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, sessionId]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      loadSessions(value || undefined);
    }, 300);
  };

  const handleSelectSession = async (id: string) => {
    try {
      const detail = await fetchChatSession(id);
      const msgs: ChatMessage[] = detail.messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
      loadSession(id, msgs, detail.skill);
    } catch {
      // ignore
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
      if (sessionId === id) clearMessages();
    } catch {
      // ignore
    }
  };

  const handleNewConversation = () => {
    clearMessages();
  };

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
    <div className={embedded ? 'h-full flex' : 'max-w-6xl mx-auto h-[calc(100vh-8rem)] flex'}>
      {/* Session Sidebar */}
      {sidebarOpen && (
        <div className="w-72 flex-shrink-0 border-r flex flex-col bg-muted/30 rounded-l-lg overflow-hidden">
          {/* Sidebar header */}
          <div className="p-3 border-b flex items-center justify-between">
            <h3 className="text-sm font-semibold">Sessions</h3>
            <div className="flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNewConversation}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>New conversation</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSidebarOpen(false)}>
                <PanelLeftClose className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
                placeholder="Search sessions..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>

          {/* Session list */}
          <ScrollArea className="flex-1">
            <div className="p-1.5 space-y-0.5">
              {sessionsLoading && sessions.length === 0 && (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              )}

              {!sessionsLoading && sessions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  {searchQuery ? 'No sessions found' : 'No previous sessions'}
                </div>
              )}

              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelectSession(s.id)}
                  className={`w-full text-left px-2.5 py-2 rounded-md text-xs group transition-colors ${
                    sessionId === s.id
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">
                        {s.title || 'Untitled conversation'}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <MessageSquare className="h-3 w-3" />
                          {s.message_count}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="h-3 w-3" />
                          {formatRelativeTime(s.updated_at || s.created_at)}
                        </span>
                      </div>
                      {s.skill && (
                        <Badge variant="outline" className="mt-1 text-[10px] px-1 py-0">
                          {s.skill}
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={e => handleDeleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2 min-w-0">
            {!sidebarOpen && (
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setSidebarOpen(true)}>
                <PanelLeftOpen className="h-4 w-4" />
              </Button>
            )}
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
            <Button variant="outline" size="sm" onClick={handleNewConversation} disabled={messages.length === 0}>
              <Plus className="h-4 w-4" />
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
                    I'm here to help facilitate governance processes, look up information, and guide you through NEOS procedures.
                  </p>
                  <p className="text-xs mt-3 text-muted-foreground/70 max-w-md mx-auto">
                    What can I assist you with today? I can help with things like:
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    {[
                      'Create a proposal',
                      'Draft an agreement',
                      'Check authority boundaries',
                      'Report a conflict',
                      'Look up domain contracts',
                    ].map(suggestion => (
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
                      {msg.role === 'assistant' && msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                        <ThinkingSteps steps={msg.thinkingSteps} isStreaming={msg.isStreaming} />
                      )}
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
                          <div className="text-sm prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                            <Markdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                a: ({ href, children }) => {
                                  if (href?.startsWith('/')) {
                                    return <Link href={href} className="text-primary underline hover:text-primary/80">{children}</Link>;
                                  }
                                  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
                                },
                              }}
                            >
                              {msg.content}
                            </Markdown>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.content || (msg.isStreaming ? '...' : '')}
                          </p>
                        )}
                        {msg.isStreaming && <Loader2 className="h-3 w-3 animate-spin mt-1" />}
                      </div>

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

          {limitReached && (
            <div className="px-4 py-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm border-t flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                {userMessageCount >= maxMessages
                  ? 'Conversation limit reached. Please start a new conversation.'
                  : `Approaching conversation limit (${userMessageCount}/${maxMessages} messages).`}
              </span>
              <Button variant="outline" size="sm" onClick={handleNewConversation} className="ml-auto text-xs">
                New conversation
              </Button>
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
                disabled={isStreaming || (limitReached && userMessageCount >= maxMessages)}
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
    </div>
  );
}
