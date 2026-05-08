import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useConversations, useConversation, useWebSocket, useSendMessage } from '@/hooks/use-messaging';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { MessageSquare, Plus, Send, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function MessagingLayout() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);

  const { data: convData, isLoading } = useConversations();
  const { data: activeConv } = useConversation(activeId || '');
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

  if (isLoading) return <LoadingState message="Loading conversations..." />;

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Conversation List */}
      <Card className="w-80 flex flex-col">
        <div className="p-3 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Messages</h2>
            <Button size="sm" variant="outline" onClick={() => setShowNewDialog(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filtered.map(conv => (
            <button
              key={conv.id}
              className={`w-full text-left p-3 border-b hover:bg-muted/50 transition-colors ${
                activeId === conv.id ? 'bg-muted' : ''
              }`}
              onClick={() => setActiveId(conv.id)}
            >
              <div className="flex justify-between items-start">
                <p className="font-medium text-sm truncate">
                  {conv.title || conv.participants.map(p => p.display_name).join(', ')}
                </p>
                {conv.unread_count > 0 && (
                  <Badge variant="default" className="text-xs">{conv.unread_count}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-1">
                {conv.last_message || 'No messages yet'}
              </p>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No conversations</p>
          )}
        </ScrollArea>
      </Card>

      {/* Active Conversation */}
      <Card className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            <div className="p-3 border-b">
              <h3 className="font-semibold">
                {activeConv.title || activeConv.participants.map(p => p.display_name).join(', ')}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
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
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.sender_id === member?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-xs font-medium mb-1">{msg.sender_name}</p>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
              />
              <Button onClick={handleSend} disabled={!messageInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
