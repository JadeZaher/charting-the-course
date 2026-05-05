import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useConversations, useConversation, useWebSocket, useMemberPicker, useCreateConversation } from '@/hooks/use-messaging';
import { MessageSquare, Plus, Send, Search, Users, User, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function MessagingPanel() {
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
  const { send, isConnected } = useWebSocket();
  const { member } = useAuth();
  const { data: membersData } = useMemberPicker();
  const createConversation = useCreateConversation();

  const conversations = convData?.conversations || [];
  const availableMembers = (membersData?.members || []).filter(
    m => m.id !== member?.id && !selectedMembers.includes(m.id)
  );
  const filteredMembers = memberSearch
    ? availableMembers.filter(m =>
        m.display_name.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : availableMembers;

  const filtered = searchQuery
    ? conversations.filter(c =>
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  const handleSend = () => {
    if (!messageInput.trim() || !activeId) return;
    send({ type: 'message', conversation_id: activeId, content: messageInput });
    setMessageInput('');
  };

  const handleCreateConversation = () => {
    if (selectedMembers.length === 0) return;
    createConversation.mutate(
      {
        type: newConvType,
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

  const resetDialog = () => {
    setShowNewDialog(false);
    setNewConvType('direct');
    setNewConvTitle('');
    setSelectedMembers([]);
    setMemberSearch('');
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

  return (
    <div className="h-full flex gap-3">
      {/* Conversation List */}
      <Card className="w-64 flex flex-col flex-shrink-0">
        <div className="p-2.5 border-b space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Messages</h2>
            <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={() => setShowNewDialog(true)}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-7 h-8 text-sm"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <ScrollArea className="flex-1">
          {filtered.map(conv => (
            <button
              key={conv.id}
              className={`w-full text-left p-2.5 border-b hover:bg-muted/50 transition-colors ${
                activeId === conv.id ? 'bg-muted' : ''
              }`}
              onClick={() => setActiveId(conv.id)}
            >
              <div className="flex justify-between items-start gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  {conv.type === 'group' ? (
                    <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  <p className="font-medium text-xs truncate">
                    {conv.title || conv.participants.map(p => p.display_name).join(', ')}
                  </p>
                </div>
                {conv.unread_count > 0 && (
                  <Badge variant="default" className="text-[10px] h-4 px-1">{conv.unread_count}</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5 pl-5">
                {conv.last_message || 'No messages yet'}
              </p>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No conversations</p>
          )}
        </ScrollArea>
      </Card>

      {/* Active Conversation */}
      <Card className="flex-1 flex flex-col min-w-0">
        {activeConv ? (
          <>
            <div className="p-2.5 border-b">
              <div className="flex items-center gap-2">
                {activeConv.type === 'group' ? (
                  <Users className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
                <h3 className="font-semibold text-sm truncate">
                  {activeConv.title || activeConv.participants.map(p => p.display_name).join(', ')}
                </h3>
              </div>
              <div className="flex items-center gap-2 mt-0.5 pl-6">
                <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Disconnected'}
                  {activeConv.type === 'group' && ` · ${activeConv.participants.length} members`}
                </span>
              </div>
            </div>
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-3">
                {activeConv.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === member?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg p-2.5 ${
                        msg.sender_id === member?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {activeConv.type === 'group' && msg.sender_id !== member?.id && (
                        <p className="text-xs font-medium mb-0.5 opacity-80">{msg.sender_name}</p>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-[10px] opacity-60 mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-2.5 border-t flex gap-2">
              <Input
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Type a message..."
                className="h-9 text-sm"
              />
              <Button size="sm" onClick={handleSend} disabled={!messageInput.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Select a conversation</p>
              <p className="text-xs mt-1">or start a new one</p>
            </div>
          </div>
        )}
      </Card>

      {/* New Conversation Dialog */}
      <Dialog open={showNewDialog} onOpenChange={(open) => { if (!open) resetDialog(); else setShowNewDialog(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>
              Start a direct message or create a group chat.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Type toggle */}
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

            {/* Group name */}
            {newConvType === 'group' && (
              <div className="space-y-1.5">
                <Label htmlFor="group-name" className="text-sm">Group Name</Label>
                <Input
                  id="group-name"
                  placeholder="e.g. Domain Stewards"
                  value={newConvTitle}
                  onChange={e => setNewConvTitle(e.target.value)}
                />
              </div>
            )}

            {/* Selected members */}
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedMembers.map(id => {
                  const m = membersData?.members.find(m => m.id === id);
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

            {/* Member search */}
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
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-0 ${
                      selectedMembers.includes(m.id) ? 'bg-primary/10' : ''
                    }`}
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
    </div>
  );
}
