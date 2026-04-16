import { useEcosystem } from '@/contexts/EcosystemContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2 } from 'lucide-react';

export function EcosystemPicker() {
  const { ecosystems, selected, selectEcosystem } = useEcosystem();

  if (ecosystems.length === 0) return null;
  if (ecosystems.length === 1) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span className="truncate max-w-[200px]">{ecosystems[0].name}</span>
      </div>
    );
  }

  return (
    <Select value={selected?.id || ''} onValueChange={selectEcosystem}>
      <SelectTrigger className="w-[200px]">
        <Building2 className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Select ecosystem" />
      </SelectTrigger>
      <SelectContent>
        {ecosystems.map((eco) => (
          <SelectItem key={eco.id} value={eco.id}>
            {eco.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
