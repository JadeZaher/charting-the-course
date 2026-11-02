import { resolveInternalPath } from './internal-path';

export type JoinTarget = 'ecosystem' | 'domain' | 'team';
export interface JoinGates {
  target_type: JoinTarget;
  target_id: string;
  eligible: boolean;
  status: 'ready' | 'quiz_required' | 'quiz_unavailable' | 'agreement_consent_required';
  required_quizzes: Array<{ id: string; title: string; scope_type: string; scope_id: string; completion_mode?: 'graded' | 'completion'; status: 'passed' | 'completed' | 'required' | 'unavailable' | 'bypassed'; href: string }>;
  quiz_bypass?: { applied: boolean; reason: 'node_admin' | null };
  required_agreements: Array<{ id: string; title: string; version?: string; href: string }>;
}

export function joinReturnPath(search: string, fallback = '/my-quiz-history'): string {
  const value = resolveInternalPath(new URLSearchParams(search).get('returnTo'));
  return value && !/^\/(?:login|quiz\/take|quiz\/results)(?:\/|\?|$)/.test(value) ? value : fallback;
}

export function quizForJoin(id: string, returnTo: string): string {
  return `/quiz/take/${encodeURIComponent(id)}?returnTo=${encodeURIComponent(resolveInternalPath(returnTo) || '/welcome/consent')}`;
}

export function joinGateMessage(gates: JoinGates): string {
  if (gates.status === 'quiz_unavailable') return 'A required entry quiz is not published or available. Ask a steward to repair its configuration; it cannot be skipped.';
  if (gates.status === 'quiz_required') return gates.required_quizzes.some(quiz => quiz.completion_mode === 'completion') ? 'Complete the configured entry requirements before joining. Readiness questionnaires require valid answers, without grading personal preferences; knowledge quizzes require a server-graded pass. Neither records agreement consent.' : 'Pass the configured entry quizzes before joining. Your answers are graded by the server; taking a quiz does not record agreement consent.';
  if (gates.status === 'agreement_consent_required') return 'Read and personally consent to the remaining membership agreements before taking part.';
  return gates.required_quizzes.length ? 'Your entry quiz requirements are complete.' : 'No entry quiz is configured. You can join without taking one.';
}
