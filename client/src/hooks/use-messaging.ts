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
          qc.invalidateQueries({ queryKey: ['conversations'] });
          if (msg.data?.conversation_id) {
            qc.invalidateQueries({ queryKey: ['conversations', msg.data.conversation_id] });
          }
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
