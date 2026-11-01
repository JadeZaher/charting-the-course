import { useId, useState } from 'react';
import { apiErrorMessage } from '@/lib/api-error-message';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useMemberPicker, useCreateConversation } from '@/hooks/use-messaging';
import { useAuth } from '@/contexts/AuthContext';
import { User, Users, X } from 'lucide-react';
import type { ConversationDetail } from '@/types/api';

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (conversation: ConversationDetail) => void;
}

/** Start a direct message or group chat; shared by /messaging and the floating comms drawer. */
export function NewConversationDialog({ open, onOpenChange, onCreated }: NewConversationDialogProps) {
  const [conversationType, setConversationType] = useState<'direct' | 'group'>('direct');
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const fieldId = useId();

  const { member } = useAuth();
  const { data: membersData, error: membersError } = useMemberPicker();
  const createConversation = useCreateConversation({ silent: true });

  const availableMembers = (membersData?.members || []).filter(
    (candidate) => candidate.id !== member?.id && !selectedMembers.includes(candidate.id),
  );
  const filteredMembers = memberSearch
    ? availableMembers.filter((candidate) =>
        candidate.display_name.toLowerCase().includes(memberSearch.toLowerCase()),
      )
    : availableMembers;

  const reset = () => {
    setConversationType('direct');
    setGroupTitle('');
    setSelectedMembers([]);
    setMemberSearch('');
    createConversation.reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const toggleMember = (id: string) => {
    if (conversationType === 'direct') {
      setSelectedMembers([id]);
    } else {
      setSelectedMembers((previous) =>
        previous.includes(id) ? previous.filter((selectedId) => selectedId !== id) : [...previous, id],
      );
    }
  };

  const handleCreate = () => {
    if (selectedMembers.length === 0) return;
    createConversation.mutate(
      {
        type: conversationType === 'direct' ? 'dm' : 'group',
        title: conversationType === 'group' ? groupTitle || undefined : undefined,
        participant_ids: selectedMembers,
      },
      {
        onSuccess: (conversation) => {
          onCreated(conversation);
          handleOpenChange(false);
        },
      },
    );
  };

  const groupNameId = `${fieldId}-group-name`;
  const memberSearchId = `${fieldId}-member-search`;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Conversation</DialogTitle>
          <DialogDescription>Start a direct message or create a group chat.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2" role="group" aria-label="Conversation type">
            <Button
              variant={conversationType === 'direct' ? 'default' : 'outline'}
              size="sm"
              aria-pressed={conversationType === 'direct'}
              onClick={() => { setConversationType('direct'); setSelectedMembers([]); }}
            >
              <User className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Direct
            </Button>
            <Button
              variant={conversationType === 'group' ? 'default' : 'outline'}
              size="sm"
              aria-pressed={conversationType === 'group'}
              onClick={() => { setConversationType('group'); setSelectedMembers([]); }}
            >
              <Users className="h-4 w-4 mr-1.5" aria-hidden="true" />
              Group
            </Button>
          </div>
          {conversationType === 'group' && (
            <div className="space-y-1.5">
              <Label htmlFor={groupNameId} className="text-sm">Group Name</Label>
              <Input
                id={groupNameId}
                placeholder="e.g. Domain Stewards"
                value={groupTitle}
                onChange={(event) => setGroupTitle(event.target.value)}
              />
            </div>
          )}
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {selectedMembers.map((id) => {
                const selected = membersData?.members.find((candidate) => candidate.id === id);
                const name = selected?.display_name || id;
                return (
                  <Badge key={id} variant="secondary" className="gap-1 pr-1">
                    {name}
                    <button
                      type="button"
                      onClick={() => toggleMember(id)}
                      className="hover:text-destructive"
                      aria-label={`Remove ${name}`}
                    >
                      <X className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor={memberSearchId} className="text-sm">
              {conversationType === 'direct' ? 'Select a member' : 'Add members'}
            </Label>
            <Input
              id={memberSearchId}
              placeholder="Search members..."
              value={memberSearch}
              onChange={(event) => setMemberSearch(event.target.value)}
            />
            <ScrollArea className="h-40 rounded-none border-2 border-strong-border">
              {filteredMembers.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors border-b last:border-0"
                  onClick={() => toggleMember(candidate.id)}
                >
                  {candidate.display_name}
                </button>
              ))}
              {membersError ? (
                <p className="text-xs text-destructive text-center py-4">Couldn't load members</p>
              ) : filteredMembers.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No members found</p>
              )}
            </ScrollArea>
          </div>
          {createConversation.error && (
            <p className="text-xs text-destructive" role="alert">
              {apiErrorMessage(createConversation.error)}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleCreate}
            disabled={selectedMembers.length === 0 || createConversation.isPending}
          >
            {createConversation.isPending ? 'Creating...' : 'Start Chat'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
