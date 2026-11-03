import { Link } from 'wouter';
import { displayEventTime, engagementPath, familyLabels } from '@/lib/engagement';
import type { Activity } from '@/types/engagement';

export function ActivityCard({ item, children }: { item: Activity; children?: React.ReactNode }) {
  const followPath = `/settings/notifications?scope=${encodeURIComponent(item.source_kind)}&id=${encodeURIComponent(item.source_id)}`;
  return <article className="min-w-0 space-y-3 border border-border bg-card p-4 sm:p-5">
    <div className="flex flex-wrap justify-between gap-2 text-sm text-muted-foreground"><span>{item.ecosystem_name || 'Your communities'} · {familyLabels[item.family] || 'Update'}</span><time dateTime={item.occurred_at}>{displayEventTime(item.occurred_at)}</time></div>
    <h3 className="break-words text-lg font-bold">{item.title}</h3><p className="break-words text-sm">{item.summary}</p>
    <div className="flex flex-wrap gap-x-5 gap-y-1"><Link href={engagementPath(item.url)} className="inline-flex min-h-11 items-center font-semibold text-link underline">Open update</Link><Link href={followPath} className="inline-flex min-h-11 items-center text-sm text-link underline">Follow or mute this</Link></div>
    {children}
  </article>;
}
