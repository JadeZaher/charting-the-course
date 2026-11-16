import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/lib/api-client';
import { memberQueriesEnabled } from '@/lib/member-queries';
import { conversationHeading, conversationTitle } from '@/lib/conversation-title';
import { connectionPhase, type ConnectionPhase } from '@/lib/connection-status';
import { affects, keys } from '@/lib/query-keys';
import { API_BASE_URL } from '@/lib/api-origin';
import { messagingWebSocketUrl } from '@/lib/api-base';

// REST hooks
export function useConversations() {
  const { member } = useAuth();
  return useQuery({ enabled: memberQueriesEnabled(member), queryKey: keys.conversations.list(), queryFn: api.fetchConversations, refetchInterval: 30_000 });
}

/** Loading a conversation marks it read on the server, so each load refreshes the list's unread badges. */
export function useConversation(id: string) {
  const { member } = useAuth();
  const qc = useQueryClient();
  const query = useQuery({ queryKey: keys.conversations.detail(id), queryFn: () => api.fetchConversation(id), enabled: !!id && memberQueriesEnabled(member) });
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

/** Thread heading, including a profile link when the viewer still has a generated name. */
export function useConversationHeading() {
  const { member } = useAuth();
  const id = member?.id;
  const displayName = member?.display_name;
  return useCallback(
    (conversation: Parameters<typeof conversationHeading>[0]) => conversationHeading(conversation, { id, display_name: displayName }),
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
  const { member } = useAuth();
  return useQuery({
    queryKey: keys.conversations.messages(id, page),
    queryFn: () => api.fetchConversationMessages(id, page),
    enabled: !!id && memberQueriesEnabled(member),
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
  const { member } = useAuth();
  return useQuery({
    queryKey: keys.conversations.search(q),
    queryFn: () => api.searchMessages(q),
    enabled: q.length > 2 && memberQueriesEnabled(member),
  });
}

export function useMemberPicker() {
  const { member } = useAuth();
  return useQuery({ enabled: memberQueriesEnabled(member), queryKey: keys.members.picker(), queryFn: api.fetchMembersList });
}

// WebSocket hook
interface WSMessage {
  type: string;
  data: any;
}

export type MessagingConnection = ConnectionPhase | 'idle';

function silence(socket: WebSocket) {
  socket.onopen = null;
  socket.onclose = null;
  socket.onerror = null;
  socket.onmessage = null;
}

export function useWebSocket(path: string = '/messaging/ws') {
  const { member } = useAuth();
  const enabled = memberQueriesEnabled(member);
  // Connecting until the first attempt opens or fails. Idle when messaging is not attempted.
  const [connection, setConnection] = useState<MessagingConnection>(enabled ? 'connecting' : 'idle');
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const reconnectAttemptRef = useRef(0);
  const qc = useQueryClient();

  const connect = useCallback(() => {
    if (!enabled) return;
    setConnection((phase) => (phase === 'idle' ? 'connecting' : connectionPhase(phase, 'start')));
    // Close any existing connection before reconnecting. Drop its handlers so that close is not a failure.
    if (wsRef.current) {
      silence(wsRef.current);
      wsRef.current.close();
    }

    let ws: WebSocket;
    try {
      ws = new WebSocket(messagingWebSocketUrl(API_BASE_URL, window.location, path));
    } catch {
      setConnection((phase) => (phase === 'idle' ? 'disconnected' : connectionPhase(phase, 'failure')));
      return;
    }

    ws.onopen = () => {
      setConnection('connected');
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
      setConnection((phase) => (phase === 'idle' ? 'disconnected' : connectionPhase(phase, 'failure')));
      // Exponential backoff: 3s, 6s, 12s, 24s, max 30s
      const delay = Math.min(3000 * Math.pow(2, reconnectAttemptRef.current), 30000);
      reconnectAttemptRef.current += 1;
      reconnectTimeoutRef.current = window.setTimeout(connect, delay);
    };

    ws.onerror = () => {
      setConnection((phase) => (phase === 'idle' ? 'disconnected' : connectionPhase(phase, 'failure')));
      ws.close();
    };

    wsRef.current = ws;
  }, [path, qc, enabled]);

  useEffect(() => {
    if (!enabled) {
      setConnection('idle');
      return;
    }
    setConnection((phase) => (phase === 'idle' ? 'connecting' : phase));
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        silence(wsRef.current);
        wsRef.current.close();
      }
    };
  }, [connect, enabled]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { isConnected: connection === 'connected', connection, lastMessage, send, reconnect: connect };
}
