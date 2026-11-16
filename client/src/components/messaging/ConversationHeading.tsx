import { Link } from 'wouter';
import { useConversationHeading } from '@/hooks/use-messaging';

/** Thread title. A generated placeholder is the unnamed-owner sentence, or a profile link when the viewer is that person. */
export function ConversationHeading({
  conversation,
}: {
  conversation: { title?: string | null; participants: { id: string; display_name: string }[] };
}) {
  const headingOf = useConversationHeading();
  const heading = headingOf(conversation);
  if (!heading.prompt) return <>{heading.text}</>;
  const at = heading.text.indexOf(heading.prompt.text);
  if (at < 0) return <>{heading.text}</>;
  return (
    <>
      {heading.text.slice(0, at)}
      <Link href={heading.prompt.href} className="font-bold text-link underline underline-offset-4">
        {heading.prompt.text}
      </Link>
      {heading.text.slice(at + heading.prompt.text.length)}
    </>
  );
}
