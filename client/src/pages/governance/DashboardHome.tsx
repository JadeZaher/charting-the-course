import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDashboardSummary } from '@/hooks/use-api';
import { useEcosystem } from '@/contexts/EcosystemContext';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { FileText, Vote, Users, Globe2, Scale, Clock } from 'lucide-react';
import type { SummaryCard as SummaryCardType, ActivityItem } from '@/types/api';

type ActivityFilter = 'all' | 'needs_input' | 'watching';

const iconMap: Record<string, React.ElementType> = {
  Agreements: FileText,
  Proposals: Vote,
  Members: Users,
  Domains: Globe2,
  Decisions: Scale,
};

function SummaryCardComponent({ card }: { card: SummaryCardType }) {
  const Icon = iconMap[card.label] || FileText;

  return (
    <Link href={card.href}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{card.value}</div>
          {card.breakdown && Object.keys(card.breakdown).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {Object.entries(card.breakdown).map(([status, count]) => (
                <Badge key={status} variant="secondary" className="text-xs">
                  {status}: {count}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function ActivityFeedItem({ item }: { item: ActivityItem }) {
  const timeAgo = new Date(item.timestamp).toLocaleDateString();

  return (
    <Link href={item.href}>
      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
        <div className="mt-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.label}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">{item.type}</Badge>
            <Badge variant="secondary" className="text-xs">{item.status}</Badge>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function GovernanceDashboard() {
  const { data, isLoading, error } = useDashboardSummary();
  const { selected } = useEcosystem();
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>('all');

  if (isLoading) return <LoadingState message="Loading dashboard..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load dashboard data</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Governance Dashboard</h1>
        {selected && (
          <p className="text-muted-foreground mt-1">{selected.name}</p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {data?.cards.map((card) => (
          <SummaryCardComponent key={card.label} card={card} />
        ))}
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Recent Activity</CardTitle>
            <div className="flex gap-1 rounded-lg bg-muted p-1">
              {([
                { key: 'all' as const, label: 'All Activity' },
                { key: 'needs_input' as const, label: 'Needs My Input' },
                { key: 'watching' as const, label: 'Watching' },
              ]).map((tab) => (
                <Button
                  key={tab.key}
                  variant={activityFilter === tab.key ? 'default' : 'ghost'}
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setActivityFilter(tab.key)}
                >
                  {tab.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const filtered = (data?.activity || []).filter((item) => {
              if (activityFilter === 'all') return true;
              if (activityFilter === 'needs_input') {
                return item.status === 'advice' || item.status === 'consent' || item.status === 'pending';
              }
              // 'watching' - show items that are in progress but not needing direct input
              return item.status === 'active' || item.status === 'approved' || item.status === 'ratified';
            });
            return filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {activityFilter === 'all'
                  ? 'No recent governance activity'
                  : activityFilter === 'needs_input'
                    ? 'Nothing needs your input right now'
                    : 'No watched items'}
              </p>
            ) : (
              <div className="divide-y">
                {filtered.map((item) => (
                  <ActivityFeedItem key={item.id} item={item} />
                ))}
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
