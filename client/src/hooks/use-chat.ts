import { useState, useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { applyToolResult, refreshAfterTool, settleChatResponse, type ToolChip } from '@/lib/chat-tools';
import { useAuth } from '@/contexts/AuthContext';
import { createChatStreamParser } from '@/lib/chat-stream';
import type { SupportChatScope } from '@/lib/support-chat';
import { applyChatRoute, conversationLimit, readChatRoute, type ChatRoute } from '@/lib/chat-routing';

/** A tool call in an assistant message: plain label, status, and the confirmation it waits on. */
export type ToolExecution = ToolChip;

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ThinkingStep {
  step: string;
  tool?: string;
  timestamp: number;
}

export interface ArtifactLink {
  type: string;
  id: string;
  business_key: string | null;
  route: string;
  label: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  tools?: ToolExecution[];
  skill?: string;
  routing?: ChatRoute;
  usage?: TokenUsage;
  thinkingSteps?: ThinkingStep[];
  artifacts?: ArtifactLink[];
}

const BASE_URL = import.meta.env.VITE_API_URL || '';

/** Hard cap on user messages per conversation (matches server-side limit). */
const MAX_CONVERSATION_MESSAGES = 20;

export interface ChatContext {
  supportContext?: SupportChatScope | null;
  /** Selected ecosystem IDs from context */
  selectedEcosystemIds?: string[];
  /** Summary of active page context (entity, filters, etc.) */
  pageContextSummary?: string;
  /** Authenticated member info */
  member?: { id: string; display_name: string };
  /** Current ecosystem name */
  ecosystemName?: string;
  requestedSkill?: string | null;
}

function buildHistory(messages: ChatMessage[]): { role: string; content: string }[] {
  return messages
    .filter(m => m.content && !m.isStreaming)
    .map(m => ({ role: m.role, content: m.content }));
}

export function useSSEChat() {
  const queryClient = useQueryClient();
  const { refreshSession } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [activeRoute, setActiveRoute] = useState<ChatRoute | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { userCount: userMessageCount, reached: limitReached } = conversationLimit(messages, MAX_CONVERSATION_MESSAGES);
  useEffect(() => () => { abortRef.current?.abort(); abortRef.current = null; }, []);

  const sendMessage = useCallback(async (content: string, ctx?: ChatContext) => {
    if (abortRef.current || !content.trim()) return;
    setError(null);

    const currentUserCount = conversationLimit(messages, MAX_CONVERSATION_MESSAGES).userCount + 1;
    if (currentUserCount > MAX_CONVERSATION_MESSAGES) {
      setError(`Conversation limit reached (${MAX_CONVERSATION_MESSAGES} messages). Please start a new conversation.`);
      return;
    }

    const history = buildHistory(messages);

    setMessages(prev => [...prev, { role: 'user', content }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true, tools: [] }]);
    setIsStreaming(true);
    setActiveRoute(null);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const response = await fetch(`${BASE_URL}/api/v1/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: content,
          history,
          active_skill: activeSkill,
          requested_skill: ctx?.requestedSkill ?? null,
          session_id: sessionId,
          ...(ctx?.supportContext ? { support_context: ctx.supportContext } : {}),
          page_context: {
            path: window.location.pathname,
            hash: window.location.hash,
            search: window.location.search,
            ...(ctx?.pageContextSummary ? { active_view: ctx.pageContextSummary } : {}),
            ...(ctx?.member ? { member_id: ctx.member.id, member_name: ctx.member.display_name } : {}),
            ...(ctx?.ecosystemName ? { ecosystem_name: ctx.ecosystemName } : {}),
          },
          selected_ecosystem_ids: ctx?.selectedEcosystemIds ?? [],
        }),
        signal: abort.signal,
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        throw new Error(errBody?.error || 'Chat request failed');
      }
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const parser = createChatStreamParser();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        for (const event of parser.feed(decoder.decode(value, { stream: true }))) handleEvent(event.type, event.data);
      }
      for (const event of parser.finish(decoder.decode())) handleEvent(event.type, event.data);
    } catch (err) {
      if (abortRef.current === abort && (err as Error).name !== 'AbortError') {
        setError((err as Error).message);
        setMessages(prev => prev.filter(m => !(m.role === 'assistant' && m.isStreaming && !m.content && !m.tools?.length)));
      }
    } finally {
      if (abortRef.current !== abort) return;
      setIsStreaming(false);
      abortRef.current = null;
      setMessages(prev => settleChatResponse(prev));
    }

    function handleEvent(eventType: string, data: string) {
      if (abortRef.current !== abort || abort.signal.aborted) return;
      switch (eventType) {
        case 'append': {
          if (data.trim()) {
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                updated[updated.length - 1] = { ...last, content: last.content + data };
              }
              return updated;
            });
          }
          break;
        }

        case 'tool_start': {
          try {
            const { name, label } = JSON.parse(data);
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                const tools = [...(last.tools || []), { name, label, status: 'running' as const }];
                updated[updated.length - 1] = { ...last, tools };
              }
              return updated;
            });
          } catch { /* ignore */ }
          break;
        }

        case 'tool_result': {
          try {
            const event = JSON.parse(data);
            const { artifact } = event;
            if (ctx?.supportContext && ['node_support_command', 'node_support_prepare_proposal'].includes(event.name) && event.success === true && !event.needs_confirmation) {
              void queryClient.invalidateQueries();
              void refreshSession();
            }
            const refresh = refreshAfterTool(event);
            for (const queryKey of refresh.queryKeys) void queryClient.invalidateQueries({ queryKey });
            if (refresh.refreshSession) void refreshSession();
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                const tools = applyToolResult(last.tools || [], event);
                const artifacts = artifact
                  ? [...(last.artifacts || []), artifact as ArtifactLink]
                  : last.artifacts;
                updated[updated.length - 1] = { ...last, tools, ...(artifacts ? { artifacts } : {}) };
              }
              return updated;
            });
          } catch { /* ignore */ }
          break;
        }

        case 'skill_route': {
          try {
            const route = readChatRoute(JSON.parse(data));
            if (route) {
              setActiveSkill(route.skill);
              setActiveRoute(route);
              setMessages(prev => applyChatRoute(prev, route));
            }
          } catch { /* ignore malformed routing data */ }
          break;
        }

        case 'skill': {
          const skill = data.trim();
          setActiveSkill(skill || null);
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant') updated[updated.length - 1] = { ...last, skill: skill || undefined };
            return updated;
          });
          break;
        }

        case 'skill_transition': {
          try {
            const { to } = JSON.parse(data);
            if (to === null || typeof to === 'string') {
              setActiveSkill(to || null);
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, skill: to || undefined };
                }
                return updated;
              });
            }
          } catch { /* ignore */ }
          break;
        }

        case 'session': {
          try {
            const { session_id: sid } = JSON.parse(data);
            if (sid) setSessionId(sid);
          } catch { /* ignore */ }
          break;
        }

        case 'usage': {
          try {
            const usage = JSON.parse(data) as TokenUsage;
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                updated[updated.length - 1] = { ...last, usage };
              }
              return updated;
            });
          } catch { /* ignore */ }
          break;
        }

        case 'thinking': {
          try {
            const { step, tool } = JSON.parse(data);
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                const thinkingSteps = [...(last.thinkingSteps || []), { step, tool, timestamp: Date.now() }];
                updated[updated.length - 1] = { ...last, thinkingSteps };
              }
              return updated;
            });
          } catch { /* ignore */ }
          break;
        }

        case 'done': {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last) updated[updated.length - 1] = { ...last, isStreaming: false };
            return updated;
          });
          break;
        }

        default: {
          break;
        }
      }
    }
  }, [messages, activeSkill, sessionId, queryClient, refreshSession]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setMessages(prev => settleChatResponse(prev));
  }, []);

  const clearMessages = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setIsStreaming(false);
    setError(null);
    setActiveSkill(null);
    setActiveRoute(null);
    setSessionId(null);
  }, []);

  /** Load a previously saved session by restoring its messages. */
  const loadSession = useCallback((id: string, savedMessages: ChatMessage[], skill?: string | null) => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsStreaming(false);
    setSessionId(id);
    setMessages(savedMessages);
    setActiveSkill(skill ?? null);
    setActiveRoute(null);
    setError(null);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
    loadSession,
    activeSkill,
    activeRoute,
    sessionId,
    limitReached,
    userMessageCount,
    maxMessages: MAX_CONVERSATION_MESSAGES,
  };
}
