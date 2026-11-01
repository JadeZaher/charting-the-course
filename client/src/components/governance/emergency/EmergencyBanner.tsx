// All-member layout banner while an emergency is pending, open or in Recovery (mounted once in App.tsx AppLayout).
import { Link } from 'wouter';
import { AlertTriangle, Siren } from 'lucide-react';
import { useActiveEmergencies } from '@/hooks/use-emergency';
import { emergencyBanner } from '@/lib/emergency-phase';
import { cn } from '@/lib/utils';

const formatDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

export function EmergencyBanner() {
  const { data } = useActiveEmergencies(true);
  const banners = (data?.items ?? []).flatMap((item) => {
    const copy = emergencyBanner(item, formatDate);
    return copy ? [{ id: item.id, ...copy }] : [];
  });
  // A failed or loading feed shows nothing: the Emergency page is the source of truth.
  if (banners.length === 0) return null;
  return (
    <div role="status" aria-live="polite" aria-label="Emergency status" className="shrink-0 border-b-2 border-strong-border">
      {banners.map((banner) => (
        <div
          key={banner.id}
          className={cn(
            'flex flex-wrap items-center gap-x-4 gap-y-2 border-l-4 bg-background px-[var(--page-gutter)] py-2 text-sm text-foreground',
            banner.tone === 'critical' ? 'border-destructive' : 'border-warning',
          )}
        >
          {banner.tone === 'critical'
            ? <Siren className="h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            : <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden="true" />}
          <p className="min-w-0 flex-1">
            <span className="font-semibold">{banner.title}.</span> {banner.detail}
          </p>
          <Link href={banner.href} className="inline-flex min-h-[44px] items-center font-medium underline underline-offset-4">
            {banner.action}
          </Link>
        </div>
      ))}
    </div>
  );
}
