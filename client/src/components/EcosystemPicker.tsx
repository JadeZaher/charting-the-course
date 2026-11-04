import { useState } from 'react';
import { Link } from 'wouter';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useAuth } from '@/contexts/AuthContext';
import { activeEcosystemIds } from '@/lib/consent-gate';
import { CONSENT_GATE_PATH } from '@/lib/member-status';
import { ecosystemPickerLabel } from '@/lib/nav-access';
import { keys } from '@/lib/query-keys';
import { useQuery } from '@tanstack/react-query';
import { fetchDiscover } from '@/lib/api-client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronDown, Search, ExternalLink } from 'lucide-react';
import type { EcosystemSummary } from '@/types/api';

/** "1 member" / "N members" so picker counts carry their unit. */
function memberCount(count: number) {
  return `${count} ${count === 1 ? 'member' : 'members'}`;
}

export function EcosystemPicker() {
  const { ecosystems, selectedIds, toggleMulti, selectMultiple } = useEcosystem();
  const { pendingConsents, member } = useAuth();
  // Ecosystems behind a consent gate are not selectable scopes: the server would snap the selection back.
  const activeIds = activeEcosystemIds({ pendingConsents, memberships: ecosystems, member });
  const activeEcosystems = ecosystems.filter((eco) => activeIds.includes(eco.id));
  const awaitingConsent = ecosystems.filter((eco) => !activeIds.includes(eco.id));
  const isAll = activeEcosystems.length > 0 && activeEcosystems.every((eco) => selectedIds.includes(eco.id));
  const [open, setOpen] = useState(false);
  const [discoverSearch, setDiscoverSearch] = useState('');

  const discoverParams: Record<string, string> = { tab: 'ecosystems', ...(discoverSearch ? { q: discoverSearch } : {}) };

  const { data: discoverData } = useQuery({
    queryKey: keys.discover.list(discoverParams),
    queryFn: () => fetchDiscover(discoverParams),
    enabled: open,
  });

  const memberEcoIds = new Set(ecosystems.map(e => e.id));
  const discoverEcosystems = (discoverData?.ecosystems?.items ?? []).filter(
    (e: any) => !memberEcoIds.has(e.id)
  );

  if (ecosystems.length === 0) return null;

  const label = ecosystemPickerLabel({
    selected: ecosystems.filter((eco) => selectedIds.includes(eco.id)),
    activeCount: activeEcosystems.length,
    awaitingConsent,
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" aria-label={`Choose ecosystem: ${label}`} className="min-w-0 max-w-full gap-2 sm:max-w-[250px]">
          <Building2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{label}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        {/* Your Ecosystems */}
        <div className="p-3 border-b">
          <p className="text-xs font-medium text-muted-foreground mb-2">Your Ecosystems</p>
          <div className="space-y-1">
            {activeEcosystems.length > 1 && (
              <label
                className="flex items-center gap-2 rounded-[2px] border-2 border-strong-border px-2 py-1.5 text-sm hover:bg-accent cursor-pointer font-medium"
              >
                <Checkbox
                  checked={isAll}
                  onCheckedChange={() => selectMultiple(activeIds)}
                />
                <span className="flex-1">All Ecosystems</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {memberCount(activeEcosystems.reduce((sum, e) => sum + e.member_count, 0))}
                </Badge>
              </label>
            )}
            {activeEcosystems.map((eco) => (
              <label
                key={eco.id}
                className="flex items-center gap-2 rounded-[2px] border-2 border-strong-border px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
              >
                <Checkbox
                  checked={selectedIds.includes(eco.id)}
                  onCheckedChange={() => toggleMulti(eco.id)}
                />
                <span className="truncate flex-1">{eco.name}</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {memberCount(eco.member_count)}
                </Badge>
              </label>
            ))}
            {awaitingConsent.map((eco) => (
              <Link
                key={eco.id}
                href={CONSENT_GATE_PATH}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-[2px] border-2 border-dashed border-strong-border px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
              >
                <span className="truncate flex-1">{eco.name}</span>
                <Badge variant="outline" className="text-xs shrink-0">Awaiting your consent</Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Discover New Ecosystems */}
        <div className="p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Discover Ecosystems</p>
          <div className="relative mb-2">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search public ecosystems..."
              value={discoverSearch}
              onChange={(e) => setDiscoverSearch(e.target.value)}
              className="h-8 pl-7 text-sm"
            />
          </div>
          <div className="max-h-[180px] overflow-y-auto space-y-1">
            {discoverEcosystems.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">
                {discoverSearch ? 'No ecosystems found' : 'No new ecosystems to discover'}
              </p>
            ) : (
              discoverEcosystems.map((eco: any) => (
                <Link
                  key={eco.id}
                  href={`/ecosystems/${eco.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 rounded-[2px] border-2 border-strong-border px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                >
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate flex-1">{eco.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {memberCount(eco.member_count)}
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                </Link>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
