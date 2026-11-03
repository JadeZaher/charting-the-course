import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { engagementWrite, useEngagementMutation } from '@/hooks/use-engagement';
import { canEnrollChannel } from '@/lib/engagement';
import type { Capability, Contact, VerificationPending } from '@/types/engagement';
import { MutationFeedback } from './QueryFeedback';

export function ContactEnrollment({ channel, capability, contacts }: { channel: 'email' | 'sms'; capability: Capability; contacts: Contact[] }) {
  const [destination, setDestination] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState<VerificationPending | null>(null);
  const request = useEngagementMutation<VerificationPending, string>(value => engagementWrite('/contacts', 'POST', { channel, destination: value.trim() }));
  const verify = useEngagementMutation<Contact, string>(value => engagementWrite(`/contacts/${challenge!.contact.id}/verify`, 'POST', { challenge_id: challenge!.challenge_id, code: value.trim() }));
  const remove = useEngagementMutation((id: string) => engagementWrite(`/contacts/${id}`, 'DELETE'));
  const active = contacts.filter(contact => contact.channel === channel);
  const enrollable = canEnrollChannel(capability.state) || (capability.state === 'suppressed' && capability.can_verify === true);
  const label = channel === 'email' ? 'Email address' : 'Phone number including country code';
  return <div className="space-y-4">
    {active.map(contact => <div key={contact.id} className="flex flex-wrap items-center justify-between gap-3 text-sm"><p>{contact.masked_destination} · {contact.suppressed ? 'Delivery stopped' : contact.verified ? 'Verified' : 'Not verified'}</p><Button variant="outline" disabled={remove.isPending} onClick={() => remove.mutate(contact.id, { onSuccess: () => { if (challenge?.contact.id === contact.id) setChallenge(null); } })}>Remove contact</Button></div>)}
    <MutationFeedback error={remove.error} />
    <form className="space-y-3" onSubmit={async event => { event.preventDefault(); verify.reset(); try { setChallenge(await request.mutateAsync(destination)); setCode(''); } catch { /* Inline feedback preserves input. */ } }}>
      <label htmlFor={`contact-${channel}`} className="block text-sm font-medium">{label}</label>
      <Input id={`contact-${channel}`} value={destination} onChange={event => setDestination(event.target.value)} type={channel === 'email' ? 'email' : 'tel'} autoComplete={channel === 'email' ? 'email' : 'tel'} required maxLength={channel === 'email' ? 254 : 20} disabled={!enrollable} className="min-h-11" placeholder={channel === 'sms' ? '+15551234567' : 'you@example.org'} />
      <Button type="submit" variant="outline" disabled={!enrollable || request.isPending}>{request.isPending ? 'Requesting…' : 'Send verification code'}</Button>
      {!enrollable && <p className="text-sm text-muted-foreground">{capability.reason || 'Delivery setup must be completed before a verification code can be sent.'}</p>}
      <MutationFeedback error={request.error} />
    </form>
    {challenge && <form className="space-y-3 border-t border-border pt-4" onSubmit={async event => { event.preventDefault(); try { await verify.mutateAsync(code); setChallenge(null); setCode(''); } catch { /* Inline feedback preserves input. */ } }}>
      <p role="status" className="text-sm">A verification code was requested for {challenge.contact.masked_destination}. Verify ownership before enabling updates.</p>
      <label htmlFor={`code-${channel}`} className="block text-sm font-medium">Verification code</label><Input id={`code-${channel}`} inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value)} maxLength={12} required className="min-h-11" /><Button type="submit" disabled={verify.isPending}>{verify.isPending ? 'Checking…' : 'Verify contact'}</Button><MutationFeedback error={verify.error} />
    </form>}
    <MutationFeedback error={challenge ? null : verify.error} success={verify.isSuccess} successText="Contact verified. You can now enable this delivery channel." />
    {active.length > 0 && <p className="text-xs text-muted-foreground">Replacing a contact stops its queued updates and requires fresh verification. It does not enable the new destination automatically.</p>}
  </div>;
}
