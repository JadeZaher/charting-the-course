import { Link, useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { keys } from '@/lib/query-keys';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { useEthosDetail } from '@/hooks/useEthos';
import { useCommunity } from '@/hooks/use-engagement';
import { useAuth } from '@/contexts/AuthContext';
import { membershipStanding } from '@/lib/ecosystem-join';
import { useJoinEcosystem } from '@/hooks/use-onboarding';
import { fetchEthosJourneyMaps } from '@/lib/api-client';
import { resolveExternalUrl, resolveMediaUrl, resolveMiroEmbedUrl } from '@/lib/media';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FitCheck } from '@/components/discovery/FitCheck';
import { EcosystemHome } from '@/components/ethos/EcosystemHome';
import { apiErrorMessage } from '@/lib/api-error-message';
import { headerStatus, publicMemberCount, spaceViewer } from '@/lib/space-home';
import { spaceHomeCopy } from '@/lib/space-home-copy';

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
  const { ecosystems, isAuthenticated } = useAuth();
  const detailQuery = useEthosDetail(isAuthenticated ? slug : '');
  const communityQuery = useCommunity(isAuthenticated ? '' : slug);
  const ethosId = detailQuery.data?.ethos.id;
  const join = useJoinEcosystem(ethosId || slug, { silent: true });
  const journeyQuery = useQuery({
    queryKey: keys.orientation.journeyMaps(ethosId),
    queryFn: () => fetchEthosJourneyMaps(ethosId!),
    enabled: !!ethosId,
  });

  if (!isAuthenticated) {
    if (communityQuery.isLoading) return <HomeSkeleton />;
    if (communityQuery.isError || !communityQuery.data) return <MissingDossier />;
    const community = communityQuery.data;
    const imageUrl = resolveMediaUrl(community.logo_url);
    const standing = headerStatus('signed-out', community.name);
    return (
      <div className="space-y-10">
        <DiscoverLink href="/communities" />
        <EcosystemHeading name={community.name} status={standing.text} finishJoining={false} purpose={community.description} />
        <EcosystemHome
          ecosystemId={community.id}
          name={community.name}
          memberCount={publicMemberCount(community)}
          viewer="signed-out"
          owner={community}
          stewards={[]}
          orientationHref={null}
          opportunities={community.opportunities}
          opportunitiesRequireSignIn={community.opportunities_require_sign_in}
          onJoin={() => undefined}
          joining={false}
        />
        {imageUrl && <img src={imageUrl} alt="" width={1600} height={1067} loading="lazy" decoding="async" className="aspect-[3/2] w-full border-2 border-strong-border object-cover" />}
      </div>
    );
  }

  if (detailQuery.isLoading) return <HomeSkeleton />;

  if (detailQuery.isError || !detailQuery.data) return <MissingDossier />;

  const { ethos, stewards, owner } = detailQuery.data;
  const viewer = spaceViewer(true, membershipStanding(ethos.id, ecosystems));
  const standing = headerStatus(viewer, ethos.name);
  const joined = viewer === 'member' || viewer === 'pending';
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
  const isMember = viewer === 'member';
  const purpose = ethos.description || ethos.tagline || null;

  return (
    <div className="space-y-10">
      {joined && <Link className="inline-flex min-h-11 items-center text-link underline" href={`/settings/notifications?scope=ecosystem&id=${ethos.id}`}>Choose updates for {ethos.name}</Link>}
      <DiscoverLink href="/discover" />
      <EcosystemHeading name={ethos.name} status={standing.text} finishJoining={standing.finishJoining} purpose={purpose} />

      <EcosystemHome
        ecosystemId={ethos.id}
        name={ethos.name}
        memberCount={ethos.member_count}
        viewer={viewer}
        owner={owner}
        stewards={isMember ? stewards : []}
        orientationHref={journeyMaps.length > 0 ? `/orientation/${slug}` : null}
        onJoin={() => join.mutate()}
        joining={join.isPending}
        prepareJoin={() => join.mutateAsync()}
        joinError={join.isError ? apiErrorMessage(join.error) : null}
      />

      {imageUrl && <img src={imageUrl} alt="" width={1600} height={1067} loading="lazy" decoding="async" className="aspect-[3/2] w-full border-2 border-strong-border object-cover" />}

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-8">
          {(ethos.mission || ethos.governance_summary) && (
            <section className="border-2 border-strong-border bg-card" aria-labelledby="dossier-purpose-title">
              <div className="border-b-2 border-strong-border p-5 sm:p-6">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">01 / Purpose</p>
                <h2 id="dossier-purpose-title" className="mt-2 text-3xl font-black tracking-[-0.035em]">Operating intent.</h2>
              </div>
              <div className="space-y-6 p-5 sm:p-6">
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
                {journeyMaps.map((map, index) => (
                  <li key={map.id} className="grid gap-4 p-5 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-6">
                    <span className="text-xs font-black tabular-nums text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="font-black">{map.title}</p>
                      {map.description && <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{map.description}</p>}
                      <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{map.step_count} {map.step_count === 1 ? 'step' : 'steps'}</p>
                    </div>
                    <Link
                      href={`/orientation/${slug}?journey=${encodeURIComponent(map.id)}`}
                      aria-label={`Begin ${map.title}`}
                      className="inline-flex min-h-11 items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
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

            <div className="flex flex-wrap items-center justify-end gap-4 border-t-2 border-strong-border p-5">
              {!joined && (
                <p className="mr-auto max-w-md text-sm leading-6 text-muted-foreground">
                  You are not a member of {ethos.name} yet. Starting a journey asks to join it.
                </p>
              )}
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

          <div id="ecosystem-fit"><FitCheck ecosystemId={ethos.id} /></div>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          {phase && (
            <p className="text-sm text-muted-foreground">Phase: {phase}</p>
          )}
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

          <section className="border-2 border-strong-border bg-card p-5 sm:p-6">
            <h2 className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Teams</h2>
            <p className="mt-3 text-sm leading-6">{spaceHomeCopy.teamsEmpty(ethos.name)}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function DiscoverLink({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex min-h-11 items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-link hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Discover index
    </Link>
  );
}

function EcosystemHeading({ name, status, finishJoining, purpose }: { name: string; status: string; finishJoining: boolean; purpose?: string | null }) {
  return (
    <header className="border-2 border-strong-border bg-card p-6 sm:p-8">
      <h1 className="text-5xl font-black leading-[0.86] tracking-[-0.055em] sm:text-6xl">{name}</h1>
      <p className="mt-5 text-base leading-7">{status}</p>
      {finishJoining && (
        <a href="#what-to-do-next" className="mt-3 inline-flex min-h-11 items-center font-bold text-link underline underline-offset-4">{spaceHomeCopy.header.finishJoining}</a>
      )}
      {purpose && <p className="mt-5 max-w-3xl text-base leading-7 text-muted-foreground">{purpose}</p>}
    </header>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading ecosystem">
      <p role="status">Loading ecosystem.</p>
      <Skeleton className="h-12 w-44 rounded-none" />
      <Skeleton className="h-40 rounded-none border-2 border-border" />
      <Skeleton className="h-48 rounded-none border-2 border-border" />
    </div>
  );
}

function MissingDossier() {
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
