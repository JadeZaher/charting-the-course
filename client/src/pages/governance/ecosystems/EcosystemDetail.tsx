import { useState, useEffect, useCallback } from 'react';
import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
import { useEcosystemDetail, useAgreements, useProposals } from '@/hooks/use-governance';
import { useJoinEcosystem } from '@/hooks/use-onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { isStewardIn, membershipStanding } from '@/lib/ecosystem-join';
import { JoinRequirements } from '@/components/JoinRequirements';
import { JourneyStepsEditor,JourneyExitEditor,JourneyValidation } from '@/components/orientation/JourneyAuthoring';
import { journeyErrors } from '@/lib/journey-authoring';
import { CONSENT_GATE_PATH, memberStatusLabel } from '@/lib/member-status';
import { useToast } from '@/hooks/use-toast';
import {
  Pencil, ArrowLeft, UserPlus, Lock, FileText, Check, Clock, ClipboardList, Eye,
  Link2Off, Map, Plus, Trash2, X, Handshake, ArrowUpDown, Globe2, Vote,
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
  fetchDomains,
} from '@/lib/api-client';
import type { QuizListItem, DomainListItem } from '@/types/api';
import { resolveExternalUrl } from '@/lib/media';
import { domainCode, domainLabel } from '@/lib/domain-label';
import { apiErrorMessage } from '@/lib/api-error-message';
import { EcosystemPostsSection } from '@/pages/discover/EcosystemPostsSection';

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

export default function EcosystemDetail() {
  const [, params] = useRoute('/ecosystems/:id');
  const id = params?.id ?? '';
  const { data, isLoading, error } = useEcosystemDetail(id);
  const { ecosystems } = useAuth();
  const { toast } = useToast();
  // The hook refreshes the session (the standing below follows) and toasts the outcome or the one failure.
  const joinMutation = useJoinEcosystem(id, { ecosystemName: data?.name });

  // G-Onboard: the caller's own row here decides; only an active row is a member, only an active mod+ row a steward.
  const standing = membershipStanding(id, ecosystems);
  const membershipStatus = ecosystems.find(e => e.id === id)?.membership_status;
  const isMember = standing === 'active';
  const isSteward = isStewardIn(id, ecosystems);

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
  const [journeyToDelete, setJourneyToDelete] = useState<JourneyMapItem | null>(null);

  // --- Domains (the Domains card); the shares card is EcosystemPostsSection (FX-Exchange) ---
  const [domainsLoading, setDomainsLoading] = useState(false);
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

  // --- Load domains ---
  const loadDomains = useCallback(async () => {
    if (!id || !isMember) return;
    setDomainsLoading(true);
    try {
      const domResult = await fetchDomains({ ecosystem_id: id });
      setEcoDomains(domResult.items ?? []);
    } catch { /* silent */ } finally { setDomainsLoading(false); }
  }, [id, isMember]);

  useEffect(() => {
    loadQuizzes();
    loadJourneyMaps();
    loadDomains();
  }, [loadQuizzes, loadJourneyMaps, loadDomains]);

  // --- Quiz handlers ---
  const handleAssignQuiz = async () => {
    if (!assignQuizId.trim()) return;
    setAssigning(true);
    try {
      await assignQuizToEcosystem(id, assignQuizId.trim(), assignAsEntry);
      toast({ title: 'Quiz assigned' });
      setAssignQuizId(''); setAssignAsEntry(false);
      await loadQuizzes();
    } catch (err) { toast({ title: 'Failed to assign quiz', description: apiErrorMessage(err), variant: 'destructive' }); }
    finally { setAssigning(false); }
  };
  const handleUnassignQuiz = async (quizId: string) => {
    try {
      await unassignQuizFromEcosystem(id, quizId);
      toast({ title: 'Quiz unassigned' }); await loadQuizzes();
    } catch (err) { toast({ title: 'Failed', description: apiErrorMessage(err), variant: 'destructive' }); }
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
      const errors = journeyErrors(contentSequence, exitPackage);
      if (errors.length) throw new Error(errors.join(' '));
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
    } catch (err) {
      // A SyntaxError here is the author's JSON, which apiErrorMessage would hide as engine text.
      const description = err instanceof SyntaxError ? `The content sequence or exit package is not valid JSON: ${err.message}` : apiErrorMessage(err);
      toast({ title: 'Journey map not created', description, variant: 'destructive' });
    }
    finally { setJmSaving(false); }
  };
  const handleToggleJmActive = async (jm: JourneyMapItem) => {
    try {
      await updateJourneyMap(jm.id, { is_active: !jm.is_active });
      toast({ title: jm.is_active ? 'Journey map deactivated' : 'Journey map activated' });
      await loadJourneyMaps();
    } catch (err) { toast({ title: 'Failed', description: apiErrorMessage(err), variant: 'destructive' }); }
  };
  const handleDeleteJourneyMap = async () => {
    if (!journeyToDelete) return;
    const jmId = journeyToDelete.id;
    setJourneyToDelete(null);
    try {
      await deleteJourneyMap(jmId);
      toast({ title: 'Journey map deleted' }); await loadJourneyMaps();
    } catch (err) { toast({ title: 'Failed', description: apiErrorMessage(err), variant: 'destructive' }); }
  };

  // Fetch agreements only when user is a member
  const { data: agreementsData } = useAgreements(isMember ? {} : false);
  const allEcoAgreements = (agreementsData?.items ?? []).filter((a: any) => a.ecosystem_id === id);
  const visibleAgreements = isMember ? allEcoAgreements : allEcoAgreements.filter((a: any) => a.hierarchy_level === 'ecosystem');

  // Governance stamp: derived from the current top-level agreement, never fabricated
  const governanceStamp = visibleAgreements
    .filter((a: any) => a.status === 'active')
    .sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''))[0] ?? null;
  // Open proposals: members-only fetch, mirrors agreements gating
  const { data: proposalsData } = useProposals(isMember ? {} : false);
  const openProposals = (proposalsData?.items ?? [])
    .filter((p: any) => p.ecosystem_id === id && !['adopted', 'rejected', 'withdrawn', 'expired'].includes(p.status));

  if (isLoading) return <LoadingState message="Loading ecosystem..." />;

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load ecosystem</p>
        <p className="text-sm text-muted-foreground mt-1">{error ? apiErrorMessage(error) : 'Not found'}</p>
        <Button asChild variant="outline" className="mt-4"><Link href="/ecosystems">Back to Ecosystems</Link></Button>
      </div>
    );
  }

  // A newcomer or a leaver joins; an "already in" 409 resolves and refreshes the stale session.
  const handleJoin = () => joinMutation.mutate();

  const assignedIds = new Set(ecoQuizzes.map(q => q.id));
  const unassignedQuizzes = allQuizzes.filter(q => !assignedIds.has(q.id));
  const websiteUrl = resolveExternalUrl(data.website);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href="/ecosystems"><ArrowLeft className="h-4 w-4 mr-1" />Back to Ecosystems</Link>
      </Button>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{data.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant(data.status)}>{data.status}</Badge>
            {data.visibility && <Badge variant="outline">{data.visibility}</Badge>}
            {isMember && <Badge variant="default">Member</Badge>}
            {(standing === 'left' || standing === 'paused') && <Badge variant="outline">{memberStatusLabel(membershipStatus)}</Badge>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/ethos/${id}`}>Open the ecosystem home</Link>
          </Button>
          {isSteward && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/ecosystems/${id}/edit`}><Pencil className="h-4 w-4 mr-1" />Edit</Link>
            </Button>
          )}
          {standing === 'pending' && (
            <Button asChild variant="outline" size="sm">
              <Link href={CONSENT_GATE_PATH}><Clock className="h-4 w-4 mr-1" />Waiting on your consent</Link>
            </Button>
          )}
          {(standing === 'none' || standing === 'left') && (
            <Button size="sm" onClick={handleJoin} disabled={joinMutation.isPending}>
              <UserPlus className="h-4 w-4 mr-1" />{joinMutation.isPending ? 'Joining…' : `Join ${data.name}`}
            </Button>
          )}
        </div>
      </div>

      {!isMember && <JoinRequirements type="ecosystem" id={id} returnTo={`/ethos/${id}`} prepare={() => joinMutation.mutateAsync()} />}
      {/* Governance stamp strip */}
      <div className="rounded-none border-2 border-strong-border p-3 text-sm">
        {governanceStamp ? (
          <dl className="flex flex-wrap gap-x-6 gap-y-1">
            <div><dt className="inline text-muted-foreground">Agreement: </dt><dd className="inline font-medium">{governanceStamp.title}</dd></div>
            <div><dt className="inline text-muted-foreground">Version: </dt><dd className="inline font-medium">{governanceStamp.version}</dd></div>
            <div><dt className="inline text-muted-foreground">Status: </dt><dd className="inline font-medium">{governanceStamp.status}</dd></div>
            <div><dt className="inline text-muted-foreground">Review due: </dt><dd className="inline font-medium">{governanceStamp.review_date ? new Date(governanceStamp.review_date).toLocaleDateString() : 'not scheduled'}</dd></div>
          </dl>
        ) : (
          <p className="text-muted-foreground">Governance profile incomplete — no active ecosystem agreement on record.</p>
        )}
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
            <div><dt className="text-muted-foreground">Website</dt><dd className="font-medium">{websiteUrl ? <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">{data.website}</a> : '-'}</dd></div>
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
                <Link key={agreement.id} href={`/agreements/${agreement.id}`} className="block rounded-none border-2 border-strong-border p-3 transition-colors hover:bg-accent">
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

      {/* Domains (members only) */}
      {isMember && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Globe2 className="h-5 w-5" />Domains</CardTitle>
              <Button asChild size="sm" variant="outline"><Link href="/domains">View all</Link></Button>
            </div>
          </CardHeader>
          <CardContent>
            {domainsLoading ? (
              <p className="text-sm text-muted-foreground">Loading domains...</p>
            ) : ecoDomains.length === 0 ? (
              <p className="text-sm text-muted-foreground">No domains documented yet.</p>
            ) : (
              <div className="space-y-2">
                {ecoDomains.map(d => (
                  <Link key={d.id} href={`/domains/${d.id}`} className="block rounded-none border-2 border-strong-border p-3 transition-colors hover:bg-accent">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {domainLabel(d)}
                        {domainCode(d) && <span className="ml-2 text-xs font-normal text-muted-foreground">{domainCode(d)}</span>}
                      </span>
                      <Badge variant={d.status === 'active' ? 'default' : 'secondary'} className="text-xs">{d.status}</Badge>
                    </div>
                    {d.purpose && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{d.purpose}</p>}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Open Proposals (members only) */}
      {isMember && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Vote className="h-5 w-5" />Open Proposals</CardTitle>
              <Button asChild size="sm" variant="outline"><Link href="/proposals">View all</Link></Button>
            </div>
          </CardHeader>
          <CardContent>
            {openProposals.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open proposals.</p>
            ) : (
              <div className="space-y-2">
                {openProposals.slice(0, 5).map((p: any) => (
                  <Link key={p.id} href={`/proposals/${p.id}`} className="block rounded-none border-2 border-strong-border p-3 transition-colors hover:bg-accent">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{p.title}</span>
                      <Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-xs">{p.status}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{p.type}</span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ethos / Journey Map Management (members only) */}
      {isMember && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><Map className="h-5 w-5" />Orientation Journey Maps</CardTitle>
              {isSteward && (
                <Button size="sm" variant="outline" onClick={() => setShowJmForm(!showJmForm)}>
                  {showJmForm ? <><X className="h-4 w-4 mr-1" />Cancel</> : <><Plus className="h-4 w-4 mr-1" />New Journey Map</>}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {showJmForm && (
              <div className="space-y-3 rounded-none border-2 border-strong-border bg-muted/30 p-4">
                <div className="space-y-1">
                  <Label htmlFor="journey-map-title">Title</Label>
                  <Input id="journey-map-title" value={jmForm.title} onChange={e => setJmForm({ ...jmForm, title: e.target.value })} placeholder="e.g. New Member Orientation" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="journey-map-description">Description</Label>
                  <Textarea id="journey-map-description" value={jmForm.description} onChange={e => setJmForm({ ...jmForm, description: e.target.value })} placeholder="Brief description of this journey" rows={2} />
                </div>
                <div className="space-y-1">
                  <JourneyStepsEditor ecosystemId={id} value={jmForm.contentJson} onChange={contentJson => setJmForm({...jmForm,contentJson})} />
                  <JourneyExitEditor value={jmForm.exitJson} onChange={exitJson => setJmForm({...jmForm,exitJson})} />
                  <JourneyValidation steps={jmForm.contentJson} exit={jmForm.exitJson} />
                </div>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={jmForm.is_default} onChange={e => setJmForm({ ...jmForm, is_default: e.target.checked })} className="rounded-[2px] border-2 border-control-border" />
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
                  <div key={jm.id} className="flex items-center justify-between rounded-none border-2 border-strong-border p-3">
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
                    {isSteward && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleToggleJmActive(jm)} aria-label={jm.is_active ? `Deactivate ${jm.title}` : `Activate ${jm.title}`}>
                          <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setJourneyToDelete(jm)} aria-label={`Delete ${jm.title}`}>
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <AlertDialog open={journeyToDelete !== null} onOpenChange={(open) => { if (!open) setJourneyToDelete(null); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this journey map?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Delete {journeyToDelete?.title ?? 'this journey map'} and all associated progress?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => void handleDeleteJourneyMap()}>Delete journey map</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
              <div className="overflow-x-auto rounded-none border-2 border-strong-border">
                <table className="w-full min-w-[42rem] text-sm">
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
                            <Button asChild variant="ghost" size="sm"><Link href={`/quiz/results/${q.id}`}><Eye className="h-4 w-4 mr-1" />Results</Link></Button>
                            {isSteward && (
                              <Button variant="ghost" size="sm" onClick={() => handleUnassignQuiz(q.id)} aria-label={`Unassign ${q.title}`}><Link2Off className="h-4 w-4" aria-hidden="true" /></Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {isSteward && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Assign a Quiz</p>
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                  <div className="flex-1">
                    <Label htmlFor="assign-quiz-select" className="mb-1 block text-xs text-muted-foreground">Select Quiz</Label>
                    <Select value={assignQuizId} onValueChange={setAssignQuizId}>
                      <SelectTrigger id="assign-quiz-select"><SelectValue placeholder="Choose a quiz..." /></SelectTrigger>
                      <SelectContent>
                        {unassignedQuizzes.length === 0 ? <SelectItem value="_none" disabled>No available quizzes</SelectItem> : unassignedQuizzes.map(q => <SelectItem key={q.id} value={q.id}>{q.title}{!q.is_published ? ' (Draft)' : ''}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={assignAsEntry} onChange={e => setAssignAsEntry(e.target.checked)} className="rounded-[2px] border-2 border-control-border" />Entry Quiz
                  </label>
                  <Button size="sm" onClick={handleAssignQuiz} disabled={assigning || !assignQuizId}>{assigning ? 'Assigning...' : 'Assign'}</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Shares & Needs (members only): FX-Exchange's EcosystemPostsSection, server flags for every control */}
      {isMember && <EcosystemPostsSection ecosystemId={id} ecosystemName={data.name} />}
    </div>
  );
}
