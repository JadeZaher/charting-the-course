import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { FilterBar } from '@/components/governance/shared/FilterBar';
import { useOnboardings } from '@/hooks/use-governance';
import { useGovernanceList, type FilterDef } from '@/hooks/use-governance-list';
import { useEcosystemName } from '@/hooks/use-ecosystem-filter';

const FILTERS: FilterDef[] = [];

export default function OnboardingList() {
  const [, navigate] = useLocation();
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

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead>Facilitator</TableHead>
                <TableHead>Ecosystem</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No pending onboardings
                  </TableCell>
                </TableRow>
              ) : (
                items.map((o: any) => {
                  const completionPct = o.completion_percentage ?? (o.sections
                    ? Math.round((o.sections.filter((s: any) => s.completed).length / o.sections.length) * 100)
                    : 0);

                  return (
                    <TableRow
                      key={o.id || o.member_id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/onboarding/${o.member_id}/ceremony`)}
                    >
                      <TableCell className="font-medium">{o.member_name || o.display_name || o.member_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${completionPct}%` }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground">{completionPct}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{o.facilitator || '-'}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{getEcosystemName(o.ecosystem_id) || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={completionPct === 100 ? 'default' : 'secondary'}>
                          {completionPct === 100 ? 'Complete' : 'In Progress'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
