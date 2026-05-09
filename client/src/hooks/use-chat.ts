import { useState, useCallback, useRef } from 'react';

export interface ToolExecution {
  name: string;
  status: 'running' | 'success' | 'error';
  result?: string;
  error?: string;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  tools?: ToolExecution[];
  skill?: string;
  usage?: TokenUsage;
}

const BASE_URL = import.meta.env.VITE_API_URL || '';

/** Hard cap on user messages per conversation (matches server-side limit). */
const MAX_CONVERSATION_MESSAGES = 20;

function getSelectedEcosystemIds(): string[] {
  const raw = document.cookie
    .split('; ')
    .find(c => c.startsWith('neos_selected_ecosystems='));
  if (!raw) return [];
  try {
    const ids = JSON.parse(decodeURIComponent(raw.split('=')[1]));
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function buildHistory(messages: ChatMessage[]): { role: string; content: string }[] {
  return messages
    .filter(m => m.content && !m.isStreaming)
    .map(m => ({ role: m.role, content: m.content }));
}

export function useSSEChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const userMessageCount = messages.filter(m => m.role === 'user').length;

  const sendMessage = useCallback(async (content: string) => {
    setError(null);

    const currentUserCount = messages.filter(m => m.role === 'user').length + 1;
    if (currentUserCount > MAX_CONVERSATION_MESSAGES) {
      setLimitReached(true);
      setError(`Conversation limit reached (${MAX_CONVERSATION_MESSAGES} messages). Please start a new conversation.`);
      return;
    }
    if (currentUserCount === MAX_CONVERSATION_MESSAGES) {
      setLimitReached(true);
    }

    const history = buildHistory(messages);

    setMessages(prev => [...prev, { role: 'user', content }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true, tools: [] }]);
    setIsStreaming(true);

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
          session_id: sessionId,
          page_context: {
            path: window.location.pathname,
            hash: window.location.hash,
          },
          selected_ecosystem_ids: getSelectedEcosystemIds(),
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
      let buffer = '';
      let currentEventType = 'message';
      let dataBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataBuffer += (dataBuffer ? '\n' : '') + line.slice(6);
          } else if (line === '') {
            if (dataBuffer !== '') {
              handleEvent(currentEventType, dataBuffer);
              dataBuffer = '';
            }
            currentEventType = 'message';
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message);
        setMessages(prev => prev.filter(m => !(m.role === 'assistant' && m.isStreaming && !m.content)));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === 'assistant' && last.isStreaming) {
          updated[updated.length - 1] = { ...last, isStreaming: false };
        }
        return updated;
      });
    }

    function handleEvent(eventType: string, data: string) {
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
            const { name } = JSON.parse(data);
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                const tools = [...(last.tools || []), { name, status: 'running' as const }];
                updated[updated.length - 1] = { ...last, tools };
              }
              return updated;
            });
          } catch { /* ignore */ }
          break;
        }

        case 'tool_result': {
          try {
            const { name, success, error: toolError } = JSON.parse(data);
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant' && last.tools) {
                const tools = last.tools.map(t =>
                  t.name === name && t.status === 'running'
                    ? { ...t, status: (success ? 'success' : 'error') as 'success' | 'error', error: toolError }
                    : t
                );
                updated[updated.length - 1] = { ...last, tools };
              }
              return updated;
            });
          } catch { /* ignore */ }
          break;
        }

        case 'skill': {
          const skill = data.trim();
          if (skill) {
            setActiveSkill(skill);
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                updated[updated.length - 1] = { ...last, skill };
              }
              return updated;
            });
          }
          break;
        }

        case 'skill_transition': {
          try {
            const { to } = JSON.parse(data);
            if (to) {
              setActiveSkill(to);
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, skill: to };
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

        case 'done': {
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last) updated[updated.length - 1] = { ...last, isStreaming: false };
            return updated;
          });
          setIsStreaming(false);
          break;
        }

        default: {
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
      }
    }
  }, [messages, activeSkill, sessionId]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setMessages(prev => {
      const updated = [...prev];
      const last = updated[updated.length - 1];
      if (last?.role === 'assistant' && last.isStreaming) {
        updated[updated.length - 1] = { ...last, isStreaming: false };
      }
      return updated;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    setActiveSkill(null);
    setSessionId(null);
    setLimitReached(false);
  }, []);

  /** Load a previously saved session by restoring its messages. */
  const loadSession = useCallback((id: string, savedMessages: ChatMessage[], skill?: string | null) => {
    setSessionId(id);
    setMessages(savedMessages);
    setActiveSkill(skill ?? null);
    setError(null);
    setLimitReached(savedMessages.filter(m => m.role === 'user').length >= MAX_CONVERSATION_MESSAGES);
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
    sessionId,
    limitReached,
    userMessageCount,
    maxMessages: MAX_CONVERSATION_MESSAGES,
  };
}
