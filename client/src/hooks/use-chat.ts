import { useState, useCallback, useRef } from 'react';

export interface ToolExecution {
  name: string;
  status: 'running' | 'success' | 'error';
  result?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  tools?: ToolExecution[];
  skill?: string;
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function parseToolIndicator(html: string): ToolExecution | null {
  // Tool indicators have class "font-mono font-medium" for tool name
  const nameMatch = html.match(/font-mono[^>]*>([^<]+)/);
  const statusMatch = html.match(/bg-neos-surface[^>]*>([^<]+)/);
  if (nameMatch) {
    const rawStatus = (statusMatch?.[1] || 'running').trim().toLowerCase();
    const status: 'running' | 'success' | 'error' =
      rawStatus === 'success' ? 'success' : rawStatus === 'error' ? 'error' : 'running';
    return {
      name: nameMatch[1].trim(),
      status,
    };
  }
  return null;
}

function parseSkillTransition(html: string): string | null {
  // Skill transitions contain "Skill transition:" text or text-neos-primary class
  const skillTransitionMatch = html.match(/Skill transition:\s*([^\s<]+)/i);
  if (skillTransitionMatch) return skillTransitionMatch[1].trim();

  const primaryMatch = html.match(/text-neos-primary[^>]*>([^<]+)/);
  return primaryMatch ? primaryMatch[1].trim() : null;
}

function isToolIndicatorHtml(html: string): boolean {
  return html.includes('font-mono') && (
    html.includes('font-medium') ||
    html.includes('bg-neos-surface') ||
    html.includes('tool')
  );
}

function isSkillTransitionHtml(html: string): boolean {
  return html.includes('Skill transition:') || (
    html.includes('text-neos-primary') && html.includes('skill')
  );
}

export function useSSEChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    setError(null);

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content }]);

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { role: 'assistant', content: '', isStreaming: true, tools: [] }]);
    setIsStreaming(true);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const response = await fetch('/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: content }),
        signal: abort.signal,
      });

      if (!response.ok) throw new Error('Chat request failed');
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentEventType = 'message';

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
            const data = line.slice(6);
            handleEvent(currentEventType, data);
            // Reset event type after handling (SSE spec: event type resets per message block)
          } else if (line === '') {
            // Empty line signals end of SSE message block — reset event type
            currentEventType = 'message';
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message);
        // Remove the empty streaming message on error
        setMessages(prev => prev.filter(m => !(m.role === 'assistant' && m.isStreaming && !m.content)));
      }
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
      // Ensure last assistant message is no longer marked as streaming
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
          if (isToolIndicatorHtml(data)) {
            const tool = parseToolIndicator(data);
            if (tool) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  const existingTools = last.tools || [];
                  updated[updated.length - 1] = {
                    ...last,
                    tools: [...existingTools, tool],
                  };
                }
                return updated;
              });
              return;
            }
          }

          if (isSkillTransitionHtml(data)) {
            const skill = parseSkillTransition(data);
            if (skill) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, skill };
                }
                return updated;
              });
              return;
            }
          }

          const text = data.includes('<') ? stripHtml(data) : data;
          if (text.trim()) {
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + text,
                };
              }
              return updated;
            });
          }
          break;
        }

        case 'morph': {
          if (isSkillTransitionHtml(data)) {
            const skill = parseSkillTransition(data);
            if (skill) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, skill };
                }
                return updated;
              });
              return;
            }
          }

          const text = data.includes('<') ? stripHtml(data) : data;
          setMessages(prev => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last?.role === 'assistant') {
              updated[updated.length - 1] = {
                ...last,
                content: text,
              };
            }
            return updated;
          });
          break;
        }

        case 'skill': {
          const skill = parseSkillTransition(data) || stripHtml(data).trim();
          if (skill) {
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
          // Fallback: treat unknown events like append if they contain text
          const text = data.includes('<') ? stripHtml(data) : data;
          if (text.trim()) {
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last?.role === 'assistant') {
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + text,
                };
              }
              return updated;
            });
          }
          break;
        }
      }
    }
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    // Mark streaming message as no longer streaming
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
  }, []);

  return { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages };
}
