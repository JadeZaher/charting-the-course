import { useEcosystem } from '@/contexts/EcosystemContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, ChevronDown } from 'lucide-react';
import { useState } from 'react';

/**
 * Ecosystem filter that reads/writes directly from EcosystemContext.
 * No props needed - it's a global filter that persists across pages.
 */
export function EcosystemFilter() {
  const { ecosystems, selectedIds, selectMultiple, selectAll, isAll } = useEcosystem();
  const [open, setOpen] = useState(false);

  if (ecosystems.length <= 1) return null;

  const toggle = (id: string) => {
    if (isAll) {
      // "All" is selected: unchecking one means "all except this one"
      selectMultiple(ecosystems.filter(e => e.id !== id).map(e => e.id));
    } else if (selectedIds.includes(id)) {
      // Already selected: remove it (but keep at least one)
      const next = selectedIds.filter(x => x !== id);
      if (next.length === 0) return;
      // If removing makes it all-but-zero, keep as explicit list
      if (next.length === ecosystems.length) {
        selectAll();
      } else {
        selectMultiple(next);
      }
    } else {
      // Not selected: add it
      const next = [...selectedIds, id];
      if (next.length === ecosystems.length) {
        selectAll();
      } else {
        selectMultiple(next);
      }
    }
  };

  const label = isAll
    ? 'All Ecosystems'
    : selectedIds.length === 1
      ? ecosystems.find(e => e.id === selectedIds[0])?.name ?? '1 ecosystem'
      : `${selectedIds.length} ecosystems`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9 px-3">
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate max-w-[140px]">{label}</span>
          <ChevronDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <p className="text-xs font-medium text-muted-foreground mb-2">Filter by Ecosystem</p>
        <div className="space-y-1">
          {ecosystems.map((eco) => (
            <label
              key={eco.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
            >
              <Checkbox
                checked={isAll || selectedIds.includes(eco.id)}
                onCheckedChange={() => toggle(eco.id)}
              />
              <span className="truncate flex-1">{eco.name}</span>
            </label>
          ))}
        </div>
        {!isAll && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={() => selectAll()}
          >
            Show all ecosystems
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
