import { useState, useEffect, useCallback } from 'react';
import { Link, useRoute, useLocation } from 'wouter';
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
import { useDomain } from '@/hooks/use-governance';
import { useToast } from '@/hooks/use-toast';
import {
  Pencil, ArrowLeft, Users, ClipboardCheck, Eye, Check, Link2Off, Plus, X, Trash2, Handshake,
} from 'lucide-react';
import {
  fetchDomainQuizzes,
  fetchQuizzes,
  assignQuizToDomain,
  unassignQuizFromDomain,
  fetchDomainSharesNeeds,
  createSharesNeeds,
  updateSharesNeedsStatus,
  deleteSharesNeeds,
} from '@/lib/api-client';
import type { QuizListItem, SharesNeeds } from '@/types/api';

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

const snTypeColor = (type: string) => type === 'share' ? 'default' as const : 'secondary' as const;
const snStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'fulfilled': return 'outline' as const;
    case 'withdrawn': return 'secondary' as const;
    default: return 'secondary' as const;
  }
};

export default function DomainDetail() {
  const [, params] = useRoute('/domains/:id');
  const id = params?.id ?? '';
  const [, navigate] = useLocation();
  const { data, isLoading, error } = useDomain(id);
  const { toast } = useToast();

  // --- Quiz management state ---
  const [domainQuizzes, setDomainQuizzes] = useState<DomainQuiz[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<QuizListItem[]>([]);
  const [assignQuizId, setAssignQuizId] = useState('');
  const [assignAsEntry, setAssignAsEntry] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // --- Shares/Needs state ---
  const [sharesNeeds, setSharesNeeds] = useState<SharesNeeds[]>([]);
  const [snLoading, setSnLoading] = useState(false);
  const [showSnForm, setShowSnForm] = useState(false);
  const [snForm, setSnForm] = useState({ type: 'share' as 'share' | 'need', title: '', description: '', category: '', capacity: '', visibility: 'public' });
  const [snSaving, setSnSaving] = useState(false);

  // --- Load quiz data ---
  const loadQuizzes = useCallback(async () => {
    if (!id) return;
    try {
      const [domResult, allResult] = await Promise.all([
        fetchDomainQuizzes(id),
        fetchQuizzes(),
      ]);
      setDomainQuizzes(domResult.items ?? []);
      const items = (allResult as any).items || (allResult as any).quizzes || [];
      setAllQuizzes(items);
    } catch { /* silent */ }
  }, [id]);

  // --- Load shares/needs ---
  const loadSharesNeeds = useCallback(async () => {
    if (!id) return;
    setSnLoading(true);
    try {
      const result = await fetchDomainSharesNeeds(id);
      setSharesNeeds(result.items ?? []);
    } catch { /* silent */ } finally { setSnLoading(false); }
  }, [id]);

  useEffect(() => { loadQuizzes(); loadSharesNeeds(); }, [loadQuizzes, loadSharesNeeds]);

  // --- Quiz handlers ---
  const handleAssignQuiz = async () => {
    if (!assignQuizId.trim()) return;
    setAssigning(true);
    try {
      await assignQuizToDomain(id, assignQuizId.trim(), assignAsEntry);
      toast({ title: 'Quiz assigned' });
      setAssignQuizId(''); setAssignAsEntry(false);
      await loadQuizzes();
    } catch (err) { toast({ title: 'Failed', description: (err as Error).message, variant: 'destructive' }); }
    finally { setAssigning(false); }
  };
  const handleUnassignQuiz = async (quizId: string) => {
    try {
      await unassignQuizFromDomain(id, quizId);
      toast({ title: 'Quiz unassigned' }); await loadQuizzes();
    } catch (err) { toast({ title: 'Failed', description: (err as Error).message, variant: 'destructive' }); }
  };

  // --- Shares/Needs handlers ---
  const handleCreateShareNeed = async () => {
    if (!snForm.title.trim() || !data) return;
    setSnSaving(true);
    try {
      await createSharesNeeds({
        ecosystem_id: data.ecosystem_id,
        domain_id: id,
        type: snForm.type,
        title: snForm.title,
        description: snForm.description || null,
        category: snForm.category || null,
        capacity: snForm.capacity || null,
        visibility: snForm.visibility,
      });
      toast({ title: `${snForm.type === 'share' ? 'Share' : 'Need'} created` });
      setShowSnForm(false);
      setSnForm({ type: 'share', title: '', description: '', category: '', capacity: '', visibility: 'public' });
      await loadSharesNeeds();
    } catch (err) { toast({ title: 'Failed', description: (err as Error).message, variant: 'destructive' }); }
    finally { setSnSaving(false); }
  };
  const handleSnStatusChange = async (snId: string, newStatus: string) => {
    try {
      await updateSharesNeedsStatus(snId, newStatus);
      toast({ title: `Status updated to ${newStatus}` }); await loadSharesNeeds();
    } catch (err) { toast({ title: 'Failed', description: (err as Error).message, variant: 'destructive' }); }
  };
  const handleDeleteShareNeed = async (snId: string) => {
    if (!confirm('Delete this share/need?')) return;
    try {
      await deleteSharesNeeds(snId);
      toast({ title: 'Deleted' }); await loadSharesNeeds();
    } catch (err) { toast({ title: 'Failed', description: (err as Error).message, variant: 'destructive' }); }
  };

  if (isLoading) return <LoadingState message="Loading domain..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load domain</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Link href="/domains"><Button variant="outline" className="mt-4">Back to Domains</Button></Link>
      </div>
    );
  }

  const assignedIds = new Set(domainQuizzes.map(q => q.id));
  const unassignedQuizzes = allQuizzes.filter(q => !assignedIds.has(q.id));

  return (
    <div className="space-y-6">
      <Link href="/domains">
        <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back to Domains</Button>
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
            <Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-1" />Edit</Button>
          </Link>
        </div>
      </div>

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
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Users className="h-4 w-4" />Circle Members</CardTitle></CardHeader>
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
          <CardHeader><CardTitle className="text-lg">Domain Elements</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
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
          <CardHeader><CardTitle className="text-lg">Domain Metrics</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Metric</TableHead><TableHead>Target</TableHead><TableHead>Current</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {data.metrics.map((m: any) => (
                  <TableRow key={m.id || m.name}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.target ?? '-'}</TableCell>
                    <TableCell>{m.current ?? '-'}</TableCell>
                    <TableCell><Badge variant={m.status === 'on_track' ? 'default' : 'secondary'}>{m.status || '-'}</Badge></TableCell>
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
                        <Link href={`/quiz/take/${q.id}`}><Button variant="ghost" size="sm">Take</Button></Link>
                        <Link href={`/quiz/results/${q.id}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button></Link>
                        <Button variant="ghost" size="sm" onClick={() => handleUnassignQuiz(q.id)} title="Unassign"><Link2Off className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No quizzes assigned to this domain</p>
          )}

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
              <input type="checkbox" checked={assignAsEntry} onChange={e => setAssignAsEntry(e.target.checked)} className="h-4 w-4 rounded" />Entry quiz
            </label>
            <Button size="sm" onClick={handleAssignQuiz} disabled={assigning || !assignQuizId}>{assigning ? 'Assigning...' : 'Assign'}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Shares & Needs Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><Handshake className="h-5 w-5" />Shares & Needs</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setShowSnForm(!showSnForm)}>
              {showSnForm ? <><X className="h-4 w-4 mr-1" />Cancel</> : <><Plus className="h-4 w-4 mr-1" />Add</>}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSnForm && (
            <div className="border rounded-md p-4 space-y-3 bg-muted/30">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={snForm.type} onValueChange={(v: any) => setSnForm({ ...snForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="share">Share (offering)</SelectItem>
                      <SelectItem value="need">Need (requesting)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Category</Label>
                  <Select value={snForm.category} onValueChange={(v: string) => setSnForm({ ...snForm, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skill">Skill</SelectItem>
                      <SelectItem value="resource">Resource</SelectItem>
                      <SelectItem value="knowledge">Knowledge</SelectItem>
                      <SelectItem value="space">Space</SelectItem>
                      <SelectItem value="labor">Labor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Title</Label>
                <Input value={snForm.title} onChange={e => setSnForm({ ...snForm, title: e.target.value })} placeholder="What are you sharing or needing?" />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Textarea value={snForm.description} onChange={e => setSnForm({ ...snForm, description: e.target.value })} placeholder="Details..." rows={2} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Capacity / Availability</Label>
                  <Input value={snForm.capacity} onChange={e => setSnForm({ ...snForm, capacity: e.target.value })} placeholder="e.g. 10 hrs/week, 5 units" />
                </div>
                <div className="space-y-1">
                  <Label>Visibility</Label>
                  <Select value={snForm.visibility} onValueChange={(v: string) => setSnForm({ ...snForm, visibility: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="ecosystem">Ecosystem Only</SelectItem>
                      <SelectItem value="domain">Domain Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button size="sm" onClick={handleCreateShareNeed} disabled={snSaving || !snForm.title.trim()}>
                {snSaving ? 'Creating...' : `Create ${snForm.type === 'share' ? 'Share' : 'Need'}`}
              </Button>
            </div>
          )}

          {snLoading ? (
            <p className="text-sm text-muted-foreground">Loading shares & needs...</p>
          ) : sharesNeeds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No shares or needs declared for this domain.</p>
          ) : (
            <div className="space-y-2">
              {sharesNeeds.map(sn => (
                <div key={sn.id} className="flex items-start justify-between border rounded-md p-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={snTypeColor(sn.type)} className="text-xs capitalize">{sn.type}</Badge>
                      <span className="text-sm font-medium">{sn.title}</span>
                      <Badge variant={snStatusColor(sn.status)} className="text-xs">{sn.status}</Badge>
                    </div>
                    {sn.description && <p className="text-xs text-muted-foreground">{sn.description}</p>}
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      {sn.category && <span>{sn.category}</span>}
                      {sn.capacity && <span>Capacity: {sn.capacity}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {sn.status === 'active' && (
                      <Button variant="ghost" size="sm" onClick={() => handleSnStatusChange(sn.id, 'fulfilled')} title="Mark fulfilled">
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {sn.status !== 'withdrawn' && (
                      <Button variant="ghost" size="sm" onClick={() => handleSnStatusChange(sn.id, 'withdrawn')} title="Withdraw">
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteShareNeed(sn.id)} title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
