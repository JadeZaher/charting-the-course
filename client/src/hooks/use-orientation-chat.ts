import { keys } from '@/lib/query-keys';
import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api-client';
import { apiErrorMessage } from '@/lib/api-error-message';
import { currentOrientationHistory, orientationChatScope, orientationReplyCount, orientationSession, type OrientationHistory, type OrientationSelection } from '@/lib/orientation-chat-state';
import type { OmniBotMessage } from '@/types/orientation';

interface OrientationReply { session_id: string; message: OmniBotMessage; turn_count: number; available: boolean }
export function useOrientationChat(journeyId?: string, stepId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const owner = user?.id || '';
  const root = keys.orientationChat.journey(owner, journeyId);
  const identity = orientationChatScope(owner, journeyId, stepId);
  const [selection, setSelection] = useState<OrientationSelection>({scope: identity, mode: 'resume', id: null});
  const [live, setLive] = useState<{scope: string; session: string; messages: OmniBotMessage[]; replies: number} | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const scope = stepId ? `&step_id=${encodeURIComponent(stepId)}` : '';
  const availability = useQuery({ queryKey: [...root, stepId, 'availability'], queryFn: () => apiFetch<{available:boolean;reason?:string;latest_session_id?:string|null}>(`/api/v1/orientation/chat/availability?journey_id=${encodeURIComponent(journeyId!)}${scope}`), enabled: !!journeyId && !!owner, staleTime: 30_000, retry:false });
  const sessionId = orientationSession(selection, identity, availability.data?.latest_session_id);
  const sessions = useQuery({ queryKey: [...root, 'sessions', stepId], queryFn: () => apiFetch<{items:Array<{id:string;title?:string;updated_at?:string;step_id?:string|null;stale?:boolean}>}>(`/api/v1/orientation/chat/sessions?journey_id=${encodeURIComponent(journeyId!)}${scope}`), enabled: !!owner && !!journeyId && availability.isSuccess });
  const historyKey = [...root, 'session', stepId, sessionId];
  const history = useQuery({ queryKey: historyKey, queryFn: () => apiFetch<OrientationHistory>(`/api/v1/orientation/chat/sessions/${encodeURIComponent(sessionId!)}`), enabled: !!sessionId && !!owner && availability.isSuccess, retry:false });
  const record = currentOrientationHistory(history.data, sessionId, journeyId, stepId) ? history.data : undefined;
  const currentLive = live?.scope === identity && live.session === sessionId ? live : null;
  const preferredLive = currentLive && (!record || record.turn_count < currentLive.replies) ? currentLive : null;
  const messages = preferredLive?.messages || record?.messages.filter(message => message.role !== 'system') || [];
  const sessionStale = record?.stale === true;
  const completedReplies = sessionStale || (!preferredLive && (history.isFetching || history.isError)) ? 0 : preferredLive?.replies ?? orientationReplyCount(record);
  const restoring = !!sessionId && !preferredLive && (!record || history.isFetching || history.isError);
  useEffect(() => {
    generation.current += 1;
    setSelection({scope: identity, mode: 'resume', id: null});
    setLive(null); setError(''); setBusy(false);
  }, [identity]);
  function chooseSession(id: string) {
    generation.current += 1;
    setSelection({scope: identity, mode: id ? 'selected' : 'new', id: id || null});
    setLive(null); setError(''); setBusy(false);
  }
  async function send(message: string): Promise<boolean> {
    if (!journeyId || !owner || !availability.data?.available || sessionStale || restoring || busy || !message.trim()) return false;
    setBusy(true); setError('');
    const requestGeneration = generation.current;
    try {
      const reply = await apiFetch<OrientationReply>('/api/v1/orientation/chat', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({journey_id:journeyId,step_id:stepId,session_id:sessionId || undefined,message:message.trim()})});
      if (requestGeneration !== generation.current) return false;
      if (!reply.available || reply.message?.role !== 'assistant' || !reply.message.content?.trim()) throw new Error('The orientation guide did not return a complete reply. Please retry.');
      setSelection({scope: identity, mode: 'selected', id: reply.session_id});
      setLive({scope: identity, session: reply.session_id, messages: [...messages,{role:'user',content:message.trim()},reply.message], replies: completedReplies + 1});
      void queryClient.invalidateQueries({queryKey:[...root,'sessions']});
      void queryClient.invalidateQueries({queryKey:[...root,'session',stepId,reply.session_id]});
      return true;
    } catch (failure) { if (requestGeneration === generation.current) setError(apiErrorMessage(failure)); return false; }
    finally { if (requestGeneration === generation.current) setBusy(false); }
  }
  async function removeSession() {
    if (!sessionId || busy) return;
    const requestGeneration = generation.current;
    setBusy(true); setError('');
    try {
      await apiFetch(`/api/v1/orientation/chat/sessions/${encodeURIComponent(sessionId)}`,{method:'DELETE'});
      if (requestGeneration !== generation.current) return;
      queryClient.removeQueries({queryKey:historyKey,exact:true});
      chooseSession(''); void sessions.refetch(); void availability.refetch();
    } catch (failure) { if (requestGeneration === generation.current) setError(apiErrorMessage(failure)); }
    finally { if (requestGeneration === generation.current) setBusy(false); }
  }
  const available = availability.data?.available === true && !sessionStale && !restoring;
  const reason = sessionStale ? 'This journey has changed. You can read the old conversation; choose a new conversation to ask about its current version.'
    : history.error ? apiErrorMessage(history.error)
    : restoring ? 'Restoring your private conversation...'
    : !journeyId ? 'Choose an orientation journey to use its guide.'
    : availability.error ? apiErrorMessage(availability.error)
    : availability.data?.reason || (availability.isLoading ? 'Checking orientation guide availability...' : 'The orientation guide is unavailable. You can continue with the written journey materials.');
  return {messages,busy,error,available,reason,sessionStale,checking:availability.isLoading || (restoring && history.isFetching),sessions:sessions.data?.items || [],sessionId,completedReplies,send,removeSession,chooseSession,retry:()=>Promise.all([availability.refetch(),...(sessionId?[history.refetch()]:[])])};
}
