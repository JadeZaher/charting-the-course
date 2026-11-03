import { useEffect } from 'react';
import { Link } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContactEnrollment } from '@/components/engagement/ContactEnrollment';
import { SubscriptionEditor } from '@/components/engagement/SubscriptionEditor';
import { MutationFeedback, QueryFeedback } from '@/components/engagement/QueryFeedback';
import { engagementWrite, useEngagementCapabilities, useEngagementMutation, useEngagementPreferences } from '@/hooks/use-engagement';
import { useNotifications } from '@/hooks/use-notifications';
import { canEnrollChannel, capabilityLabel, channelLabels, pacingSchema, toLocalDatetime } from '@/lib/engagement';
import type { EngagementPreferences } from '@/types/engagement';

type Pacing = z.infer<typeof pacingSchema>;
function NotificationSettingsContent() {
  const preferences = useEngagementPreferences();
  const capabilities = useEngagementCapabilities();
  const push = useNotifications();
  const save = useEngagementMutation<EngagementPreferences, EngagementPreferences>(value => engagementWrite('/preferences', 'PUT', value));
  const channelSave = useEngagementMutation<EngagementPreferences, EngagementPreferences>(value => engagementWrite('/preferences', 'PUT', value));
  const form = useForm<Pacing>({ resolver: zodResolver(pacingSchema), defaultValues: { timezone: 'UTC', quiet_start: '', quiet_end: '', paused_until: '', direct_messages: true } });
  const dirty = form.formState.isDirty;
  useEffect(() => {
    if (preferences.data && !dirty) form.reset({
      timezone: preferences.data.timezone, quiet_start: preferences.data.quiet_start ?? '', quiet_end: preferences.data.quiet_end ?? '',
      paused_until: toLocalDatetime(preferences.data.paused_until), direct_messages: preferences.data.direct_messages,
    });
  }, [preferences.data, dirty, form]);
  const submit = form.handleSubmit(async value => {
    if (!preferences.data) return;
    try {
      await save.mutateAsync({ ...preferences.data, ...value, quiet_start: value.quiet_start || null, quiet_end: value.quiet_end || null, paused_until: value.paused_until ? new Date(value.paused_until).toISOString() : null });
      form.reset(value);
    } catch { /* Inline error retains edited values. */ }
  });
  const preference = preferences.data;
  const capability = capabilities.data;
  return <div className="space-y-8">
    <header className="space-y-3 border-b border-border pb-5"><h1 className="text-3xl font-black">Your notification choices</h1><p className="max-w-prose text-muted-foreground">Follow the communities and conversations that matter to you. Choose where updates arrive and how often.</p><Link href="/updates" className="inline-flex min-h-11 items-center text-link underline">Open your updates</Link></header>
    <QueryFeedback pending={preferences.isPending || capabilities.isPending} error={preferences.error || capabilities.error} retry={() => { void preferences.refetch(); void capabilities.refetch(); }} />
    {preference && capability && !preferences.isError && !capabilities.isError && <>
      <section aria-labelledby="delivery-channels-title" className="space-y-5">
        <h2 id="delivery-channels-title" className="text-2xl font-bold">Where updates arrive</h2>
        <div className="border border-border bg-card p-5"><h3 className="font-bold">In-app · Ready</h3><p className="mt-2 text-sm text-muted-foreground">Your updates are available here without an email address, phone number or browser permission.</p></div>
        <div className="grid gap-4 xl:grid-cols-2">{(['email', 'sms'] as const).map(channel => {
          const state = capability.channels[channel];
          const enabled = preference[`${channel}_enabled`];
          return <section key={channel} className="space-y-4 border border-border bg-card p-5" aria-labelledby={`channel-${channel}-title`}>
            <h3 id={`channel-${channel}-title`} className="text-lg font-bold">{channelLabels[channel]} · {capabilityLabel(state.state)}</h3>
            {state.reason && <p className="text-sm text-muted-foreground">{state.reason}</p>}
            <label className="flex min-h-11 items-center gap-3"><input className="h-5 w-5 accent-primary" type="checkbox" checked={enabled} disabled={channelSave.isPending || (!enabled && state.state !== 'ready')} onChange={event => channelSave.mutate({ ...preference, [`${channel}_enabled`]: event.target.checked })} /><span>Allow {channel === 'email' ? 'email' : 'SMS'} updates from my follows</span></label>
            <ContactEnrollment channel={channel} capability={state} contacts={capability.contacts ?? []} />
          </section>;
        })}</div>
        <section className="space-y-4 border border-border bg-card p-5" aria-labelledby="channel-push-title">
          <h3 id="channel-push-title" className="text-lg font-bold">Browser push · {capabilityLabel(capability.channels.push.state)}</h3>
          <p className="text-sm text-muted-foreground">{capability.channels.push.reason || 'Permission applies to this browser. Updates use a private, generic preview.'}</p>
          {!push.isSupported && <p className="text-sm">This browser does not support push on this connection. In-app updates remain available.</p>}
          {push.permission === 'denied' && <p className="text-sm">Browser permission is blocked. Change it in your browser settings if you want to enable push.</p>}
          <div className="flex flex-wrap gap-3">{push.isSubscribed
            ? <Button variant="outline" disabled={push.isLoading} onClick={() => push.unsubscribe()}>Disable on this device</Button>
            : <Button variant="outline" disabled={!push.isSupported || push.isLoading || !canEnrollChannel(capability.channels.push.state)} onClick={() => push.requestPermissionAndSubscribe()}>{push.isLoading ? 'Enabling…' : 'Enable on this device'}</Button>}
          </div>
          {push.error && <p role="alert" className="text-sm text-destructive">{push.error}</p>}
          <label className="flex min-h-11 items-center gap-3"><input className="h-5 w-5 accent-primary" type="checkbox" checked={preference.push_enabled} disabled={channelSave.isPending || (!preference.push_enabled && capability.channels.push.state !== 'ready')} onChange={event => channelSave.mutate({ ...preference, push_enabled: event.target.checked })} /><span>Allow push updates from my follows</span></label>
        </section>
        <MutationFeedback error={channelSave.error} success={channelSave.isSuccess} successText="Delivery choice saved." />
        {!capability.external_delivery_enabled && <p className="border border-border p-4 text-sm">External delivery is not activated on this node. You can use in-app updates and save follows now. Email, push and SMS will remain off until their setup is complete and you enable them.</p>}
      </section>
      <section className="space-y-4 border-t border-border pt-8" aria-labelledby="pacing-title">
        <h2 id="pacing-title" className="text-2xl font-bold">Set your pace</h2>
        <form onSubmit={submit} className="space-y-5">
          <div><label htmlFor="notification-timezone" className="mb-2 block font-medium">Delivery time zone</label><div className="flex flex-wrap gap-3"><Input id="notification-timezone" className="min-h-11 min-w-0 flex-1" {...form.register('timezone')} placeholder="America/Denver" aria-invalid={!!form.formState.errors.timezone} /><Button type="button" variant="outline" onClick={() => form.setValue('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone, { shouldDirty: true, shouldValidate: true })}>Use my device’s time zone</Button></div><p className="mt-2 text-sm text-muted-foreground">Daily digests: 09:00. Weekly digests: Monday at 09:00 in this time zone.</p>{form.formState.errors.timezone && <p role="alert" className="text-sm text-destructive">{form.formState.errors.timezone.message}</p>}</div>
          <fieldset className="space-y-3"><legend className="font-medium">Quiet hours in your delivery time zone</legend><div className="grid gap-4 sm:grid-cols-2"><div><label htmlFor="quiet-start" className="mb-2 block text-sm">Start</label><Input id="quiet-start" className="min-h-11" type="time" {...form.register('quiet_start')} /></div><div><label htmlFor="quiet-end" className="mb-2 block text-sm">End</label><Input id="quiet-end" className="min-h-11" type="time" {...form.register('quiet_end')} /></div></div>{(form.formState.errors.quiet_start || form.formState.errors.quiet_end) && <p role="alert" className="text-sm text-destructive">{form.formState.errors.quiet_start?.message || form.formState.errors.quiet_end?.message}</p>}<p className="text-sm text-muted-foreground">External updates wait until quiet hours end. Clear both times to remove quiet hours.</p></fieldset>
          <div><label htmlFor="notification-pause" className="mb-2 block font-medium">Pause external updates until</label><Input className="min-h-11" id="notification-pause" type="datetime-local" {...form.register('paused_until')} /><p className="mt-2 text-sm text-muted-foreground">Enter this date in your device’s local time. Clear it to resume. Your in-app updates remain available.</p>{form.formState.errors.paused_until && <p role="alert" className="text-sm text-destructive">{form.formState.errors.paused_until.message}</p>}</div>
          <label className="flex min-h-11 items-center gap-3"><input className="h-5 w-5 accent-primary" type="checkbox" {...form.register('direct_messages')} /><span>Include direct messages in my in-app updates</span></label>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save pacing preferences'}</Button>
          <MutationFeedback error={save.error} success={save.isSuccess && !dirty} successText="Pacing preferences saved." />
        </form>
      </section>
    </>}
    <SubscriptionEditor />
  </div>;
}
export default function NotificationPreferences() {
  const { user } = useAuth();
  return <NotificationSettingsContent key={user?.id ?? 'signed-out'} />;
}
