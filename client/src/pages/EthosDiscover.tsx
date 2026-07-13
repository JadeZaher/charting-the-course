import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useEthosList } from '@/hooks/useEthos';
import { EthosCard } from '@/components/ethos/EthosCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';

const SECTORS = ['all', 'ecology', 'technology', 'economics', 'culture', 'governance'];
const LIMIT = 12;

export default function EthosDiscover() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAdmin, canAccessDiscover, isLoading: permLoading } = usePermissions();
  const [sector, setSector] = useState<string>('all');
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (permLoading) return;
    if (!isAdmin && !canAccessDiscover) {
      toast({ title: "You don't have access to this page yet.", variant: 'destructive' });
      setLocation('/dashboard');
    }
  }, [isAdmin, canAccessDiscover, permLoading]);

  const { data, isLoading, isError } = useEthosList(
    sector === 'all' ? undefined : sector,
    LIMIT,
    offset,
  );

  const totalPages = data ? Math.ceil(data.total / LIMIT) : 0;
  const currentPage = Math.floor(offset / LIMIT) + 1;

  function handleSector(s: string) {
    setSector(s);
    setOffset(0);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Discover ETHOS</h1>
        <p className="text-muted-foreground mt-1">
          Explore emergent thriving communities and find your alignment.
        </p>
      </div>

      {/* Sector filter bar */}
      <div className="flex flex-wrap gap-2">
        {SECTORS.map(s => (
          <Button
            key={s}
            size="sm"
            variant={sector === s ? 'default' : 'outline'}
            onClick={() => handleSector(s)}
            className="capitalize"
          >
            {s === 'all' ? (
              <>
                <Globe className="h-3.5 w-3.5 mr-1.5" />
                All
              </>
            ) : (
              s
            )}
          </Button>
        ))}
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-none border-2 border-strong-border" />
          ))}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="text-center py-16 text-muted-foreground">
          Failed to load ETHOS. Please try again.
        </div>
      )}

      {/* Empty state */}
      {data && data.ethos.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          No ETHOS found{sector !== 'all' ? ` in the ${sector} sector` : ''}.
        </div>
      )}

      {/* Card grid */}
      {data && data.ethos.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.ethos.map(ethos => (
              <EthosCard key={ethos.id} ethos={ethos} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset(o => Math.max(0, o - LIMIT))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() => setOffset(o => o + LIMIT)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
