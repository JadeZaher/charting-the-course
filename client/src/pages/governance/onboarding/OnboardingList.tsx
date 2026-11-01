import { Link } from 'wouter';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { QueryState } from '@/components/QueryState';
import { useNewcomers } from '@/hooks/use-onboarding';
import { memberStatusLabel } from '@/lib/member-status';
import { formatDate } from '@/lib/utils';
import type { NewcomerItem, NewcomerOrientationStatus } from '@/types/api';

const ORIENTATION_LABELS: Record<NewcomerOrientationStatus, string> = {
  not_started: 'Not started',
  in_progress: 'In progress',
  complete: 'Complete',
  opted_out: 'Chose to skip',
};

/** The steward's Newcomers list (/onboarding): who is joining the ecosystems they steward, stuck newcomers first (G-Onboard). */
export default function OnboardingList() {
  const newcomers = useNewcomers();
  // The route answers 403 to anyone who stewards no ecosystem: say so plainly instead of an error panel.
  const notASteward = (newcomers.error as { status?: unknown } | null)?.status === 403;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Newcomers</h1>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          People joining the ecosystems you steward: anyone still consenting to the membership agreements, and members
          who joined in the last 30 days. Consenting is what makes someone a member, so nobody needs your approval. Step
          in when someone is stuck.
        </p>
      </header>

      {notASteward ? (
        <div className="border-2 border-dashed border-strong-border p-8">
          <p className="font-bold">Only stewards see newcomers.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Moderators, admins and owners of an ecosystem see who is joining it here.
          </p>
        </div>
      ) : (
        <QueryState
          query={newcomers}
          errorTitle="We couldn't load newcomers"
          isEmpty={(page) => page.items.length === 0}
          empty={
            <div className="border-2 border-dashed border-strong-border p-8 text-center text-muted-foreground">
              No newcomers right now.
            </div>
          }
        >
          {(page) => (
            <ul className="space-y-3" aria-label="Newcomers">
              {page.items.map((item) => <NewcomerRow key={item.id} item={item} />)}
            </ul>
          )}
        </QueryState>
      )}
    </div>
  );
}

function NewcomerRow({ item }: { item: NewcomerItem }) {
  return (
    <li className="border-2 border-strong-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.ecosystem_name}</p>
          <h2 className="mt-1 text-lg font-semibold">
            <Link href={`/members/${item.id}`} className="underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {item.display_name}
            </Link>
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={item.current_status === 'active' ? 'default' : 'secondary'}>{memberStatusLabel(item.current_status)}</Badge>
          {item.stuck && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" />
              Stuck: nothing left to consent to
            </Badge>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-1 gap-3 border-t border-border pt-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-muted-foreground">Joined</dt>
          <dd className="mt-1 font-medium">{formatDate(item.joined_at)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Orientation</dt>
          <dd className="mt-1 font-medium">{ORIENTATION_LABELS[item.orientation_status] ?? memberStatusLabel(item.orientation_status)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Still to consent to</dt>
          <dd className="mt-1 font-medium">
            {item.required_agreements.length === 0
              ? 'Nothing'
              : item.required_agreements.map((agreement) => (
                  <Link key={agreement.id} href={`/agreements/${agreement.id}`} className="mr-2 inline-block text-link underline underline-offset-4 hover:no-underline">
                    {agreement.title}
                  </Link>
                ))}
          </dd>
        </div>
      </dl>

      {item.stuck && (
        <p className="mt-4 text-sm">
          {item.display_name} is still pending, but nothing is left for them to consent to.{' '}
          <Link href={`/members/${item.id}`} className="font-bold text-link underline underline-offset-4 hover:no-underline">
            Open their member page to confirm the membership
          </Link>
        </p>
      )}
    </li>
  );
}
