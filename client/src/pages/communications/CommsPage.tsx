import { useState } from 'react';
import ChatPanel from '@/pages/chat/ChatPanel';
import MessagingPanel from './MessagingPanel';
import { Bot, MessageSquare } from 'lucide-react';

type ActiveTab = 'split' | 'chat' | 'messaging';

export default function CommsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('split');

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-3">
        <button
          onClick={() => setActiveTab('split')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'split' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
          }`}
        >
          Split View
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'chat' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
          }`}
        >
          <Bot className="h-4 w-4" />
          AI Agent
        </button>
        <button
          onClick={() => setActiveTab('messaging')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'messaging' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Messages
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex gap-4 min-h-0">
        {(activeTab === 'split' || activeTab === 'chat') && (
          <div className={activeTab === 'split' ? 'w-1/2 min-w-0' : 'w-full min-w-0'}>
            <ChatPanel embedded />
          </div>
        )}
        {(activeTab === 'split' || activeTab === 'messaging') && (
          <div className={activeTab === 'split' ? 'w-1/2 min-w-0' : 'w-full min-w-0'}>
            <MessagingPanel />
          </div>
        )}
      </div>
    </div>
  );
}
