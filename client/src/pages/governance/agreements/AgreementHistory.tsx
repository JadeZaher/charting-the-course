import { useMemo } from 'react';
import { Link, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingState } from '@/components/governance/shared/LoadingState';
import { useAgreementHistory } from '@/hooks/use-governance';
import { ArrowLeft, FileEdit, Search } from 'lucide-react';
import type { AmendmentRecord, ReviewRecord } from '@/types/api';

type TimelineItem =
  | { kind: 'amendment'; date: string | null; data: AmendmentRecord }
  | { kind: 'review'; date: string | null; data: ReviewRecord };

export default function AgreementHistory() {
  const [, params] = useRoute('/agreements/:id/history');
  const id = params?.id ?? '';
  const { data, isLoading, error } = useAgreementHistory(id);

  const timeline = useMemo<TimelineItem[]>(() => {
    if (!data) return [];
    const items: TimelineItem[] = [
      ...data.amendments.map((a) => ({ kind: 'amendment' as const, date: a.date, data: a })),
      ...data.reviews.map((r) => ({ kind: 'review' as const, date: r.date, data: r })),
    ];
    items.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da; // newest first
    });
    return items;
  }, [data]);

  if (isLoading) return <LoadingState message="Loading history..." />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load history</p>
        <p className="text-sm text-muted-foreground mt-1">{(error as Error).message}</p>
        <Link href={`/agreements/${id}`}>
          <Button variant="outline" className="mt-4">Back to Agreement</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href={`/agreements/${id}`}>
        <Button variant="ghost" size="sm">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Agreement
        </Button>
      </Link>

      <h1 className="text-3xl font-bold">Agreement History</h1>

      {timeline.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No history records found
          </CardContent>
        </Card>
      ) : (
        <div className="relative border-l-2 border-muted ml-4 space-y-6">
          {timeline.map((item) => {
            const isAmendment = item.kind === 'amendment';
            const Icon = isAmendment ? FileEdit : Search;
            return (
              <div key={item.data.id} className="relative pl-8">
                <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-2 border-background bg-muted flex items-center justify-center">
                  <Icon className="h-3 w-3 text-muted-foreground" />
                </div>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={isAmendment ? 'default' : 'secondary'}>
                        {isAmendment ? 'Amendment' : 'Review'}
                      </Badge>
                      <Badge variant="outline">{item.data.status ?? (item.data as ReviewRecord).outcome ?? '-'}</Badge>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {item.date ? new Date(item.date).toLocaleDateString() : 'No date'}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm space-y-1">
                    {isAmendment ? (
                      <>
                        <p><span className="text-muted-foreground">Type:</span> {(item.data as AmendmentRecord).amendment_type}</p>
                        {(item.data as AmendmentRecord).proposed_by && (
                          <p><span className="text-muted-foreground">Proposed by:</span> {(item.data as AmendmentRecord).proposed_by}</p>
                        )}
                        {(item.data as AmendmentRecord).rationale && (
                          <p><span className="text-muted-foreground">Rationale:</span> {(item.data as AmendmentRecord).rationale}</p>
                        )}
                        {(item.data as AmendmentRecord).new_agreement_version && (
                          <p><span className="text-muted-foreground">New version:</span> {(item.data as AmendmentRecord).new_agreement_version}</p>
                        )}
                      </>
                    ) : (
                      <>
                        <p><span className="text-muted-foreground">Type:</span> {(item.data as ReviewRecord).review_type}</p>
                        {(item.data as ReviewRecord).trigger && (
                          <p><span className="text-muted-foreground">Trigger:</span> {(item.data as ReviewRecord).trigger}</p>
                        )}
                        {(item.data as ReviewRecord).outcome && (
                          <p><span className="text-muted-foreground">Outcome:</span> {(item.data as ReviewRecord).outcome}</p>
                        )}
                        {(item.data as ReviewRecord).next_review_date && (
                          <p><span className="text-muted-foreground">Next review:</span> {new Date((item.data as ReviewRecord).next_review_date!).toLocaleDateString()}</p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
