import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EcosystemFilter } from '@/components/EcosystemFilter';
import type { FilterDef } from '@/hooks/use-governance-list';

interface FilterBarProps {
  filters: FilterDef[];
  filterValues: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
}

export function FilterBar({
  filters,
  filterValues,
  onFilterChange,
  search,
  onSearchChange,
  searchPlaceholder = 'Search...',
}: FilterBarProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-3">
          {filters.map((f) => {
            if (f.type === 'select' && f.options) {
              return (
                <Select
                  key={f.key}
                  value={filterValues[f.key] || 'all'}
                  onValueChange={(v) => onFilterChange(f.key, v)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder={f.label} />
                  </SelectTrigger>
                  <SelectContent>
                    {f.options.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              );
            }
            if (f.type === 'text') {
              return (
                <Input
                  key={f.key}
                  placeholder={f.placeholder || `${f.label}...`}
                  value={filterValues[f.key] || ''}
                  onChange={(e) => onFilterChange(f.key, e.target.value)}
                  className="w-[160px]"
                />
              );
            }
            return null;
          })}

          <EcosystemFilter />

          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-[200px]"
          />
        </div>
      </CardContent>
    </Card>
  );
}
