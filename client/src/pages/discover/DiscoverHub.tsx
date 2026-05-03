import { useState, useMemo } from 'react';
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Globe, Users, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchDiscover } from '@/lib/api-client';
import SharesNeedsList from './SharesNeedsList';
import CollaborationsList from './CollaborationsList';

function EcosystemCard({ eco }: { eco: { id: string; name: string; description: string | null; status: string; logo_url: string | null; location: string | null; tags: string[]; member_count: number; founded_date: string | null; website: string | null } }) {
  return (
    <Card className="flex flex-col hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {eco.logo_url ? (
              <img src={eco.logo_url} alt={eco.name} className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                <Globe className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="text-base">{eco.name}</CardTitle>
              {eco.location && <p className="text-xs text-muted-foreground">{eco.location}</p>}
            </div>
          </div>
          <Badge variant={eco.status === 'active' ? 'default' : 'secondary'} className="shrink-0">
            {eco.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 gap-3">
        {eco.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{eco.description}</p>
        )}
        {eco.tags && eco.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {eco.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
            {eco.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">+{eco.tags.length - 3}</Badge>
            )}
          </div>
        )}
        <div className="flex items-center justify-between mt-auto pt-2 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{eco.member_count} members</span>
          </div>
          {eco.website && (
            <a href={eco.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
              Website <ArrowRight className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EcosystemsTab({ search }: { search: string }) {
  const params = useMemo(() => {
    const p: Record<string, string> = { tab: 'ecosystems', per_page: '24' };
    if (search) p.q = search;
    return p;
  }, [search]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['discover', params],
    queryFn: () => fetchDiscover(params),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load ecosystems</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  const ecosystems = data?.ecosystems?.items ?? [];

  if (ecosystems.length === 0) {
    return (
      <div className="text-center py-16 rounded-lg border border-dashed">
        <Globe className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="font-medium text-muted-foreground">No ecosystems found</p>
        {search && <p className="text-sm text-muted-foreground mt-1">Try adjusting your search</p>}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {ecosystems.map(eco => (
        <EcosystemCard key={eco.id} eco={eco} />
      ))}
    </div>
  );
}

export default function DiscoverHub() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ecosystems');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Discover</h1>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="ecosystems">Ecosystems</TabsTrigger>
          <TabsTrigger value="shares-needs">Shares & Needs</TabsTrigger>
          <TabsTrigger value="collaborations">Collaborations</TabsTrigger>
        </TabsList>

        <TabsContent value="ecosystems" className="mt-6">
          <EcosystemsTab search={search} />
        </TabsContent>

        <TabsContent value="shares-needs" className="mt-6">
          <SharesNeedsList searchProp={search} />
        </TabsContent>

        <TabsContent value="collaborations" className="mt-6">
          <CollaborationsList searchProp={search} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
