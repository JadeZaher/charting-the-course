import { useState, useEffect, useCallback } from 'react';
import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useEcosystemDetail, useRequestJoinEcosystem, useAgreements } from '@/hooks/use-governance';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Pencil, ArrowLeft, UserPlus, Lock, FileText, Check, Clock, ClipboardList, Eye } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface EcoQuiz {
  id: string;
  title: string;
  description: string | null;
  mode: string;
  is_published: boolean;
  is_entry_quiz: boolean;
  passing_score: number | null;
  allow_retakes: boolean;
  visibility: string;
}

async function fetchEcoQuizzes(ecoId: string): Promise<EcoQuiz[]> {
  const res = await fetch(`${API_BASE}/api/v1/ecosystems/${ecoId}/quizzes`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch ecosystem quizzes');
  const data = await res.json();
  return data.quizzes ?? [];
}

interface AvailableQuiz {
  id: string;
  title: string;
  is_published: boolean;
}

async function fetchAllQuizzes(): Promise<AvailableQuiz[]> {
  const res = await fetch(`${API_BASE}/api/v1/quizzes`, { credentials: 'include' });
  if (!res.ok) return [];
  const data = await res.json();
  const items = data.items || data.quizzes || [];
  return items.map((q: any) => ({ id: q.id, title: q.title, is_published: q.is_published ?? false }));
}

async function assignQuizToEcosystem(ecoId: string, quizId: string, isEntryQuiz: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/ecosystems/${ecoId}/quizzes/assign`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz_id: quizId, is_entry_quiz: isEntryQuiz }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Failed to assign quiz' }));
    throw new Error(body.error || 'Failed to assign quiz');
  }
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'forming': return 'secondary' as const;
    case 'inactive': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

export default function EcosystemDetail() {
  const [, params] = useRoute('/ecosystems/:id');
  const id = params?.id ?? '';
  const { data, isLoading, error } = useEcosystemDetail(id);
  const { ecosystems } = useEcosystem();
  const { refreshSession } = useAuth();
  const { toast } = useToast();
  const joinMutation = useRequestJoinEcosystem(id);
  const [joinRequested, setJoinRequested] = useState(false);

  const isMember = ecosystems.some(e => e.id === id);

  // Quiz management state
  const [ecoQuizzes, setEcoQuizzes] = useState<EcoQuiz[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<AvailableQuiz[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [assignQuizId, setAssignQuizId] = useState('');
  const [assignAsEntry, setAssignAsEntry] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const loadQuizzes = useCallback(async () => {
    if (!id || !isMember) return;
    setQuizzesLoading(true);
    try {
      const [ecoQ, allQ] = await Promise.all([fetchEcoQuizzes(id), fetchAllQuizzes()]);
      setEcoQuizzes(ecoQ);
      setAllQuizzes(allQ);
    } catch {
      // silently fail, section just shows empty
    } finally {
      setQuizzesLoading(false);
    }
  }, [id, isMember]);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleAssignQuiz = async () => {
    if (!assignQuizId.trim()) return;
    setAssigning(true);
    try {
      await assignQuizToEcosystem(id, assignQuizId.trim(), assignAsEntry);
      toast({ title: 'Quiz assigned', description: 'Quiz has been assigned to this ecosystem.' });
      setAssignQuizId('');
      setAssignAsEntry(false);
      await loadQuizzes();
    } catch (err) {
      toast({ title: 'Failed to assign quiz', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setAssigning(false);
    }
  };

  // Fetch agreements only when user is a member (backend scopes by cookie)
  const { data: agreementsData } = useAgreements(isMember ? {} : false);

  // Filter to this ecosystem's agreements, then apply visibility rules
  const allEcoAgreements = (agreementsData?.items ?? []).filter(
    (a: any) => a.ecosystem_id === id
  );
  // Members see all; non-members see only ecosystem-level
  const visibleAgreements = isMember
    ? allEcoAgreements
    : allEcoAgreements.filter((a: any) => a.hierarchy_level === 'ecosystem');

  if (isLoading) return <LoadingState message="Loading ecosystem..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load ecosystem</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Link href="/ecosystems">
          <Button variant="outline" className="mt-4">Back to Ecosystems</Button>
        </Link>
      </div>
    );
  }

  const handleJoin = async () => {
    try {
      const result = await joinMutation.mutateAsync();
      setJoinRequested(true);
      toast({ title: 'Join request sent', description: result.message || 'Your request to join has been submitted.' });
      await refreshSession();
    } catch (err) {
      const message = (err as Error).message;
      if (message.includes('Already a member')) {
        setJoinRequested(true);
        toast({ title: 'Already a member', description: 'You are already a member of this ecosystem.' });
        await refreshSession();
      } else {
        toast({ title: 'Failed to join', description: message, variant: 'destructive' });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Link href="/ecosystems">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Ecosystems
        </Button>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{data.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
            {data.visibility && <Badge variant="outline">{data.visibility}</Badge>}
            {isMember && <Badge variant="default">Member</Badge>}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {isMember ? (
            <Link href={`/ecosystems/${id}/edit`}>
              <Button variant="outline" size="sm">
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </Link>
          ) : joinRequested || joinMutation.isSuccess ? (
            <Button variant="outline" size="sm" disabled>
              <Clock className="h-4 w-4 mr-1" />
              Join Requested
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleJoin}
              disabled={joinMutation.isPending}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              {joinMutation.isPending ? 'Requesting...' : 'Request to Join'}
            </Button>
          )}
        </div>
      </div>

      {data.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.description}</div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Location</dt>
              <dd className="font-medium">{data.location || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Website</dt>
              <dd className="font-medium">
                {data.website ? (
                  <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    {data.website}
                  </a>
                ) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Founded</dt>
              <dd className="font-medium">{data.founded_date ? new Date(data.founded_date).toLocaleDateString() : '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Member Count</dt>
              <dd className="font-medium">{data.member_count ?? '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Contact Email</dt>
              <dd className="font-medium">
                {data.contact_email ? (
                  <a href={`mailto:${data.contact_email}`} className="text-primary underline">
                    {data.contact_email}
                  </a>
                ) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Visibility</dt>
              <dd className="font-medium">{data.visibility || '-'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {data.tags && data.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.governance_summary && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Governance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.governance_summary}</div>
          </CardContent>
        </Card>
      )}

      {/* Agreements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Agreements
            {!isMember && (
              <Badge variant="outline" className="text-xs font-normal ml-2">
                <Lock className="h-3 w-3 mr-1" />
                Ecosystem-level only
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isMember ? (
            <p className="text-sm text-muted-foreground">
              Join this ecosystem and complete onboarding to view agreements.
            </p>
          ) : visibleAgreements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agreements yet.</p>
          ) : (
            <div className="space-y-2">
              {visibleAgreements.map((agreement: any) => (
                <Link
                  key={agreement.id}
                  href={`/agreements/${agreement.id}`}
                  className="block rounded-md border p-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{agreement.title}</span>
                    <Badge variant={agreement.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {agreement.status}
                    </Badge>
                  </div>
                  {agreement.hierarchy_level && (
                    <span className="text-xs text-muted-foreground">{agreement.hierarchy_level}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quiz Management Section (members only) */}
      {isMember && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Quiz Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quizzesLoading ? (
              <p className="text-sm text-muted-foreground">Loading quizzes...</p>
            ) : ecoQuizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quizzes assigned to this ecosystem yet.</p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-2 font-medium">Title</th>
                      <th className="text-left p-2 font-medium">Mode</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Role</th>
                      <th className="text-right p-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ecoQuizzes.map((q) => (
                      <tr key={q.id} className="border-b last:border-b-0">
                        <td className="p-2 font-medium">{q.title}</td>
                        <td className="p-2">{q.mode}</td>
                        <td className="p-2">
                          <Badge variant={q.is_published ? 'default' : 'secondary'}>
                            {q.is_published ? 'Published' : 'Draft'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {q.is_entry_quiz && (
                            <Badge variant="outline" className="text-xs">
                              <Check className="h-3 w-3 mr-1" />
                              Entry Quiz
                            </Badge>
                          )}
                        </td>
                        <td className="p-2 text-right">
                          <Link href={`/quiz/results/${q.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              View Results
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Assign Quiz Form */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Assign a Quiz</p>
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Select Quiz</label>
                  <Select value={assignQuizId} onValueChange={setAssignQuizId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a quiz..." />
                    </SelectTrigger>
                    <SelectContent>
                      {(() => {
                        const assignedIds = new Set(ecoQuizzes.map(q => q.id));
                        const unassigned = allQuizzes.filter(q => !assignedIds.has(q.id));
                        if (unassigned.length === 0) {
                          return (
                            <SelectItem value="_none" disabled>
                              No available quizzes
                            </SelectItem>
                          );
                        }
                        return unassigned.map(q => (
                          <SelectItem key={q.id} value={q.id}>
                            {q.title}{!q.is_published ? ' (Draft)' : ''}
                          </SelectItem>
                        ));
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={assignAsEntry}
                    onChange={(e) => setAssignAsEntry(e.target.checked)}
                    className="rounded"
                  />
                  Entry Quiz
                </label>
                <Button
                  size="sm"
                  onClick={handleAssignQuiz}
                  disabled={assigning || !assignQuizId}
                >
                  {assigning ? 'Assigning...' : 'Assign'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
