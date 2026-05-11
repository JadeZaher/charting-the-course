import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';
import { fetchChatSessions, fetchChatSession, updateChatSessionPrivacy } from '@/lib/api-client';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Link } from 'wouter';
import { ThinkingSteps } from '@/components/chat/ThinkingSteps';
import { useConversations, useConversation, useWebSocket, useMemberPicker, useCreateConversation, useSendMessage } from '@/hooks/use-messaging';
import { useSSEChat } from '@/hooks/use-chat';
import { useAuth } from '@/contexts/AuthContext';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { usePageContext } from '@/contexts/PageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import {
  MessageSquare,
  Bot,
  X,
  Send,
  Search,
  Plus,
  Maximize2,
  Minimize2,
  Square,
  Trash2,
  Loader2,
  Wrench,
  ArrowRight,
  User,
  Users,
  Building2,
  ArrowLeft,
  History,
  Coins,
  Lock,
  Globe,
  Share2,
  Copy,
  Check,
} from 'lucide-react';

type Tab = 'messaging' | 'chat';

export function FloatingComms() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('messaging');
  const isMobile = useIsMobile();

  // Hide on comms page where full messaging + agent are available
  const isCommsPage = window.location.pathname.startsWith('/comms');
  if (isCommsPage) return null;

  // Messaging unread count for badge on FAB
  const { data: convData } = useConversations();
  const totalUnread = (convData?.conversations || []).reduce((sum, c) => sum + c.unread_count, 0);

  return (
    <div className={cn('fixed z-50 flex flex-col items-end gap-3', isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6')}>
      {/* Panel */}
      {open && (
        <div
          className={cn(
            'rounded-2xl border bg-background shadow-2xl flex flex-col overflow-hidden transition-all duration-300',
            expanded
              ? isMobile ? 'w-screen h-[85vh]' : 'w-[85vw] h-[85vh] max-w-[1200px]'
              : isMobile ? 'w-[calc(100vw-1.5rem)] h-[70vh]' : 'w-[420px] h-[560px]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-primary text-primary-foreground flex-shrink-0">
            <div className="flex items-center gap-1">
              {/* Tabs */}
              <button
                onClick={() => setActiveTab('messaging')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                  activeTab === 'messaging'
                    ? 'bg-primary-foreground/20'
                    : 'hover:bg-primary-foreground/10 opacity-75'
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Messaging
                {totalUnread > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-4 min-w-4 px-1">
                    {totalUnread}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                  activeTab === 'chat'
                    ? 'bg-primary-foreground/20'
                    : 'hover:bg-primary-foreground/10 opacity-75'
                )}
              >
                <Bot className="h-3.5 w-3.5" />
                AI Chat
              </button>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setExpanded(e => !e)}
                className="p-1.5 rounded-md hover:bg-primary-foreground/10 transition-colors"
                aria-label={expanded ? 'Minimize' : 'Expand'}
              >
                {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={() => { setOpen(false); setExpanded(false); }}
                className="p-1.5 rounded-md hover:bg-primary-foreground/10 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'messaging' ? <MessagingTab expanded={expanded} /> : <ChatTab expanded={expanded} />}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <Button
        size="icon"
        className="h-14 w-14 min-h-[48px] min-w-[48px] rounded-full shadow-lg"
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close communications' : 'Open communications'}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <div className="relative">
            <MessageSquare className="h-5 w-5" />
            {totalUnread > 0 && (
              <span className="absolute -top-2 -right-2 h-4 min-w-4 px-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {totalUnread > 9 ? '9+' : totalUnread}
              </span>
            )}
          </div>
        )}
      </Button>
    </div>
  );
}

/* ─── Messaging Tab ──────────────────────────────────────────────────── */

function MessagingTab({ expanded }: { expanded: boolean }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newConvType, setNewConvType] = useState<'direct' | 'group'>('direct');
  const [newConvTitle, setNewConvTitle] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');

  const { data: convData, isLoading } = useConversations();
  const { data: activeConv } = useConversation(activeId || '');
  const { isConnected } = useWebSocket();
  const { member } = useAuth();
  const { data: membersData } = useMemberPicker();
  const createConversation = useCreateConversation();
  const sendMessageMutation = useSendMessage(activeId || '');

  const conversations = convData?.conversations || [];
  const filtered = searchQuery
    ? conversations.filter(c =>
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const availableMembers = (membersData?.members || []).filter(
    m => m.id !== member?.id && !selectedMembers.includes(m.id)
  );
  const filteredMembers = memberSearch
    ? availableMembers.filter(m =>
        m.display_name.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : availableMembers;

  const handleSend = () => {
    if (!messageInput.trim() || !activeId) return;
    const content = messageInput;
    setMessageInput('');
    sendMessageMutation.mutate(content);
  };

  const resetDialog = () => {
    setShowNewDialog(false);
    setNewConvType('direct');
    setNewConvTitle('');
    setSelectedMembers([]);
    setMemberSearch('');
  };

  const handleCreateConversation = () => {
    if (selectedMembers.length === 0) return;
    createConversation.mutate(
      {
        type: newConvType === 'direct' ? 'dm' : 'group',
        title: newConvType === 'group' ? newConvTitle || undefined : undefined,
        participant_ids: selectedMembers,
      },
      {
        onSuccess: (conv) => {
          setActiveId(conv.id);
          resetDialog();
        },
      }
    );
  };

  const toggleMember = (id: string) => {
    if (newConvType === 'direct') {
      setSelectedMembers([id]);
    } else {
      setSelectedMembers(prev =>
        prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
      );
    }
  };

  // On mobile-ish (non-expanded), show either list or conversation
  const showConversation = activeId && activeConv;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const newConvDialog = (
    <Dialog open={showNewDialog} onOpenChange={(open) => { if (!open) resetDialog(); else setShowNewDialog(true); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>Start a direct message or create a group chat.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={newConvType === 'direct' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setNewConvType('direct'); setSelectedMembers([]); }}
            >
              <User className="h-4 w-4 mr-1.5" />
              Direct
            </Button>
            <Button
              variant={newConvType === 'group' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setNewConvType('group'); setSelectedMembers([]); }}
            >
              <Users className="h-4 w-4 mr-1.5" />
              Group
            </Button>
          </div>
          {newConvType === 'group' && (
            <div className="space-y-1.5">
              <Label htmlFor="floating-group-name" className="text-sm">Group Name</Label>
              <Input
                id="floating-group-name"
                placeholder="e.g. Domain Stewards"
                value={newConvTitle}
                onChange={e => setNewConvTitle(e.target.value)}
              />
            </div>
          )}
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedMembers.map(id => {
                const m = membersData?.members.find(mb => mb.id === id);
                return (
                  <Badge key={id} variant="secondary" className="gap-1 pr-1">
                    {m?.display_name || id}
                    <button onClick={() => toggleMember(id)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-sm">
              {newConvType === 'direct' ? 'Select a member' : 'Add members'}
            </Label>
            <Input
              placeholder="Search members..."
              value={memberSearch}
              onChange={e => setMemberSearch(e.target.value)}
            />
            <ScrollArea className="h-40 border rounded-md">
              {filteredMembers.map(m => (
                <button
                  key={m.id}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-0',
                    selectedMembers.includes(m.id) && 'bg-primary/10'
                  )}
                  onClick={() => toggleMember(m.id)}
                >
                  {m.display_name}
                </button>
              ))}
              {filteredMembers.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No members found</p>
              )}
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={resetDialog}>Cancel</Button>
          <Button
            onClick={handleCreateConversation}
            disabled={selectedMembers.length === 0 || createConversation.isPending}
          >
            {createConversation.isPending ? 'Creating...' : 'Start Chat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Expanded: side-by-side layout
  if (expanded) {
    return (
      <div className="flex h-full">
        {newConvDialog}
        {/* Conversation list */}
        <div className="w-72 border-r flex flex-col">
          <ConversationList
            conversations={filtered}
            activeId={activeId}
            onSelect={setActiveId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onNewConversation={() => setShowNewDialog(true)}
          />
        </div>
        {/* Active conversation */}
        <div className="flex-1 flex flex-col">
          {showConversation ? (
            <ConversationView
              conv={activeConv}
              memberId={member?.id}
              isConnected={isConnected}
              messageInput={messageInput}
              onMessageChange={setMessageInput}
              onSend={handleSend}
            />
          ) : (
            <EmptyConversation />
          )}
        </div>
      </div>
    );
  }

  // Compact: stacked — show list or conversation
  if (showConversation) {
    return (
      <div className="flex flex-col h-full">
        {newConvDialog}
        <button
          onClick={() => setActiveId(null)}
          className="flex items-center gap-1 px-3 py-2 text-sm text-muted-foreground hover:text-foreground border-b"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
        <ConversationView
          conv={activeConv}
          memberId={member?.id}
          isConnected={isConnected}
          messageInput={messageInput}
          onMessageChange={setMessageInput}
          onSend={handleSend}
        />
      </div>
    );
  }

  return (
    <>
      {newConvDialog}
      <ConversationList
        conversations={filtered}
        activeId={activeId}
        onSelect={setActiveId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewConversation={() => setShowNewDialog(true)}
      />
    </>
  );
}

function ConversationList({
  conversations,
  activeId,
  onSelect,
  searchQuery,
  onSearchChange,
  onNewConversation,
}: {
  conversations: any[];
  activeId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewConversation?: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-2.5 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Messages</h3>
          {onNewConversation && (
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={onNewConversation}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-7 h-8 text-sm"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {conversations.map(conv => (
          <button
            key={conv.id}
            className={cn(
              'w-full text-left px-3 py-2.5 border-b hover:bg-muted/50 transition-colors',
              activeId === conv.id && 'bg-muted'
            )}
            onClick={() => onSelect(conv.id)}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1.5 min-w-0">
                {conv.type === 'group' ? (
                  <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
                <p className="font-medium text-xs truncate">
                  {conv.title || conv.participants.map((p: any) => p.display_name).join(', ')}
                </p>
              </div>
              {conv.unread_count > 0 && (
                <Badge variant="default" className="text-[10px] h-4 min-w-4 px-1 ml-1 flex-shrink-0">
                  {conv.unread_count}
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5 pl-5">
              {conv.last_message || 'No messages yet'}
            </p>
          </button>
        ))}
        {conversations.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6">No conversations</p>
        )}
      </ScrollArea>
    </div>
  );
}

function ConversationView({
  conv,
  memberId,
  isConnected,
  messageInput,
  onMessageChange,
  onSend,
}: {
  conv: any;
  memberId?: string;
  isConnected: boolean;
  messageInput: string;
  onMessageChange: (v: string) => void;
  onSend: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv?.messages]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Conversation header */}
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm truncate">
            {conv.title || conv.participants.map((p: any) => p.display_name).join(', ')}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', isConnected ? 'bg-green-500' : 'bg-red-500')} />
            <span className="text-[10px] text-muted-foreground">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-2.5">
          {conv.messages.map((msg: any) => (
            <div
              key={msg.id}
              className={cn('flex', msg.sender_id === memberId ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[80%] rounded-xl px-3 py-2',
                  msg.sender_id === memberId
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted rounded-bl-sm'
                )}
              >
                <p className="text-[10px] font-medium mb-0.5 opacity-80">{msg.sender_name}</p>
                <p className="text-xs whitespace-pre-wrap">{msg.content}</p>
                <p className="text-[10px] opacity-60 mt-0.5">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-2.5 border-t flex gap-2">
        <Input
          value={messageInput}
          onChange={e => onMessageChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && onSend()}
          placeholder="Type a message..."
          className="h-8 text-sm"
        />
        <Button size="sm" onClick={onSend} disabled={!messageInput.trim()} className="h-8 px-2.5">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function EmptyConversation() {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground">
      <div className="text-center">
        <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">Select a conversation</p>
      </div>
    </div>
  );
}

/* ─── Chat Tab (AI Governance Agent) ─────────────────────────────────── */

type ChatPrivacy = 'private' | 'ecosystem' | 'public';

function ChatTab({ expanded }: { expanded: boolean }) {
  const { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages, loadSession, sessionId } = useSSEChat();
  const { selected: ecosystem, isAll, isMulti, selectedIds, ecosystems } = useEcosystem();
  const { getAISummary } = usePageContext();
  const { member } = useAuth();
  const [input, setInput] = useState('');
  const [showSessions, setShowSessions] = useState(false);
  const [privacy, setPrivacy] = useState<ChatPrivacy>('private');
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: sessionsData } = useQuery({
    queryKey: ['chat', 'sessions'],
    queryFn: () => fetchChatSessions({ limit: 20 }),
    staleTime: 30_000,
    enabled: showSessions,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input, {
      selectedEcosystemIds: selectedIds,
      pageContextSummary: getAISummary(),
      member: member ? { id: member.id, display_name: member.display_name } : undefined,
      ecosystemName: ecosystem?.name,
    });
    setInput('');
  };

  const cyclePrivacy = async () => {
    if (!sessionId) return;
    const cycle: ChatPrivacy[] = ['private', 'ecosystem', 'public'];
    const next = cycle[(cycle.indexOf(privacy) + 1) % cycle.length];
    try {
      const res = await updateChatSessionPrivacy(sessionId, next);
      setPrivacy(res.privacy as ChatPrivacy);
      setShareToken(res.share_token);
    } catch { /* ignore */ }
  };

  const handleShare = async () => {
    if (!shareToken) return;
    const url = `${window.location.origin}/chat/shared/${shareToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showSessions) {
    const sessions = sessionsData?.sessions ?? [];
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowSessions(false)} className="p-1 rounded hover:bg-muted transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" />
            </button>
            <span className="text-sm font-semibold">Chat History</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { clearMessages(); setShowSessions(false); }} className="h-7 px-2 text-xs">
            <Plus className="h-3 w-3 mr-1" /> New
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {sessions.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No past sessions</p>
          ) : (
            sessions.map((s) => (
              <button
                key={s.id}
                className={`w-full text-left px-3 py-2.5 border-b hover:bg-muted/50 transition-colors ${
                  sessionId === s.id ? 'bg-primary/10' : ''
                }`}
                onClick={async () => {
                  try {
                    const detail = await fetchChatSession(s.id);
                    const msgs = detail.messages.map((m: any) => ({
                      role: m.role as 'user' | 'assistant',
                      content: m.content,
                    }));
                    loadSession(s.id, msgs, detail.skill);
                    setShowSessions(false);
                  } catch { /* ignore */ }
                }}
              >
                <p className="text-xs font-medium truncate">{s.title || 'Untitled session'}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                  <span>{s.message_count} messages</span>
                  {s.created_at && (
                    <span>{new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Governance Agent</span>
          <Badge variant="outline" className="text-[10px] h-5">
            <Building2 className="h-2.5 w-2.5 mr-0.5" />
            {isAll ? 'All' : isMulti ? `${selectedIds.length} ecosystems` : ecosystem?.name ?? 'Ecosystem'}
          </Badge>
        </div>
        <div className="flex items-center gap-0.5">
          {sessionId && (
            <>
              <Button variant="ghost" size="sm" onClick={cyclePrivacy} className="h-7 px-1.5 text-xs" title={`Privacy: ${privacy}`}>
                {privacy === 'private' ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
              </Button>
              {privacy !== 'private' && shareToken && (
                <Button variant="ghost" size="sm" onClick={handleShare} className="h-7 px-1.5 text-xs" title="Copy share link">
                  {copied ? <Check className="h-3 w-3 text-green-500" /> : <Share2 className="h-3 w-3" />}
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowSessions(true)} className="h-7 px-2 text-xs" title="Chat history">
            <History className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={clearMessages} disabled={messages.length === 0} className="h-7 px-2 text-xs">
            <Trash2 className="h-3 w-3 mr-1" /> Clear
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-3">
          {/* Welcome */}
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">NEOS Governance Agent</p>
              <p className="text-xs mt-1 max-w-xs mx-auto">
                Create proposals, draft agreements, navigate the ACT process, and more.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                {['Create a proposal', 'Draft an agreement', 'Start a consent round', 'Report a conflict'].map(s => (
                  <Button
                    key={s}
                    variant="outline"
                    size="sm"
                    onClick={() => setInput(s)}
                    className="text-xs h-9 px-3"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div key={i}>
              {msg.skill && (
                <div className="flex items-center justify-center gap-1.5 my-2 py-1.5 bg-primary/5 rounded-lg text-xs">
                  <ArrowRight className="h-3 w-3 text-primary" />
                  <span className="text-muted-foreground">Skill:</span>
                  <span className="font-semibold text-primary">{msg.skill}</span>
                </div>
              )}

              <div className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <div className={cn('space-y-1', expanded ? 'max-w-[80%]' : 'max-w-[85%]')}>
                  {/* Thinking steps */}
                  {msg.role === 'assistant' && msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                    <ThinkingSteps steps={msg.thinkingSteps} isStreaming={msg.isStreaming} />
                  )}

                  {/* Tool executions */}
                  {msg.tools && msg.tools.length > 0 && (
                    <div className="space-y-0.5">
                      {msg.tools.map((tool, ti) => (
                        <div
                          key={ti}
                          className="flex items-center gap-1.5 px-2 py-1 bg-muted/50 border-l-2 border-primary/30 rounded-r text-[10px]"
                        >
                          <Wrench className="h-2.5 w-2.5 text-muted-foreground" />
                          <code className="font-mono">{tool.name}</code>
                          <Badge
                            variant={tool.status === 'success' ? 'default' : tool.status === 'error' ? 'destructive' : 'secondary'}
                            className="text-[9px] px-1 py-0 h-3.5"
                          >
                            {tool.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className={cn(
                      'rounded-xl px-3 py-2',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    )}
                  >
                    {msg.role === 'assistant' && msg.content ? (
                      <div className="text-xs prose prose-xs dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
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
                      <p className="text-xs whitespace-pre-wrap">
                        {msg.content || (msg.isStreaming ? '...' : '')}
                      </p>
                    )}
                    {msg.isStreaming && <Loader2 className="h-3 w-3 animate-spin mt-1" />}
                  </div>

                  {msg.role === 'assistant' && msg.artifacts && msg.artifacts.length > 0 && !msg.isStreaming && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {msg.artifacts.map((a, ai) => (
                        <Link
                          key={ai}
                          href={a.route}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 transition-colors"
                        >
                          <ArrowRight className="h-2.5 w-2.5" />
                          {a.label}
                        </Link>
                      ))}
                    </div>
                  )}

                  {msg.role === 'assistant' && msg.usage && msg.usage.total_tokens > 0 && !msg.isStreaming && (
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <Coins className="h-2.5 w-2.5" />
                      {msg.usage.total_tokens} tokens
                    </span>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-3 w-3 text-secondary-foreground" />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="px-3 py-1.5 bg-destructive/10 text-destructive text-xs border-t">
          {error}
        </div>
      )}

      {/* Input */}
      <div className="p-2.5 border-t">
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
            className="min-h-[48px] resize-none text-sm"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button variant="destructive" size="sm" onClick={stopStreaming} className="self-end h-8 px-2.5">
              <Square className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSend} disabled={!input.trim()} className="self-end h-8 px-2.5">
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
