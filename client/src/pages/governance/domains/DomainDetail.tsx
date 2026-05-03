import { useState, useEffect, useCallback } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useDomain } from '@/hooks/use-governance';
import { Pencil, ArrowLeft, Users, ClipboardCheck, Eye, Check } from 'lucide-react';

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

async function fetchDomainQuizzes(domainId: string): Promise<{ items: DomainQuiz[] }> {
  const res = await fetch(`/api/v1/domains/${domainId}/quizzes`, { credentials: 'include' });
  if (!res.ok) return { items: [] };
  return res.json();
}

async function assignQuizToDomain(domainId: string, quizId: string, isEntry: boolean): Promise<boolean> {
  const res = await fetch(`/api/v1/domains/${domainId}/quizzes/assign`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quiz_id: quizId, is_entry_quiz: isEntry }),
  });
  return res.ok;
}

const roleVariant = (role: string) => {
  switch (role) {
    case 'steward': return 'default' as const;
    case 'delegate': return 'secondary' as const;
    default: return 'outline' as const;
  }
};

const statusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'draft': return 'secondary' as const;
    case 'archived': return 'outline' as const;
    default: return 'secondary' as const;
  }
};

export default function DomainDetail() {
  const [, params] = useRoute('/domains/:id');
  const id = params?.id ?? '';
  const [, navigate] = useLocation();
  const { data, isLoading, error } = useDomain(id);
  const [domainQuizzes, setDomainQuizzes] = useState<DomainQuiz[]>([]);
  const [assignQuizId, setAssignQuizId] = useState('');
  const [assignAsEntry, setAssignAsEntry] = useState(false);

  const loadQuizzes = useCallback(async () => {
    if (!id) return;
    const result = await fetchDomainQuizzes(id);
    setDomainQuizzes(result.items);
  }, [id]);

  useEffect(() => { loadQuizzes(); }, [loadQuizzes]);

  const handleAssignQuiz = async () => {
    if (!assignQuizId.trim()) return;
    const ok = await assignQuizToDomain(id, assignQuizId.trim(), assignAsEntry);
    if (ok) {
      setAssignQuizId('');
      setAssignAsEntry(false);
      loadQuizzes();
    }
  };

  if (isLoading) return <LoadingState message="Loading domain..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load domain</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Link href="/domains">
          <Button variant="outline" className="mt-4">Back to Domains</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/domains">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Domains
        </Button>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{data.domain_id}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
            <span className="text-sm text-muted-foreground">v{data.version}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/domains/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Purpose</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{data.purpose}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Steward Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Current Steward</dt>
              <dd className="font-medium">{data.current_steward || '-'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium">{new Date(data.created_at).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last Updated</dt>
              <dd className="font-medium">{new Date(data.updated_at).toLocaleDateString()}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-4 w-4" />
            Circle Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.circle_memberships && data.circle_memberships.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.circle_memberships.map((cm: any) => (
                <div key={cm.id || cm.member_id} className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm">
                  <span className="font-medium">{cm.display_name || cm.member_id}</span>
                  <Badge variant={roleVariant(cm.role)} className="text-xs">{cm.role}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No circle members assigned</p>
          )}
        </CardContent>
      </Card>

      {data.elements && data.elements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Domain Elements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.elements.map((el: any) => (
                  <TableRow key={el.id || el.name}>
                    <TableCell className="font-medium">{el.name}</TableCell>
                    <TableCell>{el.type || '-'}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{el.description || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {data.metrics && data.metrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Domain Metrics</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metric</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.metrics.map((m: any) => (
                  <TableRow key={m.id || m.name}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.target ?? '-'}</TableCell>
                    <TableCell>{m.current ?? '-'}</TableCell>
                    <TableCell>
                      <Badge variant={m.status === 'on_track' ? 'default' : 'secondary'}>
                        {m.status || '-'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Quiz Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            Domain Quizzes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {domainQuizzes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Entry Quiz</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domainQuizzes.map(q => (
                  <TableRow key={q.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{q.title}</span>
                        {q.description && <p className="text-xs text-muted-foreground line-clamp-1">{q.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{q.mode}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={q.is_published ? 'default' : 'secondary'}>
                        {q.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {q.is_entry_quiz && (
                        <Badge variant="outline" className="text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          Entry Quiz
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Link href={`/quiz/take/${q.id}`}>
                          <Button variant="ghost" size="sm">Take</Button>
                        </Link>
                        <Link href={`/quiz/results/${q.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No quizzes assigned to this domain</p>
          )}

          <div className="flex items-center gap-2 pt-2 border-t">
            <Input
              placeholder="Quiz ID to assign..."
              value={assignQuizId}
              onChange={(e) => setAssignQuizId(e.target.value)}
              className="max-w-[280px]"
            />
            <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
              <input
                type="checkbox"
                checked={assignAsEntry}
                onChange={(e) => setAssignAsEntry(e.target.checked)}
                className="h-4 w-4 rounded"
              />
              Entry quiz
            </label>
            <Button size="sm" onClick={handleAssignQuiz} disabled={!assignQuizId.trim()}>
              Assign
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
