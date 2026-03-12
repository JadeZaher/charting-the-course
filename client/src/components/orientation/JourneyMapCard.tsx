import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { JourneyMap } from '@/types/orientation';

interface Props {
  map: JourneyMap;
  isRecommended: boolean;
  misalignmentFlags?: string[];
  onSelect: () => void;
  isSelected: boolean;
}

export function JourneyMapCard({ map, isRecommended, misalignmentFlags, onSelect, isSelected }: Props) {
  const stepCount = map.content_sequence?.length ?? 0;
  const estMinutes = stepCount * 3;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-150 ${
        isSelected
          ? 'border-primary bg-primary/5'
          : 'border-border bg-card hover:border-primary/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 rounded-full p-1.5 flex-shrink-0 ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
          {isSelected ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{map.title}</span>
            {isRecommended && (
              <Badge variant="default" className="text-xs px-1.5 py-0">Recommended</Badge>
            )}
          </div>
          {map.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{map.description}</p>
          )}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-xs text-muted-foreground">{stepCount} steps · ~{estMinutes} min</span>
            {map.sector_alignment?.map(s => (
              <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">{s}</Badge>
            ))}
          </div>
          {misalignmentFlags && misalignmentFlags.length > 0 && (
            <div className="mt-2 flex items-start gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-0.5">
                {misalignmentFlags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
