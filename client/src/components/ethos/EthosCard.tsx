import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, ArrowRight } from 'lucide-react';
import type { EthosSummary } from '@/types/orientation';

const SECTOR_COLORS: Record<string, string> = {
  ecology: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  technology: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  economics: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  culture: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  governance: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

interface AlignmentRingProps {
  score: number;
}

function AlignmentRing({ score }: AlignmentRingProps) {
  const r = 18;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#94a3b8';

  return (
    <div className="relative flex items-center justify-center w-12 h-12" title={`${score}% alignment`}>
      <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-90">
        <circle cx="24" cy="24" r={r} fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/20" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

interface Props {
  ethos: EthosSummary;
}

export function EthosCard({ ethos }: Props) {
  const sectorClass = ethos.sector ? SECTOR_COLORS[ethos.sector.toLowerCase()] ?? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground';

  return (
    <Link href={`/ethos/${ethos.slug}`}>
      <div className="group border rounded-xl overflow-hidden bg-card hover:shadow-lg hover:border-primary/40 transition-all duration-200 cursor-pointer flex flex-col h-full">
        {/* Header */}
        <div className="h-28 relative bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center overflow-hidden">
          {ethos.image_url ? (
            <img src={ethos.image_url} alt={ethos.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-4xl font-black text-primary/20 select-none">
              {ethos.name.slice(0, 2).toUpperCase()}
            </span>
          )}
          {ethos.sector && (
            <span className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded-full ${sectorClass}`}>
              {ethos.sector}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">
              {ethos.name}
            </h3>
            {ethos.alignment_score !== undefined && (
              <AlignmentRing score={ethos.alignment_score} />
            )}
          </div>

          {ethos.tagline && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{ethos.tagline}</p>
          )}

          <div className="mt-auto flex items-center justify-between">
            {/* Member avatars */}
            <div className="flex items-center gap-1.5">
              {ethos.member_avatars.length > 0 ? (
                <div className="flex -space-x-2">
                  {ethos.member_avatars.slice(0, 5).map((av, i) => (
                    <Avatar key={i} className="h-6 w-6 border-2 border-background">
                      <AvatarImage src={av} />
                      <AvatarFallback className="text-[10px]">?</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              ) : (
                <Users className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="text-xs text-muted-foreground">{ethos.member_count} member{ethos.member_count !== 1 ? 's' : ''}</span>
            </div>

            <span className="text-xs text-primary font-medium flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
              Explore <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
