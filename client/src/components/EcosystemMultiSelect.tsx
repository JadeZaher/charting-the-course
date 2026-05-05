import { useEcosystem } from '@/contexts/EcosystemContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Building2 } from 'lucide-react';

interface EcosystemMultiSelectProps {
  label?: string;
  description?: string;
  /** The primary ecosystem_id (required, first selected) */
  primaryId: string;
  /** Additional shared ecosystem IDs */
  sharedIds: string[];
  onPrimaryChange: (id: string) => void;
  onSharedChange: (ids: string[]) => void;
}

export function EcosystemMultiSelect({
  label = 'Ecosystems',
  description = 'Select ecosystems this applies to. The primary ecosystem owns the entity.',
  primaryId,
  sharedIds,
  onPrimaryChange,
  onSharedChange,
}: EcosystemMultiSelectProps) {
  const { ecosystems } = useEcosystem();

  if (ecosystems.length <= 1) return null;

  const toggleShared = (id: string) => {
    if (id === primaryId) return; // Can't uncheck primary from shared
    const next = sharedIds.includes(id)
      ? sharedIds.filter(x => x !== id)
      : [...sharedIds, id];
    onSharedChange(next);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="border rounded-md p-3 space-y-1">
        {ecosystems.map((eco) => {
          const isPrimary = eco.id === primaryId;
          const isShared = sharedIds.includes(eco.id);
          const isChecked = isPrimary || isShared;

          return (
            <label
              key={eco.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
            >
              <Checkbox
                checked={isChecked}
                onCheckedChange={() => {
                  if (isPrimary) return; // Primary can't be unchecked
                  toggleShared(eco.id);
                }}
                disabled={isPrimary}
              />
              <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate flex-1">{eco.name}</span>
              {isPrimary && (
                <Badge variant="default" className="text-xs shrink-0">Primary</Badge>
              )}
              {isShared && !isPrimary && (
                <Badge variant="outline" className="text-xs shrink-0">Shared</Badge>
              )}
            </label>
          );
        })}
      </div>
    </div>
  );
}
