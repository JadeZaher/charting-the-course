import { Bell } from 'lucide-react';
import { Link } from 'wouter';
import { useInbox } from '@/hooks/use-engagement';

export function UpdatesLink() {
  const query = useInbox(true);
  const page = query.data?.pages[0];
  const count = page?.unread_count;
  const label = count === undefined || query.isError ? 'Open your updates' : `Your updates, ${count}${page?.unread_count_is_lower_bound ? ' or more' : ''} unread`;
  return <Link href="/updates" aria-label={label} className="relative flex h-11 min-w-11 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"><Bell className="h-5 w-5" aria-hidden="true" />{!query.isError && count !== undefined && count > 0 && <span aria-hidden="true" className="absolute -right-1 top-0 min-w-5 bg-primary px-1 text-center text-xs font-bold text-primary-foreground">{count > 99 ? '99+' : `${count}${page?.unread_count_is_lower_bound ? '+' : ''}`}</span>}</Link>;
}
