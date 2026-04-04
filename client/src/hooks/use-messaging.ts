import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '@/lib/api-client';

// REST hooks
export function useConversations() {
  return useQuery({ queryKey: ['conversations'], queryFn: api.fetchConversations, refetchInterval: 30_000 });
}

export function useConversation(id: string) {
  return useQuery({ queryKey: ['conversations', id], queryFn: () => api.fetchConversation(id), enabled: !!id });
}

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createConversation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

export function useConversationMessages(id: string, page?: number) {
  return useQuery({
    queryKey: ['conversations', id, 'messages', page],
    queryFn: () => api.fetchConversationMessages(id, page),
    enabled: !!id,
  });
}

export function useMessageSearch(q: string) {
  return useQuery({
    queryKey: ['messages', 'search', q],
    queryFn: () => api.searchMessages(q),
    enabled: q.length > 2,
  });
}

export function useMemberPicker() {
  return useQuery({ queryKey: ['members', 'picker'], queryFn: api.fetchMembersList });
}

// WebSocket hook
interface WSMessage {
  type: string;
  data: any;
}

export function useWebSocket(url: string = '/messaging/ws') {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number>();
  const qc = useQueryClient();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}${url}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        setLastMessage(msg);
        // Invalidate conversations on new message
        if (msg.type === 'message') {
          qc.invalidateQueries({ queryKey: ['conversations'] });
        }
      } catch { /* ignore non-JSON */ }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Reconnect with exponential backoff
      reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();

    wsRef.current = ws;
  }, [url, qc]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { isConnected, lastMessage, send, reconnect: connect };
}
