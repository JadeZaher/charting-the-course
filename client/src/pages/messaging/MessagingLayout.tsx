import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearch } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConversations, useConversation, useConversationTitle, useWebSocket, useSendMessage } from '@/hooks/use-messaging';
import { QueryState } from '@/components/QueryState';
import { MessageSquare, Plus, Send, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { NewConversationDialog } from '@/components/messaging/NewConversationDialog';
import { LinkifiedText } from '@/components/messaging/LinkifiedText';
import { conversationIdFromQuery } from '@/lib/exchange';

export default function MessagingLayout() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const threadHeadingRef = useRef<HTMLHeadingElement>(null);
  // Set when the member opens a conversation; the thread heading takes focus once it renders.
  const focusThreadRef = useRef(false);

  const conversationsQuery = useConversations();
  const convData = conversationsQuery.data;
  const conversationQuery = useConversation(activeId || '');
  const activeConv = conversationQuery.data;
  const { isConnected } = useWebSocket();
  const { member } = useAuth();
  const sendMessageMutation = useSendMessage(activeId || '');
  const titleOf = useConversationTitle();

  const openConversation = (id: string) => {
    focusThreadRef.current = true;
    setActiveId(id);
  };

  // `/messaging?conversation=<id>` (the bell, "Open the conversation") opens that thread, then the link is dropped.
  const [location, navigate] = useLocation();
  const linkedId = conversationIdFromQuery(useSearch());
  useEffect(() => {
    if (!linkedId) return;
    focusThreadRef.current = true;
    setActiveId(linkedId);
    navigate(location, { replace: true });
  }, [linkedId, location, navigate]);

  useEffect(() => {
    if (!focusThreadRef.current || !activeConv || activeConv.id !== activeId) return;
    focusThreadRef.current = false;
    threadHeadingRef.current?.focus();
  }, [activeConv, activeId]);

  const conversations = convData?.conversations || [];
  const query = searchQuery.toLowerCase();
  const filtered = searchQuery
    ? conversations.filter(c =>
        titleOf(c).toLowerCase().includes(query) ||
        c.last_message?.toLowerCase().includes(query)
      )
    : conversations;

  const handleSend = () => {
    if (!messageInput.trim() || !activeId) return;
    const content = messageInput;
    setMessageInput('');
    sendMessageMutation.mutate(content);
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Conversation List */}
      <Card className="w-80 flex flex-col">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Messages</h2>
            <Button size="sm" variant="outline" onClick={() => setShowNewDialog(true)} aria-label="New conversation">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder="Search..."
              aria-label="Search conversations"
              className="pl-8"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          <QueryState
            query={conversationsQuery}
            isEmpty={(data) => data.conversations.length === 0}
            empty={<p className="text-sm text-muted-foreground text-center py-8">No conversations</p>}
            errorTitle="We couldn't load conversations"
          >
            {() => (
              <>
                {filtered.map(conv => {
                  // Name = title + unread; the preview is the description, not part of the name.
                  const titleId = `conversation-${conv.id}-title`;
                  const unreadId = `conversation-${conv.id}-unread`;
                  const previewId = `conversation-${conv.id}-preview`;
                  return (
                    <button
                      key={conv.id}
                      className={`w-full text-left p-3 border-b hover:bg-muted/50 transition-colors ${
                        activeId === conv.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => openConversation(conv.id)}
                      aria-current={activeId === conv.id ? 'true' : undefined}
                      aria-labelledby={conv.unread_count > 0 ? `${titleId} ${unreadId}` : titleId}
                      aria-describedby={previewId}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <p id={titleId} className="font-medium text-sm truncate">
                          {titleOf(conv)}
                        </p>
                        {conv.unread_count > 0 && (
                          <Badge id={unreadId} variant="default" className="shrink-0 text-xs">
                            {conv.unread_count} unread
                          </Badge>
                        )}
                      </div>
                      <p id={previewId} className="text-xs text-muted-foreground truncate mt-1">
                        {conv.last_message || 'No messages yet'}
                      </p>
                    </button>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No conversations</p>
                )}
              </>
            )}
          </QueryState>
        </ScrollArea>
      </Card>

      {/* Active Conversation */}
      <Card className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            <div className="p-3 border-b">
              <h3 ref={threadHeadingRef} tabIndex={-1} className="font-semibold">
                {titleOf(activeConv)}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`h-2 w-2 ${isConnected ? 'bg-success' : 'bg-destructive'}`} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {activeConv.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === member?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] border p-3 ${
                        msg.sender_id === member?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-xs font-medium mb-1">{msg.sender_name}</p>
                      <p className="text-sm whitespace-pre-wrap"><LinkifiedText text={msg.content} /></p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-3 border-t flex gap-2">
              <Input
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                aria-label="Message"
              />
              <Button onClick={handleSend} disabled={!messageInput.trim()} aria-label="Send message">
                <Send className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </>
        ) : activeId && conversationQuery.isError ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <p role="alert" className="border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive">
              We couldn't open this conversation. It may not include you, or it no longer exists.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </Card>

      <NewConversationDialog
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
        onCreated={(conversation) => openConversation(conversation.id)}
      />
    </div>
  );
}
