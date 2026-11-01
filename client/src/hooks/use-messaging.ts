import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/lib/api-client';
import { conversationTitle } from '@/lib/conversation-title';
import { affects, keys } from '@/lib/query-keys';

// REST hooks
export function useConversations() {
  return useQuery({ queryKey: keys.conversations.list(), queryFn: api.fetchConversations, refetchInterval: 30_000 });
}

/** Loading a conversation marks it read on the server, so each load refreshes the list's unread badges. */
export function useConversation(id: string) {
  const qc = useQueryClient();
  const query = useQuery({ queryKey: keys.conversations.detail(id), queryFn: () => api.fetchConversation(id), enabled: !!id });
  const { dataUpdatedAt } = query;
  useEffect(() => {
    if (!id || !dataUpdatedAt) return;
    // List keys only: invalidating `conversations.all` would refetch this detail and loop.
    qc.invalidateQueries({ queryKey: keys.conversations.list() });
  }, [id, dataUpdatedAt, qc]);
  return query;
}

/** Conversation name for the signed-in member: its title, else the other participants (never the caller). */
export function useConversationTitle() {
  const { member } = useAuth();
  const id = member?.id;
  const displayName = member?.display_name;
  return useCallback(
    (conversation: Parameters<typeof conversationTitle>[0]) => conversationTitle(conversation, { id, display_name: displayName }),
    [id, displayName],
  );
}

// NewConversationDialog renders the failure inline and passes `silent`; other callers get the toast.
export function useCreateConversation({ silent = false }: { silent?: boolean } = {}) {
  return useApiMutation({
    mutationFn: api.createConversation,
    invalidates: affects.conversations,
    error: "Couldn't start the conversation",
    silent,
  });
}

export function useConversationMessages(id: string, page = 1) {
  return useQuery({
    queryKey: keys.conversations.messages(id, page),
    queryFn: () => api.fetchConversationMessages(id, page),
    enabled: !!id,
  });
}

export function useSendMessage(conversationId: string) {
  return useApiMutation({
    mutationFn: (content: string) => api.sendConversationMessage(conversationId, content),
    invalidates: affects.conversations,
    error: 'Message not sent',
  });
}

export function useMessageSearch(q: string) {
  return useQuery({
    queryKey: keys.conversations.search(q),
    queryFn: () => api.searchMessages(q),
    enabled: q.length > 2,
  });
}

export function useMemberPicker() {
  return useQuery({ queryKey: keys.members.picker(), queryFn: api.fetchMembersList });
}

// WebSocket hook
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

interface WSMessage {
  type: string;
  data: any;
}

export function useWebSocket(path: string = '/messaging/ws') {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const reconnectAttemptRef = useRef(0);
  const qc = useQueryClient();

  const connect = useCallback(() => {
    // Close any existing connection before reconnecting
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
    }

    let wsUrl: string;
    if (API_BASE_URL) {
      const base = API_BASE_URL.replace(/^http/, 'ws');
      wsUrl = `${base}${path}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${window.location.host}${path}`;
    }
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
      reconnectAttemptRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setLastMessage(msg);
        if (msg.type === 'message') {
          qc.invalidateQueries({ queryKey: keys.conversations.all });
        }
      } catch { /* ignore non-JSON */ }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Exponential backoff: 3s, 6s, 12s, 24s, max 30s
      const delay = Math.min(3000 * Math.pow(2, reconnectAttemptRef.current), 30000);
      reconnectAttemptRef.current += 1;
      reconnectTimeoutRef.current = window.setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();

    wsRef.current = ws;
  }, [path, qc]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { isConnected, lastMessage, send, reconnect: connect };
}
