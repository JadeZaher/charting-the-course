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
  ownerDirectMessage,
  ownerMessageError,
  releaseInFlight,
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
  const gate = useRef(false);
  const fields = useRequiredFields({ content: copy.whosHere.messageRequired });
  const openConversation = useCreateConversation({ silent: true });
  const sendMessage = useApiMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => sendConversationMessage(id, content),
    invalidates: affects.conversations,
    silent: true,
  });
  const busy = opening || openConversation.isPending || sendMessage.isPending;

  async function start() {
    if (!claimInFlight(gate)) return;
    setOpening(true);
    setFailure('');
    setSent('');
    try {
      const conversation = await openConversation.mutateAsync(ownerDirectMessage(owner.ownerId));
      const id = openedDirectMessageId(conversation);
      if (!id) {
        setFailure(copy.whosHere.messageUnopened);
        return;
      }
      if (owner.destination === 'compose') setConversationId(id);
      else navigate(conversationHref(id));
    } catch (error) {
      setFailure(ownerMessageError(error));
    } finally {
      releaseInFlight(gate);
      setOpening(false);
    }
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!conversationId || !fields.validate({ content: draft })) return;
    if (!claimInFlight(gate)) return;
    setFailure('');
    setSent('');
    try {
      await sendMessage.mutateAsync({ id: conversationId, content: draft.trim() });
      setDraft('');
      setSent(copy.whosHere.messageSent);
    } catch (error) {
      setFailure(ownerMessageError(error));
    } finally {
      releaseInFlight(gate);
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
