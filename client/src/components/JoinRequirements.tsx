import { keys } from '@/lib/query-keys';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { apiFetch } from '@/lib/api-client';
import { apiErrorMessage } from '@/lib/api-error-message';
import { joinGateMessage, quizForJoin, type JoinGates, type JoinTarget } from '@/lib/join-gates';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { holdsMembershipIn } from '@/lib/ecosystem-join';

export function JoinRequirements({ type, id, gates: initial, returnTo, prepare }: { type: JoinTarget; id: string; gates?: JoinGates; returnTo?: string; prepare?: () => Promise<unknown> }) {
  const [location, navigate] = useLocation();
  const [failure, setFailure] = useState('');
  const [busy, setBusy] = useState(false);
  const { user, ecosystems } = useAuth();
  const [prepared, setPrepared] = useState('');
  const enrollmentScope = `${user?.id}:${type}:${id}`;
  const canReadAgreements = type !== 'ecosystem' || holdsMembershipIn(id, ecosystems) || prepared === enrollmentScope;
  const query = useQuery({ queryKey: keys.joinGates.target(type,id), queryFn: async () => (await apiFetch<{join_gates:JoinGates}>(`/api/v1/${type}s/${encodeURIComponent(id)}/join-gates`)).join_gates, enabled: !!id, initialData: initial, staleTime: 0 });
  async function start(quizId: string) {
    setFailure(''); setBusy(true);
    try { const result=await prepare?.();if((result as {status?:string}|undefined)?.status==='quiz_unavailable'){setFailure('The required entry quiz is no longer available. Ask a steward to publish or repair it.');void query.refetch();return;}navigate(quizForJoin(quizId, returnTo || location)); }
    catch (error) {
      const code = (error as { code?: string; body?: { code?: string } }).code || (error as { body?: { code?: string } }).body?.code;
      if (code === 'JOIN_QUIZ_REQUIRED') navigate(quizForJoin(quizId, returnTo || location));
      else setFailure(apiErrorMessage(error));
    } finally { setBusy(false); }
  }
  async function startJoining() {
    if (!prepare) return;
    setFailure(''); setBusy(true);
    try {
      await prepare();
      setPrepared(enrollmentScope);
      await query.refetch();
    } catch (error) { setFailure(apiErrorMessage(error)); }
    finally { setBusy(false); }
  }
  const gates = query.data;
  return <section className="space-y-3 border border-border p-4" aria-label="Joining requirements">
    <h3 className="font-bold">Before you join</h3>
    {query.isLoading ? <p role="status">Checking entry requirements…</p> : query.error ? <div role="alert"><p>{apiErrorMessage(query.error)}</p><Button variant="outline" onClick={() => query.refetch()}>Retry requirements</Button></div> : gates && <>
      <p className="text-sm text-muted-foreground">{joinGateMessage(gates)}</p>
      {gates.quiz_bypass?.applied && <p className="font-bold">Entry quizzes waived for node administrator. The server records this exemption; no passing result is created.</p>}
      {gates.required_quizzes.map(quiz => <div key={`${quiz.scope_type}-${quiz.scope_id}-${quiz.id}`} className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"><span>{quiz.title} · {quiz.status === 'bypassed' ? 'Waived for node administrator' : quiz.status === 'completed' ? 'Questionnaire completed' : quiz.status === 'passed' ? 'Passed' : quiz.status === 'unavailable' ? 'Needs steward attention' : quiz.completion_mode === 'completion' ? 'Questionnaire completion required' : 'Pass required'}</span>{quiz.status === 'required' && <Button disabled={busy} onClick={() => start(quiz.id)}>{busy ? 'Preparing…' : quiz.completion_mode === 'completion' ? 'Start entry questionnaire' : 'Start entry quiz'}</Button>}</div>)}
      {gates.required_agreements.length > 0 && !canReadAgreements && <div className="space-y-3 border-t border-border pt-3"><p>Start joining to read the required agreements and choose whether to consent. This creates a pending membership request; you cannot participate until all entry requirements are met. You can read and consent before answering the entry quiz or questionnaire.</p>{prepare ? <Button disabled={busy} onClick={startJoining}>{busy ? 'Preparing membership request…' : 'Start joining to read agreements'}</Button> : <Link className="underline font-bold" href={`/ethos/${id}`}>Open ecosystem to start joining</Link>}</div>}
      {gates.required_agreements.map(agreement => <p key={agreement.id}>{canReadAgreements ? <Link className="underline font-bold" href={`/agreements/${agreement.id}`}>Read {agreement.title}{agreement.version ? ` · v${agreement.version}` : ''}</Link> : <span className="font-bold">{agreement.title}{agreement.version ? ` · v${agreement.version}` : ''}</span>} · consent required</p>)}
      <Button size="sm" variant="outline" disabled={query.isFetching} onClick={() => query.refetch()}>Check requirements again</Button>
    </>}
    {failure && <p role="alert" className="text-sm text-destructive">{failure}</p>}
  </section>;
}
