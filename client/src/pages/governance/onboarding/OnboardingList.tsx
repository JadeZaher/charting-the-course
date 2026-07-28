import { Link } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { CollectionCard, CollectionGrid } from '@/components/governance/shared/CollectionGrid';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { FilterBar } from '@/components/governance/shared/FilterBar';
import { useOnboardings } from '@/hooks/use-governance';
import { useGovernanceList, type FilterDef } from '@/hooks/use-governance-list';
import { useEcosystemName } from '@/hooks/use-ecosystem-filter';

const FILTERS: FilterDef[] = [];

export default function OnboardingList() {
  const list = useGovernanceList({ entity: 'onboarding', filters: FILTERS });
  const getEcosystemName = useEcosystemName();

  const { data, isLoading, error } = useOnboardings(list.params);

  if (isLoading) return <LoadingState message="Loading onboardings..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load onboardings</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  const items: any[] = Array.isArray(data) ? data : (data?.items ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Onboarding</h1>
      </div>

      <FilterBar
        filters={list.filters}
        filterValues={list.filterValues}
        onFilterChange={list.setFilter}
        search={list.search}
        onSearchChange={list.setSearch}
      />

      <CollectionGrid aria-label="Onboarding records">
        {items.length === 0 ? (
          <div className="col-span-full border-2 border-dashed border-strong-border p-8 text-center text-muted-foreground">No pending onboardings</div>
        ) : items.map((o: any) => {
          const completionPct = o.completion_percentage ?? (o.sections
            ? Math.round((o.sections.filter((s: any) => s.completed).length / o.sections.length) * 100)
            : 0);
          const memberName = o.member_name || o.display_name || o.member_id;

          return (
            <CollectionCard key={o.id || o.member_id} asChild>
              <Link href={`/onboarding/${o.member_id}/ceremony`} aria-label={`Open onboarding ceremony for ${memberName}`}>
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Member onboarding</p><h2 className="mt-1 text-lg font-semibold">{memberName}</h2></div><Badge variant={completionPct === 100 ? 'default' : 'secondary'}>{completionPct === 100 ? 'Complete' : 'In Progress'}</Badge></div>
                <div className="mt-5"><div className="flex items-center justify-between text-sm"><span>Completion</span><span className="font-medium">{completionPct}%</span></div><div className="mt-2 h-2 overflow-hidden border border-strong-border bg-muted"><div className="h-full bg-primary transition-[width] motion-reduce:transition-none" style={{ width: `${completionPct}%` }} /></div></div>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-border pt-4 text-sm"><div><dt className="text-xs text-muted-foreground">Facilitator</dt><dd className="mt-1 font-medium">{o.facilitator || '-'}</dd></div><div><dt className="text-xs text-muted-foreground">Ecosystem</dt><dd className="mt-1 font-medium">{getEcosystemName(o.ecosystem_id) || '-'}</dd></div></dl>
              </Link>
            </CollectionCard>
          );
        })}
      </CollectionGrid>
    </div>
  );
}
