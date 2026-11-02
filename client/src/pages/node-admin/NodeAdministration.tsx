import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation, useSearch } from 'wouter';
import { useSupportChat } from '@/contexts/SupportChatContext';
import { useAuth } from '@/contexts/AuthContext';
import { NodeAdminBadge } from '@/components/NodeAdminBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { apiErrorMessage } from '@/lib/api-error-message';
import { keys } from '@/lib/query-keys';
import { fetchSupportCatalog, fetchSupportResources, inspectSupportResource, runSupportCommand, fetchNodeAdmins, fetchNodeAdminUsers, grantNodeAdmin, revokeNodeAdmin, fetchSupportArchives } from '@/lib/node-admin-api';
import { isPublicSupportReason } from '@/lib/support-reasons';
import { fieldOptions, prepareSupportCommand, parseSupportRecordLink, supportAuditPath, supportDisplayValue } from '@/lib/node-admin';
import type { NodeAdminUser, SupportCommand, SupportField, SupportReceipt, SupportRecord, NodeAdminReceipt } from '@/types/node-admin';

const selectClass = 'min-h-11 w-full border border-input bg-background px-3 py-2 text-sm';
const actionLabel = (value: string) => value.replaceAll('_', ' ').replace(/^./, letter => letter.toUpperCase());
function Receipt({ receipt }: { receipt: { audit_id: string; resource?: SupportRecord } | null }) {
  return receipt ? <p role="status" className="border border-border p-3 text-sm">Support action recorded. {receipt.resource?.archive_id ? <span className="break-all">Archive ID: {String(receipt.resource.archive_id)}. </span> : null}<Link className="underline font-bold" href={supportAuditPath(receipt.audit_id)}>View public audit receipt</Link></p> : null;
}
function Failure({ error }: { error: unknown }) {
  return error ? <p role="alert" className="text-sm text-destructive">{apiErrorMessage(error)}</p> : null;
}
function FieldEditor({ field, value, onChange }: { field: SupportField; value: string; onChange: (value: string) => void }) {
  const id = `support-field-${field.name}`;
  const options = fieldOptions(field);
  return <div className="space-y-2"><Label htmlFor={id}>{field.label}{field.required ? ' (required)' : ''}</Label>
    {options.length > 0 || field.type === 'boolean' ? <select id={id} className={selectClass} value={value} onChange={event => onChange(event.target.value)}><option value="">Choose a value</option>{(field.type === 'boolean' ? [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }] : options).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      : ['text', 'json', 'object', 'array'].includes(field.type) || /description|body|content|rationale/.test(field.name) ? <Textarea id={id} value={value} rows={4} onChange={event => onChange(event.target.value)} />
      : <Input id={id} type={field.type === 'date' ? 'date' : ['datetime', 'datetime-local'].includes(field.type) ? 'datetime-local' : 'text'} inputMode={['number', 'integer', 'float', 'numeric'].includes(field.type) ? 'decimal' : undefined} value={value} onChange={event => onChange(event.target.value)} />}
    {field.reference && <p className="text-xs text-muted-foreground">Reference: {field.reference}. Use a record identifier from Resources.</p>}
    {['json', 'object', 'array'].includes(field.type) && <p className="text-xs text-muted-foreground">Enter structured JSON for this field. The server checks its allowed content.</p>}
  </div>;
}
function ReasonSelector({ id, label, value, categories, disabled, onChange }: { id: string; label: string; value: string; categories: readonly string[]; disabled?: boolean; onChange: (value: string) => void }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label><select id={id} className={selectClass} value={value} disabled={disabled || categories.length === 0} onChange={event => onChange(event.target.value)}><option value="">Choose a public category</option>{categories.map(category => <option key={category} value={category}>{category}</option>)}</select><p className="text-xs text-muted-foreground">The selected category is public. Record content stays private.</p></div>;
}
function ReviewDialog({ open, title, children, error, pending, onClose, onConfirm }: { open: boolean; title: string; children: React.ReactNode; error: unknown; pending: boolean; onClose: () => void; onConfirm: () => void }) {
  return <AlertDialog open={open} onOpenChange={value => { if (!value && !pending) onClose(); }}><AlertDialogContent className="max-h-[85vh] overflow-y-auto"><AlertDialogHeader><AlertDialogTitle>{title}</AlertDialogTitle><AlertDialogDescription asChild><div className="space-y-3 text-left">{children}<p>Your identity, reason category and action will be publicly recorded.</p></div></AlertDialogDescription></AlertDialogHeader><Failure error={error} /><AlertDialogFooter><AlertDialogCancel disabled={pending}>Back</AlertDialogCancel><Button disabled={pending} onClick={onConfirm}>{pending ? 'Recording…' : 'Confirm and record action'}</Button></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

export default function NodeAdministration() {
  const auth = useAuth();
  const supportChat = useSupportChat();
  const [location] = useLocation();
  const queryString = useSearch();
  const appliedLink = useRef('');
  const [linkError, setLinkError] = useState('');
  const [chatReason, setChatReason] = useState('');
  const queryClient = useQueryClient();
  const owner = auth.user?.id ?? '';
  const [tab, setTab] = useState<'resources' | 'admins'>(location.startsWith('/admin/node-admins') ? 'admins' : 'resources');
  const [organization, setOrganization] = useState('');
  const [kind, setKind] = useState('');
  const [showArchives, setShowArchives] = useState(false);
  const [restoreId, setRestoreId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<SupportRecord | null>(null);
  const [inspected, setInspected] = useState<SupportRecord | null>(null);
  const [reason, setReason] = useState('');
  const [action, setAction] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [review, setReview] = useState<SupportCommand | null>(null);
  const [localError, setLocalError] = useState('');
  const [receipt, setReceipt] = useState<SupportReceipt | null>(null);
  const generation = useRef(0);
  const catalog = useQuery({ queryKey: [...keys.nodeAdmin.all, owner, 'catalog'], queryFn: fetchSupportCatalog });
  const reasonCategories = catalog.data?.reason_categories ?? [];
  const validReason = isPublicSupportReason(reason, reasonCategories);
  const validChatReason = isPublicSupportReason(chatReason, reasonCategories);
  const spec = catalog.data?.items.find(item => item.key === kind) ?? catalog.data?.items[0];
  const selectedKind = spec?.key ?? '';
  const records = useQuery({ queryKey: [...keys.nodeAdmin.all, owner, 'resources', selectedKind, organization, search, page], queryFn: () => fetchSupportResources(selectedKind, { organization_id: spec?.organization_scoped || spec?.key === 'ecosystems' ? organization : '', q: search, page, per_page: 20 }), enabled: !!selectedKind && tab === 'resources' });
  const archives = useQuery({ queryKey: [...keys.nodeAdmin.all, owner, 'archives', selectedKind], queryFn: () => fetchSupportArchives(selectedKind), enabled: showArchives && !!selectedKind });
  const inspection = useMutation({
    mutationFn: async (value: { resource_type: string; resource_id: string; reason: string; generation: number }) => ({ result: await inspectSupportResource({ resource_type: value.resource_type, resource_id: value.resource_id, reason: value.reason }), generation: value.generation }),
    onSuccess: ({ result, generation: completed }) => { if (completed !== generation.current) return; setInspected(result.resource); setReceipt(result); setFields({}); setAction(''); void queryClient.invalidateQueries({ queryKey: keys.nodeAudit.all }); },
  });
  async function refresh() { await Promise.all([queryClient.invalidateQueries(), auth.refreshSession()]); }
  const command = useMutation({ mutationFn: runSupportCommand, onSuccess: async result => { setReceipt(result); setReview(null); setSelected(null); setInspected(null); setFields({}); setAction(''); await refresh(); } });
  function clearRecord() { generation.current += 1; setSelected(null); setInspected(null); setReason(''); setRestoreId(''); setAction(''); setFields({}); setReview(null); setLocalError(''); setReceipt(null); inspection.reset(); command.reset(); }
  useEffect(() => { clearRecord(); setShowArchives(false); }, [owner, selectedKind, organization]);
  useEffect(() => { if (location.startsWith('/admin/node-admins')) setTab('admins'); }, [location]);
  useEffect(() => {
    if (!catalog.data) return;
    const href = location.split('?')[0] + window.location.search;
    if (appliedLink.current === href) return;
    appliedLink.current = href;
    if (!window.location.search || location.split('?')[0] !== '/admin') return;
    const link = parseSupportRecordLink(href, catalog.data.items.map(item => item.key));
    if (!link || (link.organizationId && !catalog.data.organizations.some(item => item.id === link.organizationId))) { setLinkError('This support record link is not available in the node catalog.'); return; }
    clearRecord(); setTab('resources'); setKind(link.resource); setOrganization(link.organizationId ?? ''); setSearch(link.record); setPage(1); setLinkError('');
  }, [catalog.data, location, queryString, owner]);
  const busy = inspection.isPending || command.isPending;
  const organizationName = catalog.data?.organizations.find(item => item.id === organization)?.name;
  const editable = spec?.fields.filter(field => field.editable && (action !== 'restore_evidence' || field.name === 'archive_id') && !(field.name === 'ecosystem_id' && spec?.organization_scoped) && (action !== 'override_state' || ['status', 'current_status', 'state'].includes(field.name))) ?? [];
  function reviewCommand() {
    if (!spec) return;
    try { setReview(prepareSupportCommand(spec, { action, organizationId: spec.organization_scoped ? organization || String(inspected?.ecosystem_id ?? inspected?.organization_id ?? '') : '', resourceId: action === 'restore_evidence' ? restoreId : inspected?.id, version: inspected?.version, fields, reason, reasonCategories })); setLocalError(''); } catch (error) { setLocalError(apiErrorMessage(error)); }
  }
  return <div className="space-y-6">
    <Failure error={linkError} />
    <header className="space-y-3"><h1 className="text-3xl font-bold">Node Administration</h1><div className="flex flex-wrap gap-2 items-center"><NodeAdminBadge /><span>Signed in as {auth.user?.display_name || auth.member?.display_name || 'Node admin'}</span></div><p className="text-muted-foreground">Technical support across every organization on this node. Support actions and intentional record inspections are publicly recorded with your identity and reason category.</p><Link className="underline font-bold" href="/node/audit">Public support history</Link></header>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Node administration sections"><Button variant={tab === 'resources' ? 'default' : 'outline'} disabled={busy} onClick={() => setTab('resources')}>Resources</Button><Button variant={tab === 'admins' ? 'default' : 'outline'} disabled={busy} onClick={() => setTab('admins')}>Node admins</Button></div>
    {tab === 'admins' ? <AdminRoster owner={owner} onChanged={refresh} reasonCategories={reasonCategories} /> : <>
      <Card><CardContent className="grid gap-4 p-5 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="support-organization">Support organization</Label><select id="support-organization" className={selectClass} value={organization} disabled={busy} onChange={event => { setOrganization(event.target.value); setPage(1); }}><option value="">Entire node</option>{catalog.data?.organizations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><p className="text-xs text-muted-foreground">Support scope: {organizationName || 'entire node'}. Your ordinary ecosystem selection stays separate.</p></div><div className="space-y-2"><Label htmlFor="support-resource">Feature / resource</Label><select id="support-resource" className={selectClass} value={selectedKind} disabled={busy || !catalog.data} onChange={event => { setKind(event.target.value); setPage(1); setSearch(''); }}><option value="" disabled>Choose a resource</option>{catalog.data?.items.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Agent support session</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm">Start a separate conversation for technical support in the selected organization. The agent records support actions under your own identity.</p><ReasonSelector id="support-chat-reason" label="Public reason category for this support session (required)" value={chatReason} categories={reasonCategories} onChange={setChatReason} disabled={busy} /><Button disabled={!organization || !validChatReason || busy} onClick={() => supportChat.launch({ enabled: true, organization_id: organization, reason: chatReason })}>Start agent support for {organizationName || 'selected organization'}</Button>{!organization && <p className="text-xs text-muted-foreground">Choose one support organization to start an agent support session.</p>}</CardContent></Card>
      <Failure error={catalog.error} />{catalog.isLoading && <p role="status">Loading support capabilities…</p>}{catalog.data && !spec && <p>No support resources are registered on this node.</p>}
      {spec && <Card><CardHeader className="space-y-4"><div className="flex flex-wrap justify-between items-center gap-3"><CardTitle>{spec.label}</CardTitle>{spec.actions.includes('create') && <Button disabled={busy} onClick={() => { clearRecord(); setAction('create'); }}>{['proposal', 'proposals'].includes(spec.key) ? 'Propose for an organization' : `Create ${spec.label.toLowerCase()}`}</Button>}</div><Label htmlFor="support-search">Find records</Label><Input id="support-search" value={search} disabled={busy} onChange={event => { setSearch(event.target.value); setPage(1); }} placeholder="Search this resource" /></CardHeader><CardContent className="space-y-4"><Failure error={records.error} />
        {records.isLoading ? <p role="status">Loading records…</p> : records.data?.items.length ? <div className="space-y-3">{records.data.items.map(record => <div key={record.id} className="border border-border p-4 flex flex-wrap gap-3 justify-between items-start"><dl className="min-w-0 space-y-1">{spec.listing_fields.map(name => <div key={name} className="text-sm break-words"><dt className="inline font-bold">{spec.fields.find(field => field.name === name)?.label ?? actionLabel(name)}: </dt><dd className="inline">{supportDisplayValue(record[name]).slice(0, 240)}</dd></div>)}<div className="text-xs break-all text-muted-foreground">Record ID: {record.id}</div></dl><Button variant="outline" disabled={busy} onClick={() => { clearRecord(); setSelected(record); }}>Inspect and manage</Button></div>)}</div> : <p>No records match this support scope.</p>}
        {records.data && <div className="flex flex-wrap items-center gap-3"><Button variant="outline" disabled={busy || page <= 1} onClick={() => { clearRecord(); setPage(page - 1); }}>Previous</Button><span>Page {page} · {records.data.total} records</span><Button variant="outline" disabled={busy || page * 20 >= records.data.total} onClick={() => { clearRecord(); setPage(page + 1); }}>Next</Button></div>}
      </CardContent></Card>}
      {spec?.actions.includes('restore_evidence') && <Card><CardHeader><CardTitle>Archived evidence</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm">Archiving preserves the original record in a protected snapshot and records the correction publicly. Restore uses the original identity and cannot overwrite another record.</p><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={busy} onClick={() => setShowArchives(value => !value)}>{showArchives ? 'Hide archives' : 'Find archived records'}</Button><Button variant="outline" disabled={busy} onClick={() => { clearRecord(); setAction('restore_evidence'); }}>Restore by receipt identifiers</Button></div>{showArchives && <><Failure error={archives.error} />{archives.isLoading && <p role="status">Loading archive references...</p>}{archives.data?.items.map(archive => <div key={archive.id} className="border border-border p-3 space-y-2"><p className="text-sm break-all">Record: {archive.resource_id} / Archive: {archive.id}</p><p className="text-sm">{new Date(archive.created_at).toLocaleString()}</p><Button variant="outline" disabled={busy} onClick={() => { clearRecord(); setRestoreId(archive.resource_id); setFields({ archive_id: archive.id }); setAction('restore_evidence'); }}>Restore archived record</Button></div>)}{archives.data?.items.length === 0 && <p>No archived records in this resource family.</p>}</>}</CardContent></Card>}
      {(selected || action === 'create' || action === 'restore_evidence') && spec && <Card><CardHeader><CardTitle>{action === 'create' ? `Create ${spec.label.toLowerCase()}` : action === 'restore_evidence' ? 'Restore archived evidence' : `Support record ${selected?.id}`}</CardTitle></CardHeader><CardContent className="space-y-5">
        <ReasonSelector id="support-reason" label="Public support reason category (required)" value={reason} categories={reasonCategories} disabled={busy} onChange={setReason} />
        {selected && !inspected && <><Button disabled={busy || !validReason} onClick={() => inspection.mutate({ resource_type: spec.key, resource_id: selected.id, reason, generation: generation.current })}>Record inspection and open details</Button><Failure error={inspection.error} /></>}
        {inspected && <><dl className="grid gap-3 sm:grid-cols-2">{spec.fields.map(field => <div key={field.name} className="min-w-0"><dt className="text-sm font-bold">{field.label}</dt><dd className="text-sm whitespace-pre-wrap break-words max-h-48 overflow-auto">{supportDisplayValue(inspected[field.name])}</dd></div>)}</dl><div className="space-y-2"><Label htmlFor="support-action">Support action</Label><select id="support-action" className={selectClass} value={action} disabled={busy} onChange={event => { setAction(event.target.value); setFields({}); setLocalError(''); }}><option value="">Choose an action</option>{spec.actions.filter(value => value !== 'create' && value !== 'inspect').map(value => <option key={value} value={value}>{actionLabel(value)}</option>)}</select>{spec.actions.filter(value => value !== 'create' && value !== 'inspect').length === 0 && <p className="text-sm text-muted-foreground">This evidence record supports inspection only. Member participation cannot be manufactured through support controls.</p>}</div></>}
        {action === 'restore_evidence' && <div className="space-y-2"><Label htmlFor="support-restore-id">Original record ID (required)</Label><Input id="support-restore-id" value={restoreId} onChange={event => setRestoreId(event.target.value)} /></div>}
        {action === 'override_state'  && <p className="border border-border p-3 text-sm">This records a technical state correction. It does not record member advice, consent or test evidence.</p>}
        {['create', 'update', 'override_state', 'restore_evidence'].includes(action) && <div className="grid gap-5 sm:grid-cols-2">{editable.map(field => <FieldEditor key={field.name} field={field} value={fields[field.name] ?? (action !== 'create' && inspected?.[field.name] !== undefined && inspected?.[field.name] !== null ? typeof inspected[field.name] === 'object' ? (JSON.stringify(inspected[field.name]) ?? '') : String(inspected[field.name]) : '')} onChange={value => setFields(current => ({ ...current, [field.name]: value }))} />)}</div>}
        {action && <Button disabled={busy} onClick={reviewCommand}>Review support action</Button>}<Failure error={localError || command.error} /><Button variant="ghost" disabled={busy} onClick={clearRecord}>Close record</Button>
      </CardContent></Card>}
      <Receipt receipt={receipt} />
      <ReviewDialog open={!!review} title="Confirm public support action" error={command.error} pending={command.isPending} onClose={() => setReview(null)} onConfirm={() => review && command.mutate(review)}><p>{actionLabel(review?.action ?? '')} · {spec?.label}</p><p className="break-all">Target: {review?.resource_id || `New record for ${organizationName || review?.organization_id || 'entire node'}`}</p><p className="break-all">Organization: {review?.organization_id || 'Node-wide'}</p><p>Public reason category: {review?.reason}</p>{review && Object.entries(review.values).map(([name, value]) => <p key={name} className="break-words"><strong>{spec?.fields.find(field => field.name === name)?.label ?? name}:</strong> {supportDisplayValue(value)}</p>)}</ReviewDialog>
    </>}
  </div>;
}

function AdminRoster({ owner, onChanged, reasonCategories }: { owner: string; onChanged: () => Promise<void>; reasonCategories: readonly string[] }) {
  const [search, setSearch] = useState('');
  const [target, setTarget] = useState<NodeAdminUser | null>(null);
  const [reason, setReason] = useState('');
  const [review, setReview] = useState<{ user: NodeAdminUser; action: 'grant' | 'revoke'; reason: string } | null>(null);
  const [receipt, setReceipt] = useState<NodeAdminReceipt | null>(null);
  const roster = useQuery({ queryKey: [...keys.nodeAdmin.all, owner, 'admins'], queryFn: fetchNodeAdmins });
  const users = useQuery({ queryKey: [...keys.nodeAdmin.all, owner, 'users', search], queryFn: () => fetchNodeAdminUsers(search), enabled: search.trim().length >= 2 });
  const mutation = useMutation({ mutationFn: (value: NonNullable<typeof review>) => (value.action === 'grant' ? grantNodeAdmin : revokeNodeAdmin)({ user_id: value.user.id, reason: value.reason }), onSuccess: async result => { setReceipt(result); setReview(null); setTarget(null); setSearch(''); setReason(''); await onChanged(); } });
  const validReason = isPublicSupportReason(reason, reasonCategories);
  const revoking = !!target && !!roster.data?.items.some(item => item.user_id === target.id && item.active);
  return <section className="space-y-5"><h2 className="text-2xl font-bold">Node admins</h2><p>Node admins assist every organization and user. This assignment is separate from organization membership and achievement badges.</p><Failure error={roster.error} />{roster.isLoading && <p role="status">Loading node admins…</p>}
    <div className="space-y-3">{roster.data?.items.map(admin => <div key={admin.user_id} className="border border-border p-4 space-y-3"><div className="flex flex-wrap items-center gap-2"><strong>{admin.display_name}</strong>{admin.active ? <NodeAdminBadge /> : <span>Revoked</span>}</div><p className="text-sm break-all">User: {admin.user_id}{admin.user_id === owner ? ' (you)' : ''}</p><p className="text-sm">Granted {new Date(admin.granted_at).toLocaleString()}{admin.revoked_at ? ` · Revoked ${new Date(admin.revoked_at).toLocaleString()}` : ''}</p>{admin.active && <Button variant="outline" disabled={mutation.isPending} onClick={() => { setTarget({ id: admin.user_id, display_name: admin.display_name, username: null }); setReason(''); }}>Select for revocation</Button>}</div>)}</div>
    <Card><CardHeader><CardTitle>Grant or revoke node support authority</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="node-user-search">Find a user to grant node admin</Label><Input id="node-user-search" value={search} disabled={mutation.isPending} onChange={event => { setSearch(event.target.value); setTarget(null); }} placeholder="Name or username (at least 2 characters)" /></div><Failure error={users.error} />{search.trim().length >= 2 && <div className="space-y-2">{users.isLoading ? <p role="status">Finding users…</p> : users.data?.items.map(user => <Button key={user.id} variant="outline" className="w-full h-auto min-h-11 justify-start text-left whitespace-normal" onClick={() => setTarget(user)}>{user.display_name}{user.username ? ` (@${user.username})` : ''} · {user.id}</Button>)}{!users.isLoading && users.data?.items.length === 0 && <p>No users match this search.</p>}</div>}
      {target && <><p className="break-all">Selected: <strong>{target.display_name}</strong> · {target.id}</p><ReasonSelector id="node-admin-reason" label="Public reason category (required)" value={reason} categories={reasonCategories} disabled={mutation.isPending} onChange={setReason} /><Button disabled={!validReason || mutation.isPending} onClick={() => { mutation.reset(); setReview({ user: target, action: revoking ? 'revoke' : 'grant', reason }); }}>Review {revoking ? 'revocation' : 'grant'}</Button></>}
    </CardContent></Card><Receipt receipt={receipt} />
    <ReviewDialog open={!!review} title={review?.action === 'grant' ? 'Grant node admin?' : 'Revoke node admin?'} error={mutation.error} pending={mutation.isPending} onClose={() => setReview(null)} onConfirm={() => review && mutation.mutate(review)}><p className="break-all">{review?.user.display_name} · {review?.user.id}</p><p>{review?.action === 'grant' ? 'This user will be able to manage application state across every organization on this node.' : 'This user will lose node support authority.'}</p><p>Public reason category: {review?.reason}</p></ReviewDialog>
  </section>;
}
