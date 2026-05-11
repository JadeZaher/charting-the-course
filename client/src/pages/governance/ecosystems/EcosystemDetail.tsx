import { useState, useEffect, useCallback } from 'react';
import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Pencil, ArrowLeft, UserPlus, Lock, FileText, Check, Clock, ClipboardList, Eye,
  Link2Off, Map, Plus, Trash2, X, Handshake, ArrowUpDown,
} from 'lucide-react';
import {
  fetchEcosystemQuizzes,
  fetchQuizzes,
  assignQuizToEcosystem,
  unassignQuizFromEcosystem,
  fetchEthosJourneyMaps,
  createJourneyMap,
  updateJourneyMap,
  deleteJourneyMap,
  fetchEcosystemSharesNeeds,
  createSharesNeeds,
  updateSharesNeedsStatus,
  deleteSharesNeeds,
  fetchDomains,
} from '@/lib/api-client';
import type { QuizListItem, SharesNeeds, DomainListItem } from '@/types/api';

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

interface JourneyMapItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  step_count: number;
  content_sequence: any[];
  exit_package: Record<string, any>;
  is_default: boolean;
  is_active: boolean;
  created_at: string | null;
}

const statusVariant = (status: string) => {
  switch (status) {
    case 'active': return 'default' as const;
    case 'forming': return 'secondary' as const;
    case 'inactive': return 'outline' as const;
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

  // --- Quiz management state ---
  const [ecoQuizzes, setEcoQuizzes] = useState<EcoQuiz[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<QuizListItem[]>([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [assignQuizId, setAssignQuizId] = useState('');
  const [assignAsEntry, setAssignAsEntry] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // --- Journey Map state ---
  const [journeyMaps, setJourneyMaps] = useState<JourneyMapItem[]>([]);
  const [jmLoading, setJmLoading] = useState(false);
  const [showJmForm, setShowJmForm] = useState(false);
  const [jmForm, setJmForm] = useState({ title: '', description: '', contentJson: '', exitJson: '', is_default: false });
  const [jmSaving, setJmSaving] = useState(false);

  // --- Shares/Needs state ---
  const [sharesNeeds, setSharesNeeds] = useState<SharesNeeds[]>([]);
  const [snLoading, setSnLoading] = useState(false);
  const [showSnForm, setShowSnForm] = useState(false);
  const [snForm, setSnForm] = useState({ type: 'share' as 'share' | 'need', title: '', description: '', category: '', capacity: '', visibility: 'public', domain_id: '' });
  const [snSaving, setSnSaving] = useState(false);
  const [ecoDomains, setEcoDomains] = useState<DomainListItem[]>([]);

  // --- Load quiz data ---
  const loadQuizzes = useCallback(async () => {
    if (!id || !isMember) return;
    setQuizzesLoading(true);
    try {
      const [ecoResult, allResult] = await Promise.all([
        fetchEcosystemQuizzes(id),
        fetchQuizzes(),
      ]);
      setEcoQuizzes(ecoResult.quizzes ?? []);
      const items = (allResult as any).items || (allResult as any).quizzes || [];
      setAllQuizzes(items);
    } catch { /* silent */ } finally { setQuizzesLoading(false); }
  }, [id, isMember]);

  // --- Load journey maps ---
  const loadJourneyMaps = useCallback(async () => {
    if (!id || !isMember) return;
    setJmLoading(true);
    try {
      const maps = await fetchEthosJourneyMaps(id, true);
      setJourneyMaps(Array.isArray(maps) ? maps : []);
    } catch { /* silent */ } finally { setJmLoading(false); }
  }, [id, isMember]);

  // --- Load shares/needs ---
  const loadSharesNeeds = useCallback(async () => {
    if (!id || !isMember) return;
    setSnLoading(true);
    try {
      const [snResult, domResult] = await Promise.all([
        fetchEcosystemSharesNeeds(id),
        fetchDomains({ ecosystem_id: id }),
      ]);
      setSharesNeeds(snResult.items ?? []);
      setEcoDomains(domResult.items ?? []);
    } catch { /* silent */ } finally { setSnLoading(false); }
  }, [id, isMember]);

  useEffect(() => {
    loadQuizzes();
    loadJourneyMaps();
    loadSharesNeeds();
  }, [loadQuizzes, loadJourneyMaps, loadSharesNeeds]);

  // --- Quiz handlers ---
  const handleAssignQuiz = async () => {
    if (!assignQuizId.trim()) return;
    setAssigning(true);
    try {
      await assignQuizToEcosystem(id, assignQuizId.trim(), assignAsEntry);
      toast({ title: 'Quiz assigned' });
      setAssignQuizId(''); setAssignAsEntry(false);
      await loadQuizzes();
    } catch (err) { toast({ title: 'Failed to assign quiz', description: (err as Error).message, variant: 'destructive' }); }
    finally { setAssigning(false); }
  };
  const handleUnassignQuiz = async (quizId: string) => {
    try {
      await unassignQuizFromEcosystem(id, quizId);
      toast({ title: 'Quiz unassigned' }); await loadQuizzes();
    } catch (err) { toast({ title: 'Failed', description: (err as Error).message, variant: 'destructive' }); }
  };

  // --- Journey Map handlers ---
  const handleCreateJourneyMap = async () => {
    if (!jmForm.title.trim()) return;
    setJmSaving(true);
    try {
      let contentSequence: any[] = [];
      let exitPackage: Record<string, any> = {};
      if (jmForm.contentJson.trim()) contentSequence = JSON.parse(jmForm.contentJson);
      if (jmForm.exitJson.trim()) exitPackage = JSON.parse(jmForm.exitJson);
      await createJourneyMap(id, {
        title: jmForm.title,
        description: jmForm.description || null,
        content_sequence: contentSequence,
        exit_package: exitPackage,
        is_default: jmForm.is_default,
      });
      toast({ title: 'Journey map created' });
      setShowJmForm(false);
      setJmForm({ title: '', description: '', contentJson: '', exitJson: '', is_default: false });
      await loadJourneyMaps();
    } catch (err) { toast({ title: 'Failed', description: (err as Error).message, variant: 'destructive' }); }
    finally { setJmSaving(false); }
  };
  const handleToggleJmActive = async (jm: JourneyMapItem) => {
    try {
      await updateJourneyMap(jm.id, { is_active: !jm.is_active });
      toast({ title: jm.is_active ? 'Journey map deactivated' : 'Journey map activated' });
      await loadJourneyMaps();
    } catch (err) { toast({ title: 'Failed', description: (err as Error).message, variant: 'destructive' }); }
  };
  const handleDeleteJourneyMap = async (jmId: string) => {
    if (!confirm('Delete this journey map and all associated progress?')) return;
    try {
      await deleteJourneyMap(jmId);
      toast({ title: 'Journey map deleted' }); await loadJourneyMaps();
    } catch (err) { toast({ title: 'Failed', description: (err as Error).message, variant: 'destructive' }); }
  };

  // --- Shares/Needs handlers ---
  const handleCreateShareNeed = async () => {
    if (!snForm.title.trim()) return;
    const domainId = snForm.domain_id || ecoDomains[0]?.id;
    if (!domainId) {
      toast({ title: 'No domains available', description: 'Create a domain first before adding shares/needs.', variant: 'destructive' });
      return;
    }
    setSnSaving(true);
    try {
      await createSharesNeeds({
        ecosystem_id: id,
        domain_id: domainId,
        type: snForm.type,
        title: snForm.title,
        description: snForm.description || null,
        category: snForm.category || null,
        capacity: snForm.capacity || null,
        visibility: snForm.visibility,
      });
      toast({ title: `${snForm.type === 'share' ? 'Share' : 'Need'} created` });
      setShowSnForm(false);
      setSnForm({ type: 'share', title: '', description: '', category: '', capacity: '', visibility: 'public', domain_id: '' });
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

  // Fetch agreements only when user is a member
  const { data: agreementsData } = useAgreements(isMember ? {} : false);
  const allEcoAgreements = (agreementsData?.items ?? []).filter((a: any) => a.ecosystem_id === id);
  const visibleAgreements = isMember ? allEcoAgreements : allEcoAgreements.filter((a: any) => a.hierarchy_level === 'ecosystem');

  if (isLoading) return <LoadingState message="Loading ecosystem..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load ecosystem</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error)?.message || 'Not found'}</p>
        <Link href="/ecosystems"><Button variant="outline" className="mt-4">Back to Ecosystems</Button></Link>
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
        toast({ title: 'Already a member' });
        await refreshSession();
      } else {
        toast({ title: 'Failed to join', description: message, variant: 'destructive' });
      }
    }
  };

  const assignedIds = new Set(ecoQuizzes.map(q => q.id));
  const unassignedQuizzes = allQuizzes.filter(q => !assignedIds.has(q.id));

  return (
    <div className="space-y-6">
      <Link href="/ecosystems">
        <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" />Back to Ecosystems</Button>
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
              <Button variant="outline" size="sm"><Pencil className="h-4 w-4 mr-1" />Edit</Button>
            </Link>
          ) : joinRequested || joinMutation.isSuccess ? (
            <Button variant="outline" size="sm" disabled><Clock className="h-4 w-4 mr-1" />Join Requested</Button>
          ) : (
            <Button size="sm" onClick={handleJoin} disabled={joinMutation.isPending}>
              <UserPlus className="h-4 w-4 mr-1" />{joinMutation.isPending ? 'Requesting...' : 'Request to Join'}
            </Button>
          )}
        </div>
      </div>

      {data.description && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Description</CardTitle></CardHeader>
          <CardContent><div className="whitespace-pre-wrap text-sm leading-relaxed">{data.description}</div></CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-lg">Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div><dt className="text-muted-foreground">Location</dt><dd className="font-medium">{data.location || '-'}</dd></div>
            <div><dt className="text-muted-foreground">Website</dt><dd className="font-medium">{data.website ? <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-primary underline">{data.website}</a> : '-'}</dd></div>
            <div><dt className="text-muted-foreground">Founded</dt><dd className="font-medium">{data.founded_date ? new Date(data.founded_date).toLocaleDateString() : '-'}</dd></div>
            <div><dt className="text-muted-foreground">Member Count</dt><dd className="font-medium">{data.member_count ?? '-'}</dd></div>
            <div><dt className="text-muted-foreground">Contact Email</dt><dd className="font-medium">{data.contact_email ? <a href={`mailto:${data.contact_email}`} className="text-primary underline">{data.contact_email}</a> : '-'}</dd></div>
            <div><dt className="text-muted-foreground">Visibility</dt><dd className="font-medium">{data.visibility || '-'}</dd></div>
          </dl>
        </CardContent>
      </Card>

      {data.tags && data.tags.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Tags</CardTitle></CardHeader>
          <CardContent><div className="flex flex-wrap gap-2">{data.tags.map((tag: string) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div></CardContent>
        </Card>
      )}

      {data.governance_summary && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Governance Summary</CardTitle></CardHeader>
          <CardContent><div className="whitespace-pre-wrap text-sm leading-relaxed">{data.governance_summary}</div></CardContent>
        </Card>
      )}

      {/* Agreements Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" />Agreements
            {!isMember && <Badge variant="outline" className="text-xs font-normal ml-2"><Lock className="h-3 w-3 mr-1" />Ecosystem-level only</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!isMember ? (
            <p className="text-sm text-muted-foreground">Join this ecosystem and complete onboarding to view agreements.</p>
          ) : visibleAgreements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No agreements yet.</p>
          ) : (
            <div className="space-y-2">
              {visibleAgreements.map((agreement: any) => (
                <Link key={agreement.id} href={`/agreements/${agreement.id}`} className="block rounded-md border p-3 hover:bg-accent transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{agreement.title}</span>
                    <Badge variant={agreement.status === 'active' ? 'default' : 'secondary'} className="text-xs">{agreement.status}</Badge>
                  </div>
                  {agreement.hierarchy_level && <span className="text-xs text-muted-foreground">{agreement.hierarchy_level}</span>}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ethos / Journey Map Management (members only) */}
      {isMember && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Map className="h-5 w-5" />Orientation Journey Maps</CardTitle>
              <Button size="sm" variant="outline" onClick={() => setShowJmForm(!showJmForm)}>
                {showJmForm ? <><X className="h-4 w-4 mr-1" />Cancel</> : <><Plus className="h-4 w-4 mr-1" />New Journey Map</>}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showJmForm && (
              <div className="border rounded-md p-4 space-y-3 bg-muted/30">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input value={jmForm.title} onChange={e => setJmForm({ ...jmForm, title: e.target.value })} placeholder="e.g. New Member Orientation" />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Textarea value={jmForm.description} onChange={e => setJmForm({ ...jmForm, description: e.target.value })} placeholder="Brief description of this journey" rows={2} />
                </div>
                <div className="space-y-1">
                  <Label>Content Sequence (JSON array of steps)</Label>
                  <Textarea value={jmForm.contentJson} onChange={e => setJmForm({ ...jmForm, contentJson: e.target.value })} placeholder='[{"step":1,"type":"video","title":"Welcome","required":true}]' rows={4} className="font-mono text-sm" />
                </div>
                <div className="space-y-1">
                  <Label>Exit Package (JSON)</Label>
                  <Textarea value={jmForm.exitJson} onChange={e => setJmForm({ ...jmForm, exitJson: e.target.value })} placeholder='{"docs":[],"tools":[],"next_steps":[]}' rows={3} className="font-mono text-sm" />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={jmForm.is_default} onChange={e => setJmForm({ ...jmForm, is_default: e.target.checked })} className="rounded" />
                  Default journey map
                </label>
                <Button size="sm" onClick={handleCreateJourneyMap} disabled={jmSaving || !jmForm.title.trim()}>
                  {jmSaving ? 'Creating...' : 'Create Journey Map'}
                </Button>
              </div>
            )}

            {jmLoading ? (
              <p className="text-sm text-muted-foreground">Loading journey maps...</p>
            ) : journeyMaps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No journey maps configured yet. Create one to set up your onboarding flow.</p>
            ) : (
              <div className="space-y-2">
                {journeyMaps.map(jm => (
                  <div key={jm.id} className="flex items-center justify-between border rounded-md p-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{jm.title}</span>
                        {jm.is_default && <Badge variant="outline" className="text-xs">Default</Badge>}
                        <Badge variant={jm.is_active ? 'default' : 'secondary'} className="text-xs">
                          {jm.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {jm.description && <p className="text-xs text-muted-foreground mt-0.5">{jm.description}</p>}
                      <p className="text-xs text-muted-foreground">{jm.step_count} step{jm.step_count !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleToggleJmActive(jm)} title={jm.is_active ? 'Deactivate' : 'Activate'}>
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteJourneyMap(jm.id)} title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quiz Management Section (members only) */}
      {isMember && (
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><ClipboardList className="h-5 w-5" />Quiz Management</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {quizzesLoading ? (
              <p className="text-sm text-muted-foreground">Loading quizzes...</p>
            ) : ecoQuizzes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No quizzes assigned to this ecosystem yet.</p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium">Title</th>
                    <th className="text-left p-2 font-medium">Mode</th>
                    <th className="text-left p-2 font-medium">Status</th>
                    <th className="text-left p-2 font-medium">Role</th>
                    <th className="text-right p-2 font-medium">Actions</th>
                  </tr></thead>
                  <tbody>
                    {ecoQuizzes.map(q => (
                      <tr key={q.id} className="border-b last:border-b-0">
                        <td className="p-2 font-medium">{q.title}</td>
                        <td className="p-2">{q.mode}</td>
                        <td className="p-2"><Badge variant={q.is_published ? 'default' : 'secondary'}>{q.is_published ? 'Published' : 'Draft'}</Badge></td>
                        <td className="p-2">{q.is_entry_quiz && <Badge variant="outline" className="text-xs"><Check className="h-3 w-3 mr-1" />Entry Quiz</Badge>}</td>
                        <td className="p-2 text-right">
                          <div className="flex gap-1 justify-end">
                            <Link href={`/quiz/results/${q.id}`}><Button variant="ghost" size="sm"><Eye className="h-4 w-4 mr-1" />Results</Button></Link>
                            <Button variant="ghost" size="sm" onClick={() => handleUnassignQuiz(q.id)} title="Unassign"><Link2Off className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-2">Assign a Quiz</p>
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Select Quiz</label>
                  <Select value={assignQuizId} onValueChange={setAssignQuizId}>
                    <SelectTrigger><SelectValue placeholder="Choose a quiz..." /></SelectTrigger>
                    <SelectContent>
                      {unassignedQuizzes.length === 0 ? <SelectItem value="_none" disabled>No available quizzes</SelectItem> : unassignedQuizzes.map(q => <SelectItem key={q.id} value={q.id}>{q.title}{!q.is_published ? ' (Draft)' : ''}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={assignAsEntry} onChange={e => setAssignAsEntry(e.target.checked)} className="rounded" />Entry Quiz
                </label>
                <Button size="sm" onClick={handleAssignQuiz} disabled={assigning || !assignQuizId}>{assigning ? 'Assigning...' : 'Assign'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shares & Needs Management (members only) */}
      {isMember && (
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
                {ecoDomains.length > 1 && (
                  <div className="space-y-1">
                    <Label>Domain</Label>
                    <Select value={snForm.domain_id} onValueChange={(v: string) => setSnForm({ ...snForm, domain_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select domain..." /></SelectTrigger>
                      <SelectContent>
                        {ecoDomains.map(d => <SelectItem key={d.id} value={d.id}>{d.domain_id}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
              <p className="text-sm text-muted-foreground">No shares or needs declared yet.</p>
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
                        {sn.domain_name && <span>Domain: {sn.domain_name}</span>}
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
      )}
    </div>
  );
}
