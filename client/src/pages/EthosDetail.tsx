import { Link, useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { useEthosDetail } from '@/hooks/useEthos';
import { fetchEthosJourneyMaps } from '@/lib/api-client';
import { resolveExternalUrl, resolveInternalPath, resolveMediaUrl, resolveMiroEmbedUrl } from '@/lib/media';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ConsentGate } from '@/components/discovery/ConsentGate';

const PHASE_LABELS: Record<string, string> = {
  discovery: 'Discovery',
  formation: 'Formation',
  growth: 'Growth',
  maturity: 'Maturity',
  renewal: 'Renewal',
  sunset: 'Sunset',
};

export default function EthosDetail() {
  const [, baseParams] = useRoute('/ethos/:slug');
  const [, detailParams] = useRoute('/ethos/:slug/detail');
  const [, navigate] = useLocation();
  const slug = (detailParams ?? baseParams)?.slug ?? '';
  const detailQuery = useEthosDetail(slug);
  const ethosId = detailQuery.data?.ethos.id;
  const journeyQuery = useQuery({
    queryKey: ['ethos-journey-maps', ethosId],
    queryFn: () => fetchEthosJourneyMaps(ethosId!),
    enabled: !!ethosId,
  });

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-6" aria-label="Loading ecosystem dossier">
        <Skeleton className="h-12 w-44 rounded-none" />
        <div className="grid gap-5 lg:grid-cols-12">
          <Skeleton className="aspect-[3/2] rounded-none border-2 border-border lg:col-span-8" />
          <Skeleton className="h-full min-h-80 rounded-none border-2 border-border lg:col-span-4" />
        </div>
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="border-2 border-destructive p-8" role="alert">
        <p className="font-black uppercase tracking-wide text-destructive">Ecosystem not found</p>
        <p className="mt-2 text-sm text-muted-foreground">This dossier is unavailable or outside your current access.</p>
        <Link href="/discover" className="mt-6 inline-flex min-h-11 items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Browse Discover
        </Link>
      </div>
    );
  }

  const { ethos, members, viewer_alignment: viewerAlignment } = detailQuery.data;
  const alignment = ethos.alignment_score ?? viewerAlignment;
  const phase = ethos.phase ? (PHASE_LABELS[ethos.phase] ?? ethos.phase) : null;
  const mapUrl = ethos.map_type === 'miro'
    ? resolveMiroEmbedUrl(ethos.map_url)
    : resolveMediaUrl(ethos.map_url);
  const imageUrl = resolveMediaUrl(ethos.image_url);
  const officialUrl = resolveExternalUrl(ethos.external_url);
  const externalLinks = (ethos.external_links ?? []).flatMap((resource) => {
    const url = resolveExternalUrl(resource.url);
    return url ? [{ ...resource, url }] : [];
  });
  const journeyMaps = journeyQuery.data ?? [];
  const showDescription = ethos.description && ethos.description !== ethos.tagline;

  return (
    <ConsentGate ethosId={ethos.id}>
      <div className="space-y-10">
        <Link href="/discover" className="inline-flex min-h-11 items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Discover index
        </Link>

        <header className="grid border-2 border-strong-border bg-card lg:grid-cols-12">
          <div className="relative min-h-80 overflow-hidden border-b-2 border-strong-border bg-muted lg:col-span-8 lg:min-h-[34rem] lg:border-b-0 lg:border-r-2">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={`A view representing ${ethos.name}${ethos.location ? ` in ${ethos.location}` : ''}`}
                width={1600}
                height={1067}
                loading="eager"
                decoding="async"
                className="h-full w-full object-cover grayscale-[10%]"
              />
            ) : (
              <div className="flex h-full min-h-80 items-end justify-between bg-foreground p-8 text-background" role="img" aria-label={`No image available for ${ethos.name}`}>
                <span className="text-xs font-black uppercase tracking-[0.2em]">Visual pending</span>
                <span className="text-8xl font-black tracking-[-0.08em]" aria-hidden="true">{ethos.name.slice(0, 2).toUpperCase()}</span>
              </div>
            )}
            <span className="absolute left-4 top-4 border border-background bg-foreground px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-background">
              Ecosystem dossier
            </span>
          </div>

          <div className="flex flex-col p-6 sm:p-8 lg:col-span-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">{ethos.location ?? ethos.sector ?? 'Distributed network'}</p>
            <h1 className="mt-4 text-5xl font-black leading-[0.86] tracking-[-0.055em] sm:text-6xl">{ethos.name}</h1>
            {ethos.tagline && <p className="mt-5 text-base leading-7 text-muted-foreground">{ethos.tagline}</p>}

            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-none border-2 uppercase tracking-wide">{ethos.ethos_type}</Badge>
              <Badge variant={ethos.is_active ? 'default' : 'secondary'} className="rounded-none uppercase tracking-wide">
                {ethos.is_active ? 'Active' : 'Inactive'}
              </Badge>
              {phase && <Badge variant="outline" className="rounded-none uppercase tracking-wide">{phase}</Badge>}
            </div>

            <dl className="mt-auto grid grid-cols-2 gap-px bg-border pt-px">
              <div className="bg-card py-5 pr-4">
                <dt className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-muted-foreground">Members</dt>
                <dd className="mt-1 text-3xl font-black tabular-nums">{ethos.member_count}</dd>
              </div>
              <div className="bg-card py-5 pl-4">
                <dt className="text-[0.65rem] font-black uppercase tracking-[0.14em] text-muted-foreground">Alignment</dt>
                <dd className={`mt-1 text-3xl font-black tabular-nums ${alignment !== null ? 'text-success' : 'text-muted-foreground'}`}>
                  {alignment !== null ? `${alignment}%` : '—'}
                </dd>
              </div>
            </dl>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-8">
            {(showDescription || ethos.mission || ethos.governance_summary) && (
              <section className="border-2 border-strong-border bg-card" aria-labelledby="dossier-purpose-title">
                <div className="border-b-2 border-strong-border p-5 sm:p-6">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">01 / Purpose</p>
                  <h2 id="dossier-purpose-title" className="mt-2 text-3xl font-black tracking-[-0.035em]">Operating intent.</h2>
                </div>
                <div className="space-y-6 p-5 sm:p-6">
                  {showDescription && <p className="text-base leading-8">{ethos.description}</p>}
                  {ethos.mission && (
                    <div className="border-l-4 border-strong-border pl-5">
                      <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Mission</p>
                      <p className="mt-2 text-sm leading-7">{ethos.mission}</p>
                    </div>
                  )}
                  {ethos.governance_summary && (
                    <div className="border-l-4 border-strong-border pl-5">
                      <p className="text-[0.65rem] font-black uppercase tracking-[0.16em] text-muted-foreground">Governance summary</p>
                      <p className="mt-2 text-sm leading-7">{ethos.governance_summary}</p>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section className="border-2 border-strong-border bg-card" aria-labelledby="journey-maps-title">
              <div className="flex items-end justify-between gap-5 border-b-2 border-strong-border p-5 sm:p-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">02 / Orientation</p>
                  <h2 id="journey-maps-title" className="mt-2 text-3xl font-black tracking-[-0.035em]">Journey maps.</h2>
                </div>
                <span className="text-4xl font-black tabular-nums">{journeyMaps.length}</span>
              </div>

              {journeyQuery.isLoading ? (
                <div className="space-y-2 p-5"><Skeleton className="h-20 rounded-none" /><Skeleton className="h-20 rounded-none" /></div>
              ) : journeyQuery.error ? (
                <p className="p-6 text-sm text-destructive" role="alert">Journey maps could not be loaded.</p>
              ) : journeyMaps.length > 0 ? (
                <ol className="divide-y divide-border">
                  {journeyMaps.map((map: any, index: number) => (
                    <li key={map.id} className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
                      <span className="text-xs font-black tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                      <div>
                        <p className="font-black">{map.title}</p>
                        {map.description && <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{map.description}</p>}
                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{map.step_count} {map.step_count === 1 ? 'step' : 'steps'}</p>
                      </div>
                      <Link href={`/orientation/${slug}`} className="inline-flex min-h-11 items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        Begin <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="p-6 sm:p-8">
                  <p className="font-black">No published journey map yet.</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">You can still open the orientation overview for this ecosystem.</p>
                </div>
              )}

              <div className="border-t-2 border-strong-border p-5 text-right">
                <button
                  type="button"
                  onClick={() => navigate(`/orientation/${slug}`)}
                  className="inline-flex min-h-11 items-center gap-2 border-2 border-strong-border bg-foreground px-5 text-xs font-black uppercase tracking-[0.12em] text-background hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Open orientation <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </section>

            {mapUrl && (
              <section className="border-2 border-strong-border bg-card" aria-labelledby="ecosystem-map-title">
                <div className="border-b-2 border-strong-border p-5 sm:p-6">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">03 / Spatial model</p>
                  <h2 id="ecosystem-map-title" className="mt-2 text-3xl font-black tracking-[-0.035em]">{ethos.map_title ?? 'Ecosystem map'}</h2>
                </div>
                {ethos.map_type === 'miro' ? (
                  <iframe
                    src={mapUrl}
                    width="100%"
                    height="480"
                    title={ethos.map_title ?? 'Ecosystem map'}
                    loading="lazy"
                    sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
                    referrerPolicy="no-referrer"
                    allow="fullscreen; clipboard-read; clipboard-write"
                    allowFullScreen
                    className="block border-0"
                  />
                ) : (
                  <img src={mapUrl} alt={ethos.map_title ?? `Map of ${ethos.name}`} width={1400} height={900} loading="lazy" decoding="async" className="h-auto w-full" />
                )}
              </section>
            )}
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <section className="border-2 border-strong-border bg-card p-5 sm:p-6" aria-labelledby="members-title">
              <div className="flex items-end justify-between gap-4 border-b-2 border-strong-border pb-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Network</p>
                  <h2 id="members-title" className="mt-2 text-2xl font-black tracking-tight">Members.</h2>
                </div>
                <span className="text-3xl font-black tabular-nums">{members.length}</span>
              </div>
              {members.length > 0 ? (
                <ul className="divide-y divide-border">
                  {members.map((member) => {
                    const profileUrl = resolveInternalPath(member.profile_url)
                      ?? `/users/${encodeURIComponent(member.username || member.user_id)}`;
                    return (
                    <li key={member.user_id}>
                      <Link href={profileUrl} className="flex min-h-16 items-center gap-3 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        <Avatar className="h-10 w-10 shrink-0 border border-border">
                          <AvatarImage src={resolveMediaUrl(member.avatar_url)} alt="" />
                          <AvatarFallback className="text-xs font-black">{member.display_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-black hover:underline">{member.display_name}</span>
                          {member.role_in_ethos && <span className="mt-0.5 block truncate text-xs text-muted-foreground">{member.role_in_ethos}</span>}
                        </span>
                      </Link>
                    </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="py-6 text-sm leading-6 text-muted-foreground">Member profiles are private or not yet connected to this dossier.</p>
              )}
            </section>

            {ethos.tags && ethos.tags.length > 0 && (
              <section className="border-2 border-strong-border bg-card p-5 sm:p-6" aria-labelledby="topics-title">
                <h2 id="topics-title" className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Topics</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {ethos.tags.map((tag) => <Badge key={tag} variant="outline" className="rounded-none uppercase tracking-wide">{tag}</Badge>)}
                </div>
              </section>
            )}

            {(officialUrl || externalLinks.length > 0) && (
              <section className="border-2 border-strong-border bg-card p-5 sm:p-6" aria-labelledby="resources-title">
                <h2 id="resources-title" className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">External resources</h2>
                <ul className="mt-4 divide-y divide-border border-t border-border">
                  {officialUrl && (
                    <li>
                      <a href={officialUrl} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-between gap-3 py-3 text-sm font-black text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        Official website <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </li>
                  )}
                  {externalLinks.map((resource) => (
                    <li key={`${resource.label}-${resource.url}`}>
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-between gap-3 py-3 text-sm font-black text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {resource.label || resource.url} <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="border-2 border-strong-border bg-foreground p-5 text-background sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-background/70">Active teams</p>
              <p className="mt-3 text-2xl font-black tracking-tight">Connection pending.</p>
              <p className="mt-2 text-sm leading-6 text-background/75">Team information will appear after the ecosystem completes its network connection.</p>
            </section>
          </aside>
        </div>
      </div>
    </ConsentGate>
  );
}
