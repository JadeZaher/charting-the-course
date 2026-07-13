import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchDiscover } from '@/lib/api-client';
import { resolveExternalUrl, resolveMediaUrl } from '@/lib/media';
import type { DiscoverEcosystem } from '@/types/api';
import SharesNeedsList from './SharesNeedsList';
import CollaborationsList from './CollaborationsList';

function formatFoundedDate(value: string | null) {
  if (!value) return null;
  const year = new Date(value).getFullYear();
  return Number.isFinite(year) ? `Est. ${year}` : null;
}

function EcosystemCard({ ecosystem, index, featured }: { ecosystem: DiscoverEcosystem; index: number; featured: boolean }) {
  const imageUrl = resolveMediaUrl(ecosystem.logo_url);
  const websiteUrl = resolveExternalUrl(ecosystem.website);
  const founded = formatFoundedDate(ecosystem.founded_date);

  return (
    <article className={`group flex h-full flex-col border-2 border-strong-border bg-card ${featured ? 'lg:col-span-2 lg:grid lg:grid-cols-2' : ''}`}>
      <Link
        href={`/ethos/${ecosystem.id}`}
        className={`relative block overflow-hidden border-strong-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${featured ? 'min-h-72 border-b-2 lg:min-h-full lg:border-b-0 lg:border-r-2' : 'aspect-[3/2] border-b-2'}`}
        aria-label={`Open ${ecosystem.name} dossier`}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`A view representing ${ecosystem.name}${ecosystem.location ? ` in ${ecosystem.location}` : ''}`}
            width={1200}
            height={800}
            loading={featured ? 'eager' : 'lazy'}
            decoding="async"
            className="h-full w-full object-cover grayscale-[12%] transition-transform duration-300 group-hover:scale-[1.015] motion-reduce:transition-none"
          />
        ) : (
          <div className="flex h-full min-h-56 items-end justify-between bg-foreground p-6 text-background" role="img" aria-label={`No image available for ${ecosystem.name}`}>
            <span className="text-xs font-bold uppercase tracking-[0.2em]">Visual pending</span>
            <span className="text-6xl font-black tracking-tighter" aria-hidden="true">
              {ecosystem.name.slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <span className="absolute left-3 top-3 border border-background bg-foreground px-2 py-1 text-[0.65rem] font-black uppercase tracking-[0.16em] text-background">
          D-{String(index + 1).padStart(2, '0')}
        </span>
      </Link>

      <div className={`flex flex-1 flex-col ${featured ? 'p-6 sm:p-8' : 'p-5 sm:p-6'}`}>
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="min-w-0">
            <p className="mb-2 text-[0.68rem] font-black uppercase tracking-[0.18em] text-muted-foreground">
              {ecosystem.location ?? 'Location distributed'}
            </p>
            <h2 className={`${featured ? 'text-4xl' : 'text-2xl'} font-black leading-[0.94] tracking-[-0.045em]`}>
              <Link href={`/ethos/${ecosystem.id}`} className="hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {ecosystem.name}
              </Link>
            </h2>
          </div>
          <Badge variant={ecosystem.status === 'active' ? 'default' : 'secondary'} className="shrink-0 rounded-none uppercase tracking-wide">
            {ecosystem.status}
          </Badge>
        </div>

        {ecosystem.description && (
          <p className={`mt-4 text-sm leading-6 text-muted-foreground ${featured ? 'line-clamp-5' : 'line-clamp-3'}`}>
            {ecosystem.description}
          </p>
        )}

        {ecosystem.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2" aria-label={`${ecosystem.name} topics`}>
            {ecosystem.tags.slice(0, featured ? 6 : 4).map((tag) => (
              <Badge key={tag} variant="outline" className="rounded-none uppercase tracking-wide">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <dl className="mt-auto grid grid-cols-2 gap-4 border-t border-border pt-5 text-sm">
          <div>
            <dt className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">Network</dt>
            <dd className="mt-1 font-black tabular-nums">{ecosystem.member_count} members</dd>
          </div>
          <div>
            <dt className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-muted-foreground">Founded</dt>
            <dd className="mt-1 font-black">{founded ?? 'Not listed'}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/ethos/${ecosystem.id}`}
            className="inline-flex min-h-11 items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-link underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Open dossier <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          {websiteUrl && (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Website <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function EcosystemsTab({ search }: { search: string }) {
  const params = useMemo(() => {
    const next: Record<string, string> = { tab: 'ecosystems', per_page: '24' };
    if (search.trim()) next.q = search.trim();
    return next;
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['discover', params],
    queryFn: () => fetchDiscover(params),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2" aria-label="Loading ecosystems">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="aspect-[3/2] rounded-none border-2 border-border" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-2 border-destructive p-8" role="alert">
        <p className="font-black uppercase tracking-wide text-destructive">Ecosystems unavailable</p>
        <p className="mt-2 text-sm text-muted-foreground">{(error as Error).message}</p>
      </div>
    );
  }

  const section = data?.ecosystems;
  const ecosystems = section?.items ?? [];

  if (ecosystems.length === 0) {
    return (
      <div className="border-2 border-dashed border-strong-border p-10 sm:p-16">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">Zero matches</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight">No ecosystems found.</h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          {search ? 'Try a broader place, practice, or ecosystem name.' : 'Public ecosystems will appear here as they join the network.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
        <p className="text-sm text-muted-foreground">
          Showing <strong className="text-foreground">{ecosystems.length}</strong> of <strong className="text-foreground">{section?.total ?? ecosystems.length}</strong> ecosystems
        </p>
        {search && <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Query: {search}</p>}
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {ecosystems.map((ecosystem, index) => (
          <EcosystemCard key={ecosystem.id} ecosystem={ecosystem} index={index} featured={index === 0} />
        ))}
      </div>
    </div>
  );
}

export default function DiscoverHub() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ecosystems');

  return (
    <div className="space-y-10">
      <header className="grid gap-8 border-b-2 border-strong-border pb-8 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">Network index / 02</p>
          <h1 className="mt-4 text-5xl font-black leading-[0.86] tracking-[-0.055em] sm:text-7xl">Discover what connects.</h1>
        </div>
        <p className="text-base leading-7 text-muted-foreground lg:col-span-4">
          Explore living ecosystems, exchange capacity, and trace active collaborations across the NEOS network.
        </p>
      </header>

      <div className="grid gap-4 border-2 border-strong-border bg-card p-4 sm:p-6 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <label htmlFor="discover-search" className="mb-2 block text-xs font-black uppercase tracking-[0.16em]">
            Search the network
          </label>
          <Input
            id="discover-search"
            type="search"
            placeholder="Name, place, capability, or topic"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-12 rounded-none border-2 text-base"
          />
        </div>
        <p className="text-sm leading-6 text-muted-foreground lg:col-span-4">
          Search applies to the active index. Switch views to move from organizations to resources or working relationships.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid h-auto w-full grid-cols-1 rounded-none border-2 border-strong-border bg-transparent p-0 sm:grid-cols-3">
          <TabsTrigger value="ecosystems" className="min-h-12 rounded-none border-b border-border px-4 font-black uppercase tracking-[0.12em] sm:border-b-0 sm:border-r">
            Ecosystems
          </TabsTrigger>
          <TabsTrigger value="shares-needs" className="min-h-12 rounded-none border-b border-border px-4 font-black uppercase tracking-[0.12em] sm:border-b-0 sm:border-r">
            Shares + needs
          </TabsTrigger>
          <TabsTrigger value="collaborations" className="min-h-12 rounded-none px-4 font-black uppercase tracking-[0.12em]">
            Collaborations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ecosystems" className="mt-8">
          <EcosystemsTab search={search} />
        </TabsContent>
        <TabsContent value="shares-needs" className="mt-8">
          <SharesNeedsList searchProp={search} />
        </TabsContent>
        <TabsContent value="collaborations" className="mt-8">
          <CollaborationsList searchProp={search} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
