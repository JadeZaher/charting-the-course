import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useRoute } from 'wouter';
import { NodeAdminBadge } from '@/components/NodeAdminBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { keys } from '@/lib/query-keys';
import { fetchPublicNodeAdmins, fetchPublicSupportAudit, fetchPublicSupportAuditEntry } from '@/lib/node-admin-api';
import { apiErrorMessage } from '@/lib/api-error-message';
import { supportAuditPath } from '@/lib/node-admin';
import type { PublicSupportAudit } from '@/types/node-admin';

function AuditEntry({ entry }: { entry: PublicSupportAudit }) {
  return <article className="border border-border p-5 space-y-3" aria-label={`${entry.action} by ${entry.actor_name}`}><div className="flex flex-wrap items-center gap-2"><strong>{entry.actor_name}</strong><span>{entry.action.replaceAll('_', ' ')}</span><span className="font-bold">{entry.outcome}</span></div><p className="text-sm"><time dateTime={entry.created_at}>{new Date(entry.created_at).toLocaleString()}</time></p><dl className="grid gap-3 text-sm sm:grid-cols-2"><div><dt className="font-bold">Resource</dt><dd className="break-all">{entry.resource_type} · {entry.resource_id || 'No record created'}</dd></div><div><dt className="font-bold">Organization</dt><dd className="break-all">{entry.organization_id || 'Node-wide'}</dd></div><div><dt className="font-bold">Actor user ID</dt><dd className="break-all">{entry.actor_user_id}</dd></div><div><dt className="font-bold">Changed fields</dt><dd>{entry.changed_fields.length ? entry.changed_fields.join(', ') : 'No field values changed'}</dd></div></dl><p className="whitespace-pre-wrap break-words"><strong>Public reason category: </strong>{entry.reason}</p><Link className="underline text-sm" href={supportAuditPath(entry.id)}>Public record {entry.id}</Link></article>;
}
export default function NodeAudit() {
  const [, params] = useRoute('/node/audit/:id');
  const id = params?.id;
  const [draft, setDraft] = useState({ actor_user_id: '', organization_id: '', resource_type: '', outcome: '' });
  const [filters, setFilters] = useState(draft);
  const [page, setPage] = useState(1);
  const roster = useQuery({ queryKey: [...keys.nodeAudit.all, 'roster'], queryFn: fetchPublicNodeAdmins });
  const list = useQuery({ queryKey: [...keys.nodeAudit.all, 'list', filters, page], queryFn: () => fetchPublicSupportAudit({ ...filters, page, per_page: 20 }), enabled: !id });
  const detail = useQuery({ queryKey: [...keys.nodeAudit.all, 'detail', id], queryFn: () => fetchPublicSupportAuditEntry(id!), enabled: !!id });
  const error = id ? detail.error : list.error;
  return <div className="mx-auto w-full max-w-6xl p-5 sm:p-8 space-y-6"><header className="space-y-3"><Link className="underline" href="/">NEOS home</Link><h1 className="text-3xl font-bold">Public node support history</h1><p>Node admins assist users and organizations with technical support and testing. Their support actions are recorded here with their identity, reason category, outcome and changed field names. Private record bodies and secrets are excluded.</p>{id && <Link className="underline" href="/node/audit">All support actions</Link>}</header>
    <section aria-label="Official node support operators" className="border border-border p-5 space-y-3"><h2 className="text-xl font-bold">Find a node support operator</h2><p className="text-sm">These badged users are assigned to help every organization and user on this node with technical difficulties.</p>{roster.isLoading && <p role="status">Loading support operators...</p>}{roster.error && <p role="alert" className="text-destructive">{apiErrorMessage(roster.error)}</p>}<div className="flex flex-wrap gap-3">{roster.data?.items.map(operator => <Link key={operator.user_id} className="border border-border min-h-11 p-3 flex flex-wrap items-center gap-2 underline" href={`/users/${encodeURIComponent(operator.user_id)}`}><NodeAdminBadge /><span>{operator.display_name}</span><span className="sr-only"> public profile</span></Link>)}</div>{roster.data?.items.length === 0 && <p>No active node support operators are listed.</p>}</section>
    {!id && <form className="border border-border p-4 space-y-4" onSubmit={event => { event.preventDefault(); setFilters(draft); setPage(1); }}><div className="grid gap-4 sm:grid-cols-2">{([['actor_user_id', 'Actor user ID'], ['organization_id', 'Organization ID'], ['resource_type', 'Resource type'], ['outcome', 'Outcome']] as const).map(([key, label]) => <div className="space-y-2" key={key}><Label htmlFor={`audit-${key}`}>{label}</Label><Input id={`audit-${key}`} value={draft[key]} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))} /></div>)}</div><Button type="submit">Filter support history</Button></form>}
    {error && <p role="alert" className="text-destructive">{apiErrorMessage(error)}</p>}{(id ? detail.isLoading : list.isLoading) && <p role="status">Loading public support history…</p>}
    {id ? detail.data && <AuditEntry entry={detail.data} /> : <><div className="space-y-4">{list.data?.items.map(entry => <AuditEntry key={entry.id} entry={entry} />)}{list.data?.items.length === 0 && <p>No support actions match these filters.</p>}</div>{list.data && <div className="flex flex-wrap gap-3 items-center"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button><span>Page {page} · {list.data.total} actions</span><Button variant="outline" disabled={page * 20 >= list.data.total} onClick={() => setPage(page + 1)}>Next</Button></div>}</>}
  </div>;
}
