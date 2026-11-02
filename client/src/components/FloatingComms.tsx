import { useState, useRef, useEffect, type MutableRefObject } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NewConversationDialog } from '@/components/messaging/NewConversationDialog';
import { LinkifiedText } from '@/components/messaging/LinkifiedText';
import { useQuery } from '@tanstack/react-query';
import { keys } from '@/lib/query-keys';
import { fetchChatSessions, fetchChatSession, updateChatSessionPrivacy } from '@/lib/api-client';
import Markdown from 'react-markdown';
import { PortableRecordDownload } from '@/components/PortableRecordDownload';
import { portableRecordPath } from '@/lib/chat-links';
import remarkGfm from 'remark-gfm';
import { Link, useLocation } from 'wouter';
import { resolveExternalUrl, resolveInternalPath, resolveMediaUrl } from '@/lib/media';
import { ThinkingSteps } from '@/components/chat/ThinkingSteps';
import { useConversations, useConversation, useConversationTitle, useWebSocket, useSendMessage } from '@/hooks/use-messaging';
import { useSSEChat } from '@/hooks/use-chat';
import { chatRouteLabel } from '@/lib/chat-routing';
import { CONFIRM_REPLY, DECLINE_REPLY, TOOL_STATUS_TEXT, pendingConfirmation } from '@/lib/chat-tools';
import { useAuth } from '@/contexts/AuthContext';
import { useSupportChat } from '@/contexts/SupportChatContext';
import { mayRestoreSupportScope } from '@/lib/support-chat';
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
  Lock,
  Globe,
  Share2,
  Copy,
  Check,
} from 'lucide-react';

type Tab = 'messaging' | 'chat';
type ChatPrivacy = 'private' | 'ecosystem' | 'public';
type ChatOperationOwner = { generation: number; privacyRequest: number; historyRequest: number; sessionId: string | null; historyPending: boolean };

export function FloatingComms() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('messaging');
  const chat = useSSEChat();
  const support = useSupportChat();
  const { isNodeAdmin, user, member } = useAuth();
  const priorChatOwner = useRef(user?.id);
  const supportLaunch = useRef(support.launchVersion);
  const priorNodeAdmin = useRef(isNodeAdmin);
  const [chatDraft, setChatDraft] = useState('');
  const [chatPrivacy, setChatPrivacy] = useState<ChatPrivacy>('private');
  const [chatShareToken, setChatShareToken] = useState<string | null>(null);
  const chatOperationOwner = useRef<ChatOperationOwner>({ generation: 0, privacyRequest: 0, historyRequest: 0, sessionId: null, historyPending: false });
  chatOperationOwner.current.sessionId = chat.sessionId;
  useEffect(() => () => { chatOperationOwner.current.generation++; }, []);
  useEffect(() => {
    const requested = supportLaunch.current !== support.launchVersion;
    const revoked = priorNodeAdmin.current && !isNodeAdmin;
    const ownerChanged = priorChatOwner.current !== user?.id;
    priorChatOwner.current = user?.id;
    supportLaunch.current = support.launchVersion;
    priorNodeAdmin.current = isNodeAdmin;
    if (!requested && !revoked && !ownerChanged) return;
    chatOperationOwner.current.generation++;
    chatOperationOwner.current.historyPending = false;
    chatOperationOwner.current.sessionId = null;
    chat.clearMessages();
    setChatDraft(''); setChatPrivacy('private'); setChatShareToken(null);
    if (requested) { setActiveTab('chat'); setOpen(true); }
  }, [support.launchVersion, isNodeAdmin, user?.id, chat.clearMessages]);
  const isMobile = useIsMobile();

  const { data: convData } = useConversations();
  const totalUnread = (convData?.conversations || []).reduce((sum, c) => sum + c.unread_count, 0);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  // Focus moves into the drawer when it opens and back to the launcher when it closes.
  useEffect(() => {
    if (open) {
      panelRef.current?.focus();
    } else if (wasOpenRef.current) {
      launcherRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  const closePanel = () => { setOpen(false); setExpanded(false); };

  // A link followed from the drawer (or any navigation) closes it so it never covers the new page.
  // Focus is left to the shell's post-navigation focus, not returned to the launcher.
  const [location] = useLocation();
  const previousLocationRef = useRef(location);
  useEffect(() => {
    if (location.startsWith('/messaging')) setActiveTab('chat');
    if (previousLocationRef.current === location) return;
    previousLocationRef.current = location;
    wasOpenRef.current = false;
    setOpen(false);
    setExpanded(false);
  }, [location]);

  const messagingPage = location.startsWith('/messaging');
  const visibleTab = messagingPage || !member?.id ? 'chat' : activeTab;

  return (
    <div className={cn('fixed z-50 flex flex-col items-end gap-3', isMobile ? 'bottom-4 right-4' : 'bottom-6 right-6')}>
      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Communications"
          tabIndex={-1}
          onKeyDown={(event) => {
            // Portaled dialogs (new conversation) handle their own Escape.
            if (event.key === 'Escape' && panelRef.current?.contains(event.target as Node)) closePanel();
          }}
          className={cn(
            'max-h-[calc(100dvh-6rem)] border-2 border-strong-border bg-background flex flex-col overflow-hidden transition-[width,height] duration-200 motion-reduce:transition-none',
            expanded
              ? isMobile ? 'w-[calc(100vw-2rem)] h-[85vh]' : 'w-[85vw] h-[85vh] max-w-[1200px]'
              : isMobile ? 'w-[calc(100vw-2rem)] h-[70vh]' : 'w-[420px] h-[560px]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-1 px-2 py-2.5 bg-primary text-primary-foreground flex-shrink-0">
            <div className="flex min-w-0 items-center gap-1">
              {/* Tabs */}
              {!messagingPage && !!member?.id && <button
                onClick={() => setActiveTab('messaging')}
                aria-pressed={visibleTab === 'messaging'}
                className={cn(
                  'flex min-h-11 items-center gap-1.5 border border-primary-foreground/40 px-3 py-1.5 text-sm font-bold transition-colors motion-reduce:transition-none',
                  visibleTab === 'messaging'
                    ? 'bg-primary-foreground/20'
                    : 'hover:bg-primary-foreground/10'
                )}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Messaging
                {totalUnread > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-4 min-w-4 px-1">
                    {totalUnread}
                  </Badge>
                )}
              </button>}
              <button
                onClick={() => setActiveTab('chat')}
                aria-pressed={visibleTab === 'chat'}
                className={cn(
                  'flex min-h-11 items-center gap-1.5 border border-primary-foreground/40 px-3 py-1.5 text-sm font-bold transition-colors motion-reduce:transition-none',
                  visibleTab === 'chat'
                    ? 'bg-primary-foreground/20'
                    : 'hover:bg-primary-foreground/10'
                )}
              >
                <Bot className="h-3.5 w-3.5" />
                AI Chat
              </button>
            </div>
            <div className="flex flex-shrink-0 items-center gap-1">
              <button
                onClick={() => setExpanded(e => !e)}
                className="min-h-11 min-w-11 p-1.5 hover:bg-primary-foreground/10 transition-colors"
                aria-label={expanded ? 'Minimize' : 'Expand'}
              >
                {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button
                onClick={closePanel}
                className="min-h-11 min-w-11 p-1.5 hover:bg-primary-foreground/10 transition-colors"
                aria-label="Close communications"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {visibleTab === 'messaging' ? <MessagingTab expanded={expanded} /> : (
              <ChatTab expanded={expanded} chat={chat} input={chatDraft} setInput={setChatDraft}
                privacy={chatPrivacy} setPrivacy={setChatPrivacy} shareToken={chatShareToken} setShareToken={setChatShareToken}
                operationOwner={chatOperationOwner} />
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <Button
        ref={launcherRef}
        size="icon"
        className="h-14 w-14 min-h-[48px] min-w-[48px] border-2 border-strong-border"
        onClick={() => (open ? closePanel() : setOpen(true))}
        aria-label={open ? 'Close communications' : 'Open communications'}
        aria-expanded={open}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <div className="relative">
            {messagingPage ? <Bot className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
            {!messagingPage && totalUnread > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center border border-background bg-destructive px-0.5 text-[10px] font-bold text-destructive-foreground">
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

  const { data: convData, isLoading, error: convError } = useConversations();
  const { data: activeConv, error: activeConvError } = useConversation(activeId || '');
  const { isConnected } = useWebSocket();
  const { member } = useAuth();
  const sendMessageMutation = useSendMessage(activeId || '');

  const conversations = convData?.conversations || [];
  const filtered = searchQuery
    ? conversations.filter(c =>
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const handleSend = () => {
    if (!messageInput.trim() || !activeId) return;
    const content = messageInput;
    setMessageInput('');
    sendMessageMutation.mutate(content);
  };

  // On mobile-ish (non-expanded), show either list or conversation
  const showConversation = activeId && activeConv;
  const conversationFailed = !!activeId && !activeConv && !!activeConvError;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (convError) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4">
        <p className="text-sm text-destructive">Couldn't load conversations</p>
        <p className="text-xs text-muted-foreground mt-1">{(convError as Error).message}</p>
      </div>
    );
  }

  const newConvDialog = (
    <NewConversationDialog
      open={showNewDialog}
      onOpenChange={setShowNewDialog}
      onCreated={(conversation) => setActiveId(conversation.id)}
    />
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
          ) : conversationFailed ? (
            <ConversationLoadError />
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

  if (conversationFailed) {
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
        <ConversationLoadError />
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
  const titleOf = useConversationTitle();
  return (
    <div className="flex flex-col h-full">
      <div className="p-2.5 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Messages</h3>
          {onNewConversation && (
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={onNewConversation} aria-label="New conversation">
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            aria-label="Search conversations"
            className="pl-7 h-8 text-sm"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {conversations.map(conv => {
          const titleId = `comms-conversation-${conv.id}-title`;
          const unreadId = `comms-conversation-${conv.id}-unread`;
          const previewId = `comms-conversation-${conv.id}-preview`;
          return (
            <button
              key={conv.id}
              className={cn(
                'w-full text-left px-3 py-2.5 border-b hover:bg-muted/50 transition-colors',
                activeId === conv.id && 'bg-muted'
              )}
              onClick={() => onSelect(conv.id)}
              aria-current={activeId === conv.id ? 'true' : undefined}
              aria-labelledby={conv.unread_count > 0 ? `${titleId} ${unreadId}` : titleId}
              aria-describedby={previewId}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-1.5 min-w-0">
                  {conv.type === 'group' ? (
                    <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                  )}
                  <p id={titleId} className="font-medium text-xs truncate">
                    {titleOf(conv)}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <Badge id={unreadId} variant="default" className="text-[10px] h-4 min-w-4 px-1 ml-1 flex-shrink-0">
                    {conv.unread_count} unread
                  </Badge>
                )}
              </div>
              <p id={previewId} className="text-[11px] text-muted-foreground truncate mt-0.5 pl-5">
                {conv.last_message || 'No messages yet'}
              </p>
            </button>
          );
        })}
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
  const titleOf = useConversationTitle();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv?.messages]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Conversation header */}
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm truncate">
            {titleOf(conv)}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={cn('h-1.5 w-1.5', isConnected ? 'bg-success' : 'bg-destructive')} />
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
                  'max-w-[80%] border-2 border-strong-border px-3 py-2',
                  msg.sender_id === memberId
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted rounded-bl-sm'
                )}
              >
                <p className="text-[10px] font-medium mb-0.5 opacity-80">{msg.sender_name}</p>
                <p className="text-xs whitespace-pre-wrap"><LinkifiedText text={msg.content} /></p>
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
          aria-label="Message"
          className="h-8 text-sm"
        />
        <Button size="sm" onClick={onSend} disabled={!messageInput.trim()} className="h-8 px-2.5" aria-label="Send message">
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
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

function ConversationLoadError() {
  return (
    <div className="flex-1 flex items-center justify-center text-destructive">
      <div className="text-center">
        <p className="text-sm">Couldn't load this conversation</p>
      </div>
    </div>
  );
}

/* ─── Chat Tab (AI Governance Agent) ─────────────────────────────────── */

interface ChatTabProps {
  expanded: boolean;
  chat: ReturnType<typeof useSSEChat>;
  input: string;
  setInput: (value: string) => void;
  privacy: ChatPrivacy;
  setPrivacy: (value: ChatPrivacy) => void;
  shareToken: string | null;
  setShareToken: (value: string | null) => void;
  operationOwner: MutableRefObject<ChatOperationOwner>;
}

function ChatTab({ expanded, chat, input, setInput, privacy, setPrivacy, shareToken, setShareToken, operationOwner }: ChatTabProps) {
  const { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages: clearChat, loadSession, sessionId, activeRoute, limitReached, maxMessages } = chat;
  const { selected: ecosystem, isAll, isMulti, selectedIds, ecosystems } = useEcosystem();
  const { getAISummary } = usePageContext();
  const { member, isNodeAdmin } = useAuth();
  const support = useSupportChat();
  const [showSessions, setShowSessions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const sessionsParams = { limit: 20 };
  const { data: sessionsData } = useQuery({
    queryKey: keys.chatSessions.list(sessionsParams),
    queryFn: () => fetchChatSessions(sessionsParams),
    staleTime: 30_000,
    enabled: showSessions,
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearMessages = () => {
    operationOwner.current.generation++;
    operationOwner.current.sessionId = null;
    operationOwner.current.historyPending = false;
    clearChat();
    setPrivacy('private');
    setShareToken(null);
    setActionError(null);
    setCopied(false);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  };

  const sendText = (text: string) => {
    if (!text.trim() || isStreaming || limitReached) return;
    if (operationOwner.current.historyPending) {
      operationOwner.current.historyRequest++;
      operationOwner.current.historyPending = false;
    }
    sendMessage(text, {
      selectedEcosystemIds: support.context ? [support.context.organization_id] : selectedIds,
      supportContext: support.context,
      pageContextSummary: getAISummary(),
      member: member ? { id: member.id, display_name: member.display_name } : undefined,
      ecosystemName: ecosystem?.name,
    });
  };

  const handleSend = () => {
    if (!input.trim() || isStreaming || limitReached) return;
    sendText(input);
    setInput('');
  };

  // An irreversible act the assistant asked about in its latest reply; the member answers here or by typing.
  const confirmation = pendingConfirmation(messages);

  const cyclePrivacy = async () => {
    if (!sessionId) return;
    const generation = operationOwner.current.generation;
    const request = ++operationOwner.current.privacyRequest;
    const ownsRequest = () => operationOwner.current.generation === generation
      && operationOwner.current.sessionId === sessionId && operationOwner.current.privacyRequest === request;
    setActionError(null);
    const cycle: ChatPrivacy[] = ['private', 'ecosystem', 'public'];
    const next = cycle[(cycle.indexOf(privacy) + 1) % cycle.length];
    try {
      const res = await updateChatSessionPrivacy(sessionId, next);
      if (!ownsRequest()) return;
      setPrivacy(res.privacy as ChatPrivacy);
      setShareToken(res.share_token);
    } catch { if (ownsRequest()) setActionError('Could not change who can see this conversation. Try again.'); }
  };

  const handleShare = async () => {
    if (!shareToken) return;
    const generation = operationOwner.current.generation;
    const ownsRequest = () => operationOwner.current.generation === generation && operationOwner.current.sessionId === sessionId;
    try {
      const url = `${window.location.origin}/chat/shared/${shareToken}`;
      await navigator.clipboard.writeText(url);
      if (!ownsRequest()) return;
      setCopied(true);
      setTimeout(() => { if (ownsRequest()) setCopied(false); }, 2000);
    } catch { if (ownsRequest()) setActionError('Could not copy the conversation link. Try again.'); }
  };

  if (showSessions) {
    const sessions = sessionsData?.sessions ?? [];
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <button onClick={() => { operationOwner.current.historyRequest++; operationOwner.current.historyPending = false; setShowSessions(false); }} className="rounded-[2px] border-2 border-strong-border p-1 transition-colors hover:bg-muted" aria-label="Back to chat">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="text-sm font-semibold">Chat History</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { clearMessages(); setShowSessions(false); }} disabled={isStreaming} className="h-7 px-2 text-xs">
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
                  const generation = operationOwner.current.generation;
                  const request = ++operationOwner.current.historyRequest;
                  const ownsRequest = () => operationOwner.current.generation === generation && operationOwner.current.historyRequest === request;
                  operationOwner.current.historyPending = true;
                  setActionError(null);
                  try {
                    const detail = await fetchChatSession(s.id);
                    if (!ownsRequest()) return;
                    if (!mayRestoreSupportScope(detail.support_context, isNodeAdmin)) throw new Error('Node support authority is required for this session.');
                    support.restore(detail.support_context);
                    const msgs = detail.messages.map((m: any) => ({
                      role: m.role as 'user' | 'assistant',
                      content: m.content,
                    }));
                    operationOwner.current.historyPending = false;
                    operationOwner.current.generation++;
                    loadSession(s.id, msgs, detail.skill);
                    operationOwner.current.sessionId = s.id;
                    setPrivacy(detail.privacy === 'public' || detail.privacy === 'ecosystem' ? detail.privacy : 'private');
                    setShareToken(detail.share_token);
                    setCopied(false);
                    setActionError(null);
                    setShowSessions(false);
                  } catch {
                    if (ownsRequest()) {
                      operationOwner.current.historyPending = false;
                      setActionError('Could not load this conversation. Try again.');
                    }
                  }
                }}
              >
                <p className="text-xs font-medium truncate">{s.title || 'Untitled session'}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                  <span>{s.message_count} messages</span>
                  {s.support_context && <span>Node support</span>}
                  {s.created_at && (
                    <span>{new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  )}
                </div>
              </button>
            ))
          )}
        </ScrollArea>
        {actionError && <p role="alert" className="border-t px-3 py-2 text-xs text-destructive">{actionError}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Sub-header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Governance Agent</span>
          <Badge variant="outline" className="text-[10px] h-5">
            <Building2 className="h-2.5 w-2.5 mr-0.5" />
            {support.context ? 'Node support' : isAll ? 'All' : isMulti ? `${selectedIds.length} ecosystems` : ecosystem?.name ?? 'Ecosystem'}
          </Badge>
        </div>
        <div className="flex items-center gap-0.5">
          {sessionId && !support.context && (
            <>
              <Button variant="ghost" size="sm" onClick={cyclePrivacy} className="h-7 px-1.5 text-xs" title={`Privacy: ${privacy}`} aria-label={`Conversation visibility: ${privacy}`}>
                {privacy === 'private' ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
              </Button>
              {privacy !== 'private' && shareToken && (
                <Button variant="ghost" size="sm" onClick={handleShare} className="h-7 px-1.5 text-xs" title="Copy share link" aria-label="Copy share link">
                  {copied ? <Check className="h-3 w-3 text-success" /> : <Share2 className="h-3 w-3" />}
                </Button>
              )}
            </>
          )}
          <Button variant="ghost" size="sm" onClick={() => setShowSessions(true)} className="h-7 px-2 text-xs" title="Chat history" aria-label="Chat history" disabled={isStreaming}>
            <History className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={clearMessages} disabled={messages.length === 0 || isStreaming} className="h-7 px-2 text-xs">
            <Trash2 className="h-3 w-3 mr-1" /> Clear
          </Button>
        </div>
      </div>

      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isStreaming ? activeRoute ? chatRouteLabel(activeRoute) : 'Choosing how to help.'
          : [...messages].reverse().find(message => message.role === 'assistant' && message.content)?.content.slice(0, 800) ?? ''}
      </div>

      {support.context && <div className="border-b p-3 space-y-2 text-xs" role="status"><p className="font-bold break-all">Node admin support for organization {support.context.organization_id}</p><p className="whitespace-pre-wrap break-words">Public reason category: {support.context.reason}</p><p>Support actions are public. Member consent is never impersonated.</p><Button variant="outline" size="sm" disabled={isStreaming} onClick={() => support.leave()}>Leave support mode and start member chat</Button></div>}
      {/* Messages */}
      <ScrollArea className="flex-1 px-3 py-2">
        <div className="space-y-3">
          {/* Welcome */}
          {messages.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">NEOS Governance Agent</p>
              <p className="text-xs mt-1 max-w-xs mx-auto">
                Ask about the platform or how a decision works. Ask it to act for you. It will ask for your OK when needed.
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 mt-4">
                {['Explain this page', 'How does consent work?', 'Put forward a proposal', 'Report a conflict'].map(s => (
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
              {(msg.routing || msg.skill) && (
                <div className="my-2 flex items-center justify-center gap-1.5 border-y border-border bg-primary/5 px-2 py-1.5 text-xs" data-testid="agent-reply-mode">
                  <ArrowRight className="h-3 w-3 text-primary" />
                  <span className="font-semibold text-primary">{chatRouteLabel(msg.routing ?? { mode: 'skill', skill: msg.skill!, source: 'manual' })}</span>
                </div>
              )}

              <div className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center bg-primary">
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
                          className="rounded-r-sm border-l-2 border-primary bg-muted/50 px-2 py-1 text-[10px]"
                        >
                          <div className="flex flex-wrap items-center gap-1.5">
                          <Wrench className="h-2.5 w-2.5 text-muted-foreground" aria-hidden="true" />
                          <span>{tool.label ?? tool.name.replace(/_/g, ' ')}</span>
                          <Badge
                            variant={
                              tool.status === 'success' ? 'default'
                                : tool.status === 'error' ? 'destructive'
                                : tool.status === 'needs_confirmation' ? 'outline'
                                : 'secondary'
                            }
                            className="text-[9px] px-1 py-0 h-3.5"
                          >
                            {TOOL_STATUS_TEXT[tool.status]}
                          </Badge>
                          </div>
                          {(tool.status === 'error' || tool.status === 'unknown') && tool.error && (
                            <p role="status" className={cn('mt-1 text-xs', tool.status === 'error' ? 'text-destructive' : 'text-muted-foreground')}>{tool.error}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className={cn(
                      'border-2 border-strong-border px-3 py-2',
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
                              const internalHref = resolveInternalPath(href);
                              if(internalHref&&portableRecordPath(internalHref))return <PortableRecordDownload href={internalHref}>{children}</PortableRecordDownload>;
                              if (internalHref) {
                                return <Link href={internalHref} className="text-primary underline hover:text-primary/80">{children}</Link>;
                              }
                              const safeHref = resolveExternalUrl(href);
                              return safeHref
                                ? <a href={safeHref} target="_blank" rel="noopener noreferrer">{children}</a>
                                : <span>{children}</span>;
                            },
                            img: ({ src, alt }) => {
                              const internalSrc = resolveInternalPath(src);
                              const safeSrc = resolveMediaUrl(internalSrc);
                              return safeSrc
                                ? <img src={safeSrc} alt={alt || ''} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="my-2 max-h-48 w-auto border-2 border-strong-border object-contain" />
                                : <span role="note" className="my-2 block border border-border px-2 py-1 text-[10px] text-muted-foreground">{alt ? `External image blocked: ${alt}` : 'External image blocked'}</span>;
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
                      {msg.artifacts.map((a, ai) => {
                        const route = resolveInternalPath(a.route);
                        return route ? (
                          <Link
                            key={ai}
                            href={route}
                            className="inline-flex items-center gap-1 rounded-[2px] border-2 border-primary bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary transition-colors hover:bg-primary/20"
                          >
                            <ArrowRight className="h-2.5 w-2.5" />
                            {a.label}
                          </Link>
                        ) : null;
                      })}
                    </div>
                  )}

                </div>

                {msg.role === 'user' && (
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center bg-secondary">
                    <User className="h-3 w-3 text-secondary-foreground" />
                  </div>
                )}
              </div>
            </div>
          ))}
          {confirmation && !isStreaming && (
            <div role="group" aria-label="Confirm this action" className="ml-8 space-y-2 border-2 border-strong-border bg-background px-3 py-2">
              <p className="text-xs font-semibold">Confirm this action</p>
              <p id="agent-confirmation-description" className="text-xs">{confirmation}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="h-9 px-3 text-xs" disabled={limitReached} aria-describedby="agent-confirmation-description" onClick={() => sendText(CONFIRM_REPLY)}>
                  Yes, go ahead
                </Button>
                <Button size="sm" variant="outline" className="h-9 px-3 text-xs" disabled={limitReached} aria-describedby="agent-confirmation-description" onClick={() => sendText(DECLINE_REPLY)}>
                  No, cancel
                </Button>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Error */}
      {(error || actionError) && (
        <div role="alert" className="px-3 py-1.5 bg-destructive/10 text-destructive text-xs border-t">
          {error || actionError}
        </div>
      )}

      {/* Input */}
      <div className="p-2.5 border-t">
        {limitReached && (
          <div className="mb-2 space-y-2 text-xs" role="status">
            <p>This conversation has reached {maxMessages} messages. Start a new conversation to continue.</p>
            <Button variant="outline" size="sm" onClick={clearMessages} disabled={isStreaming}>Start a new conversation</Button>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask the governance agent..."
            aria-label="Message the governance agent"
            className="min-h-[48px] resize-none text-sm"
            disabled={isStreaming}
          />
          {isStreaming ? (
            <Button variant="destructive" size="sm" onClick={stopStreaming} className="self-end h-8 px-2.5" aria-label="Stop response">
              <Square className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSend} disabled={!input.trim() || limitReached} className="self-end h-8 px-2.5" aria-label="Send message">
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
