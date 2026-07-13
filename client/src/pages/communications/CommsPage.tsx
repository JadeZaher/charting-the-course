import { useState } from 'react';
import ChatPanel from '@/pages/chat/ChatPanel';
import MessagingPanel from './MessagingPanel';
import { Bot, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActiveTab = 'messaging' | 'agent';

export default function CommsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('messaging');

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={() => setActiveTab('messaging')}
          className={cn(
            'flex items-center gap-1.5 rounded-[2px] border-2 border-strong-border px-3 py-1.5 text-sm font-medium transition-colors',
            activeTab === 'messaging'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'hover:bg-muted text-muted-foreground'
          )}
        >
          <MessageSquare className="h-4 w-4" />
          Messages
        </button>
        <button
          onClick={() => setActiveTab('agent')}
          className={cn(
            'flex items-center gap-1.5 rounded-[2px] border-2 border-strong-border px-3 py-1.5 text-sm font-medium transition-colors',
            activeTab === 'agent'
              ? 'border-primary bg-primary text-primary-foreground'
              : 'hover:bg-muted text-muted-foreground'
          )}
        >
          <Bot className="h-4 w-4" />
          AI Agent
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeTab === 'messaging' ? <MessagingPanel /> : <ChatPanel embedded />}
      </div>
    </div>
  );
}
