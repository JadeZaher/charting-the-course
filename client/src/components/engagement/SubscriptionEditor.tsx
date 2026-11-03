import { useEffect, useState } from 'react';
import { useSearch } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { engagementWrite, useEngagementCapabilities, useEngagementMutation, useEngagementScopes, useEngagementSubscriptions, useSaveSubscription } from '@/hooks/use-engagement';
import { channelLabels, familyLabels, frequencyLabels, isEngagementScope, scopeLabels, type EngagementChannel, type EngagementFamily, type EngagementScope, type Frequency } from '@/lib/engagement';
import type { EngagementSubscription, SubscriptionInput } from '@/types/engagement';
import { MutationFeedback, QueryFeedback } from './QueryFeedback';

const selectStyle = 'min-h-11 w-full min-w-0 border border-input bg-background px-3 py-2 text-sm';
export function SubscriptionEditor() {
  const queryString = useSearch();
  const params = new URLSearchParams(queryString);
  const requestedKind = params.get('scope') as EngagementScope;
  const [kind, setKind] = useState<EngagementScope>(isEngagementScope(requestedKind) ? requestedKind : 'ecosystem');
  const [scopeId, setScopeId] = useState(params.get('id') || '');
  const [search, setSearch] = useState('');
  const [families, setFamilies] = useState<EngagementFamily[]>(Object.keys(familyLabels) as EngagementFamily[]);
  const [channels, setChannels] = useState<EngagementChannel[]>(['in_app']);
  const [frequency, setFrequency] = useState<Frequency>('daily');
  const [muted, setMuted] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const next = new URLSearchParams(queryString);
    const nextKind = next.get('scope') as EngagementScope;
    if (isEngagementScope(nextKind) && next.get('id')) {
      setKind(nextKind); setScopeId(next.get('id')!); setSearch('');
    }
  }, [queryString]);
  const scopes = useEngagementScopes(kind, search, scopeId);
  const subscriptions = useEngagementSubscriptions();
  const capabilities = useEngagementCapabilities();
  const save = useSaveSubscription();
  const remove = useEngagementMutation((id: string) => engagementWrite(`/subscriptions/${encodeURIComponent(id)}`, 'DELETE'));
  const options = scopes.data?.items ?? [];
  const target = scopes.isError ? undefined : options.find(item => item.scope_id === scopeId);
  const supported = scopes.data?.supported_kinds ?? Object.keys(scopeLabels) as EngagementScope[];
  const input: SubscriptionInput = { scope_kind: kind, scope_id: scopeId, event_families: families, channels, frequency, muted };
  function edit(value: EngagementSubscription) {
    setKind(value.scope_kind); setScopeId(value.scope_id); setSearch(''); setFamilies(value.event_families); setChannels(value.channels); setFrequency(value.frequency); setMuted(value.muted);
    setNotice(`Editing updates for ${value.scope_label}. Review the choices below, then save.`);
    save.reset(); remove.reset();
    document.getElementById('subscription-editor-title')?.focus();
  }
  function toggle<T>(value: T, selected: T[], set: (next: T[]) => void) { set(selected.includes(value) ? selected.filter(item => item !== value) : [...selected, value]); }
  return <section className="space-y-5 border-t border-border pt-8" aria-labelledby="subscriptions-title">
    <h2 id="subscriptions-title" className="text-2xl font-bold">What you follow</h2>
    <p className="text-sm text-muted-foreground">Follow a whole community or a specific conversation, project or decision. Following never joins a community. Muting a specific item overrides broader follows.</p>
    <QueryFeedback pending={subscriptions.isPending} error={subscriptions.error} retry={subscriptions.refetch} />
    {!subscriptions.isError && subscriptions.data?.items.length === 0 && <p className="text-sm">You have no saved follows yet. Community activity and direct messages can still appear in-app.</p>}
    {!subscriptions.isError && <ul className="divide-y divide-border">{subscriptions.data?.items.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4"><div className="min-w-0"><p className="break-words font-semibold">{item.scope_label}</p><p className="mt-1 text-sm text-muted-foreground">{item.muted ? 'Muted across matching follows' : `${item.channels.map(channel => channelLabels[channel]).join(', ')} · ${frequencyLabels[item.frequency]}`}</p></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => edit(item)}>Edit {item.muted ? 'mute' : 'follow'}</Button><Button variant="outline" disabled={remove.isPending} onClick={() => remove.mutate(item.id)}>Remove</Button></div></li>)}</ul>}
    <MutationFeedback error={remove.error} success={remove.isSuccess} successText="Follow removed. Default in-app activity remains available." />
    <form className="space-y-5 border border-border bg-card p-4 sm:p-5" onSubmit={event => { event.preventDefault(); setNotice(''); if (target) save.mutate(input); }}>
      <h3 id="subscription-editor-title" tabIndex={-1} className="text-xl font-semibold">Choose your updates</h3>
      {notice && <p role="status" className="text-sm">{notice}</p>}
      <div className="grid gap-4 sm:grid-cols-2"><div><label className="mb-2 block text-sm font-medium" htmlFor="follow-scope">Follow a</label><select id="follow-scope" className={selectStyle} value={kind} onChange={event => { setKind(event.target.value as EngagementScope); setScopeId(''); setSearch(''); }}>{
        supported.map(value => <option key={value} value={value}>{scopeLabels[value]}</option>)
      }</select></div><div><label className="mb-2 block text-sm font-medium" htmlFor="follow-search">Search available names</label><Input className="min-h-11" id="follow-search" value={search} onChange={event => { setSearch(event.target.value); setScopeId(''); }} maxLength={160} /></div></div>
      <QueryFeedback pending={scopes.isPending} error={scopes.error} retry={scopes.refetch} />
      <div><label htmlFor="follow-target" className="mb-2 block text-sm font-medium">Choose {scopeLabels[kind].toLowerCase()}</label><select id="follow-target" className={selectStyle} value={target ? scopeId : ''} onChange={event => setScopeId(event.target.value)} required><option value="">Select an available name</option>{options.map(option => <option key={option.scope_id} value={option.scope_id}>{option.label}</option>)}</select>{!scopes.isPending && !scopes.isError && !options.length && <p className="mt-2 text-sm text-muted-foreground">No accessible items match. Try another name or join the relevant community first.</p>}</div>
      <label className="flex min-h-11 items-center gap-3"><input className="h-5 w-5 accent-primary" type="checkbox" checked={muted} onChange={event => setMuted(event.target.checked)} /><span>Mute updates from this item, including broader follows</span></label>
      {!muted && <>
        <fieldset><legend className="mb-2 font-semibold">Which activity?</legend><div className="grid gap-x-4 sm:grid-cols-2">{(Object.keys(familyLabels) as EngagementFamily[]).map(family => <label key={family} className="flex min-h-11 items-center gap-3"><input className="h-5 w-5 accent-primary" type="checkbox" checked={families.includes(family)} onChange={() => toggle(family, families, setFamilies)} />{familyLabels[family]}</label>)}</div></fieldset>
        <fieldset><legend className="mb-2 font-semibold">Where should updates arrive?</legend><div className="grid gap-x-4 sm:grid-cols-2">{(Object.keys(channelLabels) as EngagementChannel[]).map(channel => {
          const available = channel === 'in_app' || (!capabilities.isError && capabilities.data?.channels[channel]?.state === 'ready');
          return <label key={channel} className="flex min-h-11 items-center gap-3"><input className="h-5 w-5 accent-primary" type="checkbox" checked={channels.includes(channel)} disabled={!available && !channels.includes(channel)} onChange={() => toggle(channel, channels, setChannels)} /><span>{channelLabels[channel]}{!available && <span className="block text-xs text-muted-foreground">Finish channel setup first</span>}</span></label>;
        })}</div></fieldset>
        <div><label className="mb-2 block font-semibold" htmlFor="follow-frequency">External delivery frequency</label><select id="follow-frequency" className={selectStyle} value={frequency} onChange={event => setFrequency(event.target.value as Frequency)}>{Object.entries(frequencyLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><p className="mt-2 text-sm text-muted-foreground">In-app updates appear as activity is recorded. Daily digests arrive at 09:00; weekly digests on Monday at 09:00 in your chosen time zone. Quiet hours and pauses still apply.</p></div>
      </>}
      <Button disabled={save.isPending || !target || (!muted && (!channels.length || !families.length))} type="submit">{save.isPending ? 'Saving…' : muted ? 'Save mute' : 'Save follow'}</Button>
      <MutationFeedback error={save.error} success={save.isSuccess} successText={save.data?.muted ? 'Mute saved.' : 'Follow saved.'} />
    </form>
  </section>;
}
