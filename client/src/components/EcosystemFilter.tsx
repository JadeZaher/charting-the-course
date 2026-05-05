import { useEcosystem } from '@/contexts/EcosystemContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Building2, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface EcosystemFilterProps {
  value: string[];
  onChange: (ids: string[]) => void;
}

export function EcosystemFilter({ value, onChange }: EcosystemFilterProps) {
  const { ecosystems } = useEcosystem();
  const [open, setOpen] = useState(false);

  if (ecosystems.length <= 1) return null;

  const toggle = (id: string) => {
    const next = value.includes(id)
      ? value.filter(x => x !== id)
      : [...value, id];
    onChange(next);
  };

  const label = value.length === 0
    ? 'All Ecosystems'
    : value.length === 1
      ? ecosystems.find(e => e.id === value[0])?.name ?? '1 ecosystem'
      : `${value.length} ecosystems`;

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
                checked={value.includes(eco.id)}
                onCheckedChange={() => toggle(eco.id)}
              />
              <span className="truncate flex-1">{eco.name}</span>
              <Badge variant="outline" className="text-xs shrink-0">
                {eco.member_count}
              </Badge>
            </label>
          ))}
        </div>
        {value.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-xs"
            onClick={() => onChange([])}
          >
            Clear filter
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
