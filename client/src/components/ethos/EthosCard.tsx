import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowRight, Users } from 'lucide-react';
import { resolveMediaUrl } from '@/lib/media';
import type { EthosSummary } from '@/types/orientation';

interface Props {
  ethos: EthosSummary;
  featured?: boolean;
}

function alignmentTone(score: number) {
  if (score >= 70) return 'text-success';
  if (score >= 40) return 'text-warning';
  return 'text-muted-foreground';
}

export function EthosCard({ ethos, featured = false }: Props) {
  const imageUrl = resolveMediaUrl(ethos.image_url);
  const description = ethos.tagline ?? ethos.description;

  return (
    <article className="group flex h-full flex-col border-2 border-strong-border bg-card shadow-none">
      <Link
        href={`/ethos/${ethos.slug}`}
        className="relative block aspect-[3/2] overflow-hidden border-b-2 border-strong-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`Explore ${ethos.name}`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`A view representing ${ethos.name}`}
            width={1200}
            height={800}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover grayscale-[15%] transition-transform duration-300 group-hover:scale-[1.015] motion-reduce:transition-none"
          />
        ) : (
          <div className="flex h-full items-end justify-between bg-foreground p-5 text-background" role="img" aria-label={`No image available for ${ethos.name}`}>
            <span className="text-xs font-bold uppercase tracking-[0.18em]">Image pending</span>
            <span className="text-5xl font-black tracking-tighter" aria-hidden="true">
              {ethos.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 border border-background bg-foreground px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.16em] text-background">
          {ethos.ethos_type}
        </span>
      </Link>

      <div className={`flex flex-1 flex-col ${featured ? 'p-6 sm:p-8' : 'p-5 sm:p-6'}`}>
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="min-w-0">
            <p className="mb-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              {ethos.location ?? ethos.sector ?? 'Networked ecosystem'}
            </p>
            <h3 className={`${featured ? 'text-3xl' : 'text-2xl'} font-black leading-[0.95] tracking-[-0.04em]`}>
              <Link href={`/ethos/${ethos.slug}`} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {ethos.name}
              </Link>
            </h3>
          </div>
          {ethos.alignment_score !== undefined && (
            <div className="shrink-0 text-right">
              <p className={`text-2xl font-black tabular-nums ${alignmentTone(ethos.alignment_score)}`}>
                {ethos.alignment_score}%
              </p>
              <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-muted-foreground">Aligned</p>
            </div>
          )}
        </div>

        {description && (
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{description}</p>
        )}

        {ethos.tags && ethos.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" aria-label={`${ethos.name} topics`}>
            {ethos.tags.slice(0, 4).map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-none uppercase tracking-wide">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-4 pt-6">
          <div className="flex items-center gap-2">
            {ethos.member_avatars.length > 0 ? (
              <div className="flex -space-x-2" aria-hidden="true">
                {ethos.member_avatars.slice(0, 4).map((avatar, index) => (
                  <Avatar key={`${avatar}-${index}`} className="h-7 w-7 border-2 border-background">
                    <AvatarImage src={resolveMediaUrl(avatar)} alt="" />
                    <AvatarFallback className="text-[0.6rem]">NE</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            ) : (
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            )}
            <span className="text-xs font-semibold tabular-nums text-muted-foreground">
              {ethos.member_count} {ethos.member_count === 1 ? 'member' : 'members'}
            </span>
          </div>

          <Link
            href={`/ethos/${ethos.slug}`}
            className="inline-flex min-h-11 items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open dossier
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </article>
  );
}
