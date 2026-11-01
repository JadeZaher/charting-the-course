import { Fragment, useState, useEffect, useCallback, useRef } from 'react';
import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { QueryState } from '@/components/QueryState';
import { useDomain, useJoinDomainParticipation } from '@/hooks/use-governance';
import { DomainPostsSection } from '@/pages/discover/DomainPostsSection';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useToast } from '@/hooks/use-toast';
import {
  Pencil, ArrowLeft, ClipboardCheck, Eye, Check, Link2Off, Plus, X, Trash2, Handshake,
} from 'lucide-react';
import {
  fetchDomainQuizzes,
  fetchQuizzes,
  assignQuizToDomain,
  unassignQuizFromDomain,
} from '@/lib/api-client';
import { apiErrorMessage } from '@/lib/api-error-message';
import { domainCode, domainLabel } from '@/lib/domain-label';
import type { QuizListItem } from '@/types/api';

interface DomainQuiz {
  id: string;
  title: string;
  description: string | null;
  mode: string;
  is_published: boolean;
  is_entry_quiz: boolean;
  time_limit: number | null;
  passing_score: number | null;
  created_at: string | null;
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'draft': return 'secondary' as const;
    case 'archived': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

/** "primary_accountabilities" -> "Primary accountabilities". */
function humanizeKey(key: string): string {
  const spaced = key.replace(/[_-]+/g, ' ').trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : key;
}

/** Renders a JSON domain-element value as readable rows and lists instead of raw JSON. */
function ElementValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === '') return <span className="text-muted-foreground">-</span>;
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">None</span>;
    return (
      <ul className="list-disc space-y-1 pl-5">
        {value.map((item, index) => <li key={index}><ElementValue value={item} /></li>)}
      </ul>
    );
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span className="text-muted-foreground">None</span>;
    return (
      <dl className="grid grid-cols-[minmax(0,auto)_1fr] gap-x-4 gap-y-1">
        {entries.map(([key, item]) => (
          <Fragment key={key}>
            <dt className="text-muted-foreground">{humanizeKey(key)}</dt>
            <dd><ElementValue value={item} /></dd>
          </Fragment>
        ))}
      </dl>
    );
  }
  if (typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>;
  return <span>{String(value)}</span>;
}

export default function DomainDetail() {
  const [, params] = useRoute('/domains/:id');
  const id = params?.id ?? '';
  const { data, isLoading, error } = useDomain(id);
  const { permissions } = useRoleAccess();
  const { toast } = useToast();
  const joinMutation = useJoinDomainParticipation(id);
  // Participation is server state (caller_is_participant); after joining, the Join
  // button unmounts, so move focus to the status text that replaces it.
  const participationStatusRef = useRef<HTMLParagraphElement>(null);
  const focusParticipationOnUpdate = useRef(false);

  useEffect(() => {
    if (data?.caller_is_participant && focusParticipationOnUpdate.current) {
      focusParticipationOnUpdate.current = false;
      participationStatusRef.current?.focus();
    }
  }, [data?.caller_is_participant]);

  const handleJoin = async () => {
    focusParticipationOnUpdate.current = true;
    try {
      // The hook confirms with a toast; a failure renders below from joinMutation.error.
      await joinMutation.mutateAsync();
    } catch {
      focusParticipationOnUpdate.current = false;
    }
  };

  // --- Quiz management state ---
  const [domainQuizzes, setDomainQuizzes] = useState<DomainQuiz[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<QuizListItem[]>([]);
  const [assignQuizId, setAssignQuizId] = useState('');
  const [assignAsEntry, setAssignAsEntry] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // --- Load quiz data ---
  const loadQuizzes = useCallback(async () => {
    if (!id) return;
    try {
      const [domResult, allResult] = await Promise.all([
        fetchDomainQuizzes(id),
        fetchQuizzes(),
      ]);
      setDomainQuizzes(domResult.items ?? []);
      setAllQuizzes(allResult.items);
    } catch { /* silent */ }
  }, [id]);

  useEffect(() => { loadQuizzes(); }, [loadQuizzes]);

  // --- Quiz handlers ---
  const handleAssignQuiz = async () => {
    if (!assignQuizId.trim()) return;
    setAssigning(true);
    try {
      await assignQuizToDomain(id, assignQuizId.trim(), assignAsEntry);
      toast({ title: 'Quiz assigned' });
      setAssignQuizId(''); setAssignAsEntry(false);
      await loadQuizzes();
    } catch (err) { toast({ title: 'Quiz not assigned', description: apiErrorMessage(err), variant: 'destructive' }); }
    finally { setAssigning(false); }
  };
  const handleUnassignQuiz = async (quizId: string) => {
    try {
      await unassignQuizFromDomain(id, quizId);
      toast({ title: 'Quiz unassigned' }); await loadQuizzes();
    } catch (err) { toast({ title: 'Quiz not unassigned', description: apiErrorMessage(err), variant: 'destructive' }); }
  };

  if (isLoading) return <LoadingState message="Loading domain..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load domain</p>
        <p className="text-sm text-muted-foreground mt-1">{error ? apiErrorMessage(error) : 'Not found'}</p>
        <Button asChild variant="outline" className="mt-4"><Link href="/domains">Back to Domains</Link></Button>
      </div>
    );
  }

  const assignedIds = new Set(domainQuizzes.map(q => q.id));
  const unassignedQuizzes = allQuizzes.filter(q => !assignedIds.has(q.id));

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/domains"><ArrowLeft className="h-4 w-4 mr-1" />Back to Domains</Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{domainLabel(data)}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
            {domainCode(data) && <span className="text-sm text-muted-foreground">Code {domainCode(data)}</span>}
            <span className="text-sm text-muted-foreground">v{data.version}</span>
          </div>
        </div>
        {/* Button state comes from server flags, so it survives reloads. */}
        <div className="flex flex-col items-start gap-2 sm:items-end">
          {data.caller_is_steward && (
            <p className="inline-flex items-center gap-1 text-sm font-medium">
              <Check className="h-4 w-4" aria-hidden="true" />You steward this domain
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {data.caller_is_participant ? (
              <p
                ref={participationStatusRef}
                tabIndex={-1}
                className="inline-flex items-center gap-1 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Check className="h-4 w-4" aria-hidden="true" />You participate in this domain
              </p>
            ) : (
              <Button variant="default" size="sm" disabled={joinMutation.isPending} onClick={handleJoin}>
                {joinMutation.isPending ? 'Joining...' : data.caller_is_steward ? 'Join as a participant' : 'Join this domain'}
              </Button>
            )}
            {data.caller_can_edit && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/domains/${id}/edit`}><Pencil className="h-4 w-4 mr-1" aria-hidden="true" />Edit</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      {joinMutation.error && (
        <div className="rounded-none border-2 border-destructive bg-destructive/10 p-3 text-sm text-destructive" role="alert">
          {apiErrorMessage(joinMutation.error)}
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Purpose</CardTitle></CardHeader>
        <CardContent><div className="whitespace-pre-wrap text-sm leading-relaxed">{data.purpose}</div></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Steward Information</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><dt className="text-muted-foreground">Current Steward</dt><dd className="font-medium">{data.current_steward || '-'}</dd></div>
            <div><dt className="text-muted-foreground">Created</dt><dd className="font-medium">{new Date(data.created_at).toLocaleDateString()}</dd></div>
            <div><dt className="text-muted-foreground">Last Updated</dt><dd className="font-medium">{new Date(data.updated_at).toLocaleDateString()}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Participants ({data.participant_count ?? 0})</CardTitle></CardHeader>
        <CardContent>
          {(data.participants ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No one participates in this domain yet.</p>
          ) : (
            <ul className="flex flex-wrap gap-2" aria-label="Domain participants">
              {(data.participants ?? []).map((participant) => (
                <li key={participant.member_id}>
                  <Badge variant="outline">
                    {participant.display_name}{participant.role !== 'member' ? ` · ${participant.role}` : ''}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {data.domain_elements.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Domain Elements</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Element</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.domain_elements.map((element) => (
                  <TableRow key={element.id}>
                    <TableCell className="align-top font-medium">{humanizeKey(element.element_name)}</TableCell>
                    <TableCell className="max-w-[480px] text-sm">
                      <ElementValue value={element.element_value} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data.domain_metrics.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Domain Metrics</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Metric</TableHead><TableHead>Target</TableHead><TableHead>Measurement Method</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.domain_metrics.map((metric) => (
                  <TableRow key={metric.id}>
                    <TableCell className="font-medium">{metric.metric}</TableCell>
                    <TableCell>{metric.target ?? '-'}</TableCell>
                    <TableCell>{metric.measurement_method ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Quiz Management */}
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ClipboardCheck className="h-4 w-4" />Domain Quizzes</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {domainQuizzes.length > 0 ? (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Quiz</TableHead><TableHead>Mode</TableHead><TableHead>Status</TableHead><TableHead>Entry Quiz</TableHead><TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {domainQuizzes.map(q => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <div><span className="font-medium">{q.title}</span>{q.description && <p className="text-xs text-muted-foreground line-clamp-1">{q.description}</p>}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{q.mode}</Badge></TableCell>
                    <TableCell><Badge variant={q.is_published ? 'default' : 'secondary'}>{q.is_published ? 'Published' : 'Draft'}</Badge></TableCell>
                    <TableCell>{q.is_entry_quiz && <Badge variant="outline" className="text-xs"><Check className="h-3 w-3 mr-1" />Entry Quiz</Badge>}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button asChild variant="ghost" size="sm"><Link href={`/quiz/take/${q.id}`}>Take</Link></Button>
                        <Button asChild variant="ghost" size="sm"><Link href={`/quiz/results/${q.id}`}><Eye className="h-4 w-4" /></Link></Button>
                        {permissions.canAssignQuizzes && (
                          <Button variant="ghost" size="sm" onClick={() => handleUnassignQuiz(q.id)} title="Unassign"><Link2Off className="h-4 w-4" /></Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No quizzes assigned to this domain</p>
          )}

          {permissions.canAssignQuizzes && (
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-2 pt-2 border-t">
              <div className="flex-1 w-full sm:max-w-[320px]">
                <label className="text-xs text-muted-foreground mb-1 block">Select Quiz</label>
                <Select value={assignQuizId} onValueChange={setAssignQuizId}>
                  <SelectTrigger><SelectValue placeholder="Choose a quiz..." /></SelectTrigger>
                  <SelectContent>
                    {unassignedQuizzes.length === 0 ? <SelectItem value="_none" disabled>No available quizzes</SelectItem> : unassignedQuizzes.map(q => <SelectItem key={q.id} value={q.id}>{q.title}{!q.is_published ? ' (Draft)' : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-1.5 text-sm whitespace-nowrap cursor-pointer">
                <input type="checkbox" checked={assignAsEntry} onChange={e => setAssignAsEntry(e.target.checked)} className="h-4 w-4 rounded-[2px] border-2 border-control-border" />Entry quiz
              </label>
              <Button size="sm" onClick={handleAssignQuiz} disabled={assigning || !assignQuizId}>{assigning ? 'Assigning...' : 'Assign'}</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shares & Needs: pages/discover/DomainPostsSection (G-Exchange) */}
      <DomainPostsSection domain={data} />
    </div>
  );
}
