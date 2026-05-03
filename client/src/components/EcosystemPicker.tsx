import { useState } from 'react';
import { Link } from 'wouter';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { useQuery } from '@tanstack/react-query';
import { fetchDiscover } from '@/lib/api-client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronDown, Search, ExternalLink } from 'lucide-react';
import type { EcosystemSummary } from '@/types/api';

export function EcosystemPicker() {
  const { ecosystems, selectedIds, toggleEcosystem } = useEcosystem();
  const [open, setOpen] = useState(false);
  const [discoverSearch, setDiscoverSearch] = useState('');

  const { data: discoverData } = useQuery({
    queryKey: ['discover', 'ecosystems', discoverSearch],
    queryFn: () => fetchDiscover({ tab: 'ecosystems', ...(discoverSearch ? { q: discoverSearch } : {}) }),
    enabled: open,
  });

  const memberEcoIds = new Set(ecosystems.map(e => e.id));
  const discoverEcosystems = (discoverData?.ecosystems?.items ?? []).filter(
    (e: any) => !memberEcoIds.has(e.id)
  );

  if (ecosystems.length === 0) return null;

  const selectedCount = selectedIds.length;
  const label = selectedCount === 1
    ? ecosystems.find(e => selectedIds.includes(e.id))?.name ?? 'Ecosystem'
    : `${selectedCount} ecosystems`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[250px]">
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
            {ecosystems.map((eco) => (
              <label
                key={eco.id}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
              >
                <Checkbox
                  checked={selectedIds.includes(eco.id)}
                  onCheckedChange={() => toggleEcosystem(eco.id)}
                />
                <span className="truncate flex-1">{eco.name}</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {eco.member_count}
                </Badge>
              </label>
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
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                >
                  <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate flex-1">{eco.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {eco.member_count} members
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
