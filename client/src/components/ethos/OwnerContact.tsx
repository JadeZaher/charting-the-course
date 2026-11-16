import { useRef, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { FieldError } from '@/components/FieldError';
import { Textarea } from '@/components/ui/textarea';
import { useApiMutation } from '@/hooks/use-api-mutation';
import { useRequiredFields } from '@/hooks/use-required-fields';
import { useCreateConversation } from '@/hooks/use-messaging';
import { sendConversationMessage } from '@/lib/api-client';
import { conversationHref } from '@/lib/exchange';
import { affects } from '@/lib/query-keys';
import { spaceHomeCopy as copy } from '@/lib/space-home-copy';
import {
  claimInFlight,
  openedDirectMessageId,
  OWNER_MESSAGE_TIMEOUT_MS,
  ownerDirectMessage,
  ownerMessageError,
  releaseInFlight,
  withDeadline,
  type OwnerContactModel,
} from '@/lib/space-home';

const primaryClass = 'inline-flex min-h-11 items-center border-2 border-strong-border bg-foreground px-4 text-sm font-bold text-background hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-70';
const secondaryClass = 'inline-flex min-h-11 items-center border-2 border-strong-border px-4 text-sm font-bold hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';
const linkClass = 'font-bold text-link underline underline-offset-4';

function OwnerLabel({ owner }: { owner: OwnerContactModel }) {
  if (!owner.labelHref) return <p>{owner.label}</p>;
  return (
    <p>
      <Link href={owner.labelHref} className={linkClass}>{owner.label}</Link>
    </p>
  );
}

function OwnerSignIn({ owner }: { owner: OwnerContactModel }) {
  return (
    <div className="space-y-3">
      <OwnerLabel owner={owner} />
      {owner.signInHref && <Link href={owner.signInHref} className={secondaryClass}>{copy.whosHere.messageOwner}</Link>}
    </div>
  );
}

function OwnerMessage({ owner }: { owner: OwnerContactModel }) {
  const [, navigate] = useLocation();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [failure, setFailure] = useState('');
  const [sent, setSent] = useState('');
  const [opening, setOpening] = useState(false);
  const [sending, setSending] = useState(false);
  const gate = useRef(false);
  const attempt = useRef(0);
  const fields = useRequiredFields({ content: copy.whosHere.messageRequired });
  const openConversation = useCreateConversation({ silent: true });
  const sendMessage = useApiMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => sendConversationMessage(id, content),
    invalidates: affects.conversations,
    silent: true,
  });
  const busy = opening || sending;

  async function start() {
    if (!claimInFlight(gate)) return;
    const ticket = ++attempt.current;
    setOpening(true);
    setFailure('');
    setSent('');
    try {
      const conversation = await withDeadline(openConversation.mutateAsync(ownerDirectMessage(owner.ownerId)), OWNER_MESSAGE_TIMEOUT_MS);
      if (ticket !== attempt.current) return;
      const id = openedDirectMessageId(conversation);
      if (!id) {
        setFailure(copy.whosHere.messageUnopened);
        return;
      }
      if (owner.destination === 'compose') setConversationId(id);
      else navigate(conversationHref(id));
    } catch (error) {
      if (ticket !== attempt.current) return;
      openConversation.reset();
      setFailure(ownerMessageError(error));
    } finally {
      if (ticket === attempt.current) {
        releaseInFlight(gate);
        setOpening(false);
      }
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!conversationId || !fields.validate({ content: draft })) return;
    if (!claimInFlight(gate)) return;
    const ticket = ++attempt.current;
    setSending(true);
    setFailure('');
    setSent('');
    try {
      await withDeadline(sendMessage.mutateAsync({ id: conversationId, content: draft.trim() }), OWNER_MESSAGE_TIMEOUT_MS);
      if (ticket !== attempt.current) return;
      setDraft('');
      setSent(copy.whosHere.messageSent);
    } catch (error) {
      if (ticket !== attempt.current) return;
      sendMessage.reset();
      setFailure(ownerMessageError(error));
    } finally {
      if (ticket === attempt.current) {
        releaseInFlight(gate);
        setSending(false);
      }
    }
  }

  return (
    <div className="space-y-3">
      <OwnerLabel owner={owner} />
      <button type="button" className={secondaryClass} disabled={busy} aria-busy={busy || undefined} onClick={() => void start()}>
        {copy.whosHere.messageOwner}
      </button>
      {owner.destination === 'compose' && conversationId && (
        <form className="space-y-3" noValidate onSubmit={(event) => void send(event)}>
          <label className="block space-y-2">
            <span className="text-sm font-bold">{copy.whosHere.compose}</span>
            <Textarea
              value={draft}
              autoFocus
              disabled={busy}
              onChange={(event) => { setDraft(event.target.value); fields.settle('content', event.target.value); }}
              {...fields.field('content')}
            />
          </label>
          <FieldError {...fields.error('content')} />
          <button type="submit" className={primaryClass} disabled={busy} aria-busy={busy || undefined}>{copy.whosHere.send}</button>
          {sent && <p role="status">{sent}</p>}
        </form>
      )}
      {failure && <p role="alert" className="text-sm text-destructive">{failure}</p>}
    </div>
  );
}

/** "Message the owner" on an ecosystem home and a community preview. */
export function OwnerContact({ owner }: { owner: OwnerContactModel }) {
  if (owner.destination === 'sign-in') return <OwnerSignIn owner={owner} />;
  return <OwnerMessage owner={owner} />;
}

export function PersonLine({ row }: { row: { text: string; href?: string; suffix?: string } }) {
  return (
    <>
      {row.href ? <Link href={row.href} className={linkClass}>{row.text}</Link> : row.text}
      {row.suffix}
    </>
  );
}
